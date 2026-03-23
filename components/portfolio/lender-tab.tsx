"use client";

import { useState } from "react";
import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { RewardsTable } from "@/components/earn/rewards-table";
import { Chart } from "@/components/earn/chart";
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

  return (
    <div className="w-full h-fit flex flex-col gap-[40px]">
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      {/* Top row: left stats/rewards + right P&L chart */}
      <div className="w-full h-fit flex gap-[24px]">
        {/* Left column */}
        <div className="w-[422px] flex-shrink-0 flex flex-col gap-[20px]">
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
          className={`flex-1 flex flex-col gap-[16px] rounded-[20px] border-[1px] p-[20px] ${
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
              <button
                type="button"
                className={`h-[40px] pl-[8px] pr-[12px] flex items-center justify-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-semibold whitespace-nowrap cursor-pointer ${
                  isDark
                    ? "bg-[#1a1a1a] border-[#333] text-white"
                    : "bg-white border-[#e2e2e2] text-[#111]"
                }`}
              >
                All Time
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className={`flex-1 min-h-0 rounded-[20px] ${isDark ? "bg-[#111111]" : "bg-white"}`}>
            <Chart
              type="net-profit-loss"
              containerHeight="h-full"
              containerWidth="w-full"
            />
          </div>
        </div>
      </div>

      {/* Positions table */}
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
  );
};
