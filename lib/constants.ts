export const navbarItems = [
  { title: "Portfolio", link: "/portfolio" },
  { title: "Earn", link: "/earn" },
  { title: "Margin", link: "/margin" },
  { title: "Trade", link: "/trade" },
  { title: "Analytics", link: "/analytics" },
];

export const DropdownOptions = [
  "USDT",
  "USDC",
  "ETH",
  "SCROLL",
  "AVALANCHE",
  "OPTIMISM",
  "POLYGON",
  "APE",
  "KATANA",
  "ARBITRUM",
  "BASE",
];

export const accountStatsItems = [
  {
    id: "netHealthFactor",
    name: "Net Health Factor",
    icon: "/margin/health.png",
  },
  {
    id: "collateralLeftBeforeLiquidation",
    name: "Collateral Left Before Liquidation",
    icon: "/margin/liquidation.png",
  },
  {
    id: "netAvailableCollateral",
    name: "Net Available Collateral",
    icon: "/margin/dollar.png",
  },
  {
    id: "netAmountBorrowed",
    name: "Net amount Borrowed",
    icon: "/margin/retry.png",
  },
  {
    id: "netProfitAndLoss",
    name: "Net Profit & Loss",
    icon: "/margin/bag.png",
  },
];

export const marginAccountInfoItems = [
  {
    id: "totalBorrowedValue",
    name: "Total Borrowed value",
  },
  {
    id: "totalCollateralValue",
    name: "Total Collateral value",
  },
  {
    id: "totalValue",
    name: "Total Value",
  },
  {
    id: "avgHealthFactor",
    name: "Avg Health Factor",
  },
  {
    id: "timeToLiquidation",
    name: "Time to liquidation",
  },
  {
    id: "borrowRate",
    name: "Borrow Rate",
  },
];

export const marginAccountMoreDetailsItems = [
  {
    id: "liquidationPremium",
    name: "Liquidation premium",
  },
  {
    id: "liquidationFee",
    name: "Liquidation Fee",
  },
  {
    id: "debtLimit",
    name: "Debt Limit",
  },
  {
    id: "minDebt",
    name: "Min Debt",
  },
  {
    id: "maxDebt",
    name: "Max Debt",
  },
];

export const carouselItems = [
  {
    icon: "/assets/mdi_learn-outline.png",
    title: "Multicollateral Loans",
    description:
      "Don't want to sell your ETH, LSTs, LRTs, and other bags? Borrow against them! You can add multiple colleterals at the same time and draw a loan from Gearbox. And then do whatever you want with that loan.",
  },
  {
    icon: "/assets/mdi_learn-outline.png",
    title: "Flexible Borrowing",
    description:
      "Access instant liquidity without selling your assets. Use your crypto holdings as collateral and maintain your long-term positions while getting the funds you need today.",
  },
  {
    icon: "/assets/mdi_learn-outline.png",
    title: "Maximize Capital",
    description:
      "Leverage your portfolio to its full potential. Borrow against multiple assets simultaneously and use the funds for trading, investing, or any other purpose you choose.",
  },
];

export const iconPaths: Record<string, string> = {
  USDT: "/icons/usdt-icon.svg",
  USDC: "/icons/usdc-icon.svg",
  ETH: "/icons/eth-icon.png",
  SCROLL: "/icons/scroll-icon.png",
  AVALANCHE: "/icons/avalanche-icon.png",
  OPTIMISM: "/icons/optimism-icon.svg",
  POLYGON: "/icons/polygon-icon.png",
  APE: "/icons/ape-icon.png",
  KATANA: "/icons/katana.jpg",
  ARBITRUM: "/icons/arbitrum-icon.svg",
  BASE: "/icons/base-icon.svg",
};

export const balanceTypeOptions = [
  "PB",
  "WB",
  "MB",
];

export const position = [
  {
    positionId: 1,
    collateral: { asset: "0xUSDT", amount: "1000" }, // 100 USDT
    collateralUsdValue: 100,

    borrowed: [
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
    ],

    leverage: 5,
    interestAccrued: 30,
    isOpen: true,
    user: "0x123",
  },

  {
    positionId: 2,
    collateral: { asset: "0xUSDT", amount: "500" }, // 5000 USDT
    collateralUsdValue: 5000,

    borrowed: [
      {
        assetData: { asset: "0xUSDC", amount: "2000" }, // 20,000 USDC
        percentage: 100,
        usdValue: 20000,
      },
    ],

    leverage: 5,
    interestAccrued: 20,
    isOpen: false,
    user: "0x123",
  },

  {
    positionId: 4,
    collateral: { asset: "0xETH", amount: "300" }, // 0.30 ETH
    collateralUsdValue: 550,

    borrowed: [
      {
        assetData: { asset: "0xUSDT", amount: "4500" }, // 450 USDT
        percentage: 100,
        usdValue: 450,
      },
    ],

    leverage: 3,
    interestAccrued: 18,
    isOpen: true,
    user: "0x123",
  },
];

export const depositAmountBreakdownDropDownData = [
  { name: "APE", value: 1200, valueInUSD: 1200 },
  { name: "Polygon", value: 400, valueInUSD: 400 },
  { name: "Optimism", value: 180, valueInUSD: 180 },
];

export const depositAmountBreakdownData = {
  heading: "Your Deposit Amount Breakdown",
  asset: "USDT",
  totalDeposit: 2000,
  breakdown: [
    { name: "APE", value: 1200 },
    { name: "Polygon", value: 400 },
    { name: "Optimism", value: 180 },
    { name: "Avalanche", value: 120 },
    { name: "Scroll", value: 100 },
  ],
};

export const unifiedBalanceBreakdownData = {
  heading: "Unified Balance Breakdown",
  asset: "USDT",
  totalDeposit: 7000,
  breakdown: [
    { name: "APE", value: 3500 },
    { name: "Polygon", value: 1500 },
    { name: "Optimism", value: 800 },
    { name: "Avalanche", value: 700 },
    { name: "Scroll", value: 500 },
  ],
};
