/**
 * usePositionHistory - Fetches Borrow & Repay event history from AccountManager contract
 *
 * STRATEGIES (in order):
 * 1. Direct public RPC (mainnet.base.org etc.) — supports 10K block ranges, always up-to-date
 * 2. Blockscout API — good for older history but has indexing lag
 * 3. Wagmi publicClient RPC — last resort (Alchemy free = 10 block limit)
 *
 * Caching: Results cached in localStorage keyed by chainId + address
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits, keccak256, toBytes } from "viem";
import { accountManagerAddressByChain } from "@/lib/utils/web3/token";
import { getAddressList } from "@/lib/utils/web3/addressList";

// Event topic hashes
const BORROW_TOPIC0 = keccak256(toBytes("Borrow(address,address,address,uint256)"));
const REPAY_TOPIC0 = keccak256(toBytes("Repay(address,address,address,uint256)"));

// Public RPCs that support larger getLogs ranges (10K blocks)
const PUBLIC_RPC: Record<number, string> = {
  8453: "https://mainnet.base.org",
  42161: "https://arb1.arbitrum.io/rpc",
  10: "https://mainnet.optimism.io",
};

// Blockscout API (fallback for older history)
const EXPLORER_API: Record<number, string> = {
  8453: "https://base.blockscout.com/api",
  42161: "https://arbitrum.blockscout.com/api",
  10: "https://optimism.blockscout.com/api",
};

const MIN_EVENTS = 10;
const CACHE_PREFIX = "vanna_pos_history_";

export interface PositionHistoryItem {
  date: string;
  time: string;
  type: "Borrow" | "Repay" | "Account Opened";
  token: string;
  tokenSymbol: string;
  amount: number;
  amountUsd: number;
  account: string;
  owner: string;
  txHash: string;
  blockNumber: bigint;
}

interface CachedHistoryItem extends Omit<PositionHistoryItem, "blockNumber"> {
  blockNumber: string;
}

interface CacheData {
  items: CachedHistoryItem[];
  latestBlock: string;
  timestamp: number;
}

interface UsePositionHistoryReturn {
  history: PositionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function resolveTokenSymbol(
  tokenAddress: string,
  chainId: number
): { symbol: string; decimals: number } {
  const addressList = getAddressList(chainId);
  if (!addressList) return { symbol: "Unknown", decimals: 18 };
  const lower = tokenAddress.toLowerCase();
  if (lower === addressList.usdcTokenAddress?.toLowerCase()) return { symbol: "USDC", decimals: 6 };
  if (lower === addressList.usdtTokenAddress?.toLowerCase()) return { symbol: "USDT", decimals: 6 };
  if (lower === addressList.wethTokenAddress?.toLowerCase()) return { symbol: "ETH", decimals: 18 };
  return { symbol: "Unknown", decimals: 18 };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function extractAddress(topic: string): string {
  if (!topic || topic.length < 42) return "";
  return "0x" + topic.slice(-40);
}

function getCacheKey(chainId: number, address: string): string {
  return `${CACHE_PREFIX}${chainId}_${address.toLowerCase()}`;
}

function loadCache(chainId: number, address: string): CacheData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(chainId, address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheData;
    if (!parsed.items || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(chainId: number, address: string, items: PositionHistoryItem[]) {
  if (!items || items.length === 0) return;
  try {
    const latestBlock = items[0].blockNumber.toString();
    const cached: CacheData = {
      items: items.map((i) => ({ ...i, blockNumber: i.blockNumber.toString() })),
      latestBlock,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(chainId, address), JSON.stringify(cached));
  } catch {}
}

function cacheToItems(cache: CacheData): PositionHistoryItem[] {
  return cache.items.map((i) => ({ ...i, blockNumber: BigInt(i.blockNumber) }));
}

// =====================================================
// Convert raw RPC log to PositionHistoryItem
// =====================================================
function rawLogToItem(
  log: any,
  chainId: number,
  prices: Record<string, number>
): PositionHistoryItem {
  const topic0 = log.topics?.[0] || "";
  const type: "Borrow" | "Repay" = topic0 === BORROW_TOPIC0 ? "Borrow" : "Repay";
  const token = extractAddress(log.topics?.[3] || "");
  const amt = log.data && log.data !== "0x" ? BigInt(log.data) : BigInt(0);
  const { symbol, decimals } = resolveTokenSymbol(token, chainId);
  const amount = Number(formatUnits(amt, decimals));
  const price = prices[symbol] || (symbol === "ETH" ? 2000 : 1);

  // blockTimestamp is available from public RPC (hex unix timestamp)
  const ts = log.blockTimestamp ? parseInt(log.blockTimestamp, 16) :
             log.timeStamp ? parseInt(log.timeStamp, 16) : 0;
  const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();

  return {
    date: ts > 0 ? dateObj.toISOString().split("T")[0] : "",
    time: ts > 0 ? dateObj.toTimeString().split(" ")[0] : "",
    type,
    token,
    tokenSymbol: symbol,
    amount: Math.round(amount * 10000) / 10000,
    amountUsd: Math.round(amount * price * 100) / 100,
    account: extractAddress(log.topics?.[1] || ""),
    owner: extractAddress(log.topics?.[2] || ""),
    txHash: log.transactionHash || "",
    blockNumber: BigInt(log.blockNumber || "0"),
  };
}

// =====================================================
// STRATEGY 1: Direct public RPC — always up-to-date
// Uses eth_getLogs with 10K block range chunks
// =====================================================
async function fetchViaPublicRpc(
  chainId: number,
  contractAddress: string,
  ownerAddress: string,
): Promise<any[]> {
  const rpcUrl = PUBLIC_RPC[chainId];
  if (!rpcUrl) return [];

  console.log(`[usePositionHistory] Strategy 1: Public RPC ${rpcUrl}`);

  // Get current block
  const blockRes = await withTimeout(
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    }),
    10_000,
    "rpc-blockNumber"
  );
  const blockData = await blockRes.json();
  const currentBlock = parseInt(blockData.result, 16);
  console.log(`[usePositionHistory] Current block: ${currentBlock}`);

  // Query Borrow + Repay in one call using topic0 OR filter
  // topics[0] = [BORROW_TOPIC0, REPAY_TOPIC0] means match either
  const allLogs: any[] = [];

  // Try progressively smaller ranges: 9999, 5000, 2000
  const ranges = [9999, 5000, 2000];
  let worked = false;

  for (const range of ranges) {
    const fromBlock = Math.max(0, currentBlock - range);
    try {
      // First: fetch ALL Borrow+Repay for this contract (no owner filter in topics)
      const res = await withTimeout(
        fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 2,
            method: "eth_getLogs",
            params: [{
              address: contractAddress,
              topics: [[BORROW_TOPIC0, REPAY_TOPIC0]],
              fromBlock: "0x" + fromBlock.toString(16),
              toBlock: "0x" + currentBlock.toString(16),
            }],
          }),
        }),
        20_000,
        `rpc-getLogs(range=${range})`
      );
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        console.log(`[usePositionHistory] Public RPC range=${range}: ${data.result.length} total events`);
        allLogs.push(...data.result);
        worked = true;
        break;
      }
      if (data.error) {
        console.warn(`[usePositionHistory] Public RPC range=${range} error:`, data.error.message);
        continue;
      }
    } catch (err) {
      console.warn(`[usePositionHistory] Public RPC range=${range} failed:`, err);
      continue;
    }
  }

  if (!worked) return [];

  // Filter for user's events (owner = topics[2])
  const ownerLower = ownerAddress.toLowerCase();
  const userLogs = allLogs.filter((log: any) => {
    const logOwner = extractAddress(log.topics?.[2] || "");
    return logOwner.toLowerCase() === ownerLower;
  });

  console.log(`[usePositionHistory] User events: ${userLogs.length} out of ${allLogs.length} total`);

  // If user has events, return them. Otherwise return recent contract activity.
  if (userLogs.length > 0) return userLogs;

  // Fallback: return latest 10 contract-wide events so table isn't empty
  console.log(`[usePositionHistory] No user events, showing recent contract activity`);
  return allLogs.slice(-10);
}

// =====================================================
// STRATEGY 2: Blockscout API — for older/more history
// =====================================================
async function fetchViaBlockscout(
  chainId: number,
  contractAddress: string,
  topic0: string,
  ownerAddress?: string,
): Promise<any[]> {
  const baseUrl = EXPLORER_API[chainId];
  if (!baseUrl) return [];

  const params: Record<string, string> = {
    module: "logs",
    action: "getLogs",
    address: contractAddress,
    topic0,
    fromBlock: "0",
    toBlock: "99999999",
    page: "1",
    offset: "1000",
  };

  if (ownerAddress) {
    const paddedOwner = "0x" + ownerAddress.slice(2).toLowerCase().padStart(64, "0");
    params["topic0_2_opr"] = "and";
    params["topic2"] = paddedOwner;
  }

  try {
    const res = await withTimeout(
      fetch(`${baseUrl}?${new URLSearchParams(params)}`),
      15_000,
      "blockscout-api"
    );
    const data = await res.json();
    if ((data.message === "OK" || data.status === "1") && Array.isArray(data.result)) {
      // Sort descending (newest first)
      data.result.sort((a: any, b: any) => {
        return parseInt(b.blockNumber || "0", 16) - parseInt(a.blockNumber || "0", 16);
      });
      return data.result.slice(0, 20);
    }
    return [];
  } catch (err) {
    console.warn("[usePositionHistory] Blockscout failed:", err);
    return [];
  }
}

async function fetchPrices(): Promise<Record<string, number>> {
  try {
    const pricesRes = await fetch("/api/prices");
    const pricesData = await pricesRes.json();
    if (pricesData.ETH) return pricesData;
  } catch {}
  try {
    const muxRes = await fetch("https://app.mux.network/api/liquidityAsset");
    const muxData = await muxRes.json();
    const ethAsset = (muxData.assets ?? []).find((a: any) => a.symbol === "ETH" || a.symbol === "WETH");
    return { ETH: ethAsset ? Number(ethAsset.price) : 2000, USDC: 1, USDT: 1 };
  } catch {}
  return { USDC: 1, USDT: 1, ETH: 2000 };
}

async function fillTimestamps(
  items: PositionHistoryItem[],
  client: any
): Promise<void> {
  const needTimestamps = items.filter((i) => !i.date);
  if (needTimestamps.length === 0) return;

  const uniqueBlocks = [...new Set(needTimestamps.map((e) => e.blockNumber))];
  const blockTimestamps = new Map<bigint, number>();

  for (let i = 0; i < uniqueBlocks.length; i += 5) {
    const batch = uniqueBlocks.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (blockNum) => {
        try {
          const block = await withTimeout(
            client.getBlock({ blockNumber: blockNum }),
            10_000,
            `getBlock(${blockNum})`
          ) as { timestamp: bigint };
          return { blockNum, timestamp: Number(block.timestamp) };
        } catch {
          return { blockNum, timestamp: 0 };
        }
      })
    );
    for (const { blockNum, timestamp } of results) {
      blockTimestamps.set(blockNum, timestamp);
    }
  }

  for (const item of needTimestamps) {
    const ts = blockTimestamps.get(item.blockNumber) || 0;
    const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();
    item.date = dateObj.toISOString().split("T")[0];
    item.time = dateObj.toTimeString().split(" ")[0];
  }
}

export function usePositionHistory(): UsePositionHistoryReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [history, setHistory] = useState<PositionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  // Load from cache immediately
  useEffect(() => {
    if (!address || !chainId) return;
    const cache = loadCache(chainId, address);
    if (cache && cache.items.length > 0) {
      setHistory(cacheToItems(cache));
    }
  }, [address, chainId]);

  const fetchHistory = useCallback(async (force = false) => {
    if (!address || !publicClient || !chainId) {
      setHistory([]);
      return;
    }

    const contractAddress = accountManagerAddressByChain[chainId];
    if (!contractAddress) {
      console.warn("[usePositionHistory] No AccountManager contract for chainId:", chainId);
      setHistory([]);
      return;
    }

    if (isFetching.current) return;
    isFetching.current = true;

    const cache = loadCache(chainId, address);
    if (!cache || cache.items.length === 0 || force) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const prices = await fetchPrices();
      let allItems: PositionHistoryItem[] = [];

      // =====================================================
      // STRATEGY 1: Direct public RPC (always up-to-date)
      // =====================================================
      try {
        const rpcLogs = await fetchViaPublicRpc(chainId, contractAddress, address);
        if (rpcLogs.length > 0) {
          allItems = rpcLogs.map((log) => rawLogToItem(log, chainId, prices));
          console.log(`[usePositionHistory] Strategy 1 (Public RPC): ${allItems.length} events`);
        }
      } catch (err) {
        console.warn("[usePositionHistory] Strategy 1 failed:", err);
      }

      // =====================================================
      // STRATEGY 2: Blockscout API (older history / fallback)
      // =====================================================
      if (allItems.length < MIN_EVENTS) {
        try {
          console.log("[usePositionHistory] Strategy 2: Blockscout API");
          const borrowLogs = await fetchViaBlockscout(chainId, contractAddress, BORROW_TOPIC0, address);
          await new Promise(r => setTimeout(r, 300));
          const repayLogs = await fetchViaBlockscout(chainId, contractAddress, REPAY_TOPIC0, address);

          const blockscoutItems = [
            ...borrowLogs.map((log) => rawLogToItem(log, chainId, prices)),
            ...repayLogs.map((log) => rawLogToItem(log, chainId, prices)),
          ];

          // Merge with existing, deduplicate by txHash
          const existingHashes = new Set(allItems.map(i => i.txHash));
          for (const item of blockscoutItems) {
            if (!existingHashes.has(item.txHash)) {
              allItems.push(item);
              existingHashes.add(item.txHash);
            }
          }
          console.log(`[usePositionHistory] After Blockscout merge: ${allItems.length} events`);

          // If still no user events, fetch contract-wide from Blockscout
          if (allItems.length === 0) {
            const anyBorrows = await fetchViaBlockscout(chainId, contractAddress, BORROW_TOPIC0);
            await new Promise(r => setTimeout(r, 300));
            const anyRepays = await fetchViaBlockscout(chainId, contractAddress, REPAY_TOPIC0);
            const anyItems = [
              ...anyBorrows.map((log) => rawLogToItem(log, chainId, prices)),
              ...anyRepays.map((log) => rawLogToItem(log, chainId, prices)),
            ];
            allItems.push(...anyItems);
            console.log(`[usePositionHistory] Blockscout contract-wide: ${allItems.length} events`);
          }
        } catch (err) {
          console.warn("[usePositionHistory] Strategy 2 failed:", err);
        }
      }

      // Sort newest first and take top 10
      allItems.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      const recent = allItems.slice(0, MIN_EVENTS);

      // Fill timestamps for items that don't have them
      await fillTimestamps(recent, publicClient);

      console.log(`[usePositionHistory] Final result: ${recent.length} items`);
      setHistory(recent);
      saveCache(chainId, address, recent);
    } catch (err: any) {
      console.error("[usePositionHistory] Error:", err);
      setError(err.message || "Failed to fetch position history");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [address, publicClient, chainId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: () => fetchHistory(true) };
}
