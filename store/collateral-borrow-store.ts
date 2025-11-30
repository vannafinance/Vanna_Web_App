import createNewStore from "@/zustand/index";
import { BorrowInfo, Collaterals } from "@/lib/types";

// Types
export interface CollateralBorrowStateType {
  collaterals: Collaterals[];
  borrowItems: BorrowInfo[];
}

// Initial State
const initialState: CollateralBorrowStateType = {
  collaterals: [],
  borrowItems: [],
};

// Export Store
export const useCollateralBorrowStore = createNewStore(initialState, {
  name: "collateral-borrow-store",
  devTools: true,
  persist: true,
});

