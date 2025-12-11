"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo } from "@/lib/types";
import {
  DropdownOptions,
  balanceTypeOptions,
  iconPaths,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Collateral } from "./collateral-box";
import { BorrowBox } from "./borrow-box";
import { Dialogue } from "@/components/ui/dialogue";
import { DetailsPanel } from "../ui/details-panel";
import { Dropdown } from "../ui/dropdown";
import { Checkbox } from "../ui/Checkbox";
import Image from "next/image";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { Radio } from "../ui/radio-button";

type Modes = "Deposit" | "Borrow";

interface LeverageAssetsTabProps {
  hasMarginAccount?: boolean;
}

export const LeverageAssetsTab = ({
  hasMarginAccount = true,
}: LeverageAssetsTabProps) => {
  // Get collaterals from global store using selector to prevent unnecessary re-renders

  // Component state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);
  const [leverage, setLeverage] = useState(2);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositCurrency, setDepositCurrency] = useState("USDT");
  const feesCurrency = "USDT";

  // Dialogue state - simplified
  type DialogueState = "none" | "create-margin" | "sign-agreement";
  const [activeDialogue, setActiveDialogue] = useState<DialogueState>("none");

  // Local state to collect data from child component
  const [currentCollaterals, setCurrentCollaterals] = useState<Collaterals[]>(
    []
  );
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>(
    []
  );
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(
    balanceTypeOptions[0]
  );
  // Store full collateral objects: array for Deposit (multiple), single for Borrow
  const [selectedMBCollaterals, setSelectedMBCollaterals] = useState<
    Collaterals[]
  >([]);

  // Get collateral mock data from store
  const collateralMock = useCollateralBorrowStore((state) => state.collaterals);

  // Single source of truth for MB mode
  const isMBMode =
    currentCollaterals.length === 1 &&
    currentCollaterals[0]?.balanceType.toLowerCase() === "mb";

  // Initialize with one empty collateral if none exist
  useEffect(() => {
    if (currentCollaterals.length === 0) {
      const newCollateral: Collaterals = {
        amount: 0,
        amountInUsd: 0,
        asset: DropdownOptions[0],
        balanceType: "pb",
        unifiedBalance: 0,
      };
      setCurrentCollaterals([newCollateral]);
      setEditingIndex(0);
    }
  }, [currentCollaterals.length]);

  // Limit to 1 collateral in Borrow mode
  useEffect(() => {
    if (mode === "Borrow" && currentCollaterals.length > 1) {
      setCurrentCollaterals([currentCollaterals[0]]);
      if (editingIndex !== null && editingIndex > 0) {
        setEditingIndex(null);
      }
    }
  }, [mode, currentCollaterals.length, editingIndex]);

  // Calculate total deposit value from all collaterals
  const totalDepositValue = useMemo(
    () =>
      currentCollaterals.reduce(
        (sum, collateral) => sum + (collateral.amountInUsd || 0),
        0
      ),
    [currentCollaterals]
  );

  // Use totalDepositValue for MB display (no need for separate calculation)
  const mbTotalUsd = isMBMode ? totalDepositValue : 0;

  // Simple calculations (no need for useMemo)
  const fees = totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0;
  const totalDeposit = totalDepositValue + fees;
  const platformPoints = Number((leverage * 0.575).toFixed(1));
  const updatedCollateral = Math.round(depositAmount * leverage * 0.6);
  const netHealthFactor = Number((2.0 - leverage * 0.0875).toFixed(2));

  // Update deposit amount and currency when collaterals change
  useEffect(() => {
    setDepositAmount(totalDepositValue);

    // Use currency from first collateral
    if (currentCollaterals.length > 0 && currentCollaterals[0].asset) {
      setDepositCurrency(currentCollaterals[0].asset);
    }
  }, [totalDepositValue, currentCollaterals]);

  // Removed redundant useEffect - state is already managed directly

  // Add new collateral
  // Prevents adding if already editing or in Borrow mode with 1 collateral
  const handleAddCollateral = () => {
    if (editingIndex !== null) return;
    if (mode === "Borrow" && currentCollaterals.length >= 1) return;

    const newCollateral: Collaterals = {
      amount: 0,
      amountInUsd: 0,
      asset: DropdownOptions[0],
      balanceType: "pb",
      unifiedBalance: 0,
    };
    const newIndex = currentCollaterals.length;
    setCurrentCollaterals([...currentCollaterals, newCollateral]);
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
    // If MB is selected, clear all other collaterals and keep only this one
    if (updatedCollateral.balanceType.toLowerCase() === "mb") {
      setCurrentCollaterals([updatedCollateral]);
      setEditingIndex(null);
    } else {
      // If saving a non-MB collateral, remove all MB collaterals and update this one
      const newCollaterals = [...currentCollaterals];
      newCollaterals[index] = updatedCollateral;
      // Remove all MB collaterals
      const filteredCollaterals = newCollaterals.filter(
        (c) => c.balanceType.toLowerCase() !== "mb"
      );
      setCurrentCollaterals(filteredCollaterals);
      setEditingIndex(null);
    }
  };

  // Cancel editing
  // Removes empty new collateral if it's the last one
  const handleCancelEdit = () => {
    if (
      editingIndex !== null &&
      editingIndex > 0 &&
      editingIndex === currentCollaterals.length - 1
    ) {
      const collateral = currentCollaterals[editingIndex];
      if (collateral.amount === 0 && collateral.amountInUsd === 0) {
        setCurrentCollaterals(currentCollaterals.slice(0, -1));
      }
    }
    setEditingIndex(null);
  };

  // Delete collateral
  // Prevents deletion if editing or deleting first collateral
  const handleDeleteCollateral = (index: number) => {
    if (editingIndex !== null) return;
    if (index === 0) return;

    const newCollaterals = currentCollaterals.filter((_, i) => i !== index);
    setCurrentCollaterals(newCollaterals);
  };

  // Handler for mode toggle
  const handleModeToggle = () => {
    setMode((prev) => (prev === "Borrow" ? "Deposit" : "Borrow"));
  };

  // Removed wrapper functions - use inline arrow functions in JSX

  // Unified balance type change handler
  const handleBalanceTypeChange = (index: number) => {
    return (balanceType: string | ((prev: string) => string)) => {
      const value =
        typeof balanceType === "string"
          ? balanceType
          : balanceType(selectedBalanceType);
      const normalized = value.toLowerCase();

      // Get current collateral or create default
      const currentCollateral = currentCollaterals[index] || {
        amount: 0,
        amountInUsd: 0,
        asset: DropdownOptions[0],
        balanceType: "pb",
        unifiedBalance: 0,
      };

      const updatedCollateral: Collaterals = {
        ...currentCollateral,
        balanceType: normalized,
      };

      if (normalized === "mb") {
        // MB mode: single collateral with MB type
        setCurrentCollaterals([updatedCollateral]);
        setEditingIndex(null);
      } else {
        // Normal mode: update balance type, remove any MB collaterals
        const newCollaterals = [...currentCollaterals];
        newCollaterals[index] = updatedCollateral;
        const filteredCollaterals = newCollaterals.filter(
          (c) => c.balanceType.toLowerCase() !== "mb"
        );
        setCurrentCollaterals(filteredCollaterals);
        setEditingIndex(null);
      }

      setSelectedBalanceType(value);
      setEditingIndex(index);
    };
  };

  // Handle create margin account button click
  const handleButtonClick = () => {
    setActiveDialogue("create-margin");
  };

  return (
    <>
      <motion.div
        className="w-full flex flex-col gap-[24px] pt-8"
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
          Multi Deposit{" "}
          <ToggleButton size="small" onToggle={handleModeToggle} /> Dual Borrow
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
            {isMBMode ? "Selected Your Collateral" : "Deposit"}
          </motion.div>
          <div className="flex flex-col gap-[12px]">
            {/* Render MB UI if MB is selected, otherwise render collaterals */}
            {isMBMode ? (
              <motion.div
                className="flex flex-col gap-[24px] bg-white p-[20px] rounded-[16px] border-[1px] border-[#E2E2E2] "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-[20px] font-medium py-[10px]">
                    {mbTotalUsd} USD
                  </div>
                  <div className="py-[4px] pr-[4px] pl-[8px] bg-[#F2EBFE] rounded-[8px]">
                    <Dropdown
                      classname="text-[16px] font-medium gap-[8px]"
                      items={balanceTypeOptions}
                      selectedOption={selectedBalanceType}
                      setSelectedOption={handleBalanceTypeChange(0)}
                    />
                  </div>
                </div>
                <div className="p-[10px] rounded-[12px] bg-[#F4F4F4] grid grid-cols-2 gap-[15px]">
                  {collateralMock.map((item, index) => {
                    const isSelected = selectedMBCollaterals.some(
                      (coll) =>
                        coll.asset === item.asset && coll.amount === item.amount
                    );

                    return (
                      <div key={index} className="flex gap-[10px] items-center">
                        <div>
                          {mode === "Deposit" ? (
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  // Remove from selection
                                  setSelectedMBCollaterals((prev) =>
                                    prev.filter(
                                      (coll) =>
                                        !(
                                          coll.asset === item.asset &&
                                          coll.amount === item.amount
                                        )
                                    )
                                  );
                                } else {
                                  // Add to selection (multiple allowed)
                                  setSelectedMBCollaterals((prev) => [
                                    ...prev,
                                    item,
                                  ]);
                                }
                              }}
                            />
                          ) : (
                            <Radio
                              name="mb-collateral-radio"
                              value={`collateral-${index}`}
                              checked={isSelected}
                              onChange={() => {
                                // Only one selection allowed (replace array with single item)
                                setSelectedMBCollaterals([item]);
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <Image
                            src={iconPaths[item.asset]}
                            alt={item.asset}
                            width={20}
                            height={20}
                          />
                        </div>
                        <div className="text-[16px] font-semibold">
                          {item.amount} {item.asset}
                        </div>
                        <div className="rounded-[4px] py-[2px] px-[4px] bg-[#FFFFFF] text-[10px] font-medium">
                          {item.amountInUsd} USD
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {currentCollaterals.length > 0 ? (
                  currentCollaterals.map((collateral, index) => (
                    <motion.div
                      key={index}
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
                        isAnyOtherEditing={
                          editingIndex !== null && editingIndex !== index
                        }
                        onEdit={() => handleEditCollateral(index)}
                        onSave={(data) => handleSaveCollateral(index, data)}
                        onCancel={handleCancelEdit}
                        onDelete={() => handleDeleteCollateral(index)}
                        onBalanceTypeChange={handleBalanceTypeChange(index)}
                        index={index}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
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
                      onSave={(data) => {
                        setCurrentCollaterals([data]);
                        setEditingIndex(null);
                      }}
                      onCancel={handleCancelEdit}
                      onBalanceTypeChange={handleBalanceTypeChange(0)}
                      index={0}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Add Collateral button */}
          <motion.button
            type="button"
            onClick={handleAddCollateral}
            disabled={
              editingIndex !== null ||
              (mode === "Borrow" && currentCollaterals.length >= 1) ||
              isMBMode
            }
            className={`w-fit hover:cursor-pointer hover:bg-[#F1EBFD] py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center ${
              editingIndex !== null ||
              (mode === "Borrow" && currentCollaterals.length >= 1) ||
              isMBMode
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            whileHover={
              editingIndex === null &&
              !(mode === "Borrow" && currentCollaterals.length >= 1) &&
              !isMBMode
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <DetailsPanel
            items={[
              {
                title: "Platform Points",
                value: `${platformPoints}x`,
              },
              {
                title: "Leverage",
                value: `${leverage}x`,
              },
              {
                title: "You're depositing",
                value: `${depositAmount} ${depositCurrency}`,
                linkText: "View Sources",
              },
              {
                title: "Fees",
                value: `${fees} ${feesCurrency}`,
                linkText: "View details",
              },
              {
                title: "Total deposit including fees",
                value: `${totalDeposit} ${depositCurrency}`,
              },
              {
                title: "Updated Collateral Before Liquidation",
                value: updatedCollateral.toString(),
              },
              {
                title: "Updated Net Health Factor",
                value: netHealthFactor.toString(),
              },
            ]}
          />
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
            text={
              hasMarginAccount && !isMBMode
                ? "Deposit & Borrow"
                : hasMarginAccount && isMBMode
                ? "Borrow"
                : "Create your Margin Account"
            }
            type="gradient"
            onClick={handleButtonClick}
          />
        </motion.div>
      </motion.div>

      {/* First dialogue: Create Margin Account */}
      <AnimatePresence>
        {activeDialogue === "create-margin" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActiveDialogue("none")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                buttonOnClick={() => setActiveDialogue("sign-agreement")}
                buttonText="Create Your Account"
                content={[
                  { line: "Connect your wallet to get started." },
                  {
                    line: "Confirm your Margin Account we will generate a unique address for you.",
                  },
                  { line: "Make a deposit to activate borrowing." },
                ]}
                heading="Create Margin Account"
                onClose={() => setActiveDialogue("none")}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second dialogue: Review and Sign Agreement */}
      <AnimatePresence>
        {activeDialogue === "sign-agreement" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActiveDialogue("none")}
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
                buttonOnClick={() => setActiveDialogue("none")}
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
                onClose={() => setActiveDialogue("none")}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
