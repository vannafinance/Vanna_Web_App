import createNewStore from "@/zustand/index";

// Types
export interface MarginAccountInfoStateType {
  totalBorrowedValue: number;
  totalCollateralValue: number;
  totalValue: number;
  avgHealthFactor: number;
  timeToLiquidation: number;
  borrowRate: number;
  liquidationPremium: number;
  liquidationFee: number;
  debtLimit: number;
  minDebt: number;
  maxDebt: number;
  hasMarginAccount: boolean;
}

// Initial State (using same constant values)
const initialState: MarginAccountInfoStateType = {
  totalBorrowedValue: 0,
  totalCollateralValue: 0,
  totalValue: 0,
  avgHealthFactor: 0,
  timeToLiquidation: 0,
  borrowRate: 0,
  liquidationPremium: 0,
  liquidationFee: 0,
  debtLimit: 0,
  minDebt: 0,
  maxDebt: 0,
  hasMarginAccount: false,
};

// Export Store
export const useMarginAccountInfoStore = createNewStore(initialState, {
  name: "margin-account-info-store",
  devTools: true,
  persist: true,
});

