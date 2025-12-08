import createNewStore from "@/zustand/index";
import { BorrowInfo, Collaterals, Position } from "@/lib/types";
import { position } from "@/lib/constants";

// Types
export interface CollateralBorrowStateType {
  collaterals: Collaterals[];
  borrowItems: BorrowInfo[];
  position: Position[];
}

// Initial State
const initialState: CollateralBorrowStateType = {
  collaterals: [],
  borrowItems:[
    {
      assetData: { asset: "0xUSDC", amount: "1000" },
      percentage: 60,
      usdValue: 100,
    },
    {
      assetData: { asset: "0xETH", amount: "22000" }, // 0.022 ETH
      percentage: 40,
      usdValue: 403.67,
    },
  ] ,
  position: position,
};

// Export Store
export const useCollateralBorrowStore = createNewStore(initialState, {
  name: "collateral-borrow-store",
  devTools: true,
  persist: true,
});

