"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LeverageAssetsTab } from "./leverage-assets-tab";
import { RepayLoanTab } from "./repay-loan-tab";
import { TransferCollateral } from "./transfer-collateral";

type Tabs = "Leverage your Assets" | "Repay Loan" | "Transfer Collateral";

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

  // Calculate tab index for animation (0, 1, or 2)
  const getTabIndex = (tab: Tabs): number => {
    if (tab === "Leverage your Assets") return 0;
    if (tab === "Repay Loan") return 1;
    return 2;
  };

  const currentIndex = getTabIndex(displayTab);

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

  const handleTransferCollateralTabClick = () => {
    setActiveTab("Transfer Collateral");
  };

  const handleTransferCollateralTabHover = () => {
    setHoveredTab("Transfer Collateral");
  };

  const handleLeverageTabHover = () => {
    setHoveredTab("Leverage your Assets");
  };

  const handleRepayTabHover = () => {
    setHoveredTab("Repay Loan");
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
      <div
        className="border-[1px] border-[#E2E2E2] w-full bg-white flex p-[6px] rounded-[16px] h-[79px] relative overflow-hidden"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Animated tab indicator background */}
        <motion.div
          className="absolute top-[6px] left-[6px] h-[67px] rounded-[16px] bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px]"
          style={{
            width: "calc((100% - 12px) / 3)",
          }}
          animate={{
            x: `${currentIndex * 100}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
        >
          <div className="bg-white rounded-[14px] h-full w-full" />
        </motion.div>

        {/* Leverage your Assets tab */}
        <motion.div
          onClick={handleLeverageTabClick}
          onMouseEnter={handleLeverageTabHover}
          className="hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
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
          className="hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
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
        {/* Transfer Collateral tab */}
        <motion.div
          onClick={handleTransferCollateralTabClick}
          onMouseEnter={handleTransferCollateralTabHover}
          className="hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
          animate={{
            color:
              hoveredTab === "Transfer Collateral" ||
              activeTab === "Transfer Collateral"
                ? "#000000"
                : "#64748b",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          Transfer Collateral
        </motion.div>
      </div>

      {/* Tab content: Leverage your Assets */}
      {activeTab === "Leverage your Assets" && (
        <LeverageAssetsTab hasMarginAccount={true} />
      )}

      {/* Tab content: Repay Loan */}
      {activeTab === "Repay Loan" && <RepayLoanTab />}
      {activeTab === "Transfer Collateral" && <TransferCollateral />}
    </motion.div>
  );
};
