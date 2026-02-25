// Hook to generate earn table data from Zustand store
import { useEffect, useMemo } from "react";
import { usePublicClient, useChainId } from "wagmi";
import { useVaultDataStore } from "@/store/vault-data-store";
import { formatUsdValue } from "@/lib/utils/prices/priceFeed";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";
import { EarnAsset } from "@/lib/types";

export type TableRow = {
  cell: Array<{
    chain?: string;
    title: string;
    tag?: string;
    onlyIcons?: string[];
    clickable?: string;
  }>;
};

// Helper to get chain display name (uppercase for iconPaths)
const getChainName = (chainId: number) => {
  switch (chainId) {
    case 42161:
      return "ARBITRUM";
    case 10:
      return "OPTIMISM";
    case 8453:
      return "BASE";
    default:
      return "BASE";
  }
};

export const useEarnTableData = () => {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Get store state and actions
  const {
    vaults,
    loading,
    error,
    fetchVaultData,
  } = useVaultDataStore();

  // Fetch data when component mounts or chain changes
  useEffect(() => {
    if (publicClient && chainId) {
      fetchVaultData({ chainId, publicClient });
    }
  }, [chainId, publicClient, fetchVaultData]);

  // Transform vault data into table rows
  const tableData = useMemo(() => {
    if (!chainId) {
      return { rows: [] };
    }

    // Get supported assets for current chain
    const supportedAssets = (
      SUPPORTED_TOKENS_BY_CHAIN[chainId] || ["ETH", "USDC", "USDT"]
    ).filter((t): t is EarnAsset => ["ETH", "USDC", "USDT"].includes(t));

    // Get vaults for current chain
    const chainVaults = vaults.filter((v) => v.chainId === chainId);

    // Generate table rows - ALWAYS show all pools even if no data yet
    const rows: TableRow[] = supportedAssets
      .map((asset) => {
        const vault = chainVaults.find((v) => v.asset === asset);

        // ✅ Show pool even if vault data is not loaded yet
        // This ensures all pools are visible, including those with 0 borrows
        const supplyApyFormatted = vault
          ? `${((vault.supplyAPY || 0) * 100).toFixed(2)}%`
          : "0.00%";
        const borrowApyFormatted = vault
          ? `${((vault.borrowAPY || 0) * 100).toFixed(2)}%`
          : "0.00%";
        const utilizationFormatted = vault
          ? `${((vault.utilizationRate || 0) * 100).toFixed(2)}%`
          : "0.00%";

        // Determine collateral assets
        const collateralAssets = supportedAssets.filter((a) => a !== asset);

        // Determine pool status
        const isActive = vault ? vault.totalAssetsFormatted > 0 : false;
        const hasData = vault !== undefined;

        return {
          cell: [
            {
              chain: getChainName(chainId),
              title: asset,
              tag: !hasData ? "Inactive" : isActive ? "Active" : "Inactive",
            },
            {
              title: vault ? formatUsdValue(vault.totalSupplyUsd) : "$0.00",
              tag: vault ? `${vault.totalAssetsFormatted.toFixed(2)} ${asset}` : `0.00 ${asset}`,
            },
            {
              title: supplyApyFormatted,
              tag: supplyApyFormatted,
            },
            {
              title: vault ? formatUsdValue(vault.totalBorrowsUsd) : "$0.00",
              tag: vault ? `${(vault.totalBorrowsFormatted || 0).toFixed(2)} ${asset}` : `0.00 ${asset}`,
            },
            {
              title: borrowApyFormatted,
              tag: borrowApyFormatted,
            },
            {
              title: utilizationFormatted,
              tag: utilizationFormatted,
            },
            {
              onlyIcons: [asset, ...collateralAssets],
              tag: "Collateral",
              clickable: "toggle",
            },
          ],
        };
      });

    return { rows };
  }, [vaults, chainId]);

  return {
    tableData,
    loading,
    error,
    refetch: () => {
      if (publicClient && chainId) {
        fetchVaultData({ chainId, publicClient });
      }
    },
  };
};
