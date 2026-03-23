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
import { formatUnits, keccak256, toBytes } from "viem";
import { vTokenAddressByChain, TOKEN_DECIMALS } from "@/lib/utils/web3/token";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { EarnAsset } from "@/lib/types";

// Event topic hashes
const DEPOSIT_TOPIC0 = keccak256(toBytes("Deposit(address,address,uint256,uint256)"));
const WITHDRAW_TOPIC0 = keccak256(toBytes("Withdraw(address,address,address,uint256,uint256)"));

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

  // Blockscout returns logs ascending (oldest first).
  // Fetch large batch then sort descending to get latest events.
  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    address: contractAddress,
    topic0,
    fromBlock: "0",
    toBlock: "99999999",
    page: "1",
    offset: "1000",
  });

  try {
    const res = await withTimeout(fetch(`${baseUrl}?${params}`), 15_000, "vault-explorer-api");
    const data = await res.json();
    console.log(`[useVaultActivityData] Explorer API response:`, data.status, data.message, "results:", data.result?.length || 0);
    if ((data.message === "OK" || data.status === "1") && Array.isArray(data.result)) {
      // Sort descending by blockNumber (newest first) and return top 20
      const sorted = data.result.sort((a: any, b: any) => {
        const blockA = parseInt(a.blockNumber || "0", 16);
        const blockB = parseInt(b.blockNumber || "0", 16);
        return blockB - blockA;
      });
      return sorted.slice(0, 20);
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
      // ALL TRANSACTIONS - Public RPC first, then Blockscout fallback
      // =====================================================
      let txItems: TransactionItem[] = [];

      // STRATEGY 1: Direct public RPC (always up-to-date, 10K block range)
      try {
        const rpcUrl = PUBLIC_RPC[chainId];
        if (rpcUrl) {
          console.log("[useVaultActivityData] Strategy 1: Public RPC for", asset, "vault", vTokenAddress);
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

          // Try progressively smaller ranges
          const ranges = [9999, 5000, 2000];
          for (const range of ranges) {
            try {
              const fromBlock = Math.max(0, currentBlock - range);
              const res = await withTimeout(
                fetch(rpcUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    jsonrpc: "2.0", id: 2,
                    method: "eth_getLogs",
                    params: [{
                      address: vTokenAddress,
                      topics: [[DEPOSIT_TOPIC0, WITHDRAW_TOPIC0]],
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
                console.log(`[useVaultActivityData] Public RPC range=${range}: ${data.result.length} events`);
                for (const log of data.result) {
                  const topic0 = log.topics?.[0] || "";
                  const isDeposit = topic0 === DEPOSIT_TOPIC0;
                  const type = isDeposit ? "Vault Deposit" as const : "Vault Withdraw" as const;

                  let assets = BigInt(0);
                  if (log.data && log.data.length >= 66) {
                    assets = BigInt("0x" + log.data.slice(2, 66));
                  }
                  const amount = Number(formatUnits(assets, decimals));

                  const ownerTopic = isDeposit ? log.topics?.[2] : log.topics?.[3];
                  const owner = extractAddress(ownerTopic || "");
                  const ts = log.blockTimestamp ? parseInt(log.blockTimestamp, 16) : 0;
                  const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();

                  txItems.push({
                    date: ts > 0 ? dateObj.toISOString().split("T")[0] : "",
                    time: ts > 0 ? dateObj.toTimeString().split(" ")[0] : "",
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
                  });
                }
                break;
              }
              if (data.error) {
                console.warn(`[useVaultActivityData] Public RPC range=${range}:`, data.error.message);
              }
            } catch { continue; }
          }
          console.log(`[useVaultActivityData] Strategy 1: ${txItems.length} events from public RPC`);
        }
      } catch (err) {
        console.warn("[useVaultActivityData] Strategy 1 (Public RPC) failed:", err);
      }

      // STRATEGY 2: Blockscout API (fallback / older history)
      if (txItems.length === 0) {
        try {
          console.log("[useVaultActivityData] Strategy 2: Blockscout API for", asset);
          const depositLogs = await fetchExplorerLogs(chainId, vTokenAddress, DEPOSIT_TOPIC0);
          await new Promise(r => setTimeout(r, 300));
          const withdrawLogs = await fetchExplorerLogs(chainId, vTokenAddress, WITHDRAW_TOPIC0);

          txItems = [
            ...explorerLogsToTxItems(depositLogs, "Vault Deposit", decimals, tokenPrice, asset),
            ...explorerLogsToTxItems(withdrawLogs, "Vault Withdraw", decimals, tokenPrice, asset),
          ];
          console.log(`[useVaultActivityData] Blockscout: ${txItems.length} events`);
        } catch (err) {
          console.warn("[useVaultActivityData] Strategy 2 (Blockscout) failed:", err);
        }
      }

      // Sort and save
      if (txItems.length > 0) {
        txItems.sort((a, b) => Number(BigInt(b.blockNumber || "0") - BigInt(a.blockNumber || "0")));
        const recent = txItems.slice(0, 10);
        // Fill timestamps for items missing them
        await fillTimestamps(recent.filter(t => !t.date), publicClient);
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
