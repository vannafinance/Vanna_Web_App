'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, type Address } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';
import { CHAIN_CONTRACTS, SUPPORTED_CHAINS, registryAbi, riskEngineAbi, accountAbi, vTokenAbi, TOKEN_LIST } from '../contracts';
import { bigintToNumber } from '../formatting';
import marginCalc from '@/lib/utils/margin/calculations';
import type { UserPosition } from '../types';

const chainConfigs = { 8453: base, 42161: arbitrum, 10: optimism } as const;

function getClient(chainId: number) {
  return createPublicClient({ chain: chainConfigs[chainId as keyof typeof chainConfigs], transport: http() });
}

function getApproxUsdPrice(symbol: string): number {
  if (symbol === 'ETH') return 3500;
  return 1;
}

async function fetchUserPositionOnChain(chainId: number, userAddress: Address): Promise<UserPosition | null> {
  const client = getClient(chainId);
  const contracts = CHAIN_CONTRACTS[chainId];
  if (!contracts) return null;

  try {
    const accounts = await client.readContract({
      address: contracts.registry,
      abi: registryAbi,
      functionName: 'accountsOwnedBy',
      args: [userAddress],
    }) as Address[];

    if (!accounts || accounts.length === 0) return null;

    const accountAddr = accounts[0];

    // Fetch balance and borrows from RiskEngine
    const [balanceRaw, borrowsRaw] = await Promise.all([
      client.readContract({ address: contracts.riskEngine, abi: riskEngineAbi, functionName: 'getBalance', args: [accountAddr] }),
      client.readContract({ address: contracts.riskEngine, abi: riskEngineAbi, functionName: 'getBorrows', args: [accountAddr] }),
    ]);

    // RiskEngine returns values in ETH-denominated terms (18 decimals)
    const collateralEth = bigintToNumber(balanceRaw as bigint, 18);
    const debtEth = bigintToNumber(borrowsRaw as bigint, 18);
    const ethPrice = getApproxUsdPrice('ETH');
    const collateralUsd = collateralEth * ethPrice;
    const debtUsd = debtEth * ethPrice;

    // Fetch per-token breakdowns
    const assets: UserPosition['assets'] = [];
    const borrows: UserPosition['borrows'] = [];

    for (const token of TOKEN_LIST) {
      const vAddr = contracts.vTokens[token.vTokenKey];
      try {
        const borrowBal = await client.readContract({
          address: vAddr, abi: vTokenAbi, functionName: 'getBorrowBalance', args: [accountAddr],
        }) as bigint;
        if (borrowBal > BigInt(0)) {
          const amount = bigintToNumber(borrowBal, token.decimals);
          borrows.push({ symbol: token.symbol, amount, usd: amount * getApproxUsdPrice(token.symbol) });
        }
      } catch { /* no borrow in this pool */ }
    }

    const hf = marginCalc.calcHF(collateralUsd, debtUsd);

    return {
      chainId,
      accountAddress: accountAddr,
      collateralUsd,
      debtUsd,
      healthFactor: hf,
      ltv: marginCalc.calcLTV(collateralUsd, debtUsd),
      leverage: marginCalc.calcLeverage(collateralUsd, debtUsd),
      hfStatus: marginCalc.getHFStatus(hf),
      assets,
      borrows,
    };
  } catch (err) {
    console.error(`[Risk] Failed to fetch user position on chain ${chainId}:`, err);
    return null;
  }
}

export function useUserRiskPosition(userAddress: Address | undefined) {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!userAddress) {
      setPositions([]);
      return;
    }
    setLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      SUPPORTED_CHAINS.map((chainId) => fetchUserPositionOnChain(chainId, userAddress))
    );

    const pos: UserPosition[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) pos.push(r.value);
    }

    setPositions(pos);
    setLoading(false);
  }, [userAddress]);

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 15000);
    return () => clearInterval(interval);
  }, [fetchPositions]);

  // Aggregated across chains
  const aggregate = positions.length > 0 ? {
    totalCollateralUsd: positions.reduce((s, p) => s + p.collateralUsd, 0),
    totalDebtUsd: positions.reduce((s, p) => s + p.debtUsd, 0),
    get healthFactor() { return marginCalc.calcHF(this.totalCollateralUsd, this.totalDebtUsd); },
    get hfStatus() { return marginCalc.getHFStatus(this.healthFactor); },
    get ltv() { return marginCalc.calcLTV(this.totalCollateralUsd, this.totalDebtUsd); },
    get leverage() { return marginCalc.calcLeverage(this.totalCollateralUsd, this.totalDebtUsd); },
    get netWorth() { return this.totalCollateralUsd - this.totalDebtUsd; },
    get maxBorrow() { return marginCalc.calcMaxBorrow(this.totalCollateralUsd, this.totalDebtUsd); },
    get maxWithdraw() { return marginCalc.calcMaxWithdraw(this.totalCollateralUsd, this.totalDebtUsd); },
  } : null;

  return { positions, aggregate, loading, error, refetch: fetchPositions };
}
