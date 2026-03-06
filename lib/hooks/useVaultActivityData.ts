/**
 * useVaultActivityData - Fetches REAL vault activity from blockchain
 *
 * Caching strategy:
 * - Transactions cached in localStorage keyed by chainId + asset
 * - On mount: show cached data immediately, then check for new events
 * - Only full re-scans when no cache exists or force refetch
 *
 * TWO DATA STRATEGIES:
 * 1. USER DISTRIBUTION - on-chain state reads (always fresh, no caching)
 * 2. ALL TRANSACTIONS - event logs with backward pagination + localStorage cache
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits, parseAbiItem, keccak256, toBytes } from "viem";
import { vTokenAddressByChain, TOKEN_DECIMALS } from "@/lib/utils/web3/token";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { EarnAsset } from "@/lib/types";

const DEPOSIT_EVENT = parseAbiItem(
  "event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)"
);
const WITHDRAW_EVENT = parseAbiItem(
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
);

// Event topic hashes for Explorer API
const DEPOSIT_TOPIC0 = keccak256(toBytes("Deposit(address,address,uint256,uint256)"));
const WITHDRAW_TOPIC0 = keccak256(toBytes("Withdraw(address,address,address,uint256,uint256)"));

// Blockscout API endpoints (Etherscan V1 is deprecated, Blockscout still works)
const EXPLORER_API: Record<number, string> = {
  8453: "https://base.blockscout.com/api",
  42161: "https://arbitrum.blockscout.com/api",
  10: "https://optimism.blockscout.com/api",
};

const MIN_EVENTS = 10;
const MAX_LOOKBACK = BigInt(2_000_000);
const CACHE_PREFIX = "vanna_vault_tx_";

export interface UserDistributionItem {
  address: string;
  fullAddress: string;
  suppliedAmount: number;
  suppliedUsd: number;
  supplyPercent: number;
  icon: string;
  asset: string;
}

export interface TransactionItem {
  date: string;
  time: string;
  type: "Vault Deposit" | "Vault Withdraw";
  amount: number;
  amountUsd: number;
  userAddress: string;
  fullAddress: string;
  asset: string;
  txHash: string;
  icon: string;
  userIcon: string;
  blockNumber?: string; // for cache tracking
}

interface CacheData {
  items: TransactionItem[];
  latestBlock: string;
  timestamp: number;
}

interface UseVaultActivityDataReturn {
  userDistribution: UserDistributionItem[];
  transactions: TransactionItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const shortenAddress = (addr: string): string => {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getAssetIcon = (asset: string): string => {
  const icons: Record<string, string> = {
    ETH: "/icons/eth-icon.png",
    USDC: "/icons/usdc-icon.svg",
    USDT: "/icons/usdt-icon.svg",
  };
  return icons[asset] || "/icons/eth-icon.png";
};

const getVaultAbi = (asset: EarnAsset) => {
  return asset === "ETH" ? VEther.abi : VToken.abi;
};

function extractAddress(topic: string): string {
  if (!topic || topic.length < 42) return "";
  return "0x" + topic.slice(-40);
}

async function fetchExplorerLogs(
  chainId: number,
  contractAddress: string,
  topic0: string,
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

  try {
    const res = await withTimeout(fetch(`${baseUrl}?${params}`), 15_000, "vault-explorer-api");
    const data = await res.json();
    console.log(`[useVaultActivityData] Explorer API response:`, data.status, data.message, "results:", data.result?.length || 0);
    if (data.status === "1" && Array.isArray(data.result)) {
      return data.result;
    }
    return [];
  } catch (err) {
    console.warn("[useVaultActivityData] Explorer API failed:", err);
    return [];
  }
}

function explorerLogsToTxItems(
  logs: any[],
  type: "Vault Deposit" | "Vault Withdraw",
  decimals: number,
  tokenPrice: number,
  asset: string,
): TransactionItem[] {
  return logs.map((log) => {
    // Deposit data: abi.encode(uint256 assets, uint256 shares)
    // Withdraw data: abi.encode(uint256 assets, uint256 shares)
    // assets is the first 32 bytes of data
    let assets = BigInt(0);
    if (log.data && log.data.length >= 66) {
      assets = BigInt("0x" + log.data.slice(2, 66));
    }
    const amount = Number(formatUnits(assets, decimals));

    // Owner: topic2 for Deposit, topic3 for Withdraw
    const ownerTopic = type === "Vault Deposit" ? log.topics?.[2] : log.topics?.[3];
    const owner = extractAddress(ownerTopic || "");

    const ts = parseInt(log.timeStamp || "0", 16);
    const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();

    return {
      date: dateObj.toISOString().split("T")[0],
      time: dateObj.toTimeString().split(" ")[0],
      type,
      amount: Math.round(amount * 1000) / 1000,
      amountUsd: Math.round(amount * tokenPrice * 100) / 100,
      userAddress: shortenAddress(owner),
      fullAddress: owner,
      asset,
      txHash: log.transactionHash || "",
      icon: getAssetIcon(asset),
      userIcon: "/icons/user.png",
      blockNumber: BigInt(log.blockNumber || "0").toString(),
    };
  });
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

function getCacheKey(chainId: number, asset: string): string {
  return `${CACHE_PREFIX}${chainId}_${asset}`;
}

function loadCache(chainId: number, asset: string): CacheData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(chainId, asset));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheData;
    // Ignore empty caches from previous failed fetches
    if (!parsed.items || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(chainId: number, asset: string, items: TransactionItem[], latestBlock: bigint) {
  if (!items || items.length === 0) return; // Don't save empty results
  try {
    const cached: CacheData = {
      items,
      latestBlock: latestBlock.toString(),
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(chainId, asset), JSON.stringify(cached));
  } catch {}
}

async function fetchLogsWithPagination(
  client: any,
  vTokenAddress: `0x${string}`,
  event: any,
  currentBlock: bigint,
  minEvents: number
): Promise<any[]> {
  const chunkSizes = [BigInt(100000), BigInt(10000), BigInt(2000), BigInt(500), BigInt(100), BigInt(10)];
  let workingChunk: bigint | null = null;

  for (const chunk of chunkSizes) {
    try {
      const from = currentBlock > chunk ? currentBlock - chunk : BigInt(0);
      await withTimeout(
        client.getLogs({ address: vTokenAddress, event, fromBlock: from, toBlock: currentBlock }),
        15_000,
        `probe(chunk=${chunk})`
      ) as any[];
      workingChunk = chunk;
      break;
    } catch {
      continue;
    }
  }

  if (!workingChunk) {
    console.warn("[useVaultActivityData] All chunk sizes failed for", vTokenAddress);
    return [];
  }

  console.log(`[useVaultActivityData] Working chunk size: ${workingChunk}`);

  const allLogs: any[] = [];
  let toBlock = currentBlock;
  // Scale iterations by chunk size: small chunks need more iterations to cover enough history
  // chunk=100000 → 20 iter (2M blocks), chunk=10000 → 100, chunk=100 → 200, chunk=10 → 500
  const maxIterations = Math.min(Number(MAX_LOOKBACK / workingChunk), 500);
  const minBlock = currentBlock > MAX_LOOKBACK ? currentBlock - MAX_LOOKBACK : BigInt(0);
  let iterations = 0;
  const paginationStart = Date.now();
  const MAX_PAGINATION_MS = 60_000; // 60s total time limit

  while (toBlock > minBlock && iterations < maxIterations) {
    if (Date.now() - paginationStart > MAX_PAGINATION_MS) {
      console.warn("[useVaultActivityData] Pagination time limit reached");
      break;
    }

    const fromBlock = toBlock > workingChunk ? toBlock - workingChunk : BigInt(0);
    iterations++;

    try {
      const logs = await withTimeout(
        client.getLogs({ address: vTokenAddress, event, fromBlock, toBlock }),
        15_000,
        `getLogs(${fromBlock}-${toBlock})`
      ) as any[];
      if (logs.length > 0) {
        allLogs.push(...logs);
      }
    } catch (err) {
      console.warn(`[useVaultActivityData] getLogs failed for ${fromBlock}-${toBlock}:`, err);
    }

    if (allLogs.length >= minEvents) break;

    toBlock = fromBlock > BigInt(0) ? fromBlock - BigInt(1) : BigInt(0);
    if (fromBlock === BigInt(0)) break;
  }

  console.log(`[useVaultActivityData] Collected ${allLogs.length} events in ${iterations} iterations (chunk: ${workingChunk}, ${Date.now() - paginationStart}ms)`);
  return allLogs;
}

function buildTxItems(
  logs: any[],
  type: "Vault Deposit" | "Vault Withdraw",
  decimals: number,
  tokenPrice: number,
  asset: string
): TransactionItem[] {
  return logs.map((log) => {
    const amount = Number(formatUnits((log.args as any).assets as bigint, decimals));
    return {
      date: "",
      time: "",
      type,
      amount: Math.round(amount * 1000) / 1000,
      amountUsd: Math.round(amount * tokenPrice * 100) / 100,
      userAddress: shortenAddress((log.args as any).owner as string),
      fullAddress: (log.args as any).owner as string,
      asset,
      txHash: log.transactionHash,
      icon: getAssetIcon(asset),
      userIcon: "/icons/user.png",
      blockNumber: log.blockNumber.toString(),
    };
  });
}

async function fillTimestamps(items: TransactionItem[], client: any): Promise<void> {
  if (items.length === 0) return;

  const uniqueBlocks = [...new Set(items.filter((i) => i.blockNumber).map((i) => BigInt(i.blockNumber!)))];
  const blockTimestamps = new Map<string, number>();

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
          return { blockNum: blockNum.toString(), timestamp: Number(block.timestamp) };
        } catch {
          return { blockNum: blockNum.toString(), timestamp: 0 };
        }
      })
    );
    for (const { blockNum, timestamp } of results) {
      blockTimestamps.set(blockNum, timestamp);
    }
  }

  for (const item of items) {
    if (item.date) continue; // already has timestamp
    const ts = blockTimestamps.get(item.blockNumber || "") || 0;
    const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();
    item.date = dateObj.toISOString().split("T")[0];
    item.time = dateObj.toTimeString().split(" ")[0];
  }
}

export function useVaultActivityData(asset: EarnAsset): UseVaultActivityDataReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [userDistribution, setUserDistribution] = useState<UserDistributionItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  // Load cached transactions immediately on mount
  useEffect(() => {
    if (!chainId) return;
    const cache = loadCache(chainId, asset);
    if (cache && cache.items.length > 0) {
      setTransactions(cache.items);
    }
  }, [chainId, asset]);

  const fetchActivity = useCallback(async (force = false) => {
    if (!publicClient || !chainId) {
      setUserDistribution([]);
      setTransactions([]);
      return;
    }

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) {
      setUserDistribution([]);
      setTransactions([]);
      return;
    }

    if (isFetching.current) return;
    isFetching.current = true;

    const cache = loadCache(chainId, asset);
    if (!cache || cache.items.length === 0 || force) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const decimals = TOKEN_DECIMALS[asset] ?? 18;
      const abi = getVaultAbi(asset);

      // Fetch live prices from /api/prices (backed by Mux)
      let prices: Record<string, number> = {};
      try {
        const pricesRes = await fetch("/api/prices");
        const pricesData = await pricesRes.json();
        if (pricesData.ETH) {
          prices = pricesData;
        } else {
          throw new Error("No ETH price");
        }
      } catch {
        try {
          const muxRes = await fetch("https://app.mux.network/api/liquidityAsset");
          const muxData = await muxRes.json();
          const ethAsset = (muxData.assets ?? []).find((a: any) => a.symbol === "ETH");
          prices = { ETH: ethAsset ? Number(ethAsset.price) : 2000, USDC: 1, USDT: 1 };
        } catch {
          prices = { USDC: 1, USDT: 1, ETH: 2000 };
        }
      }
      const tokenPrice = prices[asset] || (asset === "ETH" ? prices["ETH"] || 2000 : 1);

      // =====================================================
      // USER DISTRIBUTION - Always fresh from chain
      // =====================================================
      const distributionData: UserDistributionItem[] = [];

      try {
        const totalSupply = await publicClient.readContract({
          address: vTokenAddress, abi, functionName: "totalSupply",
        }) as bigint;

        const totalAssets = await publicClient.readContract({
          address: vTokenAddress, abi, functionName: "totalAssets",
        }) as bigint;

        const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));

        if (address) {
          const userShares = await publicClient.readContract({
            address: vTokenAddress, abi, functionName: "balanceOf", args: [address],
          }) as bigint;

          if (userShares > BigInt(0)) {
            const userAssets = await publicClient.readContract({
              address: vTokenAddress, abi, functionName: "convertToAssets", args: [userShares],
            }) as bigint;

            const userAssetsFormatted = Number(formatUnits(userAssets, decimals));
            const supplyPercent = totalSupply > BigInt(0)
              ? Number((userShares * BigInt(10000)) / totalSupply) / 100
              : 0;

            distributionData.push({
              address: shortenAddress(address),
              fullAddress: address,
              suppliedAmount: Math.round(userAssetsFormatted * 1000) / 1000,
              suppliedUsd: Math.round(userAssetsFormatted * tokenPrice * 100) / 100,
              supplyPercent: Math.round(supplyPercent * 100) / 100,
              icon: "/icons/user.png",
              asset,
            });
          }

          if (totalSupply > BigInt(0)) {
            const otherShares = totalSupply - (userShares || BigInt(0));
            if (otherShares > BigInt(0)) {
              const otherAssets = await publicClient.readContract({
                address: vTokenAddress, abi, functionName: "convertToAssets", args: [otherShares],
              }) as bigint;

              const otherAssetsFormatted = Number(formatUnits(otherAssets, decimals));
              const otherPercent = Number((otherShares * BigInt(10000)) / totalSupply) / 100;

              if (otherAssetsFormatted > 0.01) {
                distributionData.push({
                  address: "Other Suppliers",
                  fullAddress: "",
                  suppliedAmount: Math.round(otherAssetsFormatted * 1000) / 1000,
                  suppliedUsd: Math.round(otherAssetsFormatted * tokenPrice * 100) / 100,
                  supplyPercent: Math.round(otherPercent * 100) / 100,
                  icon: "/icons/user.png",
                  asset,
                });
              }
            }
          }
        } else {
          if (totalAssetsFormatted > 0) {
            distributionData.push({
              address: "Total Vault Supply",
              fullAddress: "",
              suppliedAmount: Math.round(totalAssetsFormatted * 1000) / 1000,
              suppliedUsd: Math.round(totalAssetsFormatted * tokenPrice * 100) / 100,
              supplyPercent: 100,
              icon: "/icons/user.png",
              asset,
            });
          }
        }
      } catch (err) {
        console.error("[useVaultActivityData] Error fetching distribution:", err);
      }

      setUserDistribution(distributionData);

      // =====================================================
      // ALL TRANSACTIONS - Explorer API first, then RPC fallback
      // =====================================================
      let txItems: TransactionItem[] = [];

      // STRATEGY 1: Block Explorer API (most reliable)
      try {
        console.log("[useVaultActivityData] Strategy 1: Explorer API for", asset, "vault", vTokenAddress);
        const depositLogs = await fetchExplorerLogs(chainId, vTokenAddress, DEPOSIT_TOPIC0);
        await new Promise(r => setTimeout(r, 300)); // rate limit delay
        const withdrawLogs = await fetchExplorerLogs(chainId, vTokenAddress, WITHDRAW_TOPIC0);

        txItems = [
          ...explorerLogsToTxItems(depositLogs, "Vault Deposit", decimals, tokenPrice, asset),
          ...explorerLogsToTxItems(withdrawLogs, "Vault Withdraw", decimals, tokenPrice, asset),
        ];
        console.log(`[useVaultActivityData] Explorer API: ${txItems.length} vault events (${depositLogs.length} deposits, ${withdrawLogs.length} withdraws)`);
      } catch (err) {
        console.warn("[useVaultActivityData] Strategy 1 (Explorer) failed:", err);
      }

      // STRATEGY 2: RPC getLogs (fallback)
      if (txItems.length === 0) {
        try {
          const currentBlock = await withTimeout(
            publicClient.getBlockNumber(),
            10_000,
            "getBlockNumber"
          ) as bigint;

          console.log("[useVaultActivityData] Strategy 2: RPC getLogs for", asset);
          const [depositLogs, withdrawLogs] = await Promise.all([
            fetchLogsWithPagination(publicClient, vTokenAddress, DEPOSIT_EVENT, currentBlock, MIN_EVENTS),
            fetchLogsWithPagination(publicClient, vTokenAddress, WITHDRAW_EVENT, currentBlock, MIN_EVENTS),
          ]);

          txItems = [
            ...buildTxItems(depositLogs, "Vault Deposit", decimals, tokenPrice, asset),
            ...buildTxItems(withdrawLogs, "Vault Withdraw", decimals, tokenPrice, asset),
          ];

          // Fill timestamps from RPC (explorer items already have them)
          if (txItems.length > 0) {
            await fillTimestamps(txItems.slice(0, 10), publicClient);
          }
          console.log(`[useVaultActivityData] RPC: ${txItems.length} vault events`);
        } catch (err) {
          console.warn("[useVaultActivityData] Strategy 2 (RPC) failed:", err);
        }
      }

      // Sort and save
      if (txItems.length > 0) {
        txItems.sort((a, b) => Number(BigInt(b.blockNumber || "0") - BigInt(a.blockNumber || "0")));
        const recent = txItems.slice(0, 10);
        setTransactions(recent);
        try {
          const latestBlock = BigInt(recent[0].blockNumber || "0");
          saveCache(chainId, asset, recent, latestBlock);
        } catch {}
      }
    } catch (err: any) {
      console.error("[useVaultActivityData] Error:", err);
      setError(err.message || "Failed to fetch vault activity");
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [publicClient, chainId, asset, address]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { userDistribution, transactions, isLoading, error, refetch: () => fetchActivity(true) };
}
