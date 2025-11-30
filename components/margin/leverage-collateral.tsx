"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Dialogue } from "@/components/ui/dialogue";
import { LeverageAssetsTab } from "./leverage-assets-tab";
import { RepayLoanTab } from "./repay-loan-tab";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { Collaterals, BorrowInfo } from "@/lib/types";

type Tabs = "Leverage your Assets" | "Repay Loan";

export const LeverageCollateral = () => {
  // Repay loan statistics
  const [repayStats, setRepayStats] = useState({
    netOutstandingAmountToPay: 0,
    availableBalance: 0,
    frozenBalance: 0,
  });

  // Tab management states
  const [activeTab, setActiveTab] = useState<Tabs>("Leverage your Assets");
  const [hoveredTab, setHoveredTab] = useState<Tabs | null>(null);

  // Dialogue visibility states
  const [isCreateMarginDialogueOpen, setIsCreateMarginDialogueOpen] =
    useState(false);
  const [isSecondDialogueOpen, setIsSecondDialogueOpen] = useState(false);

  // Calculation states for details panel
  const [platformPoints, setPlatformPoints] = useState(0);
  const [vannaPoints, setVannaPoints] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState("USDT");
  const [fees, setFees] = useState(0);
  const [feesCurrency, setFeesCurrency] = useState("USDT");
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [updatedCollateral, setUpdatedCollateral] = useState(0);
  const [netHealthFactor, setNetHealthFactor] = useState(0);
  const [leverage, setLeverage] = useState(0);

  // Local state to collect data from child component
  const [currentCollaterals, setCurrentCollaterals] = useState<Collaterals[]>(
    []
  );
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>(
    []
  );

  // Determine which tab to display (hovered or active)
  const displayTab = hoveredTab || activeTab;

  // Get set function from store using selector to prevent unnecessary re-renders
  const set = useCollateralBorrowStore((state) => state.set);

  // Handle create margin account button click
  // Updates global store and opens first dialogue
  const handleButtonClick = () => {
    set({
      collaterals: currentCollaterals,
      borrowItems: currentBorrowItems,
    });
    setIsCreateMarginDialogueOpen(true);
  };

  // Receive updated data from LeverageAssetsTab
  const handleDataChange = (data: {
    collaterals: Collaterals[];
    borrowItems: BorrowInfo[];
  }) => {
    setCurrentCollaterals(data.collaterals);
    setCurrentBorrowItems(data.borrowItems);
  };

  // Tab click handlers
  const handleLeverageTabClick = () => {
    setActiveTab("Leverage your Assets");
  };

  const handleRepayTabClick = () => {
    setActiveTab("Repay Loan");
  };

  const handleLeverageTabHover = () => {
    setHoveredTab("Leverage your Assets");
  };

  const handleRepayTabHover = () => {
    setHoveredTab("Repay Loan");
  };

  const handleTabHoverLeave = () => {
    setHoveredTab(null);
  };

  // Dialogue handlers
  const handleCloseFirstDialogue = () => {
    setIsCreateMarginDialogueOpen(false);
  };

  const handleCloseSecondDialogue = () => {
    setIsSecondDialogueOpen(false);
  };

  const handleFirstDialogueButtonClick = () => {
    setIsCreateMarginDialogueOpen(false);
    setIsSecondDialogueOpen(true);
  };

  // Calculate all derived values based on leverage and deposit
  useEffect(() => {
    // Platform points: leverage * 0.575
    const calculatedPlatformPoints = leverage * 0.575;
    setPlatformPoints(Number(calculatedPlatformPoints.toFixed(1)));

    // Vanna points: same as leverage
    const calculatedVannaPoints = leverage;
    setVannaPoints(Number(calculatedVannaPoints.toFixed(1)));

    // Updated collateral: deposit * leverage * 0.6
    const calculatedCollateral = depositAmount * leverage * 0.6;
    setUpdatedCollateral(Math.round(calculatedCollateral));

    // Net health factor: 2.0 - leverage * 0.0875
    const calculatedHealthFactor = 2.0 - leverage * 0.0875;
    setNetHealthFactor(Number(calculatedHealthFactor.toFixed(2)));

    // Fees: deposit * 0.000234 (if deposit > 0)
    const calculatedFees = depositAmount > 0 ? depositAmount * 0.000234 : 0;
    setFees(calculatedFees);
  }, [leverage, depositAmount]);

  return (
    <>
      {/* Main container */}
      <motion.div
        className="flex flex-col justify-between rounded-[26px] bg-[#E2E2E2] py-[36px] px-[16px] min-w-[691px] h-full"
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
          <LeverageAssetsTab
            onCreateMarginAccount={handleButtonClick}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            depositCurrency={depositCurrency}
            setDepositCurrency={setDepositCurrency}
            totalDeposit={totalDeposit}
            setTotalDeposit={setTotalDeposit}
            leverage={leverage}
            setLeverage={setLeverage}
            platformPoints={platformPoints}
            vannaPoints={vannaPoints}
            fees={fees}
            feesCurrency={feesCurrency}
            updatedCollateral={updatedCollateral}
            netHealthFactor={netHealthFactor}
            onDataChange={handleDataChange}
          />
        )}

        {/* Tab content: Repay Loan */}
        {activeTab === "Repay Loan" && <RepayLoanTab repayStats={repayStats} />}
      </motion.div>

      {/* First dialogue: Create Margin Account */}
      <AnimatePresence>
        {isCreateMarginDialogueOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseFirstDialogue}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                buttonOnClick={handleFirstDialogueButtonClick}
                buttonText="Create Your Account"
                content={[
                  { line: "Connect your wallet to get started." },
                  {
                    line: "Confirm your Margin Account we will generate a unique address for you.",
                  },
                  { line: "Make a deposit to activate borrowing." },
                ]}
                heading="Create Margin Account"
                onClose={handleCloseFirstDialogue}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second dialogue: Review and Sign Agreement */}
      <AnimatePresence>
        {isSecondDialogueOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseSecondDialogue}
          >
            <motion.div
              className="w-full max-w-[891px]"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                description="Before you proceed, please review and accept the terms of borrowing on VANNA. This agreement ensures you understand the risks, responsibilities, and conditions associated with using the platform."
                buttonOnClick={handleCloseSecondDialogue}
                buttonText="Sign Agreement"
                content={[
                  {
                    line: "Collateral Requirement",
                    points: [
                      "All borrowed positions must remain fully collateralized.",
                      "If collateral value falls below the liquidation threshold, your position may be liquidated.",
                    ],
                  },
                  {
                    line: "Borrow Limits & Leverage",
                    points: [
                      "You may only borrow assets up to the maximum Loan-to-Value (LTV) allowed.",
                      "Leverage is enabled only when collateral value supports it.",
                    ],
                  },
                  {
                    line: "Interest & Fees",
                    points: [
                      "Interest rates are variable and accrue in real time.",
                      "Additional protocol fees may apply for borrowing or liquidation events.",
                    ],
                  },
                  {
                    line: "Liquidation Risk",
                    points: [
                      "Market volatility can reduce collateral value.",
                      "If your position health factor drops below safe limits, collateral may be partially or fully liquidated without prior notice.",
                    ],
                  },
                  {
                    line: "User Responsibility",
                    points: [
                      "You are responsible for monitoring your positions, balances, and risks.",
                      "VANNA is a non-custodial protocol; all actions are initiated by your wallet.",
                    ],
                  },
                  {
                    line: "No Guarantee of Returns",
                    points: [
                      "Using borrowed assets in trading, farming, or external protocols involves risk.",
                      "VANNA does not guarantee profits or protection against losses.",
                    ],
                  },
                ]}
                heading="Review and Sign Agreement"
                checkboxContent="I have read and agree to the VANNA Borrow Agreement."
                onClose={handleCloseSecondDialogue}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
