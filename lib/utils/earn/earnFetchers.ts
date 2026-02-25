// Advanced fetchers for real-time vault statistics and APY calculations
import { useCallback } from "react";
import { formatUnits } from "viem";
import { erc20Abi } from "viem";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import DefaultRateModel from "@/abi/vanna/out/out/DefaultRateModel.sol/DefaultRateModel.json";
import { TOKEN_DECIMALS, vTokenAddressByChain, tokenAddressByChain, rateModelAddressByChain } from "@/lib/utils/web3/token";
import { EarnAsset } from "@/lib/types";
import earnCalc from "./calculations";

// ============ TYPES ============

/**
 * Complete vault statistics including borrows and APY
 */
export type VaultStats = {
  totalAssets: bigint;
  totalAssetsFormatted: number;
  totalSupply: bigint;
  totalSupplyFormatted: number;
  totalBorrows: bigint;
  totalBorrowsFormatted: number;
  availableLiquidity: number;
  utilizationRate: number;
  exchangeRate: number;
  supplyAPY: number;
  borrowAPY: number;

};

/**
 * Basic vault data (pool statistics)
 */
type FetchVaultDataResult = {
  totalAssets: bigint;
  totalSupply: bigint;
  totalAssetsFormatted: number;
  totalSupplyFormatted: number;
  exchangeRate: number;
  
};

/**
 * User position in vault
 */
type FetchUserPositionResult = {
  shares: bigint;
  sharesFormatted: number;
  assetsValue: number;
  assetsValueUsd: number;
};

/**
 * User's complete position including earned interest
 */
export type UserCompletePosition = {
  shares: bigint;
  sharesFormatted: number;
  currentValue: bigint;
  currentValueFormatted: number;
  initialDeposit: number; // Would need to track this via events or state
  earnedInterest: number;
  earnedInterestUsd: number;
  currentAPY: number;
};

// ============ HELPERS ============

/**
 * Get ABI based on asset type
 */
const getVaultAbi = (asset: EarnAsset) => {
  return asset === "ETH" ? VEther.abi : VToken.abi;
};

/**
 * Get decimals for vToken (matches underlying for ERC4626)
 */
const getVTokenDecimals = (asset: EarnAsset): number => {
  return TOKEN_DECIMALS[asset] ?? 18;
};

// ============ BASIC FETCHERS ============

/**
 * @notice Fetch vault data (pool statistics)
 * @dev Calls totalAssets() and totalSupply() on the vToken contract
 */
export const useFetchVaultData = (
  chainId?: number,
  asset?: EarnAsset,
  publicClient?: any
) => {
  return useCallback(async (): Promise<FetchVaultDataResult | null> => {
    if (!publicClient || !chainId || !asset) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const [totalAssets, totalSupply] = await Promise.all([
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalAssets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalSupply",
        }) as Promise<bigint>,
      ]);

      const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
      const totalSupplyFormatted = Number(formatUnits(totalSupply, decimals));
      const exchangeRate = earnCalc.calcExchangeRate(totalAssetsFormatted, totalSupplyFormatted);

      return {
        totalAssets,
        totalSupply,
        totalAssetsFormatted,
        totalSupplyFormatted,
        exchangeRate,
      };
    } catch (error) {
      console.error(`Error fetching vault data for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, publicClient]);
};

/**
 * @notice Fetch user's position in a vault
 * @dev Calls balanceOf() and convertToAssets() on the vToken contract
 */
export const useFetchUserVaultPosition = (
  chainId?: number,
  asset?: EarnAsset,
  userAddress?: `0x${string}`,
  publicClient?: any,
  priceUsd?: number
) => {
  return useCallback(async (): Promise<FetchUserPositionResult | null> => {
    if (!publicClient || !chainId || !asset || !userAddress) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const shares = await publicClient.readContract({
        address: vTokenAddress,
        abi,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint;

      let assetsValue = 0;
      if (shares > BigInt(0)) {
        const assetsRaw = await publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "convertToAssets",
          args: [shares],
        }) as bigint;
        assetsValue = Number(formatUnits(assetsRaw, decimals));
      }

      const sharesFormatted = Number(formatUnits(shares, decimals));
      const assetsValueUsd = priceUsd ? assetsValue * priceUsd : 0;

      return {
        shares,
        sharesFormatted,
        assetsValue,
        assetsValueUsd,
      };
    } catch (error) {
      console.error(`Error fetching user position for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, userAddress, publicClient, priceUsd]);
};

/**
 * @notice Fetch user's wallet balance for underlying token
 * @dev For ETH: uses getBalance(), for ERC20: uses balanceOf()
 */
export const useFetchUserWalletBalance = (
  chainId?: number,
  asset?: EarnAsset,
  userAddress?: `0x${string}`,
  publicClient?: any
) => {
  return useCallback(async (): Promise<{ balance: bigint; balanceFormatted: number } | null> => {
    if (!publicClient || !chainId || !asset || !userAddress) return null;

    const decimals = getVTokenDecimals(asset);

    try {
      let balance: bigint;

      if (asset === "ETH") {
        balance = await publicClient.getBalance({ address: userAddress });
      } else {
        const tokenAddress = tokenAddressByChain[chainId]?.[asset];
        if (!tokenAddress) return null;

        balance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [userAddress],
        }) as bigint;
      }

      return {
        balance,
        balanceFormatted: Number(formatUnits(balance, decimals)),
      };
    } catch (error) {
      console.error(`Error fetching wallet balance for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, userAddress, publicClient]);
};

/**
 * @notice Calculate shares user will receive for a deposit amount
 * @dev Calls convertToShares() on the vToken contract
 */
export const useFetchConvertToShares = (
  chainId?: number,
  asset?: EarnAsset,
  publicClient?: any
) => {
  return useCallback(async (amount: string): Promise<{ shares: bigint; sharesFormatted: number } | null> => {
    if (!publicClient || !chainId || !asset || !amount) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const { parseUnits } = await import("viem");
      const parsedAmount = parseUnits(amount, decimals);

      const shares = await publicClient.readContract({
        address: vTokenAddress,
        abi,
        functionName: "convertToShares",
        args: [parsedAmount],
      }) as bigint;

      return {
        shares,
        sharesFormatted: Number(formatUnits(shares, decimals)),
      };
    } catch (error) {
      console.error(`Error converting to shares for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, publicClient]);
};

/**
 * @notice Calculate assets user will receive for redeeming shares
 * @dev Calls convertToAssets() on the vToken contract
 */
export const useFetchConvertToAssets = (
  chainId?: number,
  asset?: EarnAsset,
  publicClient?: any
) => {
  return useCallback(async (shares: string): Promise<{ assets: bigint; assetsFormatted: number } | null> => {
    if (!publicClient || !chainId || !asset || !shares) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const { parseUnits } = await import("viem");
      const parsedShares = parseUnits(shares, decimals);

      const assets = await publicClient.readContract({
        address: vTokenAddress,
        abi,
        functionName: "convertToAssets",
        args: [parsedShares],
      }) as bigint;

      return {
        assets,
        assetsFormatted: Number(formatUnits(assets, decimals)),
      };
    } catch (error) {
      console.error(`Error converting to assets for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, publicClient]);
};

// ============ ADVANCED FETCHERS ============

/**
 * @notice Fetch complete vault statistics including borrows and APY
 * @dev Fetches all data needed for vault dashboard
 */
export const useFetchCompleteVaultStats = (
  chainId?: number,
  asset?: EarnAsset,
  publicClient?: any
) => {
  return useCallback(async (): Promise<VaultStats | null> => {
    if (!publicClient || !chainId || !asset) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      // Fetch all data in parallel
      const [totalAssets, totalSupply, totalBorrows] = await Promise.all([
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalAssets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalSupply",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "getBorrows",
        }) as Promise<bigint>,
      ]);

      // Format values
      const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
      const totalSupplyFormatted = Number(formatUnits(totalSupply, decimals));
      const totalBorrowsFormatted = Number(formatUnits(totalBorrows, decimals));

      // Calculate metrics using calculation utilities
      const availableLiquidity = earnCalc.calcAvailableLiquidity(
        totalAssetsFormatted,
        totalBorrowsFormatted
      );

      const utilizationRate = earnCalc.calcUtilizationRate(
        totalBorrowsFormatted,
        totalAssetsFormatted
      );

      const exchangeRate = earnCalc.calcExchangeRate(
        totalAssetsFormatted,
        totalSupplyFormatted
      );

      // Fetch on-chain borrow rate from DefaultRateModel (preferred)
      let borrowAPY: number;
      let supplyAPY: number;

      const rateModelAddress = rateModelAddressByChain[chainId];
      if (rateModelAddress) {
        try {
          const availableLiquidityRaw = totalAssets > totalBorrows
            ? totalAssets - totalBorrows
            : BigInt(0);

          const ratePerSecond = await publicClient.readContract({
            address: rateModelAddress,
            abi: DefaultRateModel.abi,
            functionName: "getBorrowRatePerSecond",
            args: [availableLiquidityRaw, totalBorrows],
          }) as bigint;

          const rateFormatted = Number(formatUnits(ratePerSecond, 18));
          borrowAPY = earnCalc.calcBorrowAPYFromRate(rateFormatted);
          supplyAPY = earnCalc.calcSupplyAPYFromRate(borrowAPY);
        } catch {
          // Fallback to client-side calculation
          borrowAPY = earnCalc.calcBorrowAPY(utilizationRate);
          supplyAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
        }
      } else {
        // No rate model for this chain, use client-side
        borrowAPY = earnCalc.calcBorrowAPY(utilizationRate);
        supplyAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
      }

      return {
        totalAssets,
        totalAssetsFormatted,
        totalSupply,
        totalSupplyFormatted,
        totalBorrows,
        totalBorrowsFormatted,
        availableLiquidity,
        utilizationRate,
        exchangeRate,
        supplyAPY,
        borrowAPY,
      };
    } catch (error) {
      console.error(`Error fetching complete vault stats for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, publicClient]);
};

/**
 * @notice Fetch statistics for all vaults on current chain
 * @dev Returns map of asset to vault stats with APY calculations
 */
export const useFetchAllVaultsData = (
  chainId?: number,
  publicClient?: any,
  includeAdvancedStats: boolean = false
) => {
  return useCallback(async (): Promise<Record<EarnAsset, VaultStats | null>> => {
    const assets: EarnAsset[] = ["ETH", "USDC", "USDT"];
    const results: Record<EarnAsset, VaultStats | null> = {
      ETH: null,
      USDC: null,
      USDT: null,
    };

    if (!publicClient || !chainId) return results;

    // Fetch all vaults in parallel
    const fetchPromises = assets.map(async (asset) => {
      const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
      if (!vTokenAddress) return { asset, data: null };

      const abi = getVaultAbi(asset);
      const decimals = getVTokenDecimals(asset);

      try {
        // Base data fetch
        const baseData = [
          publicClient.readContract({
            address: vTokenAddress,
            abi,
            functionName: "totalAssets",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: vTokenAddress,
            abi,
            functionName: "totalSupply",
          }) as Promise<bigint>,
        ];

        // Add borrow data if advanced stats requested
        if (includeAdvancedStats) {
          baseData.push(
            publicClient.readContract({
              address: vTokenAddress,
              abi,
              functionName: "getBorrows",
            }) as Promise<bigint>
          );
        }

        const fetchResults = await Promise.all(baseData);
        const [totalAssets, totalSupply, totalBorrows] = fetchResults;

        const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
        const totalSupplyFormatted = Number(formatUnits(totalSupply, decimals));
        const totalBorrowsFormatted = totalBorrows
          ? Number(formatUnits(totalBorrows, decimals))
          : 0;

        // Calculate metrics
        const availableLiquidity = earnCalc.calcAvailableLiquidity(
          totalAssetsFormatted,
          totalBorrowsFormatted
        );

        const utilizationRate = earnCalc.calcUtilizationRate(
          totalBorrowsFormatted,
          totalAssetsFormatted
        );

        const exchangeRate = earnCalc.calcExchangeRate(
          totalAssetsFormatted,
          totalSupplyFormatted
        );

        // On-chain rate model APY (preferred), with client-side fallback
        let borrowAPY: number;
        let supplyAPY: number;

        const rateModelAddress = rateModelAddressByChain[chainId];
        if (rateModelAddress && includeAdvancedStats && totalBorrows != null) {
          try {
            const availableLiquidityRaw = totalAssets > totalBorrows
              ? totalAssets - totalBorrows
              : BigInt(0);

            const ratePerSecond = await publicClient.readContract({
              address: rateModelAddress,
              abi: DefaultRateModel.abi,
              functionName: "getBorrowRatePerSecond",
              args: [availableLiquidityRaw, totalBorrows],
            }) as bigint;

            const rateFormatted = Number(formatUnits(ratePerSecond, 18));
            borrowAPY = earnCalc.calcBorrowAPYFromRate(rateFormatted);
            supplyAPY = earnCalc.calcSupplyAPYFromRate(borrowAPY);
          } catch {
            // Fallback to client-side calculation
            borrowAPY = earnCalc.calcBorrowAPY(utilizationRate);
            supplyAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
          }
        } else {
          borrowAPY = earnCalc.calcBorrowAPY(utilizationRate);
          supplyAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
        }

        return {
          asset,
          data: {
            totalAssets,
            totalAssetsFormatted,
            totalSupply,
            totalSupplyFormatted,
            totalBorrows: totalBorrows || BigInt(0),
            totalBorrowsFormatted,
            availableLiquidity,
            utilizationRate,
            exchangeRate,
            supplyAPY,
            borrowAPY,
          },
        };
      } catch (error) {
        console.error(`Error fetching vault stats for ${asset}:`, error);
        return { asset, data: null };
      }
    });

    const fetchResults = await Promise.all(fetchPromises);

    // Map results
    fetchResults.forEach(({ asset, data }) => {
      results[asset] = data;
    });

    return results;
  }, [chainId, publicClient, includeAdvancedStats]);
};

/**
 * @notice Get user's complete position including earned interest
 * @dev Calculates actual earnings based on share price increase
 */
export const useFetchUserCompletePosition = (
  chainId?: number,
  asset?: EarnAsset,
  userAddress?: `0x${string}`,
  publicClient?: any,
  priceUsd?: number
) => {
  return useCallback(async (): Promise<UserCompletePosition | null> => {
    if (!publicClient || !chainId || !asset || !userAddress) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const [shares, totalAssets, totalSupply, totalBorrows] = await Promise.all([
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "balanceOf",
          args: [userAddress],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalAssets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalSupply",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "getBorrows",
        }) as Promise<bigint>,
      ]);

      const sharesFormatted = Number(formatUnits(shares, decimals));

      // Get current value
      let currentValue = BigInt(0);
      let currentValueFormatted = 0;
      if (shares > BigInt(0)) {
        currentValue = await publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "convertToAssets",
          args: [shares],
        }) as bigint;
        currentValueFormatted = Number(formatUnits(currentValue, decimals));
      }

      // Calculate current APY (on-chain preferred, client-side fallback)
      const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
      const totalBorrowsFormatted = Number(formatUnits(totalBorrows, decimals));
      const utilizationRate = earnCalc.calcUtilizationRate(
        totalBorrowsFormatted,
        totalAssetsFormatted
      );

      let currentAPY: number;
      const rateModelAddress = rateModelAddressByChain[chainId];
      if (rateModelAddress) {
        try {
          const availableLiquidityRaw = totalAssets > totalBorrows
            ? totalAssets - totalBorrows
            : BigInt(0);

          const ratePerSecond = await publicClient.readContract({
            address: rateModelAddress,
            abi: DefaultRateModel.abi,
            functionName: "getBorrowRatePerSecond",
            args: [availableLiquidityRaw, totalBorrows],
          }) as bigint;

          const rateFormatted = Number(formatUnits(ratePerSecond, 18));
          const borrowAPY = earnCalc.calcBorrowAPYFromRate(rateFormatted);
          currentAPY = earnCalc.calcSupplyAPYFromRate(borrowAPY);
        } catch {
          currentAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
        }
      } else {
        currentAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
      }

      // Note: To calculate true earned interest, we'd need to track initial deposit
      // This would require reading historical events or maintaining state
      const earnedInterest = 0; // Placeholder
      const earnedInterestUsd = priceUsd ? earnedInterest * priceUsd : 0;

      return {
        shares,
        sharesFormatted,
        currentValue,
        currentValueFormatted,
        initialDeposit: 0, // Would need event tracking
        earnedInterest,
        earnedInterestUsd,
        currentAPY,
      };
    } catch (error) {
      console.error(`Error fetching user complete position for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, userAddress, publicClient, priceUsd]);
};

/**
 * @notice Fetch vault health metrics
 * @dev Returns utilization, liquidity ratio, and risk indicators
 */
export const useFetchVaultHealthMetrics = (
  chainId?: number,
  asset?: EarnAsset,
  publicClient?: any
) => {
  return useCallback(async () => {
    if (!publicClient || !chainId || !asset) return null;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) return null;

    const abi = getVaultAbi(asset);
    const decimals = getVTokenDecimals(asset);

    try {
      const [totalAssets, totalBorrows] = await Promise.all([
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "totalAssets",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vTokenAddress,
          abi,
          functionName: "getBorrows",
        }) as Promise<bigint>,
      ]);

      const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
      const totalBorrowsFormatted = Number(formatUnits(totalBorrows, decimals));

      const utilizationRate = earnCalc.calcUtilizationRate(
        totalBorrowsFormatted,
        totalAssetsFormatted
      );

      const availableLiquidity = earnCalc.calcAvailableLiquidity(
        totalAssetsFormatted,
        totalBorrowsFormatted
      );

      const liquidityRatio = totalAssetsFormatted > 0
        ? availableLiquidity / totalAssetsFormatted
        : 1;

      // Risk indicator: high utilization = higher risk
      const riskLevel =
        utilizationRate > 0.9 ? "high" :
        utilizationRate > 0.7 ? "medium" :
        "low";

      return {
        utilizationRate,
        utilizationPercent: utilizationRate * 100,
        availableLiquidity,
        liquidityRatio,
        riskLevel,
        canWithdraw: (amount: number) => earnCalc.canWithdraw(
          amount,
          totalAssetsFormatted,
          totalBorrowsFormatted
        ),
      };
    } catch (error) {
      console.error(`Error fetching vault health metrics for ${asset}:`, error);
      return null;
    }
  }, [chainId, asset, publicClient]);
};



