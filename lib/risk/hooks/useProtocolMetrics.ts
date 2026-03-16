'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';
import {
  CHAIN_CONTRACTS, SUPPORTED_CHAINS, vTokenAbi, linearRateModelAbi, TOKEN_LIST, SECS_PER_YEAR,
} from '../contracts';
import { bigintToNumber } from '../formatting';
import type { ProtocolMetrics, PoolData } from '../types';

const chainConfigs = {
  8453: base,
  42161: arbitrum,
  10: optimism,
} as const;

function getClient(chainId: number) {
  const chain = chainConfigs[chainId as keyof typeof chainConfigs];
  return createPublicClient({ chain, transport: http() });
}

async function fetchChainPoolData(chainId: number): Promise<PoolData[]> {
  const client = getClient(chainId);
  const contracts = CHAIN_CONTRACTS[chainId];
  if (!contracts) return [];

  const pools: PoolData[] = [];

  for (const token of TOKEN_LIST) {
    const vTokenAddr = contracts.vTokens[token.vTokenKey];
    try {
      const [totalAssets, totalBorrows] = await Promise.all([
        client.readContract({ address: vTokenAddr, abi: vTokenAbi, functionName: 'totalAssets' }),
        client.readContract({ address: vTokenAddr, abi: vTokenAbi, functionName: 'getBorrows' }),
      ]);

      const supplied = bigintToNumber(totalAssets as bigint, token.decimals);
      const borrowed = bigintToNumber(totalBorrows as bigint, token.decimals);
      const utilization = supplied > 0 ? (borrowed / supplied) * 100 : 0;

      // Fetch borrow rate from rate model
      let borrowRatePerSec = BigInt(0);
      let borrowAPY = 0;
      try {
        const liquidity = (totalAssets as bigint) - (totalBorrows as bigint);
        const rate = await client.readContract({
          address: contracts.rateModel,
          abi: linearRateModelAbi,
          functionName: 'getBorrowRatePerSecond',
          args: [liquidity > BigInt(0) ? liquidity : BigInt(0), totalBorrows as bigint],
        });
        borrowRatePerSec = rate as bigint;
        // APY = (1 + ratePerSec)^secsPerYear - 1, approximated as ratePerSec * secsPerYear / 1e18
        borrowAPY = (Number(borrowRatePerSec) * SECS_PER_YEAR) / 1e18 * 100;
      } catch {
        // Rate model call failed, leave at 0
      }

      // Supply APY approximation: borrowAPY * utilization * (1 - reserveFactor)
      // Assuming no reserve factor for simplicity
      const supplyAPY = borrowAPY * (utilization / 100);

      pools.push({
        chainId,
        symbol: token.symbol,
        vTokenAddress: vTokenAddr,
        tokenAddress: contracts.tokens[token.tokenKey],
        totalSupplied: totalAssets as bigint,
        totalBorrowed: totalBorrows as bigint,
        utilization,
        borrowRatePerSecond: borrowRatePerSec,
        borrowAPY,
        supplyAPY,
        decimals: token.decimals,
      });
    } catch (err) {
      console.error(`[Risk] Failed to fetch pool data for ${token.symbol} on chain ${chainId}:`, err);
    }
  }
  return pools;
}

// Rough USD prices for display (ETH ~$3500, stables ~$1)
// In production, these come from the oracle. For the dashboard overview we use simple estimates.
function getApproxUsdPrice(symbol: string): number {
  if (symbol === 'ETH') return 3500;
  return 1; // stablecoins
}

export function useProtocolMetrics() {
  const [metrics, setMetrics] = useState<ProtocolMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainErrors, setChainErrors] = useState<Record<number, string | null>>({});

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const errors: Record<number, string | null> = {};
    const allPools: PoolData[] = [];

    const results = await Promise.allSettled(
      SUPPORTED_CHAINS.map(async (chainId) => {
        const pools = await fetchChainPoolData(chainId);
        return { chainId, pools };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allPools.push(...result.value.pools);
        errors[result.value.chainId] = null;
      } else {
        const chainId = SUPPORTED_CHAINS[results.indexOf(result)];
        errors[chainId] = result.reason?.message || 'Failed to fetch';
      }
    }

    setChainErrors(errors);

    if (allPools.length === 0) {
      setError('Failed to fetch data from all chains');
      setLoading(false);
      return;
    }

    // Aggregate
    const perChain: ProtocolMetrics['perChain'] = {};
    let totalSupplied = 0;
    let totalBorrowed = 0;

    for (const pool of allPools) {
      const price = getApproxUsdPrice(pool.symbol);
      const suppliedUsd = bigintToNumber(pool.totalSupplied, pool.decimals) * price;
      const borrowedUsd = bigintToNumber(pool.totalBorrowed, pool.decimals) * price;

      totalSupplied += suppliedUsd;
      totalBorrowed += borrowedUsd;

      if (!perChain[pool.chainId]) {
        perChain[pool.chainId] = { tvl: 0, supplied: 0, borrowed: 0, utilization: 0 };
      }
      perChain[pool.chainId].supplied += suppliedUsd;
      perChain[pool.chainId].borrowed += borrowedUsd;
      perChain[pool.chainId].tvl += suppliedUsd;
    }

    // Calculate per-chain utilization
    for (const chainId of Object.keys(perChain)) {
      const c = perChain[Number(chainId)];
      c.utilization = c.supplied > 0 ? (c.borrowed / c.supplied) * 100 : 0;
    }

    setMetrics({
      totalTVL: totalSupplied,
      totalSupplied,
      totalBorrowed,
      utilization: totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0,
      activeMarkets: allPools.length,
      perChain,
      pools: allPools,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return { metrics, loading, error, chainErrors, refetch: fetchMetrics };
}
