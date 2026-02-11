// Hook to fetch user's total positions across all vaults
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePublicClient, useChainId, useAccount } from "wagmi";
import { useFetchUserVaultPosition } from "@/lib/utils/earn/earnFetchers";
import { useAllVaults } from "./useVaultData";
import { EarnAsset } from "@/lib/types";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";

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
 * Hook to get user's total positions across all vaults
 */
export const useUserTotalPositions = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Get all vaults data for prices and APY
  const { vaults } = useAllVaults(chainId);

  const [totalPosition, setTotalPosition] = useState<TotalPositionData>({
    totalDepositsUsd: 0,
    totalEarningsUsd: 0,
    weightedAPY: 0,
    positionsByAsset: {} as any,
    loading: true,
  });

  const loadTotalPositions = useCallback(async () => {
    if (!address || !publicClient || !chainId || vaults.length === 0) {
      setTotalPosition((prev) => ({ ...prev, loading: false }));
      return;
    }

    setTotalPosition((prev) => ({ ...prev, loading: true }));

    try {
      // Get supported assets for current chain
      const supportedAssets = (
        SUPPORTED_TOKENS_BY_CHAIN[chainId] || ["ETH", "USDC", "USDT"]
      ).filter((t): t is EarnAsset => ["ETH", "USDC", "USDT"].includes(t));

      // Fetch positions for all assets in parallel
      const positionPromises = supportedAssets.map(async (asset) => {
        const vault = vaults.find((v) => v.asset === asset);
        if (!vault) return null;

        // Dynamically import the hook function
        const { useFetchUserVaultPosition } = await import(
          "@/lib/utils/earn/earnFetchers"
        );

        try {
          const positionFetcher = useFetchUserVaultPosition(
            chainId,
            asset,
            address,
            publicClient,
            vault.priceUsd
          );

          const position = await positionFetcher();

          if (!position || position.assetsValue === 0) {
            return null;
          }

          return {
            asset,
            assetsValue: position.assetsValue,
            assetsValueUsd: position.assetsValueUsd,
            supplyAPY: vault.supplyAPY || 0,
          };
        } catch (error) {
          console.error(`Error fetching position for ${asset}:`, error);
          return null;
        }
      });

      const positions = (await Promise.all(positionPromises)).filter(
        (p): p is NonNullable<typeof p> => p !== null
      );

      // Calculate totals
      let totalDepositsUsd = 0;
      let weightedAPYSum = 0;
      const positionsByAsset: TotalPositionData["positionsByAsset"] = {
        ETH: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
        USDC: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
        USDT: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
      };

      positions.forEach((pos) => {
        totalDepositsUsd += pos.assetsValueUsd;
        weightedAPYSum += pos.assetsValueUsd * pos.supplyAPY;
        positionsByAsset[pos.asset] = {
          assetsValue: pos.assetsValue,
          assetsValueUsd: pos.assetsValueUsd,
          supplyAPY: pos.supplyAPY,
        };
      });

      // Calculate weighted average APY
      const weightedAPY =
        totalDepositsUsd > 0 ? weightedAPYSum / totalDepositsUsd : 0;

      setTotalPosition({
        totalDepositsUsd,
        totalEarningsUsd: 0, // Would need historical data to calculate actual earnings
        weightedAPY,
        positionsByAsset,
        loading: false,
      });
    } catch (error) {
      console.error("Error loading total positions:", error);
      setTotalPosition({
        totalDepositsUsd: 0,
        totalEarningsUsd: 0,
        weightedAPY: 0,
        positionsByAsset: {
          ETH: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
          USDC: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
          USDT: { assetsValue: 0, assetsValueUsd: 0, supplyAPY: 0 },
        },
        loading: false,
      });
    }
  }, [address, chainId, publicClient, vaults]);

  // Load positions when dependencies change
  useEffect(() => {
    loadTotalPositions();
  }, [loadTotalPositions]);

  return {
    totalPosition,
    refetch: loadTotalPositions,
  };
};

/**
 * Generate historical deposit data for Overall Deposit chart
 * Simulates growth based on current total position
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
 * Shows accumulated earnings based on weighted APY
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

      // Simulate earnings: principal * APY * time
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
