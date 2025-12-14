export interface AssetAmount {
  asset: string;
  amount: string;
}

export interface BorrowInfo {
  assetData: AssetAmount;
  percentage: number;
  usdValue: number;
}

export interface Position {
  positionId: number;

  collateral: AssetAmount;
  collateralUsdValue: number;

  borrowed: BorrowInfo[];

  leverage: number;
  interestAccrued: number;

  isOpen: boolean;
  user: string;
}

export type PositionsArray = Position[];

export interface Collaterals {
  asset: string;
  amount: number;
  amountInUsd: number;
  balanceType: string;
  unifiedBalance: number;
}

export type OrderType = "limit" | "market" | "trigger";
export type OrderSide = "buy" | "sell";
export type TimeInForce = "GTC" | "Post-Only" | "FOK" | "IOC";
