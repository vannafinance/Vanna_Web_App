"use client";

import { useState, useMemo, useCallback } from "react";
import { ReusableChart } from "@/components/ui/reusable-chart";
import { Table } from "@/components/earn/table";
import { useTheme } from "@/contexts/theme-context";
import { farmTableHeadings } from "@/lib/constants/farm";

// ─── Constants ───────────────────────────────────────────────────────────────

const FARMING_INFO_STATS = [
  { label: "Your Total Asset Supplied\nto Farm(USD)",             value: "$123,122",  positive: null  },
  { label: "Overall Farm TVL(USD)",                               value: "$150,712",  positive: null  },
  { label: "Percentage of Your Margin\nAllocated to Farm(%)",     value: "-29.06%",   positive: false },
  { label: "Unrealised P&L",                                     value: "-$8.31",    positive: false },
  { label: "Realised P&L",                                       value: "$72.02",    positive: true  },
  { label: "Farm Volume",                                        value: "$72.02",    positive: null  },
] as const;

const CHART_FILTER_TABS = ["Total Equity", "Cumulative PnL", "PnL", "Return Percentage"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FarmSection = () => {
  const { isDark } = useTheme();
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string>("current-position");

  const filterTabTypeOptions = [
    { id: "current-position", label: "Current Position" },
    { id: "position-history", label: "Position History" },
  ];

  // Get table headings based on filter (LP vs Single Asset style)
  const tableData = useMemo(() => {
    // Positions table - using farm table structure but with empty rows for now
    return {
      headings: farmTableHeadings,
      body: { rows: [] },
    };
  }, []);

  const handleFilterTabChange = useCallback((tabId: string) => {
    setActiveFilterTab(tabId);
  }, []);

  return (
    <div className="w-full h-fit flex flex-col gap-[20px]">

      {/* Info + Chart row */}
      <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-[20px] lg:h-[475px]">

        {/* Farming Info panel */}
        <div className={`w-full lg:w-[422px] flex-shrink-0 flex flex-col gap-[20px] rounded-[16px] border-[1px] p-4 sm:p-[20px] ${
          isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
        }`}>
          <h3 className={`text-[24px] font-bold flex-shrink-0 ${isDark ? "text-white" : "text-[#111]"}`}>
            Farming Info
          </h3>
          <div className="flex flex-col gap-[20px] overflow-y-auto">
            {FARMING_INFO_STATS.map(({ label, value, positive }) => (
              <div key={label} className="flex justify-between items-center gap-[16px]">
                <span className={`text-[16px] font-medium leading-[24px] whitespace-pre-line ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}>
                  {label}
                </span>
                <span className={`text-[16px] font-semibold leading-[24px] whitespace-nowrap ${
                  positive === true
                    ? "text-[#32e2ee]"
                    : positive === false
                    ? "text-[#fc5457]"
                    : isDark ? "text-white" : "text-[#111]"
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart panel */}
        <div className={`flex-1 min-w-0 flex flex-col rounded-[16px] sm:rounded-[20px] border-[1px] p-3 sm:p-[20px] ${
          isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
        }`}>
          <div className={`flex-1 min-h-0 rounded-[16px] sm:rounded-[20px] flex flex-col gap-3 sm:gap-[16px] p-3 sm:p-[20px] ${
            isDark ? "bg-[#111111]" : "bg-white"
          }`}>
            {/* Filter tabs + All Time dropdown */}
            <div className="flex items-center justify-between flex-shrink-0 gap-2">
              <div className="flex items-center gap-[4px] flex-wrap">
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className={`h-[40px] pl-[8px] pr-[12px] flex items-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-semibold cursor-pointer transition ${
                    isDark
                      ? "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
                      : "bg-white border-[#e2e2e2] text-[#111] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {timeFilter}
                  <ChevronDown />
                </button>
                {isTimeDropdownOpen && (
                  <div className={`absolute right-0 top-[44px] z-10 rounded-[8px] border-[1px] py-[4px] min-w-[120px] ${
                    isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-[#e2e2e2]"
                  }`}>
                    {["All Time", "3 Months", "6 Months", "1 Year"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => { setTimeFilter(f); setIsTimeDropdownOpen(false); }}
                        className={`w-full text-left px-[12px] py-[6px] text-[12px] font-medium cursor-pointer transition ${
                          f === timeFilter
                            ? "text-[#703ae6]"
                            : isDark
                              ? "text-white hover:bg-[#333]"
                              : "text-[#111] hover:bg-[#f7f7f7]"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ReusableChart
                data={{
                  "2025-10-01": 1200,
                  "2025-10-05": 1350,
                  "2025-10-10": 1280,
                  "2025-10-15": 1100,
                  "2025-10-18": 700,
                  "2025-10-20": 2800,
                  "2025-10-22": 2500,
                  "2025-10-25": 2200,
                  "2025-10-28": 2000,
                  "2025-10-30": 2100,
                  "2025-11-01": 2300,
                  "2025-11-03": 2200,
                }}
                gradientColors={["rgba(34, 197, 94, 0.25)", "rgba(34, 197, 94, 0.02)"]}
                lineColor="#22c55e"
                height={320}
                showGrid={false}
                textColor={isDark ? "#919191" : "#5c5b5b"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table only – no Vaults tab */}
      <Table
        filterDropdownPosition="left"
        heading={{
          heading: "Positions Table",
          tabType: "solid",
        }}
        filters={{
          allChainDropdown: true,
          filters: [],
          filterTabType: "solid",
        }}
        filterTabTypeOptions={filterTabTypeOptions}
        activeFilterTab={activeFilterTab}
        onFilterTabTypeChange={handleFilterTabChange}
        tableHeadings={tableData.headings}
        tableBody={tableData.body}
      />
    </div>
  );
};
