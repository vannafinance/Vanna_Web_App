export const farmTableHeadings = [
  { label: "Pool", id: "pool", icon: true },
  { label: "DEX", id: "dex", icon: true },
  { label: "DEX LP TVL", id: "dex-lp-tvl", icon: true },
  { label: "Vanna TVL", id: "vanna-tvl", icon: true },
  { label: "Pool APR", id: "pool-apr", icon: true },
  { label: "Leveraged APR", id: "leveraged-apr", icon: true },
  { label: "1D VOL", id: "1d-vol", icon: true },
  { label: "30 D VOL", id: "30d-vol", icon: true },
  { label: "1D VOL/TVL", id: "1d-vol-tvl", icon: true },
];

export const farmTableBody = {
  rows: [
    {
      cell: [
        { chain: "ETH", titles: ["ETH", "USDC"], tags: ["V3", "0.05%", "Vanna", "HyperLiquid"] },
        { title: "HyperSwap" },
        { title: "$342.8M" },
        { title: "$128.5M" },
        { title: "24.31%" },
        { title: "58.7%" },
        { title: "$8.2M" },
        { title: "$186.4M" },
        { title: "2.39" },
      ],
    },
    {
      cell: [
        { chain: "USDC", titles: ["USDC", "USDT"], tags: ["V3", "0.01%", "Vanna", "HyperLiquid"] },
        { title: "HyperSwap" },
        { title: "$218.5M" },
        { title: "$95.2M" },
        { title: "8.45%" },
        { title: "21.2%" },
        { title: "$12.5M" },
        { title: "$298.7M" },
        { title: "5.74" },
      ],
    },
    {
      cell: [
        { chain: "ETH", titles: ["wstHYPE", "HYPE"], tags: ["V3", "0.30%", "Lido", "HyperLiquid"] },
        { title: "HyperSwap" },
        { title: "$156.2M" },
        { title: "$72.8M" },
        { title: "18.92%" },
        { title: "45.6%" },
        { title: "$4.1M" },
        { title: "$89.3M" },
        { title: "2.63" },
      ],
    },
    {
      cell: [
        { chain: "ETH", titles: ["ETH", "HYPE"], tags: ["V3", "0.30%", "Vanna", "Kraken"] },
        { title: "Uniswap" },
        { title: "$89.4M" },
        { title: "$42.1M" },
        { title: "32.15%" },
        { title: "78.4%" },
        { title: "$3.8M" },
        { title: "$72.6M" },
        { title: "4.26" },
      ],
    },
    {
      cell: [
        { chain: "USDC", titles: ["kHYPE", "USDe"], tags: ["V3", "0.05%", "9summits", "HyperLiquid"] },
        { title: "HyperSwap" },
        { title: "$75.6M" },
        { title: "$38.9M" },
        { title: "41.28%" },
        { title: "99.2%" },
        { title: "$2.4M" },
        { title: "$48.5M" },
        { title: "3.18" },
      ],
    },
    {
      cell: [
        { chain: "USDT", titles: ["wHYPE", "USDC"], tags: ["V2", "0.25%", "Compound", "Coinbase"] },
        { title: "Curve" },
        { title: "$198.3M" },
        { title: "$84.7M" },
        { title: "12.56%" },
        { title: "30.8%" },
        { title: "$5.6M" },
        { title: "$124.2M" },
        { title: "2.82" },
      ],
    },
    {
      cell: [
        { chain: "ETH", titles: ["PURSE", "HYPE"], tags: ["V3", "0.30%", "Vanna"] },
        { title: "HyperSwap" },
        { title: "$42.1M" },
        { title: "$18.5M" },
        { title: "67.42%" },
        { title: "162.8%" },
        { title: "$1.8M" },
        { title: "$32.4M" },
        { title: "4.28" },
      ],
    },
    {
      cell: [
        { chain: "USDC", titles: ["USDT", "ETH"], tags: ["V2", "0.05%", "Lido", "Binance"] },
        { title: "Balancer" },
        { title: "$267.9M" },
        { title: "$112.3M" },
        { title: "6.82%" },
        { title: "16.5%" },
        { title: "$9.1M" },
        { title: "$215.8M" },
        { title: "3.41" },
      ],
    },
    {
      cell: [
        { chain: "ETH", titles: ["HYPE", "USDe"], tags: ["V3", "0.05%", "9summits", "HyperLiquid"] },
        { title: "HyperSwap" },
        { title: "$134.7M" },
        { title: "$62.4M" },
        { title: "22.85%" },
        { title: "55.1%" },
        { title: "$3.2M" },
        { title: "$68.9M" },
        { title: "2.38" },
      ],
    },
    {
      cell: [
        { chain: "USDT", titles: ["ETH", "USDT"], tags: ["V3", "0.01%", "Vanna", "Kraken"] },
        { title: "SushiSwap" },
        { title: "$312.6M" },
        { title: "$145.8M" },
        { title: "9.74%" },
        { title: "23.5%" },
        { title: "$11.3M" },
        { title: "$278.4M" },
        { title: "3.62" },
      ],
    },
  ],
};

// Single Asset Table Data
export const singleAssetTableHeadings = [
  { label: "Asset", id: "asset", icon: true },
  { label: "Protocol", id: "protocol", icon: true },
  { label: "Total Deposits", id: "total-deposits", icon: true },
  { label: "Provider TVL", id: "provider-tvl", icon: true },
  { label: "Supply APY", id: "supply-apy", icon: true },
  { label: "Leveraged APY", id: "leveraged-apy", icon: true },
  { label: "24H Volume", id: "24h-volume", icon: true },
  { label: "Utilization", id: "utilization", icon: true },
];

export const singleAssetTableBody = {
  rows: [
    {
      cell: [
        { chain: "ETH", title: "USDC", tags: ["V3", "Vanna", "9summits"] },
        { title: "Vanna" },
        { title: "$482.6M" },
        { title: "$318.4M" },
        { title: "8.42%" },
        { title: "20.8%" },
        { title: "$14.8M" },
        { title: "82.4%" },
      ],
    },
    {
      cell: [
        { chain: "USDC", title: "USDT", tags: ["V3", "Vanna", "Lido"] },
        { title: "Vanna" },
        { title: "$396.2M" },
        { title: "$285.7M" },
        { title: "7.65%" },
        { title: "18.9%" },
        { title: "$11.2M" },
        { title: "79.8%" },
      ],
    },
    {
      cell: [
        { chain: "USDT", title: "ETH", tags: ["V3", "Vanna", "9summits"] },
        { title: "Vanna" },
        { title: "$1.24B" },
        { title: "$842.5M" },
        { title: "3.85%" },
        { title: "9.6%" },
        { title: "$42.8M" },
        { title: "68.2%" },
      ],
    },
    {
      cell: [
        { chain: "ETH", title: "HYPE", tags: ["V3", "Vanna", "HyperLiquid"] },
        { title: "Vanna" },
        { title: "$268.4M" },
        { title: "$178.9M" },
        { title: "14.52%" },
        { title: "35.8%" },
        { title: "$8.6M" },
        { title: "85.6%" },
      ],
    },
    {
      cell: [
        { chain: "ETH", title: "wstHYPE", tags: ["V2", "Lido", "9summits"] },
        { title: "Lido" },
        { title: "$342.8M" },
        { title: "$248.5M" },
        { title: "6.28%" },
        { title: "15.4%" },
        { title: "$5.4M" },
        { title: "74.2%" },
      ],
    },
    {
      cell: [
        { chain: "USDC", title: "kHYPE", tags: ["V3", "Vanna", "HyperLiquid"] },
        { title: "Vanna" },
        { title: "$124.7M" },
        { title: "$86.3M" },
        { title: "18.94%" },
        { title: "46.8%" },
        { title: "$3.9M" },
        { title: "88.2%" },
      ],
    },
    {
      cell: [
        { chain: "USDT", title: "USDe", tags: ["V3", "Vanna", "Ethena"] },
        { title: "Vanna" },
        { title: "$215.3M" },
        { title: "$162.8M" },
        { title: "11.35%" },
        { title: "28.2%" },
        { title: "$6.8M" },
        { title: "81.5%" },
      ],
    },
    {
      cell: [
        { chain: "ETH", title: "PURSE", tags: ["V3", "Vanna"] },
        { title: "Vanna" },
        { title: "$56.8M" },
        { title: "$32.4M" },
        { title: "28.64%" },
        { title: "72.4%" },
        { title: "$2.1M" },
        { title: "92.1%" },
      ],
    },
  ],
};


export const FARM_STATS_ITEMS = [
  {
    id: "depositTVL",
    name: "Your Deposit TVL",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "earnings",
    name: "Your Earnings",
    icon: "/icons/bnb-icon.png",
  },
];

export const FARM_STATS_VALUES: Record<string, string | number | null> = {
  depositTVL: "$48,256.82",
  earnings: "$3,142.57",
};



export const MARGIN_ACCOUNT_STATS_ITEMS = [
  {
    id: "totalCollateral",
    name: "Total Collateral",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "availableCollateral",
    name: "Available Collateral",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "borrowedAssets",
    name: "Borrowed Assets",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "crossAccountLeverage",
    name: "Cross Account Leverage",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "healthFactor",
    name: "Health Factor",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "pnl",
    name: "PNL",
    icon: "/icons/bnb-icon.png",
  },
  {
    id: "crossMarginRatio",
    name: "Cross Margin Ratio",
    icon: "/icons/bnb-icon.png",
  },
];


export const MARGIN_ACCOUNT_STATS_VALUES: Record<
  string,
  string | number | null
> = {
  totalCollateral: "$32,480.25",
  availableCollateral: "$18,724.50",
  borrowedAssets: "$13,755.75",
  crossAccountLeverage: "2.4x",
  healthFactor: "1.82",
  pnl: "+$2,148.32",
  crossMarginRatio: "42.3%",
};

// Farm detail page sidebar stats
export const farmStatsData = [
  {
    heading: "Total Value Locked",
    value: "$342.8M",
    uptrend: "+12.4%",
  },
  {
    heading: "24H Trading Volume",
    value: "$8.2M",
    uptrend: "+5.8%",
  },
  {
    heading: "Pool APR",
    value: "24.31%",
    uptrend: "+2.1%",
  },
  {
    heading: "Leveraged APR",
    value: "58.7%",
    uptrend: "+4.6%",
  },
  {
    heading: "Your LP Position",
    value: "$12,450",
  },
  {
    heading: "Unclaimed Rewards",
    value: "$342.18",
    uptrend: "+$28.50",
  },
  {
    heading: "Pool Share",
    value: "0.0036%",
  },
  {
    heading: "Fee Tier",
    value: "0.05%",
  },
];

// Farm detail page liquidation stats (shown when adding liquidity)
export const farmLiquidationStatsData = [
  {
    heading: "Position Health Factor",
    value: "1.82",
  },
  {
    heading: "Liquidation Price",
    value: "$1,842.50",
    downtrend: "-8.2%",
  },
  {
    heading: "Current Leverage",
    value: "2.4x",
  },
  {
    heading: "Max Available Leverage",
    value: "10x",
  },
  {
    heading: "Estimated Daily Yield",
    value: "$34.12",
    uptrend: "+$2.40",
  },
  {
    heading: "Impermanent Loss Risk",
    value: "Low",
    progressBar: {
      percentage: 18,
      value: "18%",
    },
  },
];

// Analytics stats items for farm detail page (replaces dynamic items from earn details-tab)
export const farmAnalyticsStatsItems = [
  {
    heading: "Available Liquidity",
    mainInfo: "128.5M USDC",
    subInfo: "$128,500,000",
    tooltip: "Total assets available for borrowing",
  },
  {
    heading: "Pool APR",
    mainInfo: "24.31%",
    subInfo: "Based on 7-day average",
    tooltip: "Annual percentage rate from pool fees",
  },
  {
    heading: "Leveraged APR",
    mainInfo: "58.7%",
    tooltip: "APR when using maximum leverage",
  },
  {
    heading: "Utilization Rate",
    mainInfo: "82.4%",
    tooltip: "Ratio of borrowed assets to supplied assets",
  },
  {
    heading: "Impermanent Loss (30D)",
    mainInfo: "-0.42%",
    subInfo: "vs HODL",
    tooltip: "Impermanent loss compared to holding assets",
  },
  {
    heading: "Fee Revenue (24H)",
    mainInfo: "$48,250",
    tooltip: "Total fees earned by liquidity providers in 24 hours",
  },
];

export const LEVERAGE_HEALTH_STATS_ITEMS = [
  {
    id: "maxLeverage",
    name: "Max Utilised Leverage / Max Available Leverage",
    amount: "7x / 10x",
  },
  {
    id: "positionHealthFactor",
    name: "Position Health Factor",
    amount: "N/A",
  },
  {
    id: "marginHealthFactor",
    name: "Margin Health Factor",
    amount: "N/A",
  },
  {
    id: "avgLiquidationTime",
    name: "Avg Liquidation Time",
    amount: "N/A",
  },
];

export const farmStatsData = [
  {
    heading: "Total Value Locked",
    value: "$2,450.00",
    uptrend: "+3.2%",
  },
  {
    heading: "Your Earnings",
    value: "$128.50",
    uptrend: "+1.8%",
  },
  {
    heading: "APR",
    value: "12.5%",
  },
  {
    heading: "Pool Utilization",
    value: "",
    progressBar: {
      percentage: 68,
      value: "68%",
    },
  },
];

export const farmLiquidationStatsData = [
  {
    heading: "Liquidation Price",
    value: "$1,250.00",
    downtrend: "-5.2%",
  },
  {
    heading: "Health Factor",
    value: "1.85",
    uptrend: "+0.12",
  },
  {
    heading: "Margin Ratio",
    value: "",
    progressBar: {
      percentage: 42,
      value: "42%",
    },
  },
];

