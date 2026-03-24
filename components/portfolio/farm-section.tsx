"use client";

import { useState, useMemo } from "react";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { useTheme } from "@/contexts/theme-context";

// ─── Constants ───────────────────────────────────────────────────────────────

const FARMING_INFO_STATS = [
  { label: "Your Total Asset Supplied to Farm(USD)", value: "$123,122" },
  { label: "Overall Farm TVL(USD)",                  value: "$150,712" },
  { label: "Percentage of Your Margin Allocated to Farm(%)", value: "-29.06%" },
  { label: "Unrealised P&L",                         value: "-$8.31"   },
  { label: "Realised P&L",                           value: "$72.02"   },
  { label: "Farm Volume",                            value: "$72.02"   },
] as const;

const CHART_FILTER_TABS = ["Total Equity", "Cumulative PnL", "PnL", "Return Percentage"] as const;

const POSITION_TABS = [
  { id: "currentPositions", label: "Current Positions" },
  { id: "positionsHistory", label: "Positions History" },
];

const FILTER_TYPE_TABS = [
  { id: "lending", label: "Lending/Single Assets" },
  { id: "lp",      label: "LP/Multiple Assets"   },
];

const BASE_TABLE_HEADINGS = [
  { id: "pool",               label: "Pool"                },
  { id: "amount-supplied",    label: "Amount Supplied",    icon: true },
  { id: "transaction-history",label: "Transaction History", icon: true },
];

// Lending / Single Asset rows
const LENDING_CURRENT_ROWS = Array.from({ length: 4 }, () => ({
  cell: [
    { chain: "ETH", title: "WBTC", tags: ["Active", "9summits"] },
    { title: "0.0109 wbtc", tag: "$1000" },
    { title: "3.3%",        tag: "1000 USD" },
    { title: "10k USD" },
  ],
}));

const LENDING_HISTORY_ROWS = Array.from({ length: 4 }, () => ({
  cell: [
    { chain: "ETH", title: "WBTC", tags: ["Active", "9summits"] },
    { title: "0.0109 wbtc", tag: "$1000" },
    { title: "3.3%",        tag: "1000 USD" },
    { title: "10k USD" },
  ],
}));

// LP / Multi Asset rows — extra "Kraken" tag
const LP_CURRENT_ROWS = Array.from({ length: 4 }, () => ({
  cell: [
    { chain: "ETH", title: "WBTC", tags: ["Active", "9summits", "Kraken"] },
    { title: "0.0109 wbtc", tag: "$1000" },
    { title: "3.3%",        tag: "1000 USD" },
    { title: "10k USD" },
  ],
}));

const LP_HISTORY_ROWS = Array.from({ length: 4 }, () => ({
  cell: [
    { chain: "ETH", title: "WBTC", tags: ["Active", "9summits", "Kraken"] },
    { title: "0.0109 wbtc", tag: "$1000" },
    { title: "3.3%",        tag: "1000 USD" },
    { title: "10k USD" },
  ],
}));

// ─── Component ────────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FarmSection = () => {
  const { isDark } = useTheme();
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [positionTab, setPositionTab] = useState("currentPositions");
  const [activeFilterType, setActiveFilterType] = useState("lending");

  const tableHeadings = useMemo(() => {
    let apyLabel = "Unrealised Supply APY";
    if (positionTab === "positionsHistory") {
      apyLabel = activeFilterType === "lp" ? "Earn Supply APY" : "Realised Supply APY";
    }
    const apyColumn = { id: "supply-apy", label: apyLabel, icon: true as const };
    return [BASE_TABLE_HEADINGS[0], BASE_TABLE_HEADINGS[1], apyColumn, BASE_TABLE_HEADINGS[2]];
  }, [positionTab, activeFilterType]);

  const tableRows = useMemo(() => {
    const isHistory = positionTab === "positionsHistory";
    const isLP = activeFilterType === "lp";
    if (isLP) return isHistory ? LP_HISTORY_ROWS : LP_CURRENT_ROWS;
    return isHistory ? LENDING_HISTORY_ROWS : LENDING_CURRENT_ROWS;
  }, [positionTab, activeFilterType]);

  return (
    <div className="w-full h-fit flex flex-col gap-[20px]">

      {/* Info + Chart row */}
      <div className="w-full flex gap-[20px] h-[475px]">

        {/* Farming Info panel */}
        <div className={`w-[422px] flex-shrink-0 flex flex-col gap-[20px] rounded-[16px] border-[1px] p-[20px] ${
          isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
        }`}>
          <h3 className={`text-[24px] font-bold flex-shrink-0 ${isDark ? "text-white" : "text-[#111]"}`}>
            Farming Info
          </h3>
          <div className="flex flex-col gap-[20px] overflow-y-auto">
            {FARMING_INFO_STATS.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className={`text-[16px] font-medium ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}>
                  {label}
                </span>
                <span className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart panel */}
        <div className={`flex-1 flex flex-col rounded-[20px] border-[1px] p-[20px] ${
          isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
        }`}>
          <div className={`flex-1 min-h-0 rounded-[20px] flex flex-col gap-[16px] p-[20px] ${
            isDark ? "bg-[#111111]" : "bg-white"
          }`}>
            {/* Filter tabs + All Time dropdown */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-[4px]">
                {CHART_FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveChartFilter(tab)}
                    className={`h-[40px] px-[12px] py-[8px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap ${
                      activeChartFilter === tab
                        ? "bg-[#fdebf8] text-[#e63abb]"
                        : isDark
                        ? "bg-transparent text-white hover:bg-[#333]"
                        : "bg-white text-[#111] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`h-[40px] pl-[8px] pr-[12px] flex items-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-semibold cursor-pointer transition ${
                  isDark
                    ? "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
                    : "bg-white border-[#e2e2e2] text-[#111] hover:bg-[#f7f7f7]"
                }`}
              >
                All Time
                <ChevronDown />
              </button>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
              <Chart
                type="net-profit-loss"
                containerHeight="h-full"
                containerWidth="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <Table
        heading={{
          heading: "Positions Table",
          tabsItems: POSITION_TABS,
          tabType: "solid",
        }}
        activeTab={positionTab}
        onTabChange={setPositionTab}
        filterTabTypeOptions={FILTER_TYPE_TABS}
        activeFilterTab={activeFilterType}
        onFilterTabTypeChange={setActiveFilterType}
        tableHeadings={tableHeadings}
        tableBody={{ rows: tableRows }}
        tableBodyBackground={isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"}
        filters={{ customizeDropdown: true, filters: ["All"] }}
      />
    </div>
  );
};
