import Image from "next/image";
import { useMemo, useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Dropdown } from "../ui/dropdown";

type MarketType = "all" | "perps" | "spot";
type CategoryTab = "all" | "favorites" | "crypto" | "rwa";
type SubTab =
  | "all"
  | "new"
  | "majors"
  | "prelaunch"
  | "defi"
  | "chain"
  | "memes"
  | "ai"
  | "stocks"
  | "fx"
  | "commodities"
  | "indices";

type Pair = {
  id: string;
  pair: string;
  base: string;
  icon: string;
  marketType: "spot" | "perps";
  category: "crypto" | "rwa";
  subCategory: SubTab;
  leverage?: number;

  lastPrice: number;
  change24h: number;
  volume24h: number;
  openInterest?: number;
  funding?: number;

  // RWA only
  status?: "open" | "closed";
  timeline?: string;
};

interface TradingPairSearchProps {
  onSelectPair?: (pair: Pair) => void;
}

const MOCK_DATA: Pair[] = [
  {
    id: "btc-perp",
    pair: "BTC/USDC",
    base: "BTC",
    icon: "/coins/btc.svg",
    marketType: "perps",
    category: "crypto",
    subCategory: "majors",
    leverage: 50,
    lastPrice: 92574.2,
    change24h: -1.01,
    volume24h: 2.61e9,
    openInterest: 439.9e6,
    funding: 0.01,
  },
  {
    id: "eth-spot",
    pair: "ETH/USDC",
    base: "ETH",
    icon: "/coins/eth.svg",
    marketType: "spot",
    category: "crypto",
    subCategory: "majors",
    lastPrice: 3003.6,
    change24h: 0.48,
    volume24h: 6.59e6,
  },
  {
    id: "btc-spot",
    pair: "BTC/USDC",
    base: "BTC",
    icon: "/coins/btc.svg",
    marketType: "spot",
    category: "crypto",
    subCategory: "majors",
    lastPrice: 3003.6,
    change24h: 0.48,
    volume24h: 6.59e6,
  },
  {
    id: "ada-spot",
    pair: "ADA/USDC",
    base: "ADA",
    icon: "/coins/ada.svg",
    marketType: "spot",
    category: "crypto",
    subCategory: "new",
    lastPrice: 121.25,
    change24h: -1.75,
    volume24h: 10.9e6,
  },
  {
    id: "hood-rwa",
    pair: "HOOD/USDC",
    base: "HOOD",
    icon: "/coins/hood.svg",
    marketType: "perps",
    category: "rwa",
    subCategory: "stocks",
    leverage: 10,
    lastPrice: 185.15,
    change24h: 3.65,
    volume24h: 3.76e6,
    openInterest: 676.83e3,
    funding: 0.01,
    status: "open",
    timeline: "Market open until Saturday 03:30 UTC+5:30",
  },
];

const RWASTATUS_OPTIONS = ["All", "Open", "Closed"];

const format = (n?: number) => {
  if (n == null) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return n.toString();
};

const getSubTabs = (market: MarketType, category: CategoryTab): SubTab[] => {
  if (category === "favorites") return ["all"];

  if (market === "spot") return ["all", "new"];

  if (category === "crypto")
    return [
      "all",
      "new",
      "majors",
      "prelaunch",
      "defi",
      "chain",
      "memes",
      "ai",
    ];

  if (category === "rwa")
    return ["all", "stocks", "fx", "commodities", "indices"];

  return [
    "all",
    "new",
    "majors",
    "prelaunch",
    "defi",
    "chain",
    "memes",
    "ai",
    "stocks",
    "fx",
    "commodities",
    "indices",
  ];
};

export default function TradingPairSearch({
  onSelectPair,
}: TradingPairSearchProps) {
  const { isDark } = useTheme();
  const [marketType, setMarketType] = useState<MarketType>("all");
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("all");
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [rwaStatus, setRwaStatus] = useState("All");
  const [sortKey, setSortKey] = useState<keyof Pair | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const showPerpCols = marketType !== "spot";

  const categoryTabs: CategoryTab[] =
    marketType === "spot"
      ? ["all", "favorites", "crypto"]
      : ["all", "favorites", "crypto", "rwa"];
  const subTabs = getSubTabs(marketType, categoryTab);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const onSort = (key: keyof Pair) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortKey(null);
      setSortOrder(null);
    }
  };

  const rows = useMemo(() => {
    let data = [...MOCK_DATA];

    // Market type
    if (marketType !== "all") {
      data = data.filter((d) => d.marketType === marketType);
    }

    // Category
    if (categoryTab === "favorites") {
      data = data.filter((d) => favorites.includes(d.id));
    } else if (categoryTab !== "all") {
      data = data.filter((d) => d.category === categoryTab);
    }

    // Sub tab
    if (subTab !== "all") {
      data = data.filter((d) => d.subCategory === subTab);
    }

    // RWA status
    if (categoryTab === "rwa" && rwaStatus !== "All") {
      data = data.filter((d) => d.status === rwaStatus);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (d) =>
          d.pair.toLowerCase().includes(q) || d.base.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey && sortOrder) {
      data.sort((a: any, b: any) =>
        sortOrder === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
      );
    }

    return data;
  }, [marketType, categoryTab, subTab, rwaStatus, search, sortKey, sortOrder, favorites]);

  return (
    <div className={`w-[880px] rounded-2xl flex border shadow ${isDark ? "bg-[#222222] border-[#333333]" : "bg-[#F4F4F4] border-[#E2E2E2]"}`}>
      {/* left: market type tabs*/}
      <div className="flex flex-col p-2 gap-2 text-[12px]  leading-[18px] font-semibold  items-center">
        {(["all", "perps", "spot"] as MarketType[]).map((market) => (
          <button
            key={market}
            onClick={() => setMarketType(market)}
            className={`cursor-pointer w-[92px] h-9 p-2.5 rounded-lg text-left ${
              marketType === market
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : isDark ? "bg-transparent text-[#FFFFFF]" : "bg-transparent text-[#111111]"
            }`}
          >
            {market === "all" ? "All" : market === "perps" ? "Perps" : "Spot"}
          </button>
        ))}
      </div>
      {/* right */}
      <div className="h-80 w-5xl flex flex-1 flex-col p-2 gap-2">
        {/* search & main category tabs */}
        <div className="flex  gap-2">
          <div className={`flex flex-1 gap-[9px] py-2 px-5 rounded-lg ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}>
            <Image
              src="/icons/search.svg"
              alt="search"
              height={15}
              width={15}
              className="w-5 h-5 flex items-center justify-center"
            />
            <input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 placeholder:text-[#A7A7A7] outline-none text-[14px] leading-[21px] font-medium ${isDark ? "text-[#FFFFFF] bg-transparent" : ""}`}
            />
          </div>

          {/* category tabs */}
          <div>
            {categoryTabs.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setCategoryTab(category);
                  setSubTab("all");
                }}
                className={`cursor-pointer w-20 py-2 px-3  text-[12px] leading-[18px] font-semibold ${
                  categoryTab === category
                    ? "text-[#703AE6] border-b-2 border-[#703AE6]"
                    : isDark ? "text-[#FFFFFF]" : "text-[#111111]"
                }`}
              >
                {category[0].toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {/* sub tabs & grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              {subTabs.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubTab(s)}
                  className={`cursor-pointer  py-2 px-3  text-[12px] leading-[18px] font-semibold ${
                    subTab === s
                      ? "text-[#703AE6] border-b-2 border-[#703AE6]"
                      : isDark ? "text-[#FFFFFF]" : "text-[#111111]"
                  }`}
                >
                  {s === "prelaunch"
                    ? "Pre-launch"
                    : s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div>
              {categoryTab === "rwa" && marketType !== "spot" && (
                <Dropdown
                  items={RWASTATUS_OPTIONS}
                  selectedOption={rwaStatus}
                  setSelectedOption={(val) => setRwaStatus(val)}
                  classname={`gap-2 font-medium text-[12px] leading-[18px] ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
                  dropdownClassname="text-[12px] leading-[18px] font-medium "
                />
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-col gap-2">
            {/* Table header */}
            <div
              className={`grid text-[10px] text-[#A7A7A7] leading-[15px] font-semibold ${
                showPerpCols
                  ? "grid-cols-[2.5fr_1fr_1fr_1.2fr_1.2fr_1fr]"
                  : "grid-cols-[2.5fr_1fr_1fr_1.2fr]"
              }`}
            >
              <div onClick={() => onSort("pair")}>Pair</div>
              <div onClick={() => onSort("lastPrice")}>Last Price</div>
              <div onClick={() => onSort("change24h")}>24h Change</div>
              <div onClick={() => onSort("volume24h")}>24h Volume</div>
              {showPerpCols && (
                <>
                  <div>Open Interest</div>
                  <div>8h Funding</div>
                </>
              )}
            </div>

            {/* table rows */}
            {rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onSelectPair?.(row)}
                className={`cursor-pointer grid text-[12px] leading-[18px] font-medium items-center transition-colors duration-150 ${
                  isDark 
                    ? "text-[#FFFFFF] hover:bg-[#333333]" 
                    : "text-[#111111] hover:bg-[#F1EBFD]"
                } ${
                  showPerpCols
                    ? "grid-cols-[2.5fr_1fr_1fr_1.2fr_1.2fr_1fr]"
                    : "grid-cols-[2.5fr_1fr_1fr_1.2fr]"
                }`}
              >
                <div className="flex items-center gap-1">
                  <button
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(row.id);
                    }}
                  >
                    <Image
                      src={
                        favorites.includes(row.id)
                          ? "/icons/ic_round-star.svg"
                          : "/icons/line-md_star.svg"
                      }
                      alt="fav"
                      width={20}
                      height={20}
                    />
                  </button>
                  <span>
                    <Image src={row.icon} alt="fav" width={20} height={20} />
                  </span>
                  <span>{row.pair}</span>

                  {row.marketType === "spot" ? (
                    <span className="px-1.5 py-0.5 text-[10px] leading-[15px] rounded bg-[#703AE6] text-[#FFFFFF] font-medium">
                      Spot
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] leading-[15px] rounded bg-[#703AE6] text-[#FFFFFF] font-medium">
                      {row.leverage}x
                    </span>
                  )}

                  {row.category === "rwa" && row.status && (
                    <span
                      className={`ml-1 w-2 h-2 rounded-full ${
                        row.status === "open" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  )}
                </div>

                <div>{row.lastPrice.toLocaleString()}</div>
                <div
                  className={
                    row.change24h >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {row.change24h > 0 && "+"}
                  {row.change24h}%
                </div>
                <div>{format(row.volume24h)}</div>

                {showPerpCols && (
                  <>
                    <div>{format(row.openInterest)}</div>
                    <div>
                      {row.funding != null ? `${row.funding.toFixed(4)}%` : "-"}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
