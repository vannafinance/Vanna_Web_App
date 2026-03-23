// Optimized multicall implementation for earn page
import { PublicClient, formatUnits } from "viem";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import DefaultRateModel from "@/abi/vanna/out/out/DefaultRateModel.sol/DefaultRateModel.json";
import { EarnAsset } from "@/lib/types";
import { vTokenAddressByChain, TOKEN_DECIMALS, rateModelAddressByChain } from "@/lib/utils/web3/token";
import earnCalc from "./calculations";
import { VaultStats } from "./earnFetchers";

// ============ CONFIGURATION ============

/**
 * Token configuration for data-driven approach
 * Avoids code duplication across different tokens
 */
export const EARN_TOKEN_CONFIG = [
  {
    asset: "ETH" as EarnAsset,
    abi: VEther.abi,
    decimals: 18,
  },
  {
    asset: "USDC" as EarnAsset,
    abi: VToken.abi,
    decimals: 6,
  },
  {
    asset: "USDT" as EarnAsset,
    abi: VToken.abi,
    decimals: 6,
  },
] as const;

// ============ MULTICALL INDICES ============

/**
 * Named constants for multicall result indices
 * Avoids magic numbers and makes code more maintainable
 */
export const MULTICALL_INDICES = {
  // ETH indices (0-2)
  ETH_TOTAL_ASSETS: 0,
  ETH_TOTAL_SUPPLY: 1,
  ETH_TOTAL_BORROWS: 2,

  // USDC indices (3-5)
  USDC_TOTAL_ASSETS: 3,
  USDC_TOTAL_SUPPLY: 4,
  USDC_TOTAL_BORROWS: 5,

  // USDT indices (6-8)
  USDT_TOTAL_ASSETS: 6,
  USDT_TOTAL_SUPPLY: 7,
  USDT_TOTAL_BORROWS: 8,
} as const;

/**
 * Map asset to its multicall indices
 */
const getAssetIndices = (asset: EarnAsset) => {
  const baseIndex = EARN_TOKEN_CONFIG.findIndex((c) => c.asset === asset) * 3;
  return {
    totalAssets: baseIndex,
    totalSupply: baseIndex + 1,
    totalBorrows: baseIndex + 2,
  };
};

/**
 * Build multicall contracts array for all vaults
 * Single source of truth - avoids duplication across networks
 */



export function buildVaultMulticallContracts(
  chainId: number,
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"]
) {
  const contracts: any[] = [];

  for (const { asset, abi } of EARN_TOKEN_CONFIG) {
    // Skip if asset not in requested list
    if (!assets.includes(asset)) continue;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) {
      console.warn(`No vToken address for ${asset} on chain ${chainId}`);
      continue;
    }

    // Add 3 calls per vault: totalAssets, totalSupply, getBorrows
    contracts.push(
      {
        address: vTokenAddress,
        abi,
        functionName: "totalAssets",
      },
      {
        address: vTokenAddress,
        abi,
        functionName: "totalSupply",
      },
      {
        address: vTokenAddress,
        abi,
        functionName: "getBorrows",
      }
    );
  }

  return contracts;
}

// ============ MULTICALL PARSER ============

/**
 * Parse multicall results into vault stats
 * Handles errors gracefully with allowFailure support
 */
export function parseVaultMulticallResults(
  results: any[],
  chainId: number,
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"],
  onChainRates?: Record<EarnAsset, number | null>
): Record<EarnAsset, VaultStats | null> {
  const vaultStats: Record<EarnAsset, VaultStats | null> = {
    ETH: null,
    USDC: null,
    USDT: null,
  };

  for (const { asset, decimals } of EARN_TOKEN_CONFIG) {
    // Skip if asset not in requested list
    if (!assets.includes(asset)) continue;

    const indices = getAssetIndices(asset);

    // Check if all calls succeeded
    const totalAssetsResult = results[indices.totalAssets];
    const totalSupplyResult = results[indices.totalSupply];
    const totalBorrowsResult = results[indices.totalBorrows];

    if (
      totalAssetsResult?.status === "failure" ||
      totalSupplyResult?.status === "failure" ||
      totalBorrowsResult?.status === "failure"
    ) {
      console.error(`Failed to fetch data for ${asset}:`, {
        totalAssets: totalAssetsResult?.error,
        totalSupply: totalSupplyResult?.error,
        totalBorrows: totalBorrowsResult?.error,
      });
      continue;
    }

    // Extract raw values
    const totalAssets = totalAssetsResult?.result as bigint;
    const totalSupply = totalSupplyResult?.result as bigint;
    const totalBorrows = totalBorrowsResult?.result as bigint;

    if (!totalAssets || !totalSupply || !totalBorrows) {
      console.warn(`Missing data for ${asset}`);
      continue;
    }

    // Format values
    const totalAssetsFormatted = Number(formatUnits(totalAssets, decimals));
    const totalSupplyFormatted = Number(formatUnits(totalSupply, decimals));
    const totalBorrowsFormatted = Number(formatUnits(totalBorrows, decimals));

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

    // Use on-chain rate if available, otherwise fall back to client-side calculation
    const onChainRate = onChainRates?.[asset];
    let borrowAPY: number;
    let supplyAPY: number;

    if (onChainRate != null && onChainRate > 0) {
      // On-chain DefaultRateModel rate (preferred — matches actual contract)
      borrowAPY = earnCalc.calcBorrowAPYFromRate(onChainRate);
      supplyAPY = earnCalc.calcSupplyAPYFromRate(borrowAPY);
    } else {
      // Client-side fallback
      borrowAPY = earnCalc.calcBorrowAPY(utilizationRate);
      supplyAPY = earnCalc.calcSupplyAPY(utilizationRate, 0.1);
    }

    vaultStats[asset] = {
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
  }

  return vaultStats;
}


/**
 * Fetch all vault data using a single multicall
 */


/**
 * Build 2nd multicall for on-chain borrow rates from DefaultRateModel
 * Needs raw bigint results (available liquidity, total borrows) from 1st multicall
 */
export function buildRateModelMulticallContracts(
  chainId: number,
  vaultResults: any[],
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"]
) {
  const rateModelAddress = rateModelAddressByChain[chainId];
  if (!rateModelAddress) return { contracts: [], orderedAssets: [] as EarnAsset[] };

  const contracts: any[] = [];
  const orderedAssets: EarnAsset[] = [];

  for (const { asset } of EARN_TOKEN_CONFIG) {
    if (!assets.includes(asset)) continue;

    const indices = getAssetIndices(asset);
    const totalAssetsResult = vaultResults[indices.totalAssets];
    const totalBorrowsResult = vaultResults[indices.totalBorrows];

    // Skip if vault data fetch failed
    if (
      totalAssetsResult?.status === "failure" ||
      totalBorrowsResult?.status === "failure"
    ) continue;

    const totalAssets = totalAssetsResult?.result as bigint;
    const totalBorrows = totalBorrowsResult?.result as bigint;
    if (!totalAssets || !totalBorrows) continue;

    // Available liquidity = totalAssets - totalBorrows (raw bigint for contract call)
    const availableLiquidity = totalAssets > totalBorrows
      ? totalAssets - totalBorrows
      : BigInt(0);

    contracts.push({
      address: rateModelAddress,
      abi: DefaultRateModel.abi,
      functionName: "getBorrowRatePerSecond",
      args: [availableLiquidity, totalBorrows],
    });
    orderedAssets.push(asset);
  }

  return { contracts, orderedAssets };
}

export async function fetchAllVaultsMulticall(
  chainId: number,
  publicClient: PublicClient,
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"]
): Promise<Record<EarnAsset, VaultStats | null>> {
  try {
    // Phase 1: Fetch vault data (totalAssets, totalSupply, getBorrows)
    const contracts = buildVaultMulticallContracts(chainId, assets);

    if (contracts.length === 0) {
      console.warn(`No valid vault contracts for chain ${chainId}`);
      return { ETH: null, USDC: null, USDT: null };
    }

    console.log(
      `Fetching ${assets.length} vaults with ${contracts.length} calls in 1 RPC request`
    );

    const vaultResults = await publicClient.multicall({
      contracts,
      allowFailure: true,
    });

    // Phase 2: Fetch on-chain borrow rates from DefaultRateModel
    let onChainRates: Record<EarnAsset, number | null> = {
      ETH: null,
      USDC: null,
      USDT: null,
    };

    try {
      const { contracts: rateContracts, orderedAssets } =
        buildRateModelMulticallContracts(chainId, vaultResults, assets);

      if (rateContracts.length > 0) {
        const rateResults = await publicClient.multicall({
          contracts: rateContracts,
          allowFailure: true,
        });

        for (let i = 0; i < orderedAssets.length; i++) {
          const result = rateResults[i];
          if (result?.status !== "failure" && result?.result != null) {
            // formatUnits converts the raw rate to a decimal number
            onChainRates[orderedAssets[i]] = Number(
              formatUnits(result.result as bigint, 18)
            );
          }
        }
      }
    } catch (rateError) {
      console.warn("Rate model multicall failed, using client-side APY fallback:", rateError);
    }

    // Parse results with on-chain rates
    const vaultStats = parseVaultMulticallResults(vaultResults, chainId, assets, onChainRates);

    const successCount = Object.values(vaultStats).filter((v) => v !== null).length;
    console.log(`Successfully fetched ${successCount}/${assets.length} vaults with on-chain APY`);

    return vaultStats;
  } catch (error) {
    console.error("Multicall failed:", error);
    return { ETH: null, USDC: null, USDT: null };
  }
}

// ============ USER POSITION MULTICALL ============

/**
 * Build multicall for user positions across all vaults
 */
export function buildUserPositionMulticallContracts(
  chainId: number,
  userAddress: `0x${string}`,
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"]
) {
  const contracts: any[] = [];

  for (const { asset, abi } of EARN_TOKEN_CONFIG) {
    if (!assets.includes(asset)) continue;

    const vTokenAddress = vTokenAddressByChain[chainId]?.[asset];
    if (!vTokenAddress) continue;

    // Add 2 calls per vault: balanceOf (shares), convertToAssets
    contracts.push({
      address: vTokenAddress,
      abi,
      functionName: "balanceOf",
      args: [userAddress],
    });
  }

  return contracts;
}

/**
 * Fetch user positions for all vaults using multicall
 */
export async function fetchUserPositionsMulticall(
  chainId: number,
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  assets: EarnAsset[] = ["ETH", "USDC", "USDT"]
): Promise<
  Record<
    EarnAsset,
    {
      shares: bigint;
      sharesFormatted: number;
    } | null
  >
> {
  try {
    const contracts = buildUserPositionMulticallContracts(chainId, userAddress, assets);

    if (contracts.length === 0) {
      return { ETH: null, USDC: null, USDT: null };
    }

    const results = await publicClient.multicall({
      contracts,
      allowFailure: true,
    });

    const positions: Record<EarnAsset, any> = {
      ETH: null,
      USDC: null,
      USDT: null,
    };

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const result = results[i];

      if (result?.status === "failure") {
        console.error(`Failed to fetch position for ${asset}:`, result.error);
        continue;
      }

      const shares = result?.result as bigint;
      const decimals = TOKEN_DECIMALS[asset] ?? 18;
      const sharesFormatted = Number(formatUnits(shares, decimals));

      positions[asset] = {
        shares,
        sharesFormatted,
      };
    }

    return positions;
  } catch (error) {
    console.error("❌ User positions multicall failed:", error);
    return { ETH: null, USDC: null, USDT: null };
  }
}
