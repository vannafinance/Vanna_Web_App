'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';
import { CHAIN_CONTRACTS, SUPPORTED_CHAINS, linearRateModelAbi } from '../contracts';
import type { RateModelParams } from '../types';

const chainConfigs = { 8453: base, 42161: arbitrum, 10: optimism } as const;

function getClient(chainId: number) {
  return createPublicClient({ chain: chainConfigs[chainId as keyof typeof chainConfigs], transport: http() });
}

export function useRateModelData() {
  const [params, setParams] = useState<RateModelParams[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const results: RateModelParams[] = [];

    await Promise.allSettled(
      SUPPORTED_CHAINS.map(async (chainId) => {
        const client = getClient(chainId);
        const addr = CHAIN_CONTRACTS[chainId].rateModel;
        const [baseRate, slope1, slope2, optimalUsageRatio, maxExcessUsageRatio] = await Promise.all([
          client.readContract({ address: addr, abi: linearRateModelAbi, functionName: 'baseRate' }),
          client.readContract({ address: addr, abi: linearRateModelAbi, functionName: 'slope1' }),
          client.readContract({ address: addr, abi: linearRateModelAbi, functionName: 'slope2' }),
          client.readContract({ address: addr, abi: linearRateModelAbi, functionName: 'OPTIMAL_USAGE_RATIO' }),
          client.readContract({ address: addr, abi: linearRateModelAbi, functionName: 'MAX_EXCESS_USAGE_RATIO' }),
        ]);
        results.push({
          chainId,
          baseRate: Number(baseRate as bigint) / 1e18,
          slope1: Number(slope1 as bigint) / 1e18,
          slope2: Number(slope2 as bigint) / 1e18,
          optimalUsageRatio: Number(optimalUsageRatio as bigint) / 1e18,
          maxExcessUsageRatio: Number(maxExcessUsageRatio as bigint) / 1e18,
        });
      })
    );

    setParams(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 300000); // 5 min
    return () => clearInterval(interval);
  }, [fetch_]);

  return { params, loading };
}
