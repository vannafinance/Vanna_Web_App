// Hook to access vault data from store
import { useMemo } from "react";
import { useVaultDataStore } from "@/store/vault-data-store";
import { EarnAsset } from "@/lib/types";

/**
 * Hook to get specific vault data by asset
 */
export const useVaultData = (asset: EarnAsset) => {
  const vault = useVaultDataStore((state) => state.getVault(asset));
  const loading = useVaultDataStore((state) => state.loading);
  const error = useVaultDataStore((state) => state.error);

  return {
    vault,
    loading,
    error,
  };
};

/**
 * Hook to get all vaults for current chain
 */
export const useAllVaults = (chainId?: number) => {
  // Get all vaults from store (stable reference)
  const allVaults = useVaultDataStore((state) => state.vaults);
  const loading = useVaultDataStore((state) => state.loading);
  const error = useVaultDataStore((state) => state.error);

  // Filter vaults in useMemo to maintain stable reference
  const vaults = useMemo(() => {
    if (!chainId) return allVaults;
    return allVaults.filter((v) => v.chainId === chainId);
  }, [allVaults, chainId]);

  return {
    vaults,
    loading,
    error,
  };
};

/**
 * Hook to get vault prices
 */
export const useVaultPrices = () => {
  const prices = useVaultDataStore((state) => state.prices);
  return prices;
};
