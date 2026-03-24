// Hook to fetch user's position data for earn vaults
import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useChainId, useAccount } from "wagmi";
import { useFetchUserVaultPosition } from "@/lib/utils/earn/earnFetchers";
import { useVaultData } from "./useVaultData";
import { EarnAsset } from "@/lib/types";

export interface UserPositionData {
  shares: bigint;
  sharesFormatted: number;
  assetsValue: number;
  assetsValueUsd: number;
  currentAPY: number;
  loading: boolean;
}

/**
 * Hook to get user's current position in a specific vault
 * ✅ OPTIMIZED: Faster loading with parallel data fetching
 */
export const useUserPosition = (asset: EarnAsset) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Get vault data for APY and price
  const { vault, loading: vaultLoading } = useVaultData(asset);

  // Get price from vault data (with fallback to avoid waiting)
  const priceUsd = vault?.priceUsd || 0;

  // Fetch user position
  const fetchUserPosition = useFetchUserVaultPosition(
    chainId,
    asset,
    address,
    publicClient,
    priceUsd
  );

  const [position, setPosition] = useState<UserPositionData>({
    shares: BigInt(0),
    sharesFormatted: 0,
    assetsValue: 0,
    assetsValueUsd: 0,
    currentAPY: vault?.supplyAPY || 0,
    loading: true,
  });

  const loadPosition = useCallback(async () => {
    // ✅ Early return if user not connected - show $0 immediately
    if (!address || !publicClient || !chainId) {
      setPosition({
        shares: BigInt(0),
        sharesFormatted: 0,
        assetsValue: 0,
        assetsValueUsd: 0,
        currentAPY: 0,
        loading: false,
      });
      return;
    }

    setPosition((prev) => ({ ...prev, loading: true }));

    try {
      // ✅ OPTIMIZATION: Don't wait for vault data, fetch position immediately
      const positionData = await fetchUserPosition();

      if (positionData && positionData.shares > BigInt(0)) {
        setPosition({
          shares: positionData.shares,
          sharesFormatted: positionData.sharesFormatted,
          assetsValue: positionData.assetsValue,
          assetsValueUsd: positionData.assetsValueUsd,
          currentAPY: vault?.supplyAPY || 0,
          loading: false,
        });
      } else {
        // ✅ User has no position - show $0 immediately
        setPosition({
          shares: BigInt(0),
          sharesFormatted: 0,
          assetsValue: 0,
          assetsValueUsd: 0,
          currentAPY: vault?.supplyAPY || 0,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error loading user position:", error);
      // ✅ On error, show $0 instead of hanging
      setPosition({
        shares: BigInt(0),
        sharesFormatted: 0,
        assetsValue: 0,
        assetsValueUsd: 0,
        currentAPY: vault?.supplyAPY || 0,
        loading: false,
      });
    }
  }, [address, chainId, publicClient, fetchUserPosition, vault?.supplyAPY]);

  // Load position when dependencies change
  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  // Auto-refresh when deposit/withdraw completes
  useEffect(() => {
    const handler = () => loadPosition();
    window.addEventListener("vanna:position-update", handler);
    return () => window.removeEventListener("vanna:position-update", handler);
  }, [loadPosition]);

  return {
    position,
    refetch: loadPosition,
  };
};

/**
 * Generate historical deposit data for chart
 * This simulates historical data based on current position
 * In production, you'd fetch actual deposit/withdraw events from blockchain
 */
export const useUserDepositHistory = (asset: EarnAsset) => {
  const { position } = useUserPosition(asset);

  // Generate mock historical data based on current position
  const generateHistoricalData = useCallback(() => {
    if (position.assetsValueUsd === 0) {
      return [];
    }

    const now = new Date();
    const data: Array<{ date: string; amount: number }> = [];

    // Generate 12 months of data (mock - in production fetch from events)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Simulate growth from 0 to current value
      const progress = (12 - i) / 12;
      const baseAmount = position.assetsValueUsd * progress;

      // Add some variation to make it look realistic
      const variation = Math.sin(i * 0.5) * (baseAmount * 0.05);
      const amount = Math.max(0, baseAmount + variation);

      data.push({
        date: date.toISOString().split('T')[0],
        amount: parseFloat(amount.toFixed(2)),
      });
    }

    // Ensure last data point matches current position exactly
    if (data.length > 0) {
      data[data.length - 1].amount = position.assetsValueUsd;
    }

    return data;
  }, [position.assetsValueUsd]);

  return {
    depositHistory: generateHistoricalData(),
    currentValue: position.assetsValueUsd,
    loading: position.loading,
  };
};
