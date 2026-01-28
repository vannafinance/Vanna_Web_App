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
  setFetchers: (fetchers: {
    fetchAccountCheck: () => Promise<any[]>;
    fetchCollateralState: (acc: `0x${string}`) => Promise<any[]>;
    fetchBorrowState: (acc: `0x${string}`) => Promise<any[]>;
  }) => void;

  reloadMarginState: () => Promise<MarginState | null>;
}

export const useMarginStore = create<MarginStore>((set, get) => ({
  marginState: null,

  setFetchers: (fetchers) => {
    set(fetchers as any);
  },

  reloadMarginState: async () => {
    const { fetchAccountCheck, fetchCollateralState, fetchBorrowState } = get() as any;

    if (!fetchAccountCheck || !fetchCollateralState || !fetchBorrowState) {
      console.warn("MarginStore: fetch functions not injected");
      return null;
    }

    const accounts = await fetchAccountCheck();
    if (!accounts || !accounts.length) {
      set({ marginState: null });
      return null;
    }

    const acc = accounts[0];

    const [col, bor] = await Promise.all([
      fetchCollateralState(acc),
      fetchBorrowState(acc),
    ]);

    const cUsd = marginCalc.calcCollateralUsd(col);
    const bUsd = marginCalc.calcBorrowUsd(bor);

    const hf = marginCalc.calcHF(cUsd, bUsd);

    const state: MarginState = {
      collateral: col,
      borrow: bor,
      collateralUsd: cUsd,
      borrowUsd: bUsd,
      hf,
      ltv: marginCalc.calcLTV(cUsd, bUsd),
      leverage: marginCalc.calcLeverage(cUsd, bUsd),
      maxBorrow: marginCalc.calcMaxBorrow(cUsd, bUsd),
      maxWithdraw: marginCalc.calcMaxWithdraw(cUsd, bUsd),
      hfStatus: marginCalc.getHFStatus(hf),
    };

    set({ marginState: state });
    return state;
  },
}));