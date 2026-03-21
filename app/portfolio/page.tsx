"use client";

import { Lender } from "@/components/portfolio/lender";
import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { motion } from "framer-motion";

export default function PortfolioPage() {
  const { isDark } = useTheme();
  const tabs = [
    { id: "lender", label: "Lender" },
    { id: "trader", label: "Trader" },
  ];
  const [activeTab, setActiveTab] = useState<string>("lender");

  return (
    <div className="py-5 sm:py-10 lg:py-[80px] px-4 sm:px-8 lg:px-[40px] w-full h-fit">
      <div className="flex flex-col gap-5 sm:gap-[40px] w-full h-fit">
        {/* Header section */}
        <motion.div
          className="flex flex-col gap-4 sm:gap-[20px] w-full h-fit"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3 sm:items-center">
            <div className="flex items-center gap-3">
              <div className="w-1 h-[24px] sm:hidden rounded-full bg-[#703AE6]" />
              <h1 className={`text-[22px] sm:text-[24px] font-bold ${isDark ? "text-white" : "text-black"}`}>
                Portfolio
              </h1>
            </div>
            <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-[8px] sm:justify-end">
              <Button text="Deposit" size="small" type="solid" disabled={false} />
              <Button text="Withdraw" size="small" type="ghost" disabled={false} />
              <Button text="Transfer" size="small" type="ghost" disabled={false} />
              <Button text="History" size="small" type="ghost" disabled={false} />
            </div>
          </div>

          <PortfolioSection />
        </motion.div>

        {/* Tabs section */}
        <motion.div
          className="w-full h-fit flex flex-col gap-5 sm:gap-[24px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AnimatedTabs
            type="underline"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabClassName="w-auto sm:w-[120px] h-[38px] sm:h-[40px] text-[13px] sm:text-[16px]"
            containerClassName="w-full"
          />
          {activeTab === "lender" && <Lender />}
          {activeTab === "trader" && (
            <div className={`text-center py-12 text-[14px] ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
              Coming soon
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}