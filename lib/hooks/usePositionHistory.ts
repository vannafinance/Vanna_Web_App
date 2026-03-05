/**
 * usePositionHistory - Fetches Borrow & Repay event history from AccountManager contract
 *
 * Uses the same adaptive block range strategy as useVaultActivityData:
 * 1. Try large range (50K blocks) - works on Base public RPC / paid RPCs
 * 2. On block range error: try progressively smaller ranges (2000, 500, 100, 10)
 * 3. Once working chunk size found, paginate backwards to collect events
 *
 * Events from AccountManager ABI:
 * - Borrow(address indexed account, address indexed owner, address indexed token, uint256 amt)
 * - Repay(address indexed account, address indexed owner, address indexed token, uint256 amt)
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits, parseAbiItem, createPublicClient, http } from "viem";
import { base, arbitrum, optimism } from "viem/chains";
import { accountManagerAddressByChain } from "@/lib/utils/web3/token";
import { getAddressList } from "@/lib/utils/web3/addressList";

const BORROW_EVENT = parseAbiItem(
  "event Borrow(address indexed account, address indexed owner, address indexed token, uint256 amt)"
);
const REPAY_EVENT = parseAbiItem(
  "event Repay(address indexed account, address indexed owner, address indexed token, uint256 amt)"
);

export interface PositionHistoryItem {
  date: string;
  time: string;
  type: "Borrow" | "Repay";
  token: string;
  tokenSymbol: string;
  amount: number;
  amountUsd: number;
  account: string;
  owner: string;
  txHash: string;
  blockNumber: bigint;
}

interface UsePositionHistoryReturn {
  history: PositionHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Public RPCs as fallback for large block ranges
const PUBLIC_RPC: Record<number, string> = {
  8453: "https://mainnet.base.org",
  42161: "https://arb1.arbitrum.io/rpc",
  10: "https://mainnet.optimism.io",
};

const CHAIN_MAP: Record<number, any> = {
  8453: base,
  42161: arbitrum,
  10: optimism,
};

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

function getPublicRpcClient(chainId: number) {
  const rpcUrl = PUBLIC_RPC[chainId];
  const chain = CHAIN_MAP[chainId];
  if (!rpcUrl || !chain) return null;
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

async function fetchLogs(
  chainId: number,
  contractAddress: `0x${string}`,
  event: any,
  args: any
): Promise<any[]> {
  const client = getPublicRpcClient(chainId);
  if (!client) return [];

  const rangesToTry = [BigInt(100000), BigInt(10000), BigInt(2000), BigInt(500)];

  try {
    const currentBlock = await client.getBlockNumber();

    for (const range of rangesToTry) {
      try {
        const fromBlock = currentBlock > range ? currentBlock - range : BigInt(0);
        const logs = await client.getLogs({
          address: contractAddress,
          event,
          args,
          fromBlock,
          toBlock: currentBlock,
        });
        console.log(`[usePositionHistory] Found ${logs.length} events (range: ${range})`);
        return logs;
      } catch {
        console.log(`[usePositionHistory] Range ${range} failed, trying smaller...`);
        continue;
      }
    }
  } catch (err) {
    console.error("[usePositionHistory] Failed to get block number:", err);
  }

  return [];
}

export function usePositionHistory(): UsePositionHistoryReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [history, setHistory] = useState<PositionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!address || !publicClient || !chainId) {
      setHistory([]);
      return;
    }

    const contractAddress = accountManagerAddressByChain[chainId];
    if (!contractAddress) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch prices
      let prices: Record<string, number> = {};
      try {
        const pricesRes = await fetch("/api/prices");
        const pricesData = await pricesRes.json();
        if (pricesData.ETH) prices = pricesData;
        else throw new Error("No ETH price");
      } catch {
        prices = { USDC: 1, USDT: 1, ETH: 2000 };
      }

      // First get user's margin accounts from Registry
      const addressList = getAddressList(chainId);
      if (!addressList) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      const Registry = (await import("@/abi/vanna/out/out/Registry.sol/Registry.json")).default;
      const accounts = (await publicClient.readContract({
        address: addressList.registryContractAddress as `0x${string}`,
        abi: Registry.abi,
        functionName: "accountsOwnedBy",
        args: [address],
      })) as `0x${string}`[];

      if (!accounts || accounts.length === 0) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      // Fetch Borrow + Repay events for each margin account
      const allItems: PositionHistoryItem[] = [];

      for (const acc of accounts) {
        const [borrowLogs, repayLogs] = await Promise.all([
          fetchLogs(chainId, contractAddress, BORROW_EVENT, { account: acc }),
          fetchLogs(chainId, contractAddress, REPAY_EVENT, { account: acc }),
        ]);

        for (const log of borrowLogs) {
          const { account, owner, token, amt } = (log as any).args;
          const { symbol, decimals } = resolveTokenSymbol(token, chainId);
          const amount = Number(formatUnits(amt || BigInt(0), decimals));
          const price = prices[symbol] || (symbol === "ETH" ? 2000 : 1);

          allItems.push({
            date: "",
            time: "",
            type: "Borrow",
            token,
            tokenSymbol: symbol,
            amount: Math.round(amount * 10000) / 10000,
            amountUsd: Math.round(amount * price * 100) / 100,
            account,
            owner,
            txHash: (log as any).transactionHash,
            blockNumber: (log as any).blockNumber,
          });
        }

        for (const log of repayLogs) {
          const { account, owner, token, amt } = (log as any).args;
          const { symbol, decimals } = resolveTokenSymbol(token, chainId);
          const amount = Number(formatUnits(amt || BigInt(0), decimals));
          const price = prices[symbol] || (symbol === "ETH" ? 2000 : 1);

          allItems.push({
            date: "",
            time: "",
            type: "Repay",
            token,
            tokenSymbol: symbol,
            amount: Math.round(amount * 10000) / 10000,
            amountUsd: Math.round(amount * price * 100) / 100,
            account,
            owner,
            txHash: (log as any).transactionHash,
            blockNumber: (log as any).blockNumber,
          });
        }
      }

      // Sort by block number descending (most recent first)
      allItems.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      // Take last 10
      const recent = allItems.slice(0, 10);

      // Fetch block timestamps
      if (recent.length > 0) {
        const uniqueBlocks = [...new Set(recent.map((e) => e.blockNumber))];
        const blockTimestamps = new Map<bigint, number>();

        const timestampClient = getPublicRpcClient(chainId) || publicClient;

        for (let i = 0; i < uniqueBlocks.length; i += 5) {
          const batch = uniqueBlocks.slice(i, i + 5);
          const results = await Promise.all(
            batch.map(async (blockNum) => {
              try {
                const block = await timestampClient.getBlock({ blockNumber: blockNum });
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

        for (const item of recent) {
          const ts = blockTimestamps.get(item.blockNumber) || 0;
          const dateObj = ts > 0 ? new Date(ts * 1000) : new Date();
          item.date = dateObj.toISOString().split("T")[0];
          item.time = dateObj.toTimeString().split(" ")[0];
        }
      }

      setHistory(recent);
    } catch (err: any) {
      console.error("[usePositionHistory] Error:", err);
      setError(err.message || "Failed to fetch position history");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, chainId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
}
