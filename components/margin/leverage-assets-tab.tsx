"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo } from "@/lib/types";
import {
  DropdownOptions,
  iconPaths,
} from "@/lib/constants";
import { BALANCE_TYPE_OPTIONS } from "@/lib/constants/margin";
import { Button } from "@/components/ui/button";
import { Collateral } from "./collateral-box";
import { BorrowBox } from "./borrow-box";
import { Dialogue } from "@/components/ui/dialogue";
import { InfoCard } from "./info-card";
import { Dropdown } from "../ui/dropdown";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { MBSelectionGrid } from "./mb-selection-grid";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";

type Modes = "Deposit" | "Borrow";

// Helper to generate unique ID for collateral
const generateCollateralId = () => `collateral-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to ensure collateral has ID
const ensureCollateralId = (collateral: Collaterals): Collaterals => {
  if (!collateral.id) {
    return { ...collateral, id: generateCollateralId() };
  }
  return collateral;
};



export const LeverageAssetsTab = () => {
  const { isDark } = useTheme();
  // Component state
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);
  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);
  const [leverage, setLeverage] = useState(2);
  const feesCurrency = "USDT";

  const userAddress = useUserStore((state) => state.address);

  // Dialogue state
  type DialogueState = "none" | "create-margin" | "sign-agreement";
  const [activeDialogue, setActiveDialogue] = useState<DialogueState>("none");

  // Map-based state for O(1) operations
  const [collaterals, setCollaterals] = useState<Map<string, Collaterals>>(
    new Map()
  );
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>(
    []
  );
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(
    BALANCE_TYPE_OPTIONS[0]
  );
  
  // Set-based MB selections for O(1) lookups
  const [selectedMBIds, setSelectedMBIds] = useState<Set<string>>(new Set());

  // Get collateral mock data from store
  const collateralMock = useCollateralBorrowStore((state) => state.collaterals);

  // Convert Map to stable array for rendering
  const collateralList = useMemo(() => {
    return Array.from(collaterals.values());
  }, [collaterals]);

  // Single source of truth for MB mode
  const isMBMode = collateralList.length === 1 && collateralList[0]?.balanceType.toLowerCase() === "mb";

  // Initialize with one empty collateral if none exist
  useEffect(() => {
    if (collaterals.size === 0) {
      const newId = generateCollateralId();
      const newCollateral: Collaterals = {
        id: newId,
        amount: 0,
        amountInUsd: 0,
        asset: DropdownOptions[0],
        balanceType: "wb",
        unifiedBalance: 0,
      };
      setCollaterals(new Map([[newId, newCollateral]]));
      setEditingId(newId);
    }
  }, [collaterals.size]);

  // Calculate total deposit value - stable dependency
  const totalDepositValue = useMemo(
    () =>
      collateralList.reduce(
        (sum, collateral) => sum + (collateral.amountInUsd || 0),
        0
      ),
    [collateralList]
  );

  // Derived values (no state needed)
  const depositAmount = totalDepositValue;
  const depositCurrency = collateralList[0]?.asset || "USDT";
  const mbTotalUsd = isMBMode ? totalDepositValue : 0;

  // Simple calculations
  const fees = totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0;
  const totalDeposit = totalDepositValue + fees;
  const platformPoints = Number((leverage * 0.575).toFixed(1));
  const updatedCollateral = Math.round(depositAmount * leverage * 0.6);
  const netHealthFactor = Number((2.0 - leverage * 0.0875).toFixed(2));

  // Memoized callbacks
  const handleAddCollateral = useCallback(() => {
    if (editingId !== null) return;
    if (mode === "Borrow" && collaterals.size >= 1) return;

    const newId = generateCollateralId();
    const newCollateral: Collaterals = {
      id: newId,
      amount: 0,
      amountInUsd: 0,
      asset: DropdownOptions[0],
      balanceType: "wb",
      unifiedBalance: 0,
    };
    setCollaterals((prev) => {
      const next = new Map(prev);
      next.set(newId, newCollateral);
      return next;
    });
    setEditingId(newId);
  }, [editingId, mode, collaterals.size]);

  const handleEditCollateral = (id: string) => {
    if (editingId !== null && editingId !== id) return;
    setEditingId(id);
  };

  const handleSaveCollateral = useCallback((id: string, updated: Collaterals) => {
    // Use the original id, don't generate a new one
    const collateralWithId: Collaterals = {
      ...updated,
      id: id, // Always use the original id to update existing collateral
    };
    
    setCollaterals((prev) => {
      const next = new Map(prev);
      
      if (collateralWithId.balanceType.toLowerCase() === "mb") {
        // MB mode: clear all, keep only this one
        next.clear();
        next.set(id, collateralWithId);
      } else {
        // Remove all MB collaterals, then update this one
        for (const [key, val] of next) {
          if (val.balanceType.toLowerCase() === "mb") {
            next.delete(key);
          }
        }
        // Update existing collateral with same id
        next.set(id, collateralWithId);
      }
      
      return next;
    });
    
    setEditingId(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (editingId !== null) {
      const collateral = collaterals.get(editingId);
      // Remove empty collateral if it's not the first one
      if (collateral && collateral.amount === 0 && collateral.amountInUsd === 0) {
        const collateralArray = Array.from(collaterals.entries());
        const isLast = collateralArray.length > 1 && 
          collateralArray[collateralArray.length - 1][0] === editingId;
        
        if (isLast) {
          setCollaterals((prev) => {
            const next = new Map(prev);
            next.delete(editingId);
            return next;
          });
        }
      }
    }
    setEditingId(null);
  }, [editingId, collaterals]);

  const handleDeleteCollateral = useCallback((id: string) => {
    if (editingId !== null) return;
    
    setCollaterals((prev) => {
      // Prevent deleting if it's the first collateral
      const collateralArray = Array.from(prev.entries());
      if (collateralArray.length > 0 && collateralArray[0][0] === id) {
        return prev; // Return unchanged
      }
      
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, [editingId]); // Remove collaterals from deps - use functional update

  const handleModeToggle = () => {
    setMode((prev) => {
      const newMode = prev === "Borrow" ? "Deposit" : "Borrow";
      
      // When switching to Borrow mode, limit to 1 collateral
      if (newMode === "Borrow") {
        setCollaterals((currentCollaterals) => {
          if (currentCollaterals.size > 1) {
            const firstEntry = Array.from(currentCollaterals.entries())[0];
            if (firstEntry && firstEntry[0]) {
              // Clear editing if not the first collateral
              if (editingId !== null && editingId !== firstEntry[0]) {
                setEditingId(null);
              }
              return new Map([firstEntry]);
            }
          }
          return currentCollaterals;
        });
      }
      
      return newMode;
    });
  };

  const handleBalanceTypeChange = useCallback((id: string, balanceType: string) => {
    const normalized = balanceType.toLowerCase();

    setCollaterals((prev) => {
      const currentCollateral = prev.get(id) || {
        id: id,
        amount: 0,
        amountInUsd: 0,
        asset: DropdownOptions[0],
        balanceType: "wb",
        unifiedBalance: 0,
      };

      const updatedCollateral: Collaterals = {
        ...currentCollateral,
        id: id,
        balanceType: normalized,
      };

      const next = new Map(prev);

      if (normalized === "mb") {
        // MB mode: clear all, keep only this one
        next.clear();
        next.set(id, updatedCollateral);
      } else {
        // Normal mode: remove any MB collaterals, then update this one
        for (const [key, val] of next) {
          if (val.balanceType.toLowerCase() === "mb") {
            next.delete(key);
          }
        }
        next.set(id, updatedCollateral);
      }

      return next;
    });

    setSelectedBalanceType(balanceType.toUpperCase());
    setEditingId(null);
  }, []); // No dependencies - uses functional updates

  const handleButtonClick = () => {
    setActiveDialogue("create-margin");
  };

  // MB selection handlers with Set - memoized to prevent unnecessary re-renders
  const handleMBToggle = useCallback((itemId: string, isSelected: boolean) => {
    setSelectedMBIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleMBRadioSelect = useCallback((itemId: string) => {
    setSelectedMBIds(new Set([itemId]));
  }, []);


  return (
    <>
      <motion.section
        className="w-full flex flex-col gap-[24px] pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Mode toggle: Deposit / Borrow */}
        <motion.header
          className={`w-full flex justify-end text-[14px] font-medium gap-2 items-center ${
            isDark ? "text-white" : ""
          }`}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          Multi Deposit{" "}
          <ToggleButton size="small" onToggle={handleModeToggle} /> Dual Borrow
        </motion.header>

        {/* Deposit section */}
        <motion.section
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.h2
            className={`w-full text-[16px] font-medium ${isDark ? "text-white" : ""}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            {isMBMode ? "Select Your Collateral" : "Deposit"}
          </motion.h2>
          <section className="flex flex-col gap-[12px]">
            {/* Render MB UI if MB is selected, otherwise render collaterals */}
            {isMBMode ? (
              <motion.article
                className={`flex flex-col gap-[24px] p-[20px] rounded-[16px] border-[1px] ${
                  isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E2E2E2]"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <header className="flex justify-between items-center">
                  <h3 className={`text-[20px] font-medium py-[10px] ${isDark ? "text-white" : ""}`}>
                    {mbTotalUsd} USD
                  </h3>
                  <div className={`py-[4px] pr-[4px] pl-[8px] rounded-[8px] ${
                    isDark ? "bg-[#222222] " : "bg-[#F2EBFE]"
                  }`}>
                    <Dropdown
                      classname="text-[16px] font-medium gap-[8px]"
                      items={[...BALANCE_TYPE_OPTIONS]}
                      selectedOption={selectedBalanceType}
                      setSelectedOption={(value) => {
                        const id = collateralList[0]?.id || generateCollateralId();
                        handleBalanceTypeChange(id, value as string);
                      }}
                      dropdownClassname="text-[14px] gap-[10px] "
                    />
                  </div>
                </header>
                <MBSelectionGrid
                  items={collateralMock}
                  selectedIds={selectedMBIds}
                  mode={mode}
                  onToggle={handleMBToggle}
                  onRadioSelect={handleMBRadioSelect}
                />
              </motion.article>
            ) : (
              <section 
                className={`${collateralList.length>2?"max-h-[364px] overflow-y-auto overflow-x-visible pr-[4px]":""}  thin-scrollbar `}
              >
                <AnimatePresence mode="popLayout">
                  {collateralList.length > 0 ? (
                    <ul className="flex flex-col gap-[12px]" role="list">
                      {collateralList.map((collateral, index) => {
                        const id = collateral.id!;
                        return (
                          <motion.div
                            key={id}
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
                            <li>
                              <Collateral
                                id={id}
                                collaterals={collateral}
                                isEditing={editingId === id}
                                isAnyOtherEditing={editingId !== null && editingId !== id}
                                onEdit={handleEditCollateral}
                                onSave={handleSaveCollateral}
                                onCancel={handleCancelEdit}
                                onDelete={handleDeleteCollateral}
                                onBalanceTypeChange={handleBalanceTypeChange}
                                index={index}
                              />
                            </li>
                          </motion.div>
                        );
                      })}
                    </ul>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Collateral
                        id={generateCollateralId()}
                        collaterals={null}
                        isEditing={true}
                        isAnyOtherEditing={false}
                        onEdit={handleEditCollateral}
                        onSave={(id, data) => {
                          const collateralWithId = ensureCollateralId(data);
                          setCollaterals(new Map([[collateralWithId.id!, collateralWithId]]));
                          setEditingId(null);
                        }}
                        onCancel={handleCancelEdit}
                        onBalanceTypeChange={handleBalanceTypeChange}
                        index={0}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </section>

          {/* Add Collateral button */}
          <motion.button
            type="button"
            onClick={handleAddCollateral}
            disabled={
              editingId !== null ||
              (mode === "Borrow" && collaterals.size >= 1) ||
              isMBMode
            }
            className={`w-fit py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center ${
              editingId !== null ||
              (mode === "Borrow" && collaterals.size >= 1) ||
              isMBMode
                ? "opacity-50 cursor-not-allowed"
                : "hover:cursor-pointer hover:bg-[#F1EBFD]"
            }`}
            whileHover={
              editingId === null &&
              !(mode === "Borrow" && collaterals.size >= 1) &&
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
        </motion.section>

        {/* Borrow section */}
        <motion.section
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <motion.h2
            className={`w-full text-[16px] font-medium ${isDark ? "text-white" : ""}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            Borrow
          </motion.h2>
          <BorrowBox
            mode={mode}
            leverage={leverage}
            setLeverage={setLeverage}
            totalDeposit={totalDeposit}
            onBorrowItemsChange={setBorrowItems}
          />
        </motion.section>

        {/* Details panel - shows calculations and info */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <InfoCard
            data={{
              platformPoints: platformPoints,
              leverage: leverage,
              depositAmount: depositAmount,
              fees: fees,
              totalDeposit: totalDeposit,
              updatedCollateral: updatedCollateral,
              netHealthFactor: netHealthFactor,
            }}
            showExpandable={true}
            expandableSections={[
              {
                title: "More Details",
                
                items: [
                  {
                    id: "platformPoints",
                    name: "Platform Points",
                  },
                  {
                    id: "leverage",
                    name: "Leverage",
                  },
                  {
                    id: "depositAmount",
                    name: "You're depositing",
                  },
                  {
                    id: "fees",
                    name: "Fees",
                  },
                  {
                    id: "totalDeposit",
                    name: "Total deposit including fees",
                  },
                  {
                    id: "updatedCollateral",
                    name: "Updated Collateral Before Liquidation",
                  },
                  {
                    id: "netHealthFactor",
                    name: "Updated Net Health Factor",
                  },
                ],
                defaultExpanded: false,
                delay: 0.1,
              },
            ]}
          />
        </motion.aside>

        {/* Create Margin Account button */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
          <Button
            disabled={false}
            size="large"
            text={
              !userAddress ? "Login" :
              hasMarginAccount  && !isMBMode
                ? "Deposit & Borrow"
                : hasMarginAccount && isMBMode
                ? "Borrow"
                :  "Create your Margin Account"
            }
            type="gradient"
            onClick={handleButtonClick}
          />
        </motion.section>
      </motion.section>

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
                buttonOnClick={() => {setActiveDialogue("none"); setHasMarginAccount({hasMarginAccount:true}); } }
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
