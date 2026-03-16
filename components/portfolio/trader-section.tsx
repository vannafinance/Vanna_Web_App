"use client";

import { useState } from "react";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { useTheme } from "@/contexts/theme-context";
import { PortfolioSection } from "./portfolio-section";

const TRADER_TABS = [
  { id: "margin", label: "Margin" },
  { id: "spot", label: "Spot" },
  { id: "perps", label: "Perps" },
  { id: "options", label: "Options" },
  { id: "farm", label: "Farm" },
];

export const TraderSection = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("margin");

  return (
    <div className="flex flex-col gap-[24px]">
      <nav>
        <AnimatedTabs
          type="solid"
          tabs={TRADER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </nav>

      {activeTab === "margin" && <PortfolioSection />}

      {activeTab !== "margin" && (
        <div
          className={`w-full h-[200px] flex items-center justify-center rounded-[16px] border-[1px] ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
        >
          <p
            className={`text-[14px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}
          >
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} — Coming
            Soon
          </p>
        </div>
      )}
    </div>
  );
};
