import {
  MainTabType,
  OrderTabType,
  ColumnPreferenceItem,
  AccountType,
  ChainOption,
  TokenOption,
  TpSlTriggerPriceType,
  TpSlValueType,
  TpSlOrderType,
  TpSlBBOType,
  TriggerPriceType,
  ExecutionPriceType,
  TakeProfitType,
  StopLossType,
  TimeInForce,
  TwapFrequencyType,
} from "@/lib/types";
import { SuffixOption } from "@/components/ui/InputWithUnit";

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
  "LITUSDT",
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

export const CHAIN_OPTIONS: ChainOption[] = [
  { name: "Arbitrum", icon: "/icons/arbitrum-icon.svg" },
  { name: "Ethereum", icon: "/icons/eth-icon.png" },
  { name: "Polygon", icon: "/icons/polygon-icon.png" },
  { name: "Base", icon: "/icons/base-icon.svg" },
  { name: "Optimism", icon: "/icons/optimism-icon.svg" },
];

export const TOKEN_OPTIONS: TokenOption[] = [
  { symbol: "USDT", icon: "/icons/usdt-icon.svg" },
  { symbol: "USDC", icon: "/icons/usdc-icon.svg" },
  { symbol: "ETH", icon: "/icons/eth-icon.png" },
];

export const ACCOUNT_TYPE_OPTIONS: AccountType[] = [
  "Portfolio Balance",
  "Margin Balance",
];

export const DEPOSIT_TIME_CHAINS: Record<string, string> = {
  Arbitrum: "5~10 minutes",
  Ethereum: "10~15 minutes",
  Polygon: "5~10 minutes",
  "BNB Chain": "3~5 minutes",
  Base: "5~10 minutes",
  Optimism: "5~10 minutes",
};

export const BRIDGE_OPTIONS = ["Stargate", "LayerZero", "Wormhole", "Across"];

export const TP_SL_PRICE_TYPE_OPTIONS: TpSlTriggerPriceType[] = [
  "Last",
  "Mark",
  "Index",
];
export const TP_SL_VALUE_TYPE_OPTIONS: TpSlValueType[] = [
  "ROI(%)",
  "Change(%)",
  "PnL(USDC)",
];
export const TP_SL_ORDER_TYPE_OPTIONS: TpSlOrderType[] = ["Limit", "BBO"];
export const TP_SL_BBO_OPTIONS: TpSlBBOType[] = [
  "Counterparty 1",
  "Counterparty 5",
  "Queue 1",
  "Queue 5",
];

export const TRIGGER_PRICE_SUFFIX_OPTIONS: SuffixOption<TriggerPriceType>[] = [
  { label: "Last Price", value: "last" },
  { label: "Mark Price", value: "mark" },
  { label: "Index Price", value: "index" },
];

export const EXECUTION_PRICE_SUFFIX_OPTIONS: SuffixOption<ExecutionPriceType>[] =
  [
    { label: "Limit", value: "limit" },
    { label: "Market", value: "market" },
  ];

export const TP_SUFFIX_OPTIONS: SuffixOption<TakeProfitType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

export const SL_SUFFIX_OPTIONS: SuffixOption<StopLossType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

export const TIME_IN_FORCE_OPTIONS: TimeInForce[] = [
  "GTC",
  "Post-Only",
  "FOK",
  "IOC",
];

export const TWAP_FREQUENCY_OPTIONS: TwapFrequencyType[] = [
  "5s",
  "10s",
  "20s",
  "30s",
  "60s",
];
