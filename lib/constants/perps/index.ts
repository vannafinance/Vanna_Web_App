import { MainTabType, OrderTabType, ColumnPreferenceItem } from "@/lib/types";

export const ORDER_TYPE_TABS = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "trigger", label: "Trigger" },
];

export const FILTER_OPTIONS = [
  "All",
  "BTCUSDT",
  "BNBUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "AVAXUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOTUSDT",
  "DOGEUSDT",
  "MATICUSDT",
  "LINKUSDT",
  "LITUSDT"
];

// Column preferences for positions table
export const POSITION_COLUMN_ITEMS: ColumnPreferenceItem[] = [
  { id: "futures", label: "Futures", hasToggle: false },
  { id: "positionSize", label: "Position size", hasToggle: false },
  { id: "positionValue", label: "Position value", hasToggle: false },
  {
    id: "entryMarkPrice",
    label: "Avg. entry price | Mark price",
    hasToggle: true,
  },
  { id: "estLiquidation", label: "Est. liquidation price", hasToggle: true },
  { id: "margin", label: "Margin", hasToggle: true },
  {
    id: "tieredMaintenanceMarginRate",
    label: "Tiered maintenance margin rate",
    hasToggle: true,
  },
  { id: "unrealizedPnl", label: "Unrealized PnL", hasToggle: true },
  { id: "realizedPnl", label: "Realized PnL", hasToggle: true },
  { id: "funding", label: "Funding", hasToggle: true },
  { id: "mmr", label: "MMR", hasToggle: true },
  { id: "flashClose", label: "Flash close", hasToggle: true },
  { id: "reverse", label: "Reverse", hasToggle: true },
  { id: "entireTpSl", label: "All TP/SL", hasToggle: true },
  { id: "partialTpSl", label: "Partial TP/SL", hasToggle: true },
  { id: "trailingTpSl", label: "Trailing TP/SL", hasToggle: true },
  { id: "mmrSl", label: "MMR SL", hasToggle: true },
  { id: "close", label: "Close", hasToggle: false },
  { id: "breakevenPrice", label: "Breakeven price", hasToggle: true },
];

// Default visible columns (these will have toggle ON initially)
export const DEFAULT_VISIBLE_COLUMNS = [
  "futures",
  "positionSize",
  "positionValue",
  "entryMarkPrice",
  "estLiquidation",
  "margin",
  "tieredMaintenanceMarginRate",
  "unrealizedPnl",
  "realizedPnl",
  "funding",
  "mmr",
  "flashClose",
  "reverse",
  "entireTpSl",
  "partialTpSl",
  "trailingTpSl",
  "mmrSl",
  "close",
];

export const SORT_OPTIONS = [
  { id: "default", label: "Default", icon: null },
  {
    id: "coin_asc",
    label: "Coin initial (from A to Z)",
    icon: "/perp/freepik__alphabets.svg",
  },
  {
    id: "position_value",
    label: "Position Value(from high to low)",
    icon: "/perp/freepik__position_value.svg",
  },
  {
    id: "margin",
    label: "Margin(from high to low)",
    icon: "/perp/freepik__margin.svg",
  },
  {
    id: "unrealized_pnl",
    label: "Unrealized PnL (from high to low)",
    icon: "/perp/freepik__unrealized_pnl.svg",
  },
  { id: "roi", label: "ROI(from high to low)", icon: "/perp/freepik__roi.svg" },
];

export const MAIN_TABS = [
  {
    id: "position" as MainTabType,
    label: "Positions",
    count: null,
  },
  {
    id: "openOrders" as MainTabType,
    label: "Open Orders",
    count: null,
  },
  { id: "orderHistory" as MainTabType, label: "Order History", count: null },
  {
    id: "positionHistory" as MainTabType,
    label: "Position History",
    count: null,
  },
  {
    id: "orderDetails" as MainTabType,
    label: "Order Details",
    count: null,
  },
  {
    id: "transactionHistory" as MainTabType,
    label: "Transaction History",
    count: null,
  },
  { id: "assets" as MainTabType, label: "Assets", count: null },
];

export const ORDER_TABS = [
  {
    id: "limitMarket" as OrderTabType,
    label: "Limit | Market",
    count: 4,
  },
  {
    id: "trailingStop" as OrderTabType,
    label: "Trailing stop",
    count: 2,
  },
  {
    id: "tpSl" as OrderTabType,
    label: "TP/SL",
    count: 0,
  },
  {
    id: "trigger" as OrderTabType,
    label: "Trigger",
    count: 0,
  },
  {
    id: "iceberg" as OrderTabType,
    label: "Iceberg",
    count: 0,
  },
  {
    id: "twap" as OrderTabType,
    label: "TWAP",
    count: 0,
  },
];

export const PREFERENCE_ITEMS = [
  { id: "positions", label: "Positions", hasToggle: false },
  { id: "openOrders", label: "Open Orders", hasToggle: false },
  { id: "orderHistory", label: "Order History", hasToggle: true },
  { id: "positionHistory", label: "Position History", hasToggle: true },
  { id: "orderDetails", label: "Order Details", hasToggle: true },
  { id: "transactionHistory", label: "Transaction History", hasToggle: true },
  { id: "assets", label: "Assets", hasToggle: true },
] as const;
