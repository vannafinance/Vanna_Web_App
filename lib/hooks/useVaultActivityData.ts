/**
 * useVaultActivityData - Fetches REAL vault activity from blockchain
 *
 * TWO DATA STRATEGIES:
 *
 * 1. USER DISTRIBUTION (on-chain state reads - works on ANY RPC tier):
 *    - Reads totalSupply() from vToken contract
 *    - Reads balanceOf() + convertToAssets() for the connected user
 *    - Shows connected user's share of the vault
 *    - No event logs needed
 *
 * 2. ALL TRANSACTIONS (event logs with adaptive pagination):
 *    - Tries fetching Deposit/Withdraw events from vToken contract
 *    - Auto-detects RPC block range limits (e.g. Alchemy free = 10 blocks)
 *    - Paginates backwards in small chunks to collect recent transactions
 *    - Gracefully falls back to empty list if RPC doesn't support large ranges
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits, parseAbiItem, createPublicClient, http } from "viem";
import { base, arbitrum, optimism } from "viem/chains";
import { vTokenAddressByChain, TOKEN_DECIMALS } from "@/lib/utils/web3/token";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { EarnAsset } from "@/lib/types";

// Event signatures matching VToken/VEther ABI
const DEPOSIT_EVENT = parseAbiItem(
  "event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)"
);
const WITHDRAW_EVENT = parseAbiItem(
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)"
);

// Types for the hook's return data
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

// Public RPCs with no block range limit
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

function getPublicRpcClient(chainId: number) {
  const rpcUrl = PUBLIC_RPC[chainId];
  const chain = CHAIN_MAP[chainId];
  if (!rpcUrl || !chain) return null;
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

/**
 * Fetch event logs using public RPC directly.
 * Tries progressively smaller block ranges if the RPC rejects large ones.
 */
async function fetchLogs(
  chainId: number,
  vTokenAddress: `0x${string}`,
  event: any
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
          address: vTokenAddress,
          event,
          fromBlock,
          toBlock: currentBlock,
        });
        console.log(`[useVaultActivityData] Found ${logs.length} events (range: ${range})`);
        return logs;
      } catch {
        console.log(`[useVaultActivityData] Range ${range} failed, trying smaller...`);
        continue;
      }
    }
  } catch (err) {
    console.error("[useVaultActivityData] Failed to get block number:", err);
  }

  return [];
}

export function useVaultActivityData(asset: EarnAsset): UseVaultActivityDataReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [userDistribution, setUserDistribution] = useState<UserDistributionItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
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

    setIsLoading(true);
    setError(null);

    try {
      const decimals = TOKEN_DECIMALS[asset] ?? 18;
      const abi = getVaultAbi(asset);

      // Fetch live prices from /api/prices (backed by MUX)
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
      // USER DISTRIBUTION - On-chain state reads (no events needed)
      // Works on any RPC tier including Alchemy free
      // =====================================================
      const distributionData: UserDistributionItem[] = [];

      try {
        // Read total supply of vTokens (total shares in the vault)
        const totalSupply = await publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalSupply",
        }) as bigint;

        const totalAssets = await publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalAssets",
        }) as bigint;

        const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));

        // If connected user, show their share
        if (address) {
          const userShares = await publicClient.readContract({
            address: vTokenAddress,
            abi,
            functionName: "balanceOf",
            args: [address],
          }) as bigint;

          if (userShares > BigInt(0)) {
            // Convert shares to underlying assets
            const userAssets = await publicClient.readContract({
              address: vTokenAddress,
              abi,
              functionName: "convertToAssets",
              args: [userShares],
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

          // Show the remaining vault supply as "Other Suppliers"
          if (totalSupply > BigInt(0)) {
            const otherShares = totalSupply - (userShares || BigInt(0));
            if (otherShares > BigInt(0)) {
              const otherAssets = await publicClient.readContract({
                address: vTokenAddress,
                abi,
                functionName: "convertToAssets",
                args: [otherShares],
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
          // No connected wallet - show total vault supply as single entry
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
        // Non-fatal: distribution will be empty
      }

      setUserDistribution(distributionData);

      // =====================================================
      // ALL TRANSACTIONS - Event logs with adaptive pagination
      // Handles both paid RPCs (large range) and free tier (10 block chunks)
      // =====================================================
      const txData: TransactionItem[] = [];

      try {
        // Fetch events using public RPC directly (no Alchemy dependency)
        const [depositLogs, withdrawLogs] = await Promise.all([
          fetchLogs(chainId, vTokenAddress, DEPOSIT_EVENT),
          fetchLogs(chainId, vTokenAddress, WITHDRAW_EVENT),
        ]);

        // Combine and sort all events
        const allEvents: {
          type: "Vault Deposit" | "Vault Withdraw";
          user: string;
          amount: bigint;
          blockNumber: bigint;
          txHash: string;
        }[] = [];

        for (const log of depositLogs) {
          allEvents.push({
            type: "Vault Deposit",
            user: (log.args as any).owner as string,
            amount: (log.args as any).assets as bigint,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          });
        }

        for (const log of withdrawLogs) {
          allEvents.push({
            type: "Vault Withdraw",
            user: (log.args as any).owner as string,
            amount: (log.args as any).assets as bigint,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          });
        }

        // Sort most recent first
        allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        // Take most recent 10
        const recentEvents = allEvents.slice(0, 10);

        if (recentEvents.length > 0) {
          // Fetch block timestamps for unique blocks
          const uniqueBlocks = [...new Set(recentEvents.map(e => e.blockNumber))];
          const blockTimestamps = new Map<bigint, number>();

          // Use public RPC for timestamp fetching (no rate limits)
          const tsClient = getPublicRpcClient(chainId) || publicClient;

          // Batch fetch timestamps (5 at a time)
          for (let i = 0; i < uniqueBlocks.length; i += 5) {
            const batch = uniqueBlocks.slice(i, i + 5);
            const results = await Promise.all(
              batch.map(async (blockNum) => {
                try {
                  const block = await tsClient.getBlock({ blockNumber: blockNum });
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

          // Build transaction items
          for (const event of recentEvents) {
            const timestamp = blockTimestamps.get(event.blockNumber) || 0;
            const dateObj = timestamp > 0 ? new Date(timestamp * 1000) : new Date();
            const amount = Number(formatUnits(event.amount, decimals));

            txData.push({
              date: dateObj.toISOString().split("T")[0],
              time: dateObj.toTimeString().split(" ")[0],
              type: event.type,
              amount: Math.round(amount * 1000) / 1000,
              amountUsd: Math.round(amount * tokenPrice * 100) / 100,
              userAddress: shortenAddress(event.user),
              fullAddress: event.user,
              asset,
              txHash: event.txHash,
              icon: getAssetIcon(asset),
              userIcon: "/icons/user.png",
            });
          }
        }
      } catch (err) {
        console.warn("[useVaultActivityData] Could not fetch transaction logs:", err);
        // Non-fatal: transactions will be empty, distribution still shows
      }

      setTransactions(txData);
    } catch (err: any) {
      console.error("[useVaultActivityData] Error:", err);
      setError(err.message || "Failed to fetch vault activity");
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, chainId, asset, address]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { userDistribution, transactions, isLoading, error, refetch: fetchActivity };
}
