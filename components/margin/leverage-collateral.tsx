"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LeverageAssetsTab } from "./leverage-assets-tab";
import { RepayLoanTab } from "./repay-loan-tab";

type Tabs = "Leverage your Assets" | "Repay Loan";

interface LeverageCollateralProps {
  switchToRepayTab?: boolean;
  onTabSwitched?: () => void;
}

export const LeverageCollateral = ({
  switchToRepayTab,
  onTabSwitched,
}: LeverageCollateralProps = {}) => {
  

  // Tab management states
  const [activeTab, setActiveTab] = useState<Tabs>("Leverage your Assets");
  const [hoveredTab, setHoveredTab] = useState<Tabs | null>(null);

  // Determine which tab to display (hovered or active)
  const displayTab = hoveredTab || activeTab;

  // Tab click handlers
  const handleLeverageTabClick = () => {
    setActiveTab("Leverage your Assets");
  };

  const handleRepayTabClick = () => {
    setActiveTab("Repay Loan");
  };

  // Handle external repay click trigger - change tab when repay is clicked
  useEffect(() => {
    if (switchToRepayTab) {
      setActiveTab("Repay Loan");
      if (onTabSwitched) {
        onTabSwitched();
      }
    }
  }, [switchToRepayTab, onTabSwitched]);

  const handleLeverageTabHover = () => {
    setHoveredTab("Leverage your Assets");
  };

  const handleRepayTabHover = () => {
    setHoveredTab("Repay Loan");
  };

  const handleTabHoverLeave = () => {
    setHoveredTab(null);
  };

  return (
    <motion.div
        className="flex flex-col justify-between rounded-[26px] bg-[#F7F7F7] border-[1px] border-[#E2E2E2] py-[36px] px-[16px] min-w-[691px] h-full"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Tab switcher container */}
        <motion.div
          className="w-full bg-white flex p-[6px] rounded-[16px] h-[79px] relative overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated tab indicator background */}
          <motion.div
            className="absolute top-[6px] left-[6px] h-[67px] rounded-[16px] bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px]"
            style={{ width: "calc(50% - 6px)" }}
            initial={false}
            animate={{
              x: displayTab === "Leverage your Assets" ? 0 : "100%",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
            }}
          >
            <div className="bg-white rounded-[14px] h-full w-full" />
          </motion.div>

          {/* Leverage your Assets tab */}
          <motion.div
            onClick={handleLeverageTabClick}
            onMouseEnter={handleLeverageTabHover}
            onMouseLeave={handleTabHoverLeave}
            className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
            animate={{
              color:
                hoveredTab === "Leverage your Assets" ||
                activeTab === "Leverage your Assets"
                  ? "#000000"
                  : "#64748b",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            Leverage your Assets
          </motion.div>

          {/* Repay Loan tab */}
          <motion.div
            onClick={handleRepayTabClick}
            onMouseEnter={handleRepayTabHover}
            onMouseLeave={handleTabHoverLeave}
            className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
            animate={{
              color:
                hoveredTab === "Repay Loan" || activeTab === "Repay Loan"
                  ? "#000000"
                  : "#64748b",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            Repay Loan
          </motion.div>
        </motion.div>

        {/* Tab content: Leverage your Assets */}
        {activeTab === "Leverage your Assets" && (
          <LeverageAssetsTab hasMarginAccount={true} />
        )}

        {/* Tab content: Repay Loan */}
        {activeTab === "Repay Loan" && <RepayLoanTab />}
      </motion.div>
  );
};
