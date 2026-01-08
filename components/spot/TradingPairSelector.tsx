"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ViewTab = "favorites" | "spot" | "perps";
type SortOrder = "asc" | "desc";
type SpotCategory = "all" | "new";
type PerpsCategory = "all" | "new" | "stocks" | "pre-launch" | "rwa";

interface MarketRow {
  symbol: string;
  volume: number;
  lastPrice: number;
  change24h: number;
  fundingRate?: number;
  category?: SpotCategory | PerpsCategory;
}

const SPOT_MARKETS: MarketRow[] = [
  {
    symbol: "BTC/USDT",
    volume: 6550000,
    lastPrice: 89566.51,
    change24h: 2.15,
    category: "all",
  },
  {
    symbol: "ETH/USDT",
    volume: 2780000,
    lastPrice: 3016.34,
    change24h: 2.64,
    category: "all",
  },
  {
    symbol: "SOL/USDT",
    volume: 1980000,
    lastPrice: 187.42,
    change24h: 4.21,
    category: "all",
  },
  {
    symbol: "BNB/USDT",
    volume: 1430000,
    lastPrice: 612.8,
    change24h: 1.32,
    category: "all",
  },
  {
    symbol: "XRP/USDT",
    volume: 2210000,
    lastPrice: 0.6231,
    change24h: -0.48,
    category: "all",
  },

  {
    symbol: "ADA/USDT",
    volume: 980000,
    lastPrice: 0.5124,
    change24h: 3.12,
    category: "all",
  },
  {
    symbol: "AVAX/USDT",
    volume: 742000,
    lastPrice: 41.83,
    change24h: 5.91,
    category: "all",
  },
  {
    symbol: "DOGE/USDT",
    volume: 1320000,
    lastPrice: 0.0817,
    change24h: -1.24,
    category: "all",
  },
  {
    symbol: "TRX/USDT",
    volume: 615000,
    lastPrice: 0.1129,
    change24h: 0.87,
    category: "all",
  },
  {
    symbol: "DOT/USDT",
    volume: 488000,
    lastPrice: 7.41,
    change24h: 2.09,
    category: "all",
  },

  {
    symbol: "MATIC/USDT",
    volume: 534000,
    lastPrice: 0.872,
    change24h: -0.66,
    category: "all",
  },
  {
    symbol: "LINK/USDT",
    volume: 426000,
    lastPrice: 18.63,
    change24h: 3.78,
    category: "all",
  },
  {
    symbol: "ATOM/USDT",
    volume: 392000,
    lastPrice: 9.84,
    change24h: 1.44,
    category: "all",
  },
  {
    symbol: "LTC/USDT",
    volume: 361000,
    lastPrice: 92.17,
    change24h: -0.91,
    category: "all",
  },
  {
    symbol: "OP/USDT",
    volume: 318000,
    lastPrice: 3.72,
    change24h: 6.84,
    category: "all",
  },

  // 🔥 New listings
  {
    symbol: "FORM/USDT",
    volume: 69150,
    lastPrice: 0.339,
    change24h: -1.17,
    category: "new",
  },
  {
    symbol: "ASTER/USDT",
    volume: 7710000,
    lastPrice: 0.71656,
    change24h: 0.31,
    category: "new",
  },
  {
    symbol: "PIXEL/USDT",
    volume: 184000,
    lastPrice: 0.542,
    change24h: 12.47,
    category: "new",
  },
  {
    symbol: "AEVO/USDT",
    volume: 223000,
    lastPrice: 1.87,
    change24h: 9.63,
    category: "new",
  },
  {
    symbol: "NFP/USDT",
    volume: 156000,
    lastPrice: 0.481,
    change24h: 7.18,
    category: "new",
  },
];

const PERPS_MARKETS: MarketRow[] = [
  {
    symbol: "BTCUSDT",
    volume: 128500000,
    lastPrice: 89566.5,
    change24h: 2.31,
    fundingRate: 0.0102,
    category: "all",
  },
  {
    symbol: "ETHUSDT",
    volume: 86420000,
    lastPrice: 3016.3,
    change24h: 2.74,
    fundingRate: 0.0121,
    category: "all",
  },
  {
    symbol: "SOLUSDT",
    volume: 34210000,
    lastPrice: 187.4,
    change24h: 4.88,
    fundingRate: 0.0156,
    category: "all",
  },
  {
    symbol: "BNBUSDT",
    volume: 22150000,
    lastPrice: 612.9,
    change24h: 1.64,
    fundingRate: 0.0098,
    category: "all",
  },
  {
    symbol: "XRPUSDT",
    volume: 28470000,
    lastPrice: 0.623,
    change24h: -0.42,
    fundingRate: 0.0064,
    category: "all",
  },

  // ===== Large Alts =====
  {
    symbol: "ADAUSDT",
    volume: 15620000,
    lastPrice: 0.512,
    change24h: 3.42,
    fundingRate: 0.0113,
    category: "all",
  },
  {
    symbol: "AVAXUSDT",
    volume: 9870000,
    lastPrice: 41.8,
    change24h: 6.12,
    fundingRate: 0.0184,
    category: "all",
  },
  {
    symbol: "DOGEUSDT",
    volume: 17380000,
    lastPrice: 0.0816,
    change24h: -1.08,
    fundingRate: 0.0052,
    category: "all",
  },
  {
    symbol: "DOTUSDT",
    volume: 6420000,
    lastPrice: 7.41,
    change24h: 2.21,
    fundingRate: 0.0107,
    category: "all",
  },
  {
    symbol: "LINKUSDT",
    volume: 7130000,
    lastPrice: 18.6,
    change24h: 3.96,
    fundingRate: 0.0139,
    category: "all",
  },

  // ===== Stocks / Narratives =====
  {
    symbol: "ATOMUSDT",
    volume: 4980000,
    lastPrice: 9.83,
    change24h: 1.37,
    fundingRate: 0.0091,
    category: "stocks",
  },
  {
    symbol: "OPUSDT",
    volume: 5820000,
    lastPrice: 3.71,
    change24h: 7.42,
    fundingRate: 0.0214,
    category: "stocks",
  },
  {
    symbol: "ARBUSDT",
    volume: 5440000,
    lastPrice: 1.94,
    change24h: 5.63,
    fundingRate: 0.0192,
    category: "stocks",
  },

  // ===== New / High Volatility =====
  {
    symbol: "AEVOUSDT",
    volume: 1320000,
    lastPrice: 1.87,
    change24h: 12.84,
    fundingRate: 0.0361,
    category: "new",
  },
  {
    symbol: "PIXELUSDT",
    volume: 1140000,
    lastPrice: 0.542,
    change24h: 18.22,
    fundingRate: 0.0417,
    category: "new",
  },
  {
    symbol: "NFPUSDT",
    volume: 860000,
    lastPrice: 0.481,
    change24h: 9.31,
    fundingRate: 0.0286,
    category: "new",
  },

  // ===== Pre-launch / Early =====
  {
    symbol: "ZETAUSDT",
    volume: 640000,
    lastPrice: 1.43,
    change24h: 8.77,
    fundingRate: 0.0334,
    category: "pre-launch",
  },
  {
    symbol: "STRKUSDT",
    volume: 720000,
    lastPrice: 2.18,
    change24h: 11.05,
    fundingRate: 0.0291,
    category: "pre-launch",
  },

  // ===== RWA / Infra =====
  {
    symbol: "TAKEUSDT",
    volume: 184080,
    lastPrice: 0.4669,
    change24h: 42.77,
    fundingRate: 0.0405,
    category: "rwa",
  },
  {
    symbol: "ONDOUSDT",
    volume: 960000,
    lastPrice: 0.812,
    change24h: 6.91,
    fundingRate: 0.0176,
    category: "rwa",
  },

  // ===== Low liquidity / experimental =====
  {
    symbol: "TAGUSDT",
    volume: 1100,
    lastPrice: 0.0004634,
    change24h: -0.62,
    fundingRate: 0.0805,
    category: "new",
  },
  {
    symbol: "ATUSDT",
    volume: 3720000,
    lastPrice: 0.1674,
    change24h: 4.14,
    fundingRate: 0.0778,
    category: "stocks",
  },
];

function sortData<T>(data: T[], key: keyof T, order: SortOrder) {
  return [...data].sort((a: any, b: any) =>
    order === "asc" ? (a[key] > b[key] ? 1 : -1) : a[key] < b[key] ? 1 : -1
  );
}

function getCoinIcon(symbol: string) {
  const coin = symbol.replace("/USDT", "").replace("USDT", "").toLowerCase();
  return `/coins/${coin}.svg`;
}

export default function TradingPairSelector() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("spot");
  const [spotCategory, setSpotCategory] = useState<SpotCategory>("all");
  const [perpsCategory, setPerpsCategory] = useState<PerpsCategory>("all");
  const [sortKey, setSortKey] = useState<keyof MarketRow | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const isPerps = activeTab === "perps";

  const rawData =
    activeTab === "spot"
      ? SPOT_MARKETS
      : activeTab === "perps"
      ? PERPS_MARKETS
      : [...SPOT_MARKETS, ...PERPS_MARKETS];

  const handleSort = (key: keyof MarketRow) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("desc");
      return;
    }

    if (sortOrder === "desc") {
      setSortOrder("asc");
      return;
    }

    setSortKey(null);
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  const renderSortIcon = (key: keyof MarketRow) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? "▲" : "▼";
  };

  const data = useMemo(() => {
    let result = rawData;

    if (activeTab === "favorites") {
      result = result.filter((r) => favorites.has(r.symbol));
    }

    if (activeTab === "spot") {
      result = result.filter((r) => r.category === spotCategory);
    }

    if (activeTab === "perps") {
      result = result.filter((r) => r.category === perpsCategory);
    }

    if (search) {
      result = result.filter((r) =>
        r.symbol.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (!sortKey) return result;
    return sortData(result, sortKey, sortOrder);
  }, [
    rawData,
    activeTab,
    favorites,
    search,
    sortKey,
    sortOrder,
    spotCategory,
    perpsCategory,
  ]);

  return (
    <div className="flex flex-col gap-3 p-3  rounded-xl w-[492px]  bg-[#F4F4F4] border border-[#E2E2E2] shadow">
      {/* search */}
      <div className="flex gap-2.5 rounded-lg p-2 bg-white">
        <Image src="/icons/search.svg" alt="search" height={15} width={15} />
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className=" flex-1 placeholder:text-[#A7A7A7]  outline-none text-[12px] leading-[18px] font-medium"
        />
      </div>
      {/* top tabs */}
      <div className="w-full flex gap-1 text-[12px] leading-4.5 font-semibold">
        {["favorites", "perps", "spot"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as ViewTab)}
            className={`rounded-sm py-1.5 px-3 cursor-pointer ${
              activeTab === tab
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-white text-[#111111]"
            }`}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* sub tabs */}
      {activeTab === "spot" && (
        <div className="w-full flex gap-1 text-[10px] leading-3.75 font-medium">
          {(["all", "new"] as SpotCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setSpotCategory(category)}
              className={`px-2 py-1 rounded cursor-pointer ${
                spotCategory === category ? "bg-gray-200" : "bg-gray-50"
              }`}
            >
              {category === "all" ? "All markets" : "New"}
            </button>
          ))}
        </div>
      )}

      {activeTab === "perps" && (
        <div className="w-full flex gap-1 text-[10px] leading-3.75 font-medium">
          {(
            ["all", "new", "stocks", "pre-launch", "rwa"] as PerpsCategory[]
          ).map((category) => (
            <button
              key={category}
              onClick={() => setPerpsCategory(category)}
              className={`px-2 py-1 rounded cursor-pointer ${
                perpsCategory === category ? "bg-gray-200" : "bg-gray-50"
              }`}
            >
              {category === "all" ? "All markets" : category}
            </button>
          ))}
        </div>
      )}

      {/* table */}
      <div className="relative h-[420px] overflow-y-auto scrollbar-hide">
        {activeTab === "favorites" && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Image
              src="/icons/ic_round-star.svg"
              alt="No favorites"
              width={40}
              height={40}
              className="opacity-50"
            />
            <div className="text-[12px] font-medium text-[#111111]">
              No favorites yet
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#7A7A7A]">
              <span>Click</span>
              <Image
                src="/icons/line-md_star.svg"
                alt="favorite"
                width={14}
                height={14}
              />
              <span>to add trading pairs</span>
            </div>
          </div>
        ) : (
          <table className="w-full table-fixed border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] leading-3.75 font-semibold text-[#111111]">
                <th className="sticky top-0 z-10 bg-[#F4F4F4] text-left">
                  <div className="flex items-center gap-2">
                    {/* SYMBOL SORT */}
                    <button
                      onClick={() => handleSort("symbol")}
                      className="flex items-center gap-px cursor-pointer"
                    >
                      <span>Symbol</span>
                      <span className="text-[9px]">
                        {renderSortIcon("symbol")}
                      </span>
                    </button>

                    <span className="text-[#A7A7A7]">/</span>

                    {/* VOLUME SORT */}
                    <button
                      onClick={() => handleSort("volume")}
                      className="flex items-center gap-px cursor-pointer"
                    >
                      <span>Volume</span>
                      <span className="text-[9px]">
                        {renderSortIcon("volume")}
                      </span>
                    </button>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lastPrice")}
                  className="sticky top-0 z-10 bg-[#F4F4F4]   cursor-pointer text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Last price
                    <span className="text-[9px]">
                      {renderSortIcon("lastPrice")}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("change24h")}
                  className="sticky top-0 z-10 bg-[#F4F4F4]  cursor-pointer text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    24h change
                    <span className="text-[9px]">
                      {renderSortIcon("change24h")}
                    </span>
                  </div>
                </th>
                {isPerps && (
                  <th
                    onClick={() => handleSort("fundingRate")}
                    className="sticky top-0 z-10 bg-[#F4F4F4] cursor-pointer text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Funding
                      <span className="text-[9px]">
                        {renderSortIcon("fundingRate")}
                      </span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="">
              {data.map((row) => (
                <tr
                  key={row.symbol}
                  className="hover:bg-[#EFEFEF]  transition-colors duration-150"
                >
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => toggleFavorite(row.symbol)}>
                        {favorites.has(row.symbol) ? (
                          <Image
                            src="/icons/ic_round-star.svg"
                            alt=""
                            height={16}
                            width={16}
                          />
                        ) : (
                          <Image
                            src="/icons/line-md_star.svg"
                            alt=""
                            height={16}
                            width={16}
                          />
                        )}
                      </button>
                      <div className="flex gap-1 items-center justify-center">
                        <Image
                          src={getCoinIcon(row.symbol)}
                          alt={row.symbol}
                          height={20}
                          width={20}
                          className="w-5 h-5"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "/coins/default.svg";
                          }}
                        />
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-[12px] leading-4.5 text-[#111111]">
                            {row.symbol}
                          </div>
                          <div className="text-[10px] leading-3 text-[#5C5B5B]">
                            {row.volume.toLocaleString()} USDT
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className=" text-[12px] leading-4.5 font-medium text-[#111111] text-right">
                    {row.lastPrice}
                  </td>

                  <td
                    className={`text-[12px] leading-4.5 font-medium text-right ${
                      row.change24h >= 0 ? "text-[#01BC8D]" : "text-[#E23D3D]"
                    }`}
                  >
                    {row.change24h}%
                  </td>

                  {isPerps && (
                    <td className=" text-[12px] leading-4.5 font-medium text-[#111111] text-right">
                      {row.fundingRate}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
