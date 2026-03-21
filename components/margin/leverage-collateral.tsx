"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LeverageAssetsTab } from "./leverage-assets-tab";
import { RepayLoanTab } from "./repay-loan-tab";
import { TransferCollateral } from "./transfer-collateral";
import { AnimatedTabs, TabItem } from "../ui/animated-tabs";
import { LEVERAGE_TABS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";

interface LeverageCollateralProps {
  switchToRepayTab?: boolean;
  onTabSwitched?: () => void;
}

export const LeverageCollateral = ({
  switchToRepayTab,
  onTabSwitched,
}: LeverageCollateralProps = {}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("leverage-assets");

  // Handle external repay click trigger - change tab when repay is clicked
  useEffect(() => {
    if (switchToRepayTab) {
      setActiveTab("repay-loan");
      if (onTabSwitched) {
        onTabSwitched();
      }
    }
  }, [switchToRepayTab, onTabSwitched]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Use tabs from constants
  const tabs: TabItem[] = [...LEVERAGE_TABS] as TabItem[];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "leverage-assets":
        return <LeverageAssetsTab />;
      case "repay-loan":
        return <RepayLoanTab />;
      case "transfer-collateral":
        return <TransferCollateral />;
      default:
        return <LeverageAssetsTab />;
    }
  };

  return (
    <motion.section
      className={`flex flex-col justify-between rounded-[26px] border-[1px] py-[36px] px-[16px] min-w-[691px] h-full ${
        isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <nav>
        <AnimatedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          type="gradient"
        />
      </nav>
      {/* Tab content */}
      <section className="mt-6">{renderContent()}</section>
    </motion.section>
  );
};
