// Hook to fetch protocol-level total deposits and APY across all vaults
import { useMemo } from "react";
import { useChainId } from "wagmi";
import { useAllVaults } from "./useVaultData";
import type { EarnAsset } from "@/lib/types";

export interface TotalPositionData {
  totalDepositsUsd: number;
  totalEarningsUsd: number;
  weightedAPY: number;
  positionsByAsset: Record<
    EarnAsset,
    {
      assetsValue: number;
      assetsValueUsd: number;
      supplyAPY: number;
    }
  >;
  loading: boolean;
}

/**
 * Hook to get protocol-level totals across all vaults
 * Overall Deposit = sum of totalSupplyUsd across all vaults
 * Net APY = weighted average supply APY across all vaults
 */
export const useUserTotalPositions = () => {
  const chainId = useChainId();
  const { vaults, loading } = useAllVaults(chainId);

  const totalPosition = useMemo<TotalPositionData>(() => {
    if (loading || vaults.length === 0) {
      return {
        totalDepositsUsd: 0,
        totalEarningsUsd: 0,
        weightedAPY: 0,
        positionsByAsset: {
          ETH: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
          USDC: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
          USDT: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
        },
        loading,
      };
    }

    let totalDepositsUsd = 0;
    let weightedAPYSum = 0;
    const positionsByAsset: TotalPositionData["positionsByAsset"] = {
      ETH: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
      USDC: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
      USDT: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
    };

    for (const vault of vaults) {
      const supplyUsd = vault.totalSupplyUsd || 0;
      const supplyAPY = vault.supplyAPY || 0;

      totalDepositsUsd += supplyUsd;
      weightedAPYSum += supplyUsd * supplyAPY;

      positionsByAsset[vault.asset] = {
        assetsValue: vault.totalAssetsFormatted || 0,
        assetsValueUsd: supplyUsd,
        supplyAPY,
      };
    }

    const weightedAPY =
      totalDepositsUsd > 0 ? weightedAPYSum / totalDepositsUsd : 0;

    return {
      totalDepositsUsd,
      totalEarningsUsd: 0,
      weightedAPY,
      positionsByAsset,
      loading: false,
    };
  }, [vaults, loading]);

  return {
    totalPosition,
    refetch: () => {},
  };
};

/**
 * Generate historical deposit data for Overall Deposit chart
 * Simulates growth based on current total protocol deposits
 */
export const useOverallDepositHistory = () => {
  const { totalPosition } = useUserTotalPositions();

  const depositHistory = useMemo(() => {
    if (totalPosition.totalDepositsUsd === 0) {
      return [];
    }

    const now = new Date();
    const data: Array<{ date: string; amount: number }> = [];

    // Generate 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Simulate gradual growth to current value
      const progress = (12 - i) / 12;
      const baseAmount = totalPosition.totalDepositsUsd * progress;

      // Add realistic variations
      const variation = Math.sin(i * 0.7) * (baseAmount * 0.03);
      const amount = Math.max(0, baseAmount + variation);

      data.push({
        date: date.toISOString().split("T")[0],
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    // Ensure last point matches current total exactly
    if (data.length > 0) {
      data[data.length - 1].amount = totalPosition.totalDepositsUsd;
    }

    return data;
  }, [totalPosition.totalDepositsUsd]);

  return {
    depositHistory,
    currentTotal: totalPosition.totalDepositsUsd,
    loading: totalPosition.loading,
  };
};

/**
 * Generate Net APY earnings history
 * Shows accumulated earnings based on weighted APY across all vaults
 */
export const useNetAPYHistory = () => {
  const { totalPosition } = useUserTotalPositions();

  const apyHistory = useMemo(() => {
    if (totalPosition.totalDepositsUsd === 0) {
      return [];
    }

    const now = new Date();
    const data: Array<{ date: string; amount: number }> = [];

    // Generate 12 months of APY earnings
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Calculate accumulated earnings over time
      const monthsPassed = 12 - i;
      const yearsPassed = monthsPassed / 12;

      // Simulate earnings: totalDeposits * weightedAPY * time
      const earnings =
        totalPosition.totalDepositsUsd *
        totalPosition.weightedAPY *
        yearsPassed;

      // Add some variation
      const variation = Math.sin(i * 0.9) * (earnings * 0.1);
      const amount = Math.max(0, earnings + variation);

      data.push({
        date: date.toISOString().split("T")[0],
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    return data;
  }, [totalPosition.totalDepositsUsd, totalPosition.weightedAPY]);

  return {
    apyHistory,
    currentAPY: totalPosition.weightedAPY,
    totalEarnings:
      apyHistory.length > 0 ? apyHistory[apyHistory.length - 1].amount : 0,
    loading: totalPosition.loading,
  };
};
