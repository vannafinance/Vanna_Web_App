import { create } from "zustand";
import marginCalc from "@/lib/utils/margin/calculations";

export interface MarginState {
  collateral: any[];
  borrow: any[];
  collateralUsd: number;
  borrowUsd: number;
  hf: number;
  ltv: number;
  leverage: number;
  maxBorrow: number;
  maxWithdraw: number;
  hfStatus: 'safe' | 'caution' | 'warning' | 'danger' | 'liquidatable';
}

interface MarginStore {
  marginState: MarginState | null;
  isLoading: boolean;
  lastError: string | null;
  fetchersReady: boolean;
  lastFetchTime: number;

  setFetchers: (fetchers: {
    fetchAccountCheck: () => Promise<any[]>;
    fetchCollateralState: (acc: `0x${string}`) => Promise<any[]>;
    fetchBorrowState: (acc: `0x${string}`) => Promise<any[]>;
  }) => void;

  reloadMarginState: (forceRefresh?: boolean) => Promise<MarginState | null>;
  clearError: () => void;
}

// Minimum time between requests (15 seconds cooldown - increased to prevent rate limits)
const MIN_FETCH_INTERVAL = 15000;

// Cache duration - return cached data without error if within this time
const CACHE_DURATION = 30000; // 30 seconds

export const useMarginStore = create<MarginStore>((set, get) => ({
  marginState: null,
  isLoading: false,
  lastError: null,
  fetchersReady: false,
  lastFetchTime: 0,

  setFetchers: (fetchers) => {
    set({ ...fetchers as any, fetchersReady: true });
  },

  clearError: () => {
    set({ lastError: null });
  },

  reloadMarginState: async (forceRefresh = false) => {
    const state = get();
    const { fetchAccountCheck, fetchCollateralState, fetchBorrowState, fetchersReady, lastFetchTime, isLoading } = state as any;

    // Prevent duplicate simultaneous requests
    if (isLoading && !forceRefresh) {
      console.log("[MarginStore] Already loading, returning cached state");
      return state.marginState;
    }

    // Rate limiting with smart caching
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    // If data is fresh (within cache duration), return it without error
    if (!forceRefresh && timeSinceLastFetch < CACHE_DURATION && state.marginState) {
      const cacheAge = Math.floor(timeSinceLastFetch / 1000);
      console.log(`[MarginStore] Returning cached data (${cacheAge}s old)`);
      return state.marginState;
    }

    // If requesting too soon and past cache, silently return old data
    if (!forceRefresh && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      const waitTime =(MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000;
      console.log(`[MarginStore] Rate limited, returning cached data. Next refresh in ${waitTime}s`);
      // Don't set error - just return cached data
      return state.marginState;
    }

    // Better error handling - check if fetchers are ready
    if (!fetchersReady || !fetchAccountCheck || !fetchCollateralState || !fetchBorrowState) {
      console.warn("MarginStore: fetch functions not ready yet");
      set({ lastError: "Fetchers not initialized" });
      return null;
    }

    set({ isLoading: true, lastError: null });

    try {
      const accounts = await fetchAccountCheck();
      if (!accounts || !accounts.length) {
        // No margin account found
        const { useMarginAccountInfoStore } = await import("@/store/margin-account-info-store");
        useMarginAccountInfoStore.setState({ hasMarginAccount: false });
        set({ marginState: null, isLoading: false, lastFetchTime: now });
        return null;
      }

      // Margin account exists - update the flag
      const { useMarginAccountInfoStore } = await import("@/store/margin-account-info-store");
      useMarginAccountInfoStore.setState({ hasMarginAccount: true });

      const acc = accounts[0];

      const [col, bor] = await Promise.all([
        fetchCollateralState(acc),
        fetchBorrowState(acc),
      ]);

      const cUsd = marginCalc.calcCollateralUsd(col);
      const bUsd = marginCalc.calcBorrowUsd(bor);

      console.log(`[MarginStore] Collateral: $${cUsd.toFixed(2)}, Borrow: $${bUsd.toFixed(2)}`);

      const hf = marginCalc.calcHF(cUsd, bUsd);
      const maxBorrow = marginCalc.calcMaxBorrow(cUsd, bUsd);
      const maxWithdraw = marginCalc.calcMaxWithdraw(cUsd, bUsd);

      console.log(`[MarginStore] Calculated HF: ${hf === Infinity ? '∞' : hf.toFixed(2)}, MaxBorrow: $${maxBorrow.toFixed(2)}, MaxWithdraw: $${maxWithdraw.toFixed(2)}`);

      const newState: MarginState = {
        collateral: col,
        borrow: bor,
        collateralUsd: cUsd,
        borrowUsd: bUsd,
        hf,
        ltv: marginCalc.calcLTV(cUsd, bUsd),
        leverage: marginCalc.calcLeverage(cUsd, bUsd),
        maxBorrow,
        maxWithdraw,
        hfStatus: marginCalc.getHFStatus(hf),
      };

      set({ marginState: newState, isLoading: false, lastFetchTime: now });
      return newState;
    } catch (error: any) {
      console.error("MarginStore: Failed to reload margin state", error);

      // Better error messages for common issues
      let errorMessage = "Failed to load margin data";

      if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        lastError: errorMessage,
        isLoading: false,
        lastFetchTime: now // Still update to prevent spam retries
      });
      return null;
    }
  },
}));



