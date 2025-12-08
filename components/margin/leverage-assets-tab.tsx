"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo } from "@/lib/types";
import { DropdownOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Collateral } from "./collateral-box";
import { BorrowBox } from "./borrow-box";
import { Dialogue } from "@/components/ui/dialogue";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";

type Modes = "Deposit" | "Borrow";

interface LeverageAssetsTabProps {
  hasMarginAccount?: boolean;
}

export const LeverageAssetsTab = ({
  hasMarginAccount = true,
}: LeverageAssetsTabProps) => {
  // Get collaterals from global store using selector to prevent unnecessary re-renders
  const collaterals = useCollateralBorrowStore((state) => state.collaterals);
  const set = useCollateralBorrowStore((state) => state.set);

  // Component state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);
  const [leverage, setLeverage] = useState(2);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState("USDT");
  const feesCurrency = "USDT";

  // Dialogue visibility states
  const [isCreateMarginDialogueOpen, setIsCreateMarginDialogueOpen] =
    useState(false);
  const [isSecondDialogueOpen, setIsSecondDialogueOpen] = useState(false);

  // Local state to collect data from child component
  const [currentCollaterals, setCurrentCollaterals] = useState<Collaterals[]>(
    []
  );
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>(
    []
  );

  // Initialize with one empty collateral if none exist
  useEffect(() => {
    if (collaterals.length === 0) {
      const newCollateral: Collaterals = {
        amount: 0,
        amountInUsd: 0,
        asset: DropdownOptions[0].name,
        balanceType: "pb",
        unifiedBalance: 0,
      };
      set({ collaterals: [newCollateral] });
      setEditingIndex(0);
    }
  }, [collaterals.length]);

  // Limit to 1 collateral in Borrow mode
  useEffect(() => {
    if (mode === "Borrow" && collaterals.length > 1) {
      set({ collaterals: [collaterals[0]] });
      if (editingIndex !== null && editingIndex > 0) {
        setEditingIndex(null);
      }
    }
  }, [mode, collaterals.length, editingIndex]);

  // Calculate total deposit value from all collaterals
  const totalDepositValue = useMemo(
    () =>
      collaterals.reduce(
        (sum, collateral) => sum + (collateral.amountInUsd || 0),
        0
      ),
    [collaterals]
  );

  // Calculate fees: 0.0234% of total deposit
  const fees = useMemo(
    () => (totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0),
    [totalDepositValue]
  );

  // Calculate total deposit including fees
  const totalDeposit = useMemo(
    () => totalDepositValue + fees,
    [totalDepositValue, fees]
  );

  // Derived values calculated using useMemo
  const platformPoints = useMemo(
    () => Number((leverage * 0.575).toFixed(1)),
    [leverage]
  );

  const updatedCollateral = useMemo(
    () => Math.round(depositAmount * leverage * 0.6),
    [depositAmount, leverage]
  );

  const netHealthFactor = useMemo(
    () => Number((2.0 - leverage * 0.0875).toFixed(2)),
    [leverage]
  );

  // Update deposit amount and currency when collaterals change
  useEffect(() => {
    setDepositAmount(totalDepositValue);

    // Use currency from first collateral
    if (collaterals.length > 0 && collaterals[0].asset) {
      setDepositCurrency(collaterals[0].asset);
    }
  }, [totalDepositValue, collaterals]);

  // Update local state when collaterals or borrowItems change
  useEffect(() => {
    setCurrentCollaterals(collaterals);
    setCurrentBorrowItems(borrowItems);
  }, [collaterals, borrowItems]);

  // Add new collateral
  // Prevents adding if already editing or in Borrow mode with 1 collateral
  const handleAddCollateral = () => {
    if (editingIndex !== null) return;
    if (mode === "Borrow" && collaterals.length >= 1) return;

    const newCollateral: Collaterals = {
      amount: 0,
      amountInUsd: 0,
      asset: DropdownOptions[0].name,
      balanceType: "pb",
      unifiedBalance: 0,
    };
    const newIndex = collaterals.length;
    set({ collaterals: [...collaterals, newCollateral] });
    setEditingIndex(newIndex);
  };

  // Start editing a collateral
  // Only allows if not already editing another one
  const handleEditCollateral = (index: number) => {
    if (editingIndex !== null && editingIndex !== index) return;
    setEditingIndex(index);
  };

  // Save edited collateral
  const handleSaveCollateral = (
    index: number,
    updatedCollateral: Collaterals
  ) => {
    const newCollaterals = [...collaterals];
    newCollaterals[index] = updatedCollateral;
    set({ collaterals: newCollaterals });
    setEditingIndex(null);
  };

  // Cancel editing
  // Removes empty new collateral if it's the last one
  const handleCancelEdit = () => {
    if (
      editingIndex !== null &&
      editingIndex > 0 &&
      editingIndex === collaterals.length - 1
    ) {
      const collateral = collaterals[editingIndex];
      if (collateral.amount === 0 && collateral.amountInUsd === 0) {
        set({ collaterals: collaterals.slice(0, -1) });
      }
    }
    setEditingIndex(null);
  };

  // Delete collateral
  // Prevents deletion if editing or deleting first collateral
  const handleDeleteCollateral = (index: number) => {
    if (editingIndex !== null) return;
    if (index === 0) return;

    const newCollaterals = collaterals.filter((_, i) => i !== index);
    set({ collaterals: newCollaterals });
  };

  // Handler for mode toggle
  const handleModeToggle = () => {
    setMode(prev => prev === "Borrow" ? "Deposit" : "Borrow");
  };

  // Handler for edit collateral
  const handleEditCollateralClick = (index: number) => {
    return () => {
      handleEditCollateral(index);
    };
  };

  // Handler for save collateral
  const handleSaveCollateralClick = (index: number) => {
    return (updatedCollateral: Collaterals) => {
      handleSaveCollateral(index, updatedCollateral);
    };
  };

  // Handler for delete collateral
  const handleDeleteCollateralClick = (index: number) => {
    return () => {
      handleDeleteCollateral(index);
    };
  };

  // Handler for empty collateral save
  const handleEmptyCollateralSave = (updatedCollateral: Collaterals) => {
    set({ collaterals: [updatedCollateral] });
    setEditingIndex(null);
  };

  // Handle create margin account button click
  // Updates global store and opens first dialogue
  const handleButtonClick = () => {
    set({
      collaterals: currentCollaterals,
      borrowItems: currentBorrowItems,
    });
    setIsCreateMarginDialogueOpen(true);
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

  return (
    <>
    <motion.div
      className="w-full flex flex-col gap-[36px] pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Mode toggle: Deposit / Borrow */}
      <motion.div
        className="w-full flex justify-end text-[14px] font-medium gap-2 items-center"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        Deposit{" "}
        <ToggleButton
          size="small"
          onToggle={handleModeToggle}
        />{" "}
        Borrow
      </motion.div>

      {/* Deposit section */}
      <motion.div
        className="w-full flex flex-col gap-[8px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="w-full text-[16px] font-medium"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          Deposit
        </motion.div>
        <div className="flex flex-col gap-[12px]">
          {/* Render collaterals list */}
          <AnimatePresence mode="popLayout">
            {collaterals.length > 0 ? (
              collaterals.map((collateral, index) => (
                <motion.div
                  key={`collateral-${collateral.asset}-${collateral.balanceType}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                    delay: index * 0.05,
                  }}
                  layout
                >
                  <Collateral
                    collaterals={collateral}
                    isEditing={editingIndex === index}
                    isAnyOtherEditing={editingIndex !== null && editingIndex !== index}
                    onEdit={handleEditCollateralClick(index)}
                    onSave={handleSaveCollateralClick(index)}
                    onCancel={handleCancelEdit}
                    onDelete={handleDeleteCollateralClick(index)}
                    index={index}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Collateral
                  collaterals={null}
                  isEditing={true}
                  isAnyOtherEditing={false}
                  onEdit={() => {}}
                  onSave={handleEmptyCollateralSave}
                  onCancel={handleCancelEdit}
                  index={0}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Collateral button */}
        <motion.button
          type="button"
          onClick={handleAddCollateral}
          disabled={editingIndex !== null || (mode === "Borrow" && collaterals.length >= 1)}
          className={`w-fit hover:cursor-pointer hover:bg-[#F1EBFD] py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center ${
            editingIndex !== null ||
            (mode === "Borrow" && collaterals.length >= 1)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          whileHover={
            editingIndex === null &&
            !(mode === "Borrow" && collaterals.length >= 1)
              ? { x: 5 }
              : {}
          }
          transition={{ duration: 0.2 }}
          aria-label="Add new collateral"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5.33332 0.666748V10.0001M0.666656 5.33341H9.99999"
              stroke="#703AE6"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Collateral
        </motion.button>
      </motion.div>

      {/* Borrow section */}
      <motion.div
        className="w-full flex flex-col gap-[8px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <motion.div
          className="w-full text-[16px] font-medium"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          Borrow
        </motion.div>
        <div>
          <BorrowBox
            mode={mode}
            leverage={leverage}
            setLeverage={setLeverage}
            totalDeposit={totalDeposit}
            onBorrowItemsChange={setBorrowItems}
          />
        </div>
      </motion.div>

      {/* Details panel - shows calculations and info */}
      <motion.div
        className="px-[16px] w-full h-full flex flex-col gap-[16px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Map through details items */}
        {[
          {
            title: "Platform Points",
            value: `${platformPoints}x`,
            hasLink: false,
          },
          {
            title: "Leverage",
            value: `${leverage}x`,
            hasLink: false,
          },
          {
            title: "You're depositing",
            value: `${depositAmount} ${depositCurrency}`,
            hasLink: true,
            linkText: "View Sources",
          },
          {
            title: "Fees",
            value: `${fees} ${feesCurrency}`,
            hasLink: true,
            linkText: "View details",
          },
          {
            title: "Total deposit including fees",
            value: `${totalDeposit} ${depositCurrency}`,
            hasLink: false,
          },
          {
            title: "Updated Collateral Before Liquidation",
            value: updatedCollateral.toString(),
            hasLink: false,
          },
          {
            title: "Updated Net Health Factor",
            value: netHealthFactor.toString(),
            hasLink: false,
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            className="flex justify-between"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
          >
            <div className="flex items-center gap-[8px]">
              <div className="text-[16px] text-[#1F1F1F] font-medium">
                {item.title}
              </div>
              {item.hasLink && (
                <button className="text-[12px] text-[#703AE6] font-medium hover:underline cursor-pointer">
                  {item.linkText}
                </button>
              )}
            </div>
            <div className="text-[16px] text-[#1F1F1F] font-medium">
              {item.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Create Margin Account button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <Button
          disabled={false}
          size="large"
          text={hasMarginAccount ? "Deposit & Borrow" : "Create your Margin Account"}
          type="gradient"
          onClick={handleButtonClick}
        />
      </motion.div>
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
