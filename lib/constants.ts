import { PoolTable } from "./utils/margin/types";

export const navbarItems = [
  { title: "Portfolio", link: "/portfolio", group: "primary" },
  { title: "Earn", link: "/earn", group: "primary" },
  { title: "Margin", link: "/margin", group: "bordered" },
  { title: "Trade", link: "/trade" , group: "bordered"  },
  { title: "Farm", link: "/farm", group: "bordered" },
  { title: "Analytics", link: "/analytics", group: "secondary" },
];

export const tradeItems = [
  {title: "Spot", link: "/trade/spot" },
    { title: "Futures", link: "/trade/futures" },
    { title: "Options", link: "/trade/options" },
    {title:"Defi Greeks", link: "/trade/defi-greeks" },
]

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

export const poolsPlaceholder: PoolTable[] = [
  {
    id: 1,
    name: "WETH",
    icon: "/eth-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vWETH",
  },
  {
    id: 2,
    name: "WBTC",
    icon: "/btc-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vWBTC",
  },
  {
    id: 3,
    name: "USDC",
    icon: "/usdc-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vUSDC",
  },
  {
    id: 4,
    name: "USDT",
    icon: "/usdt-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vUSDT",
  },
  {
    id: 5,
    name: "DAI",
    icon: "/dai-icon.svg",
    supply: "0",
    supplyAPY: "0",
    borrowAPY: "0",
    yourBalance: "0",
    isActive: false,
    version: 0,
    vToken: "vDAI",
  },
];