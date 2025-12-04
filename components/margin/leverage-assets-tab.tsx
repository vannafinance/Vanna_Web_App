"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo } from "@/lib/types";
import { DropdownOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Collateral } from "./collateral-box";
import { BorrowBox } from "./borrow-box";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";

type Modes = "Deposit" | "Borrow";

interface LeverageAssetsTabProps {
  onCreateMarginAccount: () => void;
  depositAmount: number;
  setDepositAmount: (value: number) => void;
  depositCurrency: string;
  setDepositCurrency: (value: string) => void;
  totalDeposit: number;
  setTotalDeposit: (value: number) => void;
  leverage: number;
  setLeverage: (value: number) => void;
  platformPoints: number;
  vannaPoints: number;
  fees: number;
  feesCurrency: string;
  updatedCollateral: number;
  netHealthFactor: number;
  onDataChange?: (data: {
    collaterals: Collaterals[];
    borrowItems: BorrowInfo[];
  }) => void;
}

export const LeverageAssetsTab = ({
  onCreateMarginAccount,
  depositAmount,
  setDepositAmount,
  depositCurrency,
  setDepositCurrency,
  totalDeposit,
  setTotalDeposit,
  leverage,
  setLeverage,
  platformPoints,
  vannaPoints,
  fees,
  feesCurrency,
  updatedCollateral,
  netHealthFactor,
  onDataChange,
}: LeverageAssetsTabProps) => {
  // Get collaterals from global store using selector to prevent unnecessary re-renders
  const collaterals = useCollateralBorrowStore((state) => state.collaterals);
  const set = useCollateralBorrowStore((state) => state.set);

  // Component state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);

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
  const calculatedFees = useMemo(
    () => (totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0),
    [totalDepositValue]
  );

  // Update deposit amount and currency when collaterals change
  useEffect(() => {
    setDepositAmount(totalDepositValue);
    setTotalDeposit(totalDepositValue + calculatedFees);

    // Use currency from first collateral
    if (collaterals.length > 0 && collaterals[0].asset) {
      setDepositCurrency(collaterals[0].asset);
    }
  }, [
    totalDepositValue,
    calculatedFees,
    collaterals,
    setDepositAmount,
    setTotalDeposit,
    setDepositCurrency,
  ]);

  // Notify parent component when data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({ collaterals, borrowItems });
    }
  }, [collaterals, borrowItems, onDataChange]);

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

  return (
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
            title: "Vanna Points",
            value: `${vannaPoints}x`,
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
          text={"Create your Margin Account"}
          type="gradient"
          onClick={onCreateMarginAccount}
        />
      </motion.div>
    </motion.div>
  );
};
