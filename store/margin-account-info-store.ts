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
}

// Initial State (using same constant values)
const initialState: MarginAccountInfoStateType = {
  totalBorrowedValue: 200000,
  totalCollateralValue: 200000,
  totalValue: 100,
  avgHealthFactor: 1.2,
  timeToLiquidation: 10,
  borrowRate: 3.02,
  liquidationPremium: 0.00,
  liquidationFee: 0.00,
  debtLimit: 10000000,
  minDebt: 500,
  maxDebt: 12500,
};

// Export Store
export const useMarginAccountInfoStore = createNewStore(initialState, {
  name: "margin-account-info-store",
  devTools: true,
  persist: true,
});

