"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LeverageAssetsTab } from "./leverage-assets-tab";
import { RepayLoanTab } from "./repay-loan-tab";
import { TransferCollateral } from "./transfer-collateral";
import { AnimatedTabs, TabItem } from "../ui/animated-tabs";

interface LeverageCollateralProps {
  switchToRepayTab?: boolean;
  onTabSwitched?: () => void;
}

export const LeverageCollateral = ({
  switchToRepayTab,
  onTabSwitched,
}: LeverageCollateralProps = {}) => {
  const [externalTabId, setExternalTabId] = useState<string | undefined>();

  // Handle external repay click trigger - change tab when repay is clicked
  useEffect(() => {
    if (switchToRepayTab) {
      setExternalTabId("repay-loan");
      if (onTabSwitched) {
        onTabSwitched();
      }
    }
  }, [switchToRepayTab, onTabSwitched]);

  // Define tabs configuration
  const tabs: TabItem[] = [
    {
      id: "leverage-assets",
      label: "Leverage your Assets",
      content: <LeverageAssetsTab hasMarginAccount={true} />,
    },
    {
      id: "repay-loan",
      label: "Repay Loan",
      content: <RepayLoanTab />,
    },
    {
      id: "transfer-collateral",
      label: "Transfer Collateral",
      content: <TransferCollateral />,
    },
  ];

  return (
    <motion.div
      className="flex flex-col justify-between rounded-[26px] bg-[#F7F7F7] border-[1px] border-[#E2E2E2] py-[36px] px-[16px] min-w-[691px] h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimatedTabs
        tabs={tabs}
        defaultTabId="leverage-assets"
        externalTabId={externalTabId}
        onTabChange={(tabId) => {
          // Reset external tab control after switching
          if (externalTabId && tabId === externalTabId) {
            setExternalTabId(undefined);
          }
        }}
      />
    </motion.div>
  );
};
