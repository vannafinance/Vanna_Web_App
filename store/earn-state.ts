// store/earn-state.ts
// Zustand store for Earn vault state (ETH, USDC, USDT)

import { create } from "zustand";
import { EarnAsset } from "@/lib/types";
import earnCalc from "@/lib/utils/earn/calculations";

// ============ TYPES ============

export interface VaultData {
  asset: EarnAsset;
  totalAssets: bigint;
  totalSupply: bigint;
  totalAssetsFormatted: number;
  totalSupplyFormatted: number;
  exchangeRate: number;
  supplyAPY: number;
  utilizationRate: number;
}

export interface UserPosition {
  asset: EarnAsset;
  shares: bigint;
  sharesFormatted: number;
  assetsValue: number;
  assetsValueUsd: number;
}

export interface EarnState {
  // Vault data for each asset
  vaults: Record<EarnAsset, VaultData | null>;

  // User positions for each asset
  userPositions: Record<EarnAsset, UserPosition | null>;

  // Prices for USD conversion
  prices: Record<EarnAsset, number>;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;
}

// Fetcher types that will be injected
interface EarnFetchers {
  fetchVaultData: (asset: EarnAsset) => Promise<{
    totalAssets: bigint;
    totalSupply: bigint;
    totalAssetsFormatted: number;
    totalSupplyFormatted: number;
    exchangeRate: number;
  } | null>;

  fetchUserPosition: (asset: EarnAsset) => Promise<{
    shares: bigint;
    sharesFormatted: number;
    assetsValue: number;
    assetsValueUsd: number;
  } | null>;

  fetchWalletBalance: (asset: EarnAsset) => Promise<{
    balance: bigint;
    balanceFormatted: number;
  } | null>;
}

interface EarnStore extends EarnState {
  // Set fetcher functions (called from component with wagmi hooks)
  setFetchers: (fetchers: EarnFetchers) => void;

  // Set prices
  setPrices: (prices: Record<EarnAsset, number>) => void;

  // Reload all vault data
  reloadEarnState: () => Promise<void>;

  // Reload single vault
  reloadVault: (asset: EarnAsset) => Promise<VaultData | null>;

  // Reload user position for single asset
  reloadUserPosition: (asset: EarnAsset) => Promise<UserPosition | null>;

  // Clear state
  clearState: () => void;
}

// ============ INITIAL STATE ============

const initialState: EarnState = {
  vaults: {
    ETH: null,
    USDC: null,
    USDT: null,
  },
  userPositions: {
    ETH: null,
    USDC: null,
    USDT: null,
  },
  prices: {
    ETH: 0,
    USDC: 1,
    USDT: 1,
  },
  loading: false,
  error: null,
};

// ============ STORE ============

export const useEarnStore = create<EarnStore>((set, get) => ({
  ...initialState,

  // Inject fetcher functions from component
  setFetchers: (fetchers) => {
    set(fetchers as any);
  },

  // Set prices for USD conversion
  setPrices: (prices) => {
    set({ prices });
  },

  // Reload all vault data and user positions
  reloadEarnState: async () => {
    const { fetchVaultData, fetchUserPosition } = get() as any;

    if (!fetchVaultData) {
      console.warn("EarnStore: fetchVaultData not injected");
      return;
    }

    set({ loading: true, error: null });

    const assets: EarnAsset[] = ["ETH", "USDC", "USDT"];
    const prices = get().prices;

    try {
      // Fetch all vault data in parallel
      const vaultPromises = assets.map(async (asset) => {
        const data = await fetchVaultData(asset);
        if (!data) return { asset, vault: null };

        // Calculate APY based on utilization (placeholder - adjust with real rate model)
        const utilizationRate = 0; // Would need borrow data
        const supplyAPY = earnCalc.calcSupplyAPYPercent(utilizationRate);

        const vault: VaultData = {
          asset,
          totalAssets: data.totalAssets,
          totalSupply: data.totalSupply,
          totalAssetsFormatted: data.totalAssetsFormatted,
          totalSupplyFormatted: data.totalSupplyFormatted,
          exchangeRate: data.exchangeRate,
          supplyAPY,
          utilizationRate,
        };

        return { asset, vault };
      });

      // Fetch user positions if fetcher available
      const positionPromises = fetchUserPosition
        ? assets.map(async (asset) => {
            const data = await fetchUserPosition(asset);
            if (!data) return { asset, position: null };

            const position: UserPosition = {
              asset,
              shares: data.shares,
              sharesFormatted: data.sharesFormatted,
              assetsValue: data.assetsValue,
              assetsValueUsd: data.assetsValue * (prices[asset] || 0),
            };

            return { asset, position };
          })
        : [];

      const [vaultResults, positionResults] = await Promise.all([
        Promise.all(vaultPromises),
        Promise.all(positionPromises),
      ]);

      // Build new state
      const newVaults: Record<EarnAsset, VaultData | null> = {
        ETH: null,
        USDC: null,
        USDT: null,
      };

      const newPositions: Record<EarnAsset, UserPosition | null> = {
        ETH: null,
        USDC: null,
        USDT: null,
      };

      vaultResults.forEach(({ asset, vault }) => {
        newVaults[asset] = vault;
      });

      positionResults.forEach(({ asset, position }) => {
        newPositions[asset] = position;
      });

      set({
        vaults: newVaults,
        userPositions: newPositions,
        loading: false,
      });
    } catch (error: any) {
      console.error("Error reloading earn state:", error);
      set({
        loading: false,
        error: error.message || "Failed to load vault data",
      });
    }
  },

  // Reload single vault
  reloadVault: async (asset) => {
    const { fetchVaultData } = get() as any;

    if (!fetchVaultData) {
      console.warn("EarnStore: fetchVaultData not injected");
      return null;
    }

    try {
      const data = await fetchVaultData(asset);
      if (!data) return null;

      const utilizationRate = 0;
      const supplyAPY = earnCalc.calcSupplyAPYPercent(utilizationRate);

      const vault: VaultData = {
        asset,
        totalAssets: data.totalAssets,
        totalSupply: data.totalSupply,
        totalAssetsFormatted: data.totalAssetsFormatted,
        totalSupplyFormatted: data.totalSupplyFormatted,
        exchangeRate: data.exchangeRate,
        supplyAPY,
        utilizationRate,
      };

      set((state) => ({
        vaults: {
          ...state.vaults,
          [asset]: vault,
        },
      }));

      return vault;
    } catch (error) {
      console.error(`Error reloading vault ${asset}:`, error);
      return null;
    }
  },

  // Reload user position for single asset
  reloadUserPosition: async (asset) => {
    const { fetchUserPosition } = get() as any;
    const prices = get().prices;

    if (!fetchUserPosition) {
      console.warn("EarnStore: fetchUserPosition not injected");
      return null;
    }

    try {
      const data = await fetchUserPosition(asset);
      if (!data) return null;

      const position: UserPosition = {
        asset,
        shares: data.shares,
        sharesFormatted: data.sharesFormatted,
        assetsValue: data.assetsValue,
        assetsValueUsd: data.assetsValue * (prices[asset] || 0),
      };

      set((state) => ({
        userPositions: {
          ...state.userPositions,
          [asset]: position,
        },
      }));

      return position;
    } catch (error) {
      console.error(`Error reloading position ${asset}:`, error);
      return null;
    }
  },

  // Clear all state
  clearState: () => {
    set(initialState);
  },
}));

// ============ SELECTORS ============

// Get total USD value of all user positions
export const selectTotalPositionValue = (state: EarnStore): number => {
  const { userPositions } = state;
  let total = 0;

  Object.values(userPositions).forEach((position) => {
    if (position) {
      total += position.assetsValueUsd;
    }
  });

  return total;
};

// Get vault by asset
export const selectVault = (state: EarnStore, asset: EarnAsset): VaultData | null => {
  return state.vaults[asset];
};

// Get user position by asset
export const selectUserPosition = (state: EarnStore, asset: EarnAsset): UserPosition | null => {
  return state.userPositions[asset];
};
