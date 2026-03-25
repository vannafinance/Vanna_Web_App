"use client";

import { useState } from "react";
import { ReusableChart } from "@/components/ui/reusable-chart";
import { useTheme } from "@/contexts/theme-context";
import PositionTables from "@/components/perps/position-tables";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERPS_INFO_STATS = [
  { label: "Perps Margin Allocated(USD)",  value: "$123,122" },
  { label: "Perps Margin Allocated(%)",    value: "$150,712" },
  { label: "Perp Margin Ratio(%)",         value: "-29.06%"  },
  { label: "Perp Maintenance Margin(USD)", value: "-$8.31"   },
  { label: "Unrealised P&L(USD)",          value: "$72.02"   },
  { label: "Realised P&L(USD)",            value: "$2.20"    },
  { label: "Perps Trading Volume(USD)",    value: "$2.20"    },
] as const;

const CHART_FILTER_TABS = [
  "Total Equity",
  "Cumulative PnL",
  "PnL",
  "Return Percentage",
] as const;

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const PerpsSection = () => {
  const { isDark } = useTheme();
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-[20px]">

      {/* ── Top row: Perps Info + Chart ── */}
      <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-[20px] lg:h-[475px]">

        {/* Perps Info panel */}
        <div
          className={`w-full lg:w-[422px] flex-shrink-0 flex flex-col gap-[20px] rounded-[16px] border-[1px] p-4 sm:p-[20px] ${
            isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
          }`}
        >
          <h3
            className={`text-[24px] font-bold flex-shrink-0 leading-[36px] ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            Perps Info
          </h3>

          <div className="flex flex-col gap-[20px] overflow-y-auto">
            {PERPS_INFO_STATS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span
                  className={`text-[16px] font-medium ${
                    isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`text-[16px] font-semibold ${
                    isDark ? "text-white" : "text-[#111]"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart panel */}
        <div
          className={`flex-1 min-w-0 flex flex-col rounded-[16px] sm:rounded-[20px] border-[1px] p-3 sm:p-[20px] ${
            isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
          }`}
        >
          <div
            className={`flex-1 min-h-0 rounded-[16px] sm:rounded-[20px] flex flex-col gap-3 sm:gap-[16px] p-3 sm:p-[20px] ${
              isDark ? "bg-[#111111]" : "bg-white"
            }`}
          >
            {/* Chart filter tabs + All Time dropdown */}
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

      {/* ── Positions Table (reused from perps page) ── */}
      <PositionTables />
    </div>
  );
};
