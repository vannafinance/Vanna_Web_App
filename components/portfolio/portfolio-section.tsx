"use client";

import { useState, useMemo, useCallback } from "react";
import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "../ui/button";
import { AccountStats } from "../margin/account-stats";
import { ReusableChart } from "../ui/reusable-chart";
import { AnimatedTabs } from "../ui/animated-tabs";
import { PORTFOLIO_STATS_ITEMS } from "@/lib/constants/portfolio";
import { LenderTab } from "./lender-tab";
import { TraderTab } from "./trader-tab";

const PORTFOLIO_TABS = [
  { id: "lender", label: "Lender" },
  { id: "trader", label: "Trader" },
];

const TIME_FILTERS = ["3 months", "6 months", "1 year"] as const;

// Mock data for portfolio charts
const MOCK_EARNINGS_DATA: Record<string, number> = {
  "2025-10-29": 1800,
  "2025-10-30": 1900,
  "2025-10-31": 2000,
  "2025-11-01": 2050,
  "2025-11-02": 2100,
};

const MOCK_VOLUME_DATA: Record<string, number> = {
  "2025-10-29": 1800,
  "2025-10-30": 1900,
  "2025-10-31": 2000,
  "2025-11-01": 2050,
  "2025-11-02": 2100,
};

interface PortfolioChartCardProps {
  title: string;
  value: string;
  data: Record<string, number>;
  isDark: boolean;
}

const PortfolioChartCard = ({
  title,
  value,
  data,
  isDark,
}: PortfolioChartCardProps) => {
  const [timeFilter, setTimeFilter] = useState<string>(TIME_FILTERS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatYAxisLabel = useCallback((val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k USD`;
    return `${val} USD`;
  }, []);

  const chartColors: [string, string] = useMemo(
    () => ["rgba(34, 197, 94, 0.15)", "rgba(34, 197, 94, 0.01)"],
    [],
  );

  return (
    <div
      className={`w-full min-w-0 rounded-[16px] border-[1px] p-[20px] flex flex-col gap-[8px] ${
        isDark ? "bg-[#111111] border-[#333]" : "bg-white border-[#e2e2e2]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-[13px] font-medium ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}
          >
            {title}
          </p>
          <p
            className={`text-[22px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}
          >
            {value}
          </p>
        </div>
        {/* Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`h-[34px] px-[12px] rounded-[8px] border-[1px] text-[12px] font-medium cursor-pointer flex items-center gap-[6px] ${
              isDark
                ? "bg-[#1a1a1a] border-[#333] text-white"
                : "bg-white border-[#e2e2e2] text-[#111]"
            }`}
          >
            {timeFilter}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path
                d="M1 1L5 5L9 1"
                stroke={isDark ? "#fff" : "#111"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isDropdownOpen && (
            <div
              className={`absolute right-0 top-[38px] z-10 rounded-[8px] border-[1px] py-[4px] min-w-[120px] ${
                isDark
                  ? "bg-[#1a1a1a] border-[#333]"
                  : "bg-white border-[#e2e2e2]"
              }`}
            >
              {TIME_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setTimeFilter(f);
                    setIsDropdownOpen(false);
                  }}
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
      <div className="w-full min-w-0 overflow-hidden">
        <ReusableChart
          data={data}
          gradientColors={chartColors}
          lineColor="#22c55e"
          height={220}
          showGrid={false}
          formatYAxisLabel={formatYAxisLabel}
          textColor={isDark ? "#919191" : "#5c5b5b"}
        />
      </div>
    </div>
  );
};

export const PortfolioSection = () => {
  const userAddress = useUserStore((user) => user.address);
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("lender");

  const statsValues = {
    totalPortfolioBalance: userAddress ? 1000 : "-",
    netAvailableCollateral: userAddress ? 1000 : "-",
    marginAccountBalance: userAddress ? 600 : "-",
    availablePortfolioBalance: userAddress ? 600 : "-",
  };

  return (
    <div className="w-full h-fit flex flex-col gap-[20px]">
      {/* Stats grid 2x2 */}
      <AccountStats
        gridCols="grid-cols-1 sm:grid-cols-2"
        items={PORTFOLIO_STATS_ITEMS}
        values={statsValues}
      />

      {/* Charts row */}
      <div className="w-full h-fit flex flex-col md:flex-row gap-4 md:gap-[24px]">
        <PortfolioChartCard
          title="Net Earnings"
          value="$ 2000 USD"
          data={MOCK_EARNINGS_DATA}
          isDark={isDark}
        />
        <PortfolioChartCard
          title="Net Volume"
          value="$ 2000 USD"
          data={MOCK_VOLUME_DATA}
          isDark={isDark}
        />
      </div>

      {/* Tabs */}
      <div className="w-full h-fit flex flex-col">
        <AnimatedTabs
          type="underline"
          tabs={PORTFOLIO_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          containerClassName="w-fit "
          tabClassName="h-[48px] sm:h-[56px] text-[13px] sm:text-[14px] w-[100px] sm:w-[120px]"
        />

        {/* Tab content */}
        {!userAddress ? (
          <div
            className={`w-full h-[260px] rounded-b-[20px] flex items-center justify-center ${
              isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
            }`}
          >
            <div className="w-[70px]">
              <Button text="Login" size="small" type="solid" disabled={false} />
            </div>
          </div>
        ) : (
          <div className="w-full h-fit pt-4 sm:pt-[24px]">
            {activeTab === "lender" && <LenderTab />}
            {activeTab === "trader" && <TraderTab />}
          </div>
        )}
      </div>
    </div>
  );
};
