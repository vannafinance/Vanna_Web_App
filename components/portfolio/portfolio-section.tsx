"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "../ui/button";
import { AccountStats } from "../margin/account-stats";
import { Chart } from "../earn/chart";
import { AnimatedTabs } from "../ui/animated-tabs";
import { PORTFOLIO_STATS_ITEMS } from "@/lib/constants/portfolio";
import { LenderTab } from "./lender-tab";
import { TraderTab } from "./trader-tab";

const PORTFOLIO_TABS = [
  { id: "lender", label: "Lender" },
  { id: "trader", label: "Trader" },
];

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
        gridCols="grid-cols-2"
        items={PORTFOLIO_STATS_ITEMS}
        values={statsValues}
      />

      {/* Charts row */}
      <div className="w-full h-fit flex gap-[24px]">
        <Chart
          type="net-profit-loss"
          containerHeight="h-[331px]"
          containerWidth="w-full"
        />
        <Chart
          type="net-volume"
          containerHeight="h-[331px]"
          containerWidth="w-full"
        />
      </div>

      {/* Tabs */}
      <div className="w-full h-fit flex flex-col">
        <AnimatedTabs
          type="underline"
          tabs={PORTFOLIO_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          containerClassName="w-full border-b-[1px]"
          tabClassName="h-[56px] text-[14px] w-[120px]"
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
          <div className="w-full h-fit pt-[24px]">
            {activeTab === "lender" && <LenderTab />}
            {activeTab === "trader" && <TraderTab />}
          </div>
        )}
      </div>
    </div>
  );
};
