import { Collaterals } from "@/lib/types";
import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown } from "../ui/dropdown";
import {
  DropdownOptions,
  iconPaths,
} from "@/lib/constants";
import Image from "next/image";
import { AmountBreakdownDialogue } from "../ui/amount-breakdown-dialogue";
import {
  DEPOSIT_PERCENTAGES,
  PERCENTAGE_COLORS,
  DEPOSIT_AMOUNT_BREAKDOWN_DATA,
  UNIFIED_BALANCE_BREAKDOWN_DATA,
  BALANCE_TYPE_OPTIONS,
} from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";
import { EditIcon, CheckIcon, CloseIcon, MinusIcon } from "@/components/icons";

interface Collateral {
  id?: string; // Add id prop
  collaterals: Collaterals | null;
  isEditing?: boolean;
  isAnyOtherEditing?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string, collateral: Collaterals) => void;
  onCancel?: () => void;
  onDelete?: (id: string) => void;
  onBalanceTypeChange?: (id: string, balanceType: string) => void;
  index?: number;
}

const CollateralComponent = (props: Collateral) => {
  const { isDark } = useTheme();
  // Determine editing mode
  const isEditing = props.isEditing ?? props.collaterals === null;
  const isStandard = !isEditing;

  // Form state - initialize from props
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    props.collaterals?.asset || DropdownOptions[0]
  );
  const [valueInput, setValueInput] = useState<string>(
    props.collaterals?.amount.toString() || "0.0"
  );
  const [valueInUsd, setValueInUsd] = useState<string>(
    props.collaterals?.amountInUsd.toString() || "0.0"
  );
  const [percentage, setPercentage] = useState(10);
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(
    props.collaterals?.balanceType.toUpperCase() || BALANCE_TYPE_OPTIONS[0]
  );

  // Dialogue visibility states
  const [isViewSourcesOpen, setIsViewSourcesOpen] = useState(false);
  const [isUnifiedBalanceOpen, setIsUnifiedBalanceOpen] = useState(false);

  // Extract collateral data for conditional rendering
  const collateral = props.collaterals;
  const hasCollateral = collateral !== null;
  const showStandardRight = isStandard && hasCollateral;
  const showDeleteButton = isStandard && hasCollateral && props.index !== 0;
  const isWBSelected = selectedBalanceType === "WB";

  // Only sync when switching between edit/view modes or when collateral changes
  useEffect(() => {
    if (isEditing && props.collaterals) {
      const newAmount = props.collaterals.amount.toString();
      const newAmountInUsd = props.collaterals.amountInUsd.toString();
      const newCurrency = props.collaterals.asset;
      const newBalanceType = props.collaterals.balanceType.toUpperCase();
      
      // Only update if values are different to avoid unnecessary re-renders
      if (valueInput !== newAmount) {
        setValueInput(newAmount);
        setValueInUsd(newAmountInUsd);
      }
      if (selectedCurrency !== newCurrency) {
        setSelectedCurrency(newCurrency);
      }
      if (selectedBalanceType !== newBalanceType) {
        setSelectedBalanceType(newBalanceType);
      }
    }
  }, [isEditing, props.collaterals?.id, props.collaterals?.amount, props.collaterals?.amountInUsd, props.collaterals?.asset, props.collaterals?.balanceType]); // Only depend on isEditing and collateral id

  // Calculate USD value from input (1:1 conversion)
  useEffect(() => {
    if (isEditing && valueInput) {
      const amount = parseFloat(valueInput) || 0;
      setValueInUsd(amount.toString());
    }
  }, [valueInput, isEditing]);


  // Simple handlers - no memoization needed
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(e.target.value);
  };

  const handlePercentageClick = (item: number) => {
    setPercentage(item);
  };

  const handleViewSourcesClick = () => {
    setIsViewSourcesOpen(true);
  };

  const handleUnifiedBalanceClick = () => {
    setIsUnifiedBalanceOpen(true);
  };

  const handleCloseViewSources = () => {
    setIsViewSourcesOpen(false);
  };

  const handleCloseUnifiedBalance = () => {
    setIsUnifiedBalanceOpen(false);
  };

  // Don't memoize - depends on current state values
  const handleSave = () => {
    if (!props.onSave || !props.id) return;

    const updatedCollateral: Collaterals = {
      id: props.id,
      asset: selectedCurrency,
      amount: parseFloat(valueInput) || 0,
      amountInUsd: parseFloat(valueInUsd) || 0,
      balanceType: selectedBalanceType.toLowerCase(),
      unifiedBalance: props.collaterals?.unifiedBalance || 0,
    };
    props.onSave(props.id, updatedCollateral);
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }
  };

  return (
    <motion.article
      className={`relative flex justify-between gap-[20px] w-full p-[20px] rounded-[16px] border-[1px] ${
        isDark ? "bg-[#111111]" : "bg-white"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      layout
    >
      {/* Left section: Asset selector and amount input */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.section
            key="editing"
            className="h-[162px] flex flex-col justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Currency dropdown */}
            <div className="p-[10px]">
              <Dropdown
                dropdownClassname="text-[14px] gap-[10px] "
                classname="text-[16px] font-medium gap-[8px]"
                selectedOption={selectedCurrency}
                setSelectedOption={setSelectedCurrency}
                items={DropdownOptions}
              />
            </div>

            {/* Amount input and USD value */}
            <div className="px-[10px] flex flex-col gap-[8px]">
              <label
                htmlFor={`collateral-amount-input-${props.index}`}
                className="sr-only"
              >
                Collateral amount
              </label>
              <input
                id={`collateral-amount-input-${props.index}`}
                onChange={handleInputChange}
                className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium placeholder:text-[#C7C7C7] ${
                  isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#111111]" : "bg-white"
                }`}
                type="text"
                placeholder="0.0"
                value={valueInput}
              />
              <div
                className={`text-[12px] font-medium ${
                  isDark ? "text-[#919191]" : "text-[#76737B]"
                }`}
                aria-live="polite"
              >
                {valueInUsd} USD
              </div>

              {/* View Sources link (only for WB) */}
              {isWBSelected && (
                <motion.button
                  type="button"
                  onClick={handleViewSourcesClick}
                  className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${
                    isDark ? "text-white" : ""
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  aria-label="View sources breakdown"
                >
                  View Sources
                </motion.button>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="standard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Asset icon and name */}
            <div className={`p-[10px] flex gap-[8px] text-[16px] font-medium ${
              isDark ? "text-white" : ""
            }`}>
              {hasCollateral && (
                <>
                  <Image
                    alt={collateral.asset}
                    width={20}
                    height={20}
                    src={iconPaths[collateral.asset]}
                    aria-hidden="true"
                  />{" "}
                  {collateral.asset}
                </>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Middle section: Percentage buttons and balance type */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.section
            key="editing-middle"
            className="flex flex-col justify-between"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Percentage buttons */}
            <div
              className="flex gap-[8px]"
              role="group"
              aria-label="Deposit percentage"
            >
              {DEPOSIT_PERCENTAGES.map((item) => {
                return (
                  <motion.button
                    type="button"
                    key={item}
                    onClick={() => handlePercentageClick(item)}
                    className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${
                      percentage === item
                        ? `${PERCENTAGE_COLORS[item]} text-white`
                        : isDark
                        ? "bg-[#222222] text-white"
                        : "bg-[#F4F4F4]"
                    } p-[10px] rounded-[12px]`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    aria-label={`Select ${item} percent`}
                    aria-pressed={percentage === item}
                  >
                    {item}%
                  </motion.button>
                );
              })}
            </div>

            {/* Balance type selector and unified balance */}
            <div className="flex flex-col justify-end items-end gap-[4px]">
              {/* PB/WB toggle */}
              <div className={`py-[4px] pr-[4px] pl-[8px] rounded-[8px] ${
                isDark ? "bg-[#222222]" : "bg-[#F2EBFE]"
              }`}>
                <Dropdown 
                  dropdownClassname="text-[14px] gap-[10px] "
                  classname="text-[16px] font-medium gap-[8px]" 
                  items={[...BALANCE_TYPE_OPTIONS]} 
                  selectedOption={selectedBalanceType} 
                  setSelectedOption={(value) => {
                    setSelectedBalanceType(value);
                    if (props.onBalanceTypeChange && props.id) {
                      props.onBalanceTypeChange(props.id, value as string);
                    }
                  }}
                />
              </div>

              {/* Unified Balance link */}
              {hasCollateral && (
                <motion.button
                  type="button"
                  onClick={handleUnifiedBalanceClick}
                  className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${
                    isDark ? "text-white" : "text-[#111111]"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  aria-label="View unified balance breakdown"
                >
                  Unified Balance: {collateral.unifiedBalance}{" "}
                  {collateral.asset}
                </motion.button>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="standard-middle"
            className="px-[10px] flex flex-col gap-[4px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {hasCollateral && (
              <>
                {/* Amount and USD value */}
                <div className="items-center flex gap-[8px]">
                  <div className={`text-[20px] font-medium ${
                    isDark ? "text-white" : ""
                  }`}>
                    {collateral.amount}
                  </div>
                  <div className="text-[12px] font-medium text-[#703AE6]">
                    ${collateral.amountInUsd}
                  </div>
                </div>

                {/* View Sources link (only for WB) */}
                {collateral.balanceType.toLowerCase() === "wb" && (
                  <motion.button
                    type="button"
                    onClick={handleViewSourcesClick}
                    className={`underline decoration-1 text-[12px] font-medium cursor-pointer text-left ${
                      isDark ? "text-white" : ""
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    aria-label="View sources breakdown"
                  >
                    View Sources
                  </motion.button>
                )}
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Right section: Edit button and balance type badge */}
      <AnimatePresence>
        {showStandardRight && (
          <motion.aside
            key="standard-right"
            className="flex gap-[20px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Balance type badge and unified balance */}
            <div className="flex flex-col justify-end items-end gap-[4px]">
              <motion.div
                className="w-[28px] h-[28px] bg-[#703AE6] rounded-[4px] text-white p-[4px] text-center text-[12px] font-medium items-center flex"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.1 }}
              >
                {collateral.balanceType.toUpperCase()}
              </motion.div>
              <motion.button
                type="button"
                onClick={handleUnifiedBalanceClick}
                className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${
                  isDark ? "text-white" : "text-[#111111]"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                aria-label="View unified balance breakdown"
              >
                Unified Balance: {collateral.unifiedBalance} {collateral.asset}
              </motion.button>
            </div>

            {/* Edit button */}
            <div className="min-w-[32px] flex-shrink-0">
              <motion.button
                type="button"
                onClick={() => props.onEdit?.(props.id!)}
                disabled={props.isAnyOtherEditing}
                className={`p-[8.73px] rounded-[8px] h-fit min-w-[32px] flex-shrink-0 ${
                  isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
                } ${
                  props.isAnyOtherEditing
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                whileHover={
                  props.isAnyOtherEditing
                    ? {}
                    : { scale: 1.1, backgroundColor: isDark ? "#333333" : "#E8E8E8" }
                }
                whileTap={props.isAnyOtherEditing ? {} : { scale: 0.9 }}
                transition={{ duration: 0.1 }}
                aria-label="Edit collateral"
              >
                <EditIcon fill={isDark ? "#FFFFFF" : "#111111"} />
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Right section: Save and Cancel buttons (editing mode) */}
      <AnimatePresence>
        {isEditing && (
          <motion.aside
            key="editing-right"
            className="flex flex-col gap-[12px] min-w-[32px] flex-shrink-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Save button */}
            <motion.button
              type="button"
              onClick={handleSave}
              className="cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-[8px] p-[12px] bg-[#703AE6] flex-shrink-0"
              whileHover={{ scale: 1.05, backgroundColor: "#5A2DB8" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              aria-label="Save collateral"
            >
              <CheckIcon />
            </motion.button>

            {/* Cancel button */}
            <motion.button
              type="button"
              onClick={handleCancel}
              className={`cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-[8px] p-[12px] flex-shrink-0 ${
                isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
              }`}
              whileHover={{ scale: 1.05, backgroundColor: isDark ? "#333333" : "#F0F0F0" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              aria-label="Cancel editing"
            >
              <CloseIcon stroke={isDark ? "#FFFFFF" : "#111111"} width={12} height={12} />
            </motion.button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* View Sources dialogue */}
      <AnimatePresence>
        {isViewSourcesOpen && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseViewSources}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AmountBreakdownDialogue
                heading={DEPOSIT_AMOUNT_BREAKDOWN_DATA.heading}
                asset={DEPOSIT_AMOUNT_BREAKDOWN_DATA.asset}
                totalDeposit={DEPOSIT_AMOUNT_BREAKDOWN_DATA.totalDeposit}
                breakdown={[...DEPOSIT_AMOUNT_BREAKDOWN_DATA.breakdown]}
                onClose={handleCloseViewSources}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Balance dialogue */}
      <AnimatePresence>
        {isUnifiedBalanceOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseUnifiedBalance}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AmountBreakdownDialogue
                heading={UNIFIED_BALANCE_BREAKDOWN_DATA.heading}
                asset={UNIFIED_BALANCE_BREAKDOWN_DATA.asset}
                totalDeposit={UNIFIED_BALANCE_BREAKDOWN_DATA.totalDeposit}
                breakdown={[...UNIFIED_BALANCE_BREAKDOWN_DATA.breakdown]}
                onClose={handleCloseUnifiedBalance}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete button (only for non-first items) */}
      {showDeleteButton && (
        <motion.button
          type="button"
          onClick={() => props.onDelete?.(props.id!)}
          className={`cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-full absolute -right-3 -top-2 ${
            isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"
          }`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.2, backgroundColor: isDark ? "#444444" : "#D0D0D0" }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          aria-label="Delete collateral"
        >
          <MinusIcon fill={isDark ? "#FFFFFF" : "#111111"} width={14} height={3} />
        </motion.button>
      )}
    </motion.article>
  );
};

// Memoized component with custom comparison
export const Collateral = memo(CollateralComponent, (prevProps, nextProps) => {
  // Deep comparison for collateral object
  const prevCollateral = prevProps.collaterals;
  const nextCollateral = nextProps.collaterals;
  
  if (prevCollateral === nextCollateral) {
    // Same reference or both null
    return (
      prevProps.isEditing === nextProps.isEditing &&
      prevProps.isAnyOtherEditing === nextProps.isAnyOtherEditing &&
      prevProps.index === nextProps.index
    );
  }
  
  if (!prevCollateral || !nextCollateral) {
    return false; // One is null, other is not
  }
  
  // Compare all fields
  return (
    prevCollateral.id === nextCollateral.id &&
    prevCollateral.asset === nextCollateral.asset &&
    prevCollateral.amount === nextCollateral.amount &&
    prevCollateral.amountInUsd === nextCollateral.amountInUsd &&
    prevCollateral.balanceType === nextCollateral.balanceType &&
    prevCollateral.unifiedBalance === nextCollateral.unifiedBalance &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isAnyOtherEditing === nextProps.isAnyOtherEditing &&
    prevProps.index === nextProps.index
  );
});
