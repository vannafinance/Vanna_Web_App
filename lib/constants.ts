export const navbarItems = [
    { title: "Portfolio", link: "/portfolio" },
    { title: "Earn", link: "/earn" },
    { title: "Margin", link: "/margin" },
    { title: "Trade", link: "/trade" },
    { title: "Analytics", link: "/analytics" },
];

export const DropdownOptions = [{
  id:"usdt",
  name:"USDT",
  icon:"/icons/usdc-icon.svg"
},{
  id:"usdc",
  name:"USDC",
  icon:"/icons/usdt-icon.svg"
}]

export const accountStatsItems = [
  {
    id:"netHealthFactor",
    name:"Net Health Factor",
    icon:"/margin/health.png"
  },
  {
    id:"collateralLeftBeforeLiquidation",
    name:"Collateral Left Before Liquidation",
    icon:"/margin/liquidation.png"
  },
  {
    id:"netAvailableCollateral",
    name:"Net Available Collateral",
    icon:"/margin/dollar.png"
  },
  {
    id:"netAmountBorrowed",
    name:"Net amount Borrowed",
    icon:"/margin/retry.png"
  },
  {
    id:"netProfitAndLoss",
    name:"Net Profit & Loss",
    icon:"/margin/bag.png"
  }
]

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
]

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
]

export const carouselItems = [
    {
        icon: "/assets/mdi_learn-outline.png",
        title: "Multicollateral Loans",
        description: "Don't want to sell your ETH, LSTs, LRTs, and other bags? Borrow against them! You can add multiple colleterals at the same time and draw a loan from Gearbox. And then do whatever you want with that loan."
    },
    {
        icon: "/assets/mdi_learn-outline.png",
        title: "Flexible Borrowing",
        description: "Access instant liquidity without selling your assets. Use your crypto holdings as collateral and maintain your long-term positions while getting the funds you need today."
    },
    {
        icon: "/assets/mdi_learn-outline.png",
        title: "Maximize Capital",
        description: "Leverage your portfolio to its full potential. Borrow against multiple assets simultaneously and use the funds for trading, investing, or any other purpose you choose."
    }
]





