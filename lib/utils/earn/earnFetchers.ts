// Hooks for fetching on-chain data for Earn vaults (ETH, USDC, USDT)

import { useCallback } from "react";
import { formatUnits } from "viem";
import { erc20Abi } from "viem";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { TOKEN_DECIMALS, vTokenAddressByChain, tokenAddressByChain } from "@/lib/utils/web3/token";
import { EarnAsset, ValutInfo, UserValutPosition } from "@/lib/types";


type FetchVaultDataResult = {
  totalAssets: bigint;
  totalSupply: bigint;
  totalAssetsFormatted: number;
  totalSupplyFormatted: number;
  exchangeRate: number;
};

type FetchUserPositionResult = {
  shares: bigint;
  sharesFormatted: number;
  assetsValue: number;
  assetsValueUsd: number;
};


/**
 * Get the correct ABI based on asset type
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

// ============ FETCHER HOOKS ============

/**
 * @notice Fetch vault data (pool statistics)
 * @dev Calls totalAssets() and totalSupply() on the vToken contract
 * @param chainId Chain ID
 * @returns Callback function that fetches vault data
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
      // Fetch totalAssets and totalSupply in parallel
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

      // Format values
      const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
      const totalSupplyFormatted = Number(formatUnits(totalSupply, decimals));

      // Calculate exchange rate (assets per share)
      // If no shares exist, rate is 1:1
      const exchangeRate = totalSupplyFormatted > 0
        ? totalAssetsFormatted / totalSupplyFormatted
        : 1;

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
 * @param chainId Chain ID
 * @param asset Asset type (ETH, USDC, USDT)
 * @param priceUsd Optional USD price for the asset
 * @returns Callback function that fetches user position
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
      // Get user's vToken balance
      const shares = await publicClient.readContract({
        address: vTokenAddress,
        abi,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint;

      // Convert shares to underlying assets value
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
 * @param chainId Chain ID
 * @param asset Asset type (ETH, USDC, USDT)
 * @param userAddress User's wallet address
 * @param publicClient Viem public client
 * @returns Callback function that fetches wallet balance
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
        // Native ETH balance
        balance = await publicClient.getBalance({ address: userAddress });
      } else {
        // ERC20 token balance
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
 * @notice Fetch all vault data for multiple assets at once
 * @dev Useful for displaying all pools on earn page
 * @param chainId Chain ID
 * @param publicClient Viem public client
 * @returns Callback function that fetches data for all supported assets
 */
export const useFetchAllVaultsData = (
  chainId?: number,
  publicClient?: any
) => {
  return useCallback(async (): Promise<Record<EarnAsset, FetchVaultDataResult | null>> => {
    const assets: EarnAsset[] = ["ETH", "USDC", "USDT"];
    const results: Record<EarnAsset, FetchVaultDataResult | null> = {
      ETH: null,
      USDC: null,
      USDT: null,
    };

    if (!publicClient || !chainId) return results;

    // Fetch all vault data in parallel
    const fetchPromises = assets.map(async (asset) => {
      const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
      if (!vTokenAddress) return { asset, data: null };

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
        const exchangeRate = totalSupplyFormatted > 0
          ? totalAssetsFormatted / totalSupplyFormatted
          : 1;

        return {
          asset,
          data: {
            totalAssets,
            totalSupply,
            totalAssetsFormatted,
            totalSupplyFormatted,
            exchangeRate,
          },
        };
      } catch (error) {
        console.error(`Error fetching vault data for ${asset}:`, error);
        return { asset, data: null };
      }
    });

    const fetchResults = await Promise.all(fetchPromises);

    // Map results to record
    fetchResults.forEach(({ asset, data }) => {
      results[asset] = data;
    });

    return results;
  }, [chainId, publicClient]);
};

/**
 * @notice Calculate shares user will receive for a deposit amount
 * @dev Calls convertToShares() on the vToken contract
 * @param chainId Chain ID
 * @param asset Asset type
 * @param publicClient Viem public client
 * @returns Callback that takes amount and returns shares
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
 * @param chainId Chain ID
 * @param asset Asset type
 * @param publicClient Viem public client
 * @returns Callback that takes shares and returns assets
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
