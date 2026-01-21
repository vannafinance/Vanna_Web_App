export const navbarItems = [
  { title: "Portfolio", link: "/portfolio", group: "primary" },
  { title: "Earn", link: "/earn", group: "primary" },
  { title: "Margin", link: "/margin", group: "bordered" },
  { title: "Trade", link: "/trade", group: "bordered" },
  { title: "Farm", link: "/farm", group: "bordered" },
  { title: "Analytics", link: "/analytics", group: "secondary" },
];

export const tradeItems = [
  { title: "Spot", link: "/trade/spot/btcusdc" },
  { title: "Perps", link: "/trade/perps/btcusdc" },
  { title: "Options", link: "/trade/options" },
  { title: "Defi Greeks", link: "/trade/defi-greeks" },
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
