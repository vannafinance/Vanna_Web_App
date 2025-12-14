"use client";

import { OrderSide, OrderType } from "@/lib/types";
import createNewStore from "@/zustand";

// Types
export interface OrderPlacementStateType {
  orderType: OrderType;
  orderSide: OrderSide;
  loopEnabled?: boolean;
  noOfLoops?: number | "";
  entryPrice?: number | "";
  marketPrice?: number | "";
  triggerPrice?: number | "";
  totalUnits?: number | "";
  totalAmount?: number | "";
  takeProfit: boolean;
  stopLoss: boolean;
}

//initial state
const initialState: OrderPlacementStateType = {
  orderType: "limit",
  orderSide: "buy",
  loopEnabled: true,
  noOfLoops: "",
  entryPrice: "",
  marketPrice: "",
  triggerPrice: "",
  totalUnits: "",
  totalAmount: "",
  takeProfit: false,
  stopLoss: false,
};

//Export Store
export const useOrderPlacementStore = createNewStore<OrderPlacementStateType>(
  initialState,
  {
    name: "order-placement-store",
    devTools: true,
    persist: true,
  }
);
