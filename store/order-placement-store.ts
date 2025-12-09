"use client";

import createNewStore from "@/zustand";

export type OrderType = "limit" | "market" | "trigger";
export type OrderSide = "buy" | "sell";
export type TimeInForce = "GTC" | "IOC" | "FOK";

export interface OrderPlacementFormValues {
  orderType: OrderType;
  side: OrderSide;
  loopEnabled: boolean;
  noOfLoops?: number | "";
  entryPrice?: number | "";
  totalUnits?: number | "";
  totalAmount?: number | "";
  takeProfit: boolean;
  stopLoss: boolean;
  timeInForce: TimeInForce;
}

interface OrderPlacementState {
  form: OrderPlacementFormValues;
}

const initialState: OrderPlacementState = {
  form: {
    orderType: "limit",
    side: "buy",
    loopEnabled: true,
    noOfLoops: "",
    entryPrice: "",
    totalUnits: "",
    totalAmount: "",
    takeProfit: false,
    stopLoss: false,
    timeInForce: "GTC",
  },
};

export const useOrderPlacementStore = createNewStore(initialState, {
  name: "order-placement-store",
  devTools: true,
  persist: true,
});
