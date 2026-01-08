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
export type TriggerMode = "limit" | "market";
export type TimeInForce = "GTC" | "Post-Only" | "FOK" | "IOC";
export type RiskRewardRatio =
  | "NA"
  | "1:1"
  | "1:2"
  | "1:3"
  | "2:1"
  | "3:1"
  | "CUSTOM";

export type ActivePositionType = {
  id: string;
  dateTime: string;
  pair: string;
  type: "Limit" | "Market";
  side: "Buy" | "Sell";
  qty: string;
  estFilledPrice: string;
  takeProfit?: {
    label: string;
    value: number;
  }[];
  slTriggerPrice?: number;
  slLimit?: number;
  stopLimit?: number;
  trailPctOrUsd?: string;
  loop?: string;
  currentPnlUsd?: string;
  currentPnlPct?: string;
  status: "Active" | "Closed";
};

export type OpenOrderType = {
  id: string;
  dateTime: string;
  pair: string;
  type: "Limit" | "Market" | "Trigger";
  side: "Buy" | "Sell";
  qty: string;
  price: number;
  takeProfit: {
    label: string;
    value: number;
  }[];
  slTriggerPrice: number;
  slLimit: number;
  trail: number;
  loop: string;
  triggerCondition: string;
  total: string;
};

export type OrderHistoryType = {
  id: string;
  dateTime: string;
  pair: string;
  type: "Limit" | "Market" | "Conditional";
  side: "Buy" | "Sell";
  orderQty: string;
  executedQty: string;
  price: number;
  avgFillPrice: number;
  takeProfit?: {
    label: string;
    value: number;
  }[];
  averageTPPrice: string;
  slTriggerPrice?: number;
  slLimit?: number;
  trailPctOrUsd?: string;
  loop?: string;
  gainPct?: string;
  gainUsd?: string;
  totalGainUsd?: number;
  total: string;
  triggerCondition?: string;
  reduceOnly?: boolean;
  status: "Filled" | "Partially Filled" | "Cancelled";
  orderId?: string;
};

export type TradeHistoryType = {
  id: string;
  dateTime: string;
  pair: string;
  side: "Buy" | "Sell";
  executedQty: string;
  avgFilledPrice: string;
  fee: string;
  role: "Maker" | "Taker";
  total: "Filled" | "Partially Filled";
};

export interface SingleTakeProfit {
  exitPrice: number | null;
  profitPercent: number | null;
  profitAmount: number | null;
}

export interface RiskState {
  collateralValue: bigint;
  debtValue: bigint;
  maxLtvBps: bigint;
}

export interface MultipleTakeProfitRow {
  exitPricePercent: number | null;
  profitPercent: number | null;
  profitAmount: number | null;
  unitsPercent: number | null;
  units: number | null;
  marketPrice: boolean;
}

export interface StopLossConfig {
  triggerPrice: number | null;
  limitPrice: number | null;
  trailVariance: number | null;
  trailVarianceUnit: "USDT" | "USD";
  rrRatio: RiskRewardRatio;
  customRR: string | null;
}

export interface OrderPlacementFormValues {
  // top level
  orderType: OrderType; // limit | market | trigger
  orderSide: OrderSide; // buy | sell

  // loop
  loopEnabled?: boolean;
  noOfLoops?: number | string | null; // null = ∞

  // prices & size
  triggerPrice?: number | null;
  triggerMode?: TriggerMode; // limit | market

  entryPrice: number | null; // disabled in market
  totalUnits: number | null;
  totalAmount: number | null;

  // take profit
  takeProfitEnabled?: boolean;
  multipleTpEnabled?: boolean;
  singleTakeProfit?: SingleTakeProfit;
  multipleTakeProfits?: MultipleTakeProfitRow[];

  // stop loss
  stopLossEnabled?: boolean;
  stopLoss?: StopLossConfig;

  // derived / selection
  timeInForce?: TimeInForce;

  // calculated (read-only but useful in submit)
  riskAmount?: number;
  riskPercent?: number;
  gainAmount?: number;
  gainPercent?: number;
}
