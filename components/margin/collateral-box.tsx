import { Collaterals } from "@/lib/types";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown } from "../ui/dropdown";
import {
  DropdownOptions,
  iconPaths,
  depositAmountBreakdownData,
  unifiedBalanceBreakdownData,
  balanceTypeOptions,
} from "@/lib/constants";
import Image from "next/image";
import { AmountBreakdownDialogue } from "../ui/amount-breakdown-dialogue";

interface Collateral {
  collaterals: {
    asset: string;
    amount: number;
    amountInUsd: number;
    balanceType: string;
    unifiedBalance: number;
  } | null;
  isEditing?: boolean;
  isAnyOtherEditing?: boolean;
  onEdit?: () => void;
  onSave?: (collateral: Collaterals) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onBalanceTypeChange?: (balanceType: string) => void;
  index?: number;
}

export const depositPercentage = [10, 25, 50, 100];

export const percentageColors: Record<number, string> = {
  10: "bg-[#703AE6]",
  25: "bg-[#FC5457]",
  50: "bg-[#E63ABB]",
  100: "bg-[#FF007A]",
};

export const Collateral = (props: Collateral) => {
  // Determine editing mode
  const isEditing = props.isEditing ?? props.collaterals === null;
  const isStandard = !isEditing;

  // Form state
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DropdownOptions[0]);
  const [valueInput, setValueInput] = useState<string>("0.0");
  const [valueInUsd, setValueInUsd] = useState<string>("0.0");
  const [percentage, setPercentage] = useState(10);
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(
    balanceTypeOptions[0]
  );

  // Dialogue visibility states
  const [isViewSourcesOpen, setIsViewSourcesOpen] = useState(false);
  const [isUnifiedBalanceOpen, setIsUnifiedBalanceOpen] = useState(false);

  // Extract collateral data for conditional rendering
  const collateral = props.collaterals;
  const hasCollateral = collateral !== null;
  const showStandardRight = isStandard && hasCollateral;
  const showDeleteButton = isStandard && hasCollateral && props.index !== 0;
  const isPBSelected = selectedBalanceType === "PB";
  const isWBSelected = selectedBalanceType === "WB";
  const isMBSelected = selectedBalanceType === "MB";


  // Update form when collateral changes in editing mode
  useEffect(() => {
    if (props.collaterals && isEditing) {
      setValueInput(props.collaterals.amount.toString());
      setValueInUsd(props.collaterals.amountInUsd.toString());
      setSelectedCurrency(props.collaterals!.asset);
      setSelectedBalanceType(props.collaterals.balanceType.toUpperCase());
    }
  }, [props.collaterals, isEditing]);

  // Calculate USD value from input (1:1 conversion)
  useEffect(() => {
    if (isEditing && valueInput) {
      const amount = parseFloat(valueInput) || 0;
      setValueInUsd(amount.toString());
    }
  }, [valueInput, isEditing]);

  // Save edited collateral
  const handleSave = () => {
    if (!props.onSave) return;

    const updatedCollateral: Collaterals = {
      asset: selectedCurrency,
      amount: parseFloat(valueInput) || 0,
      amountInUsd: parseFloat(valueInUsd) || 0,
      balanceType: selectedBalanceType.toLowerCase(),
      unifiedBalance: props.collaterals?.unifiedBalance || 0,
    };
    props.onSave(updatedCollateral);
  };

  // Cancel editing
  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(e.target.value);
  };

  // Handler for percentage click
  const handlePercentageClick = (item: number) => {
    setPercentage(item);
  };

  // Handler for view sources click
  const handleViewSourcesClick = () => {
    setIsViewSourcesOpen(true);
  };

  // Handler for unified balance click
  const handleUnifiedBalanceClick = () => {
    setIsUnifiedBalanceOpen(true);
  };

  // Handler for closing view sources dialogue
  const handleCloseViewSources = () => {
    setIsViewSourcesOpen(false);
  };

  // Handler for closing unified balance dialogue
  const handleCloseUnifiedBalance = () => {
    setIsUnifiedBalanceOpen(false);
  };

  return (
    <motion.div
      className="relative flex justify-between gap-[20px] bg-white w-full p-[20px] rounded-[16px] border-[1px] border-[#E2E2E2] "
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
          <motion.div
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
                classname="text-[16px] font-medium gap-[8px]"
                selectedOption={selectedCurrency}
                setSelectedOption={setSelectedCurrency}
                items={DropdownOptions}
              />
            </div>

            {/* Amount input and USD value */}
            <div className="px-[10px] flex flex-col gap-[8px]">
              <div>
                <label
                  htmlFor={`collateral-amount-input-${props.index}`}
                  className="sr-only"
                >
                  Collateral amount
                </label>
                <input
                  id={`collateral-amount-input-${props.index}`}
                  onChange={handleInputChange}
                  className="w-full text-[20px] focus:border-[0px] focus:outline-none font-medium"
                  type="text"
                  placeholder="0.0"
                  value={valueInput}
                />
              </div>
              <div
                className="text-[12px] font-medium text-[#76737B]"
                aria-live="polite"
              >
                {valueInUsd} USD
              </div>

              {/* View Sources link (only for WB) */}
              {isWBSelected && (
                <motion.button
                  type="button"
                  onClick={handleViewSourcesClick}
                  className="text-[12px] font-medium cursor-pointer hover:underline text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  aria-label="View sources breakdown"
                >
                  View Sources
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
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
            <div className="p-[10px] flex gap-[8px] text-[16px] font-medium">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Middle section: Percentage buttons and balance type */}
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
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
              {depositPercentage.map((item) => {
                return (
                  <motion.button
                    type="button"
                    key={item}
                    onClick={() => handlePercentageClick(item)}
                    className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${
                      percentage === item
                        ? `${percentageColors[item]} text-white`
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
              <div className="py-[4px] pr-[4px] pl-[8px] bg-[#F2EBFE] rounded-[8px] ">
                <Dropdown 
                  classname="text-[16px] font-medium gap-[8px]" 
                  items={balanceTypeOptions} 
                  selectedOption={selectedBalanceType} 
                  setSelectedOption={(value) => {
                    setSelectedBalanceType(value);
                    if (props.onBalanceTypeChange) {
                      props.onBalanceTypeChange(value as string);
                    }
                  }}
                />
              </div>

              {/* Unified Balance link */}
              {hasCollateral && (
                <motion.button
                  type="button"
                  onClick={handleUnifiedBalanceClick}
                  className="text-[12px] font-medium text-[#111111] cursor-pointer hover:underline text-left"
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
          </motion.div>
        ) : (
          <motion.div
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
                  <div className="text-[20px] font-medium">
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
                    className="underline decoration-1 text-[12px] font-medium cursor-pointer text-left"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right section: Edit button and balance type badge */}
      <AnimatePresence>
        {showStandardRight && (
          <motion.div
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
              <div className="items-center flex rounded-[4px] gap-[4px]">
                <motion.div
                  className="w-[28px] h-[28px] bg-[#703AE6] rounded-[4px] text-white p-[4px] text-center text-[12px] font-medium"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.1 }}
                >
                  {collateral.balanceType.toUpperCase()}
                </motion.div>
              </div>
              <motion.button
                type="button"
                onClick={handleUnifiedBalanceClick}
                className="text-[12px] font-medium text-[#111111] cursor-pointer hover:underline text-left"
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
                onClick={props.onEdit}
                disabled={props.isAnyOtherEditing}
                className={`p-[8.73px] rounded-[8px] bg-[#F4F4F4] h-fit min-w-[32px] flex-shrink-0 ${
                  props.isAnyOtherEditing
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                whileHover={
                  props.isAnyOtherEditing
                    ? {}
                    : { scale: 1.1, backgroundColor: "#E8E8E8" }
                }
                whileTap={props.isAnyOtherEditing ? {} : { scale: 0.9 }}
                transition={{ duration: 0.1 }}
                aria-label="Edit collateral"
              >
                <svg
                  width="13"
                  height="14"
                  viewBox="0 0 13 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M0 13.3333V10.9091H12.1212V13.3333H0ZM1.21212 9.69697V7.12121L8 0.348485C8.11111 0.237374 8.2399 0.151515 8.38636 0.0909091C8.53283 0.030303 8.68687 0 8.84848 0C9.0101 0 9.16667 0.030303 9.31818 0.0909091C9.4697 0.151515 9.60606 0.242424 9.72727 0.363636L10.5606 1.21212C10.6818 1.32323 10.7702 1.45455 10.8258 1.60606C10.8813 1.75758 10.9091 1.91414 10.9091 2.07576C10.9091 2.22727 10.8813 2.37626 10.8258 2.52273C10.7702 2.66919 10.6818 2.80303 10.5606 2.92424L3.78788 9.69697H1.21212ZM8.84848 2.90909L9.69697 2.06061L8.84848 1.21212L8 2.06061L8.84848 2.90909Z"
                    fill="#111111"
                  />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right section: Save and Cancel buttons (editing mode) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
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
              <svg
                width="13"
                height="10"
                viewBox="0 0 13 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4.88938 10L13 1.6568L11.3894 0L4.88938 6.68639L1.61062 3.31361L0 4.97041L4.88938 10Z"
                  fill="white"
                />
              </svg>
            </motion.button>

            {/* Cancel button */}
            <motion.button
              type="button"
              onClick={handleCancel}
              className="cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-[8px] p-[12px] flex-shrink-0"
              whileHover={{ scale: 1.05, backgroundColor: "#F0F0F0" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              aria-label="Cancel editing"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6 7.68L1.68 12L0 10.32L4.32 6L0 1.68L1.68 0L6 4.32L10.32 0L12 1.68L7.68 6L12 10.32L10.32 12L6 7.68Z"
                  fill="#111111"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Sources dialogue */}
      <AnimatePresence>
        {isViewSourcesOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
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
                heading={depositAmountBreakdownData.heading}
                asset={depositAmountBreakdownData.asset}
                totalDeposit={depositAmountBreakdownData.totalDeposit}
                breakdown={depositAmountBreakdownData.breakdown}
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
                heading={unifiedBalanceBreakdownData.heading}
                asset={unifiedBalanceBreakdownData.asset}
                totalDeposit={unifiedBalanceBreakdownData.totalDeposit}
                breakdown={unifiedBalanceBreakdownData.breakdown}
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
          onClick={props.onDelete}
          className="cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] bg-[#E2E2E2] rounded-full absolute -right-3 -top-2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.2, backgroundColor: "#D0D0D0" }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          aria-label="Delete collateral"
        >
          <svg
            width="14"
            height="3"
            viewBox="0 0 14 3"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M13.3785 2.17793L7.77825 2.17793L5.60036 2.17793L7.72942e-05 2.17793L7.67884e-05 4.52819e-05L5.60036 4.5029e-05L7.77825 4.51976e-05L13.3785 4.55347e-05V2.17793Z"
              fill="#111111"
            />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
};
