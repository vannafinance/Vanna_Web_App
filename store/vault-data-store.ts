import { create } from "zustand";
import { PublicClient } from "viem";
import { VaultStats, useFetchAllVaultsData } from "@/lib/utils/earn/earnFetchers";
import { EarnAsset } from "@/lib/types";
import { fetchPrices, PriceData } from "@/lib/utils/prices/priceFeed";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";
import { getAddressList } from "@/lib/utils/web3/addressList";

// ============ TYPES ============

export interface VaultDataWithPrice extends VaultStats {
  asset: EarnAsset;
  priceUsd: number;
  totalSupplyUsd: number;
  totalBorrowsUsd: number;
  chainId: number;
}

interface VaultDataStore {
  // State
  vaults: VaultDataWithPrice[];
  prices: Record<string, PriceData>;
  loading: boolean;
  error: string | null;
  lastFetchTime: number;
  currentChainId: number | null;

  // Actions
  fetchVaultData: (params: {
    chainId: number;
    publicClient: PublicClient;
  }) => Promise<void>;

  fetchPrices: () => Promise<void>;

  getVault: (asset: EarnAsset) => VaultDataWithPrice | null;
  getVaultsByChain: (chainId: number) => VaultDataWithPrice[];

  reset: () => void;
  setLoading: (loading: boolean) => void;
}

// ============ INITIAL STATE ============

const initialState = {
  vaults: [],
  prices: {},
  loading: false,
  error: null,
  lastFetchTime: 0,
  currentChainId: null,
};

// ============ STORE ============

export const useVaultDataStore = create<VaultDataStore>((set, get) => ({
  ...initialState,

  // Fetch prices from API
  fetchPrices: async () => {
    try {
      const priceData = await fetchPrices(["ETH", "USDC", "USDT"]);
      set({ prices: priceData });
    } catch (error) {
      console.error("Error fetching prices:", error);
      // Set fallback prices
      set({
        prices: {
          ETH: { usd: 3000, usd_24h_change: 0 },
          USDC: { usd: 1, usd_24h_change: 0 },
          USDT: { usd: 1, usd_24h_change: 0 },
        },
      });
    }
  },

  // Fetch vault data from blockchain
  fetchVaultData: async ({ chainId, publicClient }) => {
    const state = get();

    // Skip if already loading
    if (state.loading) return;

    // Skip entirely on unsupported chains — no contracts deployed there
    if (!getAddressList(chainId)) {
      set({ loading: false, vaults: [], error: null });
      return;
    }

    // Check if we need to refetch (only refetch if >10 seconds old or chain changed)
    const now = Date.now();
    const timeSinceLastFetch = now - state.lastFetchTime;
    const isSameChain = state.currentChainId === chainId;

    if (isSameChain && timeSinceLastFetch < 10000 && state.vaults.length > 0) {
      // Data is fresh, skip refetch
      return;
    }

    set({ loading: true, error: null, currentChainId: chainId });

    try {
      // Fetch prices first (in parallel with vault data)
      const pricesPromise = get().fetchPrices();

      // Get supported assets for current chain (no fallback — guard above ensures chain is valid)
      const supportedAssets = (SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? []).filter(
        (t): t is EarnAsset => ["ETH", "USDC", "USDT"].includes(t)
      );

      // Fetch vault stats from blockchain
      const vaultStatsPromise = fetchAllVaultsStats(
        chainId,
        publicClient,
        supportedAssets
      );

      // Wait for both to complete
      const [vaultStatsMap] = await Promise.all([
        vaultStatsPromise,
        pricesPromise,
      ]);

      // Get updated prices from state
      const { prices } = get();

      // Transform vault data and combine with prices
      const vaultsWithPrices: VaultDataWithPrice[] = supportedAssets
        .map((asset) => {
          const stats = vaultStatsMap[asset];
          if (!stats) return null;

          const priceUsd = prices[asset]?.usd || 0;
          const totalSupplyUsd = stats.totalAssetsFormatted * priceUsd;
          const totalBorrowsUsd = (stats.totalBorrowsFormatted || 0) * priceUsd;

          return {
            ...stats,
            asset,
            priceUsd,
            totalSupplyUsd,
            totalBorrowsUsd,
            chainId,
          };
        })
        .filter((v): v is VaultDataWithPrice => v !== null);

      set({
        vaults: vaultsWithPrices,
        loading: false,
        lastFetchTime: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error("Error fetching vault data:", error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch vault data",
      });
    }
  },

  // Get specific vault by asset
  getVault: (asset: EarnAsset) => {
    const { vaults } = get();
    return vaults.find((v) => v.asset === asset) || null;
  },

  // Get vaults for specific chain
  getVaultsByChain: (chainId: number) => {
    const { vaults } = get();
    return vaults.filter((v) => v.chainId === chainId);
  },

  // Reset store
  reset: () => {
    set(initialState);
  },

  // Manual loading state control
  setLoading: (loading: boolean) => {
    set({ loading });
  },
}));

// ============ HELPER FUNCTION ============

/**
 * Fetch vault stats for all assets on a chain using OPTIMIZED MULTICALL
 * ✅ OLD: 9 RPC calls (3 calls × 3 vaults)
 * ✅ NEW: 1 RPC call (all batched via multicall)
 */
async function fetchAllVaultsStats(
  chainId: number,
  publicClient: PublicClient,
  assets: EarnAsset[]
): Promise<Record<EarnAsset, VaultStats | null>> {
  // Use optimized multicall implementation
  const { fetchAllVaultsMulticall } = await import("@/lib/utils/earn/earnMulticall");

  return fetchAllVaultsMulticall(chainId, publicClient, assets);
}
