"use client";

import { useState, useRef, useEffect } from "react";
import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { RewardsTable } from "@/components/earn/rewards-table";
import { ReusableChart } from "@/components/ui/reusable-chart";
import { Table } from "@/components/earn/table";
import { CalendarModal } from "@/components/portfolio/calendar-modal";
import { useTheme } from "@/contexts/theme-context";

const LENDER_MINI_STATS = [
  { id: "1", name: "Total Holdings", amount: "$1000" },
  { id: "2", name: "Due Amount", amount: "$100" },
  { id: "3", name: "Net Returns (USD)", amount: "$10" },
  { id: "4", name: "Net Returns (%)", amount: "10%" },
];

const POSITION_TABS = [
  { id: "current-positions", label: "Current Positions" },
  { id: "positions-history", label: "Positions History" },
];

const TABLE_HEADINGS = [
  { id: "pool", label: "Pool" },
  { id: "amount-supplied", label: "Amount Supplied", icon: true },
  { id: "earn-supply-apy", label: "Earn Supply APY", icon: true },
  { id: "transaction-history", label: "Transaction History", icon: true },
];

const TABLE_ROWS = Array.from({ length: 4 }, (_, i) => ({
  cell: [
    { chain: "ETH", title: "WBTC", tag: "Active" },
    { title: "0.0109 wbtc", tag: "$1000" },
    { title: "3.3%", tag: "1000 USD" },
    { title: "10k USD" },
  ],
}));

export const LenderTab = () => {
  const { isDark } = useTheme();
  const [positionTab, setPositionTab] = useState("current-positions");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(300);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setChartHeight(Math.floor(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="w-full h-fit flex flex-col gap-6 sm:gap-8 lg:gap-[40px]">
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      {/* Top row: left stats/rewards + right P&L chart */}
      <div className="w-full h-fit flex flex-col lg:flex-row gap-4 lg:gap-[24px]">
        {/* Left column */}
        <div className="w-full lg:w-[422px] flex-shrink-0 flex flex-col gap-4 sm:gap-[20px]">
          {/* Mini stats 2x2 */}
          <AccountStatsGhost
            items={LENDER_MINI_STATS}
            type="background"
            gridCols="grid-cols-2"
            gridRows="grid-rows-2"
          />

          {/* Rewards table */}
          <RewardsTable />
        </div>

        {/* Right column: P&L chart */}
        <div
          className={`flex-1 min-w-0 flex flex-col gap-3 sm:gap-[16px] rounded-[16px] sm:rounded-[20px] border-[1px] p-3 sm:p-[20px] ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
        >
          {/* Chart header: labels + action buttons */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex flex-col gap-[4px]">
              <span className="text-[14px] font-semibold text-[#a7a7a7]">Total Value</span>
              <span className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`}>P&L</span>
            </div>
            <div className="flex items-center gap-[8px]">
              {/* Calendar button */}
              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className={`h-[40px] px-[12px] pl-[8px] flex items-center justify-center rounded-[8px] border-[1px] text-[12px] font-semibold whitespace-nowrap cursor-pointer transition ${
                  isDark
                    ? "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
                    : "bg-white border-[#e2e2e2] text-[#111] hover:bg-[#f7f7f7]"
                }`}
              >
                Calendar
              </button>
              {/* All Time dropdown button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className={`h-[40px] pl-[8px] pr-[12px] flex items-center justify-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-semibold whitespace-nowrap cursor-pointer ${
                    isDark
                      ? "bg-[#1a1a1a] border-[#333] text-white"
                      : "bg-white border-[#e2e2e2] text-[#111]"
                  }`}
                >
                  {timeFilter}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
          </div>

          {/* Chart */}
          <div ref={chartContainerRef} className={`flex-1 min-h-0 rounded-[20px] overflow-hidden ${isDark ? "bg-[#111111]" : "bg-white"}`}>
            <ReusableChart
              data={{
                "2025-10-01": 1200,
                "2025-10-05": 1250,
                "2025-10-10": 1180,
                "2025-10-15": 1100,
                "2025-10-18": 800,
                "2025-10-20": 2800,
                "2025-10-22": 2500,
                "2025-10-25": 2200,
                "2025-10-28": 2000,
                "2025-10-30": 2100,
                "2025-11-01": 2300,
                "2025-11-03": 2200,
              }}
              gradientColors={["rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0.01)"]}
              lineColor="#22c55e"
              height={chartHeight}
              showGrid={false}
              textColor={isDark ? "#919191" : "#5c5b5b"}
            />
          </div>
        </div>
      </div>

      {/* Positions table */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[580px]">
          <Table
            heading={{
              heading: "Positions Table",
              tabsItems: POSITION_TABS,
              tabType: "solid",
            }}
            activeTab={positionTab}
            onTabChange={setPositionTab}
            tableHeadings={TABLE_HEADINGS}
            tableBody={{ rows: TABLE_ROWS }}
            tableBodyBackground={isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"}
            filters={{ customizeDropdown: true, filters: ["All"] }}
          />
        </div>
      </div>
    </div>
  );
};
