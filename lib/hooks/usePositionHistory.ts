/**
 * usePositionHistory - Fetches Borrow & Repay event history from AccountManager contract
 *
 * STRATEGIES (in order of reliability):
 * 1. Block Explorer API (Basescan/Arbiscan/Etherscan) — most reliable, no RPC limits
 * 2. Direct RPC getLogs — simple single query with decreasing block ranges
 * 3. Paginated RPC getLogs — slower but covers more history
 *
 * Caching: Results cached in localStorage keyed by chainId + address
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits, parseAbiItem, keccak256, toBytes } from "viem";
import { accountManagerAddressByChain } from "@/lib/utils/web3/token";
import { getAddressList } from "@/lib/utils/web3/addressList";

// ABI events for RPC getLogs
const BORROW_EVENT = parseAbiItem(
  "event Borrow(address indexed account, address indexed owner, address indexed token, uint256 amt)"
);
const REPAY_EVENT = parseAbiItem(
  "event Repay(address indexed account, address indexed owner, address indexed token, uint256 amt)"
);

// Event topic hashes for Explorer API
const BORROW_TOPIC0 = keccak256(toBytes("Borrow(address,address,address,uint256)"));
const REPAY_TOPIC0 = keccak256(toBytes("Repay(address,address,address,uint256)"));

// Blockscout API endpoints (Etherscan V1 is deprecated, Blockscout still works)
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
// EXPLORER API STRATEGY (most reliable)
// =====================================================
function extractAddress(topic: string): string {
  if (!topic || topic.length < 42) return "";
  return "0x" + topic.slice(-40);
}

async function fetchExplorerLogs(
  chainId: number,
  contractAddress: string,
  topic0: string,
  ownerAddress?: string,
): Promise<any[]> {
  const baseUrl = EXPLORER_API[chainId];
  if (!baseUrl) return [];

  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    address: contractAddress,
    topic0,
    fromBlock: "0",
    toBlock: "99999999",
    page: "1",
    offset: "20",
  });

  // Filter by owner (topic index 2 for Borrow/Repay events)
  if (ownerAddress) {
    const paddedOwner = "0x" + ownerAddress.slice(2).toLowerCase().padStart(64, "0");
    params.set("topic0_2_opr", "and");
    params.set("topic2", paddedOwner);
  }

  try {
    const res = await withTimeout(fetch(`${baseUrl}?${params}`), 15_000, "explorer-api");
    const data = await res.json();
    console.log(`[usePositionHistory] Explorer API response for topic0=${topic0.slice(0,10)}:`, data.status, data.message, "results:", data.result?.length || 0);
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result;
    }
    // status "0" with message "No records found" is valid - just no events
    return [];
  } catch (err) {
    console.warn("[usePositionHistory] Explorer API failed:", err);
    return [];
  }
}

function explorerLogsToItems(
  logs: any[],
  type: "Borrow" | "Repay",
  chainId: number,
  prices: Record<string, number>
): PositionHistoryItem[] {
  return logs.map((log) => {
    const token = extractAddress(log.topics?.[3] || "");
    const amt = log.data && log.data !== "0x" ? BigInt(log.data) : BigInt(0);
    const { symbol, decimals } = resolveTokenSymbol(token, chainId);
    const amount = Number(formatUnits(amt, decimals));
    const price = prices[symbol] || (symbol === "ETH" ? 2000 : 1);

    // Explorer API provides timestamp directly (hex)
    const ts = parseInt(log.timeStamp || "0", 16);
    const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();

    return {
      date: dateObj.toISOString().split("T")[0],
      time: dateObj.toTimeString().split(" ")[0],
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
  });
}

// =====================================================
// RPC STRATEGY (fallback)
// =====================================================
async function fetchLogsDirect(
  client: any,
  contractAddress: `0x${string}`,
  event: any,
  args: any,
  currentBlock: bigint,
): Promise<any[]> {
  const ranges = [BigInt(500000), BigInt(100000), BigInt(50000), BigInt(10000), BigInt(5000), BigInt(2000), BigInt(500)];
  for (const range of ranges) {
    try {
      const fromBlock = currentBlock > range ? currentBlock - range : BigInt(0);
      const logs = await withTimeout(
        client.getLogs({ address: contractAddress, event, args, fromBlock, toBlock: currentBlock }),
        20_000,
        `direct(range=${range})`
      ) as any[];
      console.log(`[usePositionHistory] RPC direct range=${range}: ${logs.length} events`);
      return logs;
    } catch (err) {
      console.warn(`[usePositionHistory] RPC direct range=${range} failed:`, err);
      continue;
    }
  }
  return [];
}

function rpcLogsToItems(
  logs: any[],
  type: "Borrow" | "Repay",
  chainId: number,
  prices: Record<string, number>
): PositionHistoryItem[] {
  return logs.map((log) => {
    const { account, owner, token, amt } = (log as any).args;
    const { symbol, decimals } = resolveTokenSymbol(token, chainId);
    const amount = Number(formatUnits(amt || BigInt(0), decimals));
    const price = prices[symbol] || (symbol === "ETH" ? 2000 : 1);
    return {
      date: "",
      time: "",
      type,
      token,
      tokenSymbol: symbol,
      amount: Math.round(amount * 10000) / 10000,
      amountUsd: Math.round(amount * price * 100) / 100,
      account,
      owner,
      txHash: (log as any).transactionHash,
      blockNumber: (log as any).blockNumber,
    };
  });
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

export function usePositionHistory(): UsePositionHistoryReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [history, setHistory] = useState<PositionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  // Load from cache immediately on mount / wallet change
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
      // STRATEGY 1: Block Explorer API (most reliable)
      // =====================================================
      console.log("[usePositionHistory] Strategy 1: Explorer API for chain", chainId, "contract", contractAddress);
      try {
        // Fetch user-specific borrow/repay events
        const borrowLogs = await fetchExplorerLogs(chainId, contractAddress, BORROW_TOPIC0, address);
        // Small delay to avoid rate limiting (no API key)
        await new Promise(r => setTimeout(r, 300));
        const repayLogs = await fetchExplorerLogs(chainId, contractAddress, REPAY_TOPIC0, address);

        allItems.push(...explorerLogsToItems(borrowLogs, "Borrow", chainId, prices));
        allItems.push(...explorerLogsToItems(repayLogs, "Repay", chainId, prices));

        console.log(`[usePositionHistory] Explorer API: ${allItems.length} user events (${borrowLogs.length} borrows, ${repayLogs.length} repays)`);

        // If user has no personal events, fetch recent contract activity (any user)
        if (allItems.length === 0) {
          console.log("[usePositionHistory] No user events, fetching recent contract activity...");
          await new Promise(r => setTimeout(r, 300));
          const recentBorrows = await fetchExplorerLogs(chainId, contractAddress, BORROW_TOPIC0);
          await new Promise(r => setTimeout(r, 300));
          const recentRepays = await fetchExplorerLogs(chainId, contractAddress, REPAY_TOPIC0);

          allItems.push(...explorerLogsToItems(recentBorrows, "Borrow", chainId, prices));
          allItems.push(...explorerLogsToItems(recentRepays, "Repay", chainId, prices));
          console.log(`[usePositionHistory] Explorer API: ${allItems.length} contract-wide events`);
        }
      } catch (err) {
        console.warn("[usePositionHistory] Strategy 1 (Explorer) failed:", err);
      }

      // =====================================================
      // STRATEGY 2: RPC getLogs (fallback if explorer failed)
      // =====================================================
      if (allItems.length === 0) {
        console.log("[usePositionHistory] Strategy 2: RPC direct query");
        try {
          const currentBlock = await withTimeout(
            publicClient.getBlockNumber(),
            10_000,
            "getBlockNumber"
          ) as bigint;

          // Try by owner first
          const [borrowLogs, repayLogs] = await Promise.all([
            fetchLogsDirect(publicClient, contractAddress, BORROW_EVENT, { owner: address }, currentBlock),
            fetchLogsDirect(publicClient, contractAddress, REPAY_EVENT, { owner: address }, currentBlock),
          ]);

          allItems.push(...rpcLogsToItems(borrowLogs, "Borrow", chainId, prices));
          allItems.push(...rpcLogsToItems(repayLogs, "Repay", chainId, prices));

          // If no user events, try unfiltered
          if (allItems.length === 0) {
            console.log("[usePositionHistory] No user RPC events, trying unfiltered...");
            const [allBorrows, allRepays] = await Promise.all([
              fetchLogsDirect(publicClient, contractAddress, BORROW_EVENT, {}, currentBlock),
              fetchLogsDirect(publicClient, contractAddress, REPAY_EVENT, {}, currentBlock),
            ]);

            // Filter client-side for user
            const ownerLower = address.toLowerCase();
            const userBorrows = allBorrows.filter((l: any) => l.args?.owner?.toLowerCase() === ownerLower);
            const userRepays = allRepays.filter((l: any) => l.args?.owner?.toLowerCase() === ownerLower);

            allItems.push(...rpcLogsToItems(userBorrows, "Borrow", chainId, prices));
            allItems.push(...rpcLogsToItems(userRepays, "Repay", chainId, prices));

            // Still nothing? Show recent contract activity
            if (allItems.length === 0 && (allBorrows.length > 0 || allRepays.length > 0)) {
              const recentLogs = [...allBorrows, ...allRepays]
                .sort((a: any, b: any) => Number((b.blockNumber || BigInt(0)) - (a.blockNumber || BigInt(0))))
                .slice(0, 10);
              for (const log of recentLogs) {
                const isBorrow = allBorrows.includes(log);
                allItems.push(...rpcLogsToItems([log], isBorrow ? "Borrow" : "Repay", chainId, prices));
              }
            }
          }
        } catch (err) {
          console.warn("[usePositionHistory] Strategy 2 (RPC) failed:", err);
        }
      }

      // Sort and limit
      allItems.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      const recent = allItems.slice(0, MIN_EVENTS);

      // Fill timestamps for RPC results (Explorer results already have timestamps)
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
