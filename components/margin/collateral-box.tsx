"use client";

import { Collaterals } from "@/lib/types";
import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dropdown } from "../ui/dropdown";
import {
  iconPaths,
} from "@/lib/constants";
import Image from "next/image";
import { AmountBreakdownDialogue } from "../ui/amount-breakdown-dialogue";

import {
  DEPOSIT_PERCENTAGES,
  PERCENTAGE_COLORS,
  BALANCE_TYPE_OPTIONS,
} from "@/lib/constants/margin";
import { SUPPORTED_CHAIN_NAMES } from "@/lib/chains/chains";
import { useTheme } from "@/contexts/theme-context";

import { usePublicClient, useAccount } from "wagmi";
import { useUserStore } from "@/store/user";
import { formatUnits } from "viem";
import { erc20Abi } from "viem";

interface CollateralProps {
  id?: string;
  collaterals: {
    asset: string;
    amount: number;
    amountInUsd: number;
    balanceType: string;
    unifiedBalance: number;
  } | null;
  isEditing?: boolean;
  isAnyOtherEditing?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (id: string, collateral: Collaterals) => void;
  onCancel?: () => void;
  onDelete?: (id: string) => void;
  onBalanceTypeChange?: (balanceType: string) => void;
  index?: number;
  supportedTokens: string[];
  getBalance?: (asset: string, type: "WB" | "MB") => number;
  prices?: Record<string, number>;
  // Nexus cross-chain balance data
  nexusBreakdown?: { chainId: number; chainName: string; balance: string; value: number }[];
  nexusTotal?: number;
  nexusReady?: boolean;
}

export const Collateral = (props: CollateralProps) => {
  // Determine editing mode
  const isEditing = props.isEditing ?? props.collaterals === null;
  const isStandard = !isEditing;

  // Wagmi & user data
  const { chainId } = useAccount();
  const publicClient = usePublicClient();
  const userAddress = useUserStore((state) => state.address);
  const { isDark } = useTheme();

  // Form state

  const DEFAULT_TOKENS = ["USDC", "USDT", "ETH"];

  const tokens = props.supportedTokens ?? [];

  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    props.collaterals ? props.collaterals.asset : (tokens[0] || "USDC")
  );
  const [valueInput, setValueInput] = useState<string>("0.0");
  const [valueInUsd, setValueInUsd] = useState<string>("0.0");
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
  const showDeleteButton = isStandard && hasCollateral;
  const isWBSelected = selectedBalanceType === "WB";

  // Format number to avoid scientific notation
  const formatAmount = (value: number, asset: string): string => {
    if (value === 0) return "0";
    const decimals = asset === "ETH" ? 18 : 6;
    return value.toFixed(6)
  };

  // Sync form with props when entering editing mode from standard view
  useEffect(() => {
    if (props.collaterals) {
      setValueInput(formatAmount(props.collaterals.amount, props.collaterals.asset));
      setValueInUsd(props.collaterals.amountInUsd.toFixed(2));
      setSelectedCurrency(props.collaterals.asset);
      setSelectedBalanceType(props.collaterals.balanceType.toUpperCase());
    }
    else {
      setSelectedBalanceType("WB")
    }

  }, [props.collaterals])

  // Update selectedCurrency when tokens load if it was empty
  useEffect(() => {
    if (tokens.length > 0 && !selectedCurrency) {
      setSelectedCurrency(tokens[0]);
    }
  }, [tokens, selectedCurrency]);

  // Compute live unified balance directly (no useMemo to ensure fresh balance on every render)
  const liveUnifiedBalance = (() => {
    if (props.getBalance && selectedCurrency) {
      const type = selectedBalanceType.toUpperCase() === "MB" ? "MB" : "WB";
      return props.getBalance(selectedCurrency, type);
    }
    return 0;
  })();

  // Current-chain wallet balance (used to decide if bridging is needed)
  const currentChainBalance = (() => {
    if (props.getBalance && selectedCurrency) {
      return props.getBalance(selectedCurrency, "WB");
    }
    return 0;
  })();

  // Determine if bridging is actually needed:
  // Only need bridging when WB mode, nexus ready, and current chain balance < deposit amount
  const depositAmount = parseFloat(valueInput) || 0;
  const needsBridging =
    isWBSelected &&
    props.nexusReady === true &&
    depositAmount > currentChainBalance &&
    currentChainBalance < (props.nexusTotal ?? 0);

  // Effective balance to display:
  // If on same chain with enough funds, show current chain balance
  // If nexus is ready and WB mode, show unified balance (nexusTotal) only when it provides more
  const effectiveBalance = (() => {
    if (isWBSelected && props.nexusReady && (props.nexusTotal ?? 0) > currentChainBalance) {
      return props.nexusTotal ?? liveUnifiedBalance;
    }
    return liveUnifiedBalance;
  })();

  // Calculate USD value from input using prices map
  useEffect(() => {
    if (isEditing && valueInput) {
      const amount = parseFloat(valueInput) || 0;

      // Get price with fallback: stablecoins default to $1
      let price = props.prices?.[selectedCurrency];
      if (price === undefined || price === null || price === 0) {
        // Stablecoins default to $1 if price not available
        if (selectedCurrency === "USDC" || selectedCurrency === "USDT") {
          price = 1;
        } else {
          price = 0;
        }
      }

      const usdValue = (amount * price).toFixed(2);
      setValueInUsd(usdValue);
      console.log(`[Collateral] ${amount} ${selectedCurrency} = $${usdValue} (price: $${price})`);
    }
  }, [valueInput, isEditing, props.prices, selectedCurrency]);


  // Save edited collateral (use locally fetched unified balance)
  const handleSave = () => {
    if (!props.onSave) return;

    const saveId = props.id || Math.random().toString(36).substring(7);

    const updatedCollateral: Collaterals = {
      id: saveId,
      asset: selectedCurrency,
      amount: parseFloat(valueInput) || 0,
      amountInUsd: parseFloat(valueInUsd) || 0,
      balanceType: selectedBalanceType.toLowerCase(),
      unifiedBalance: effectiveBalance,
    };
    props.onSave(saveId, updatedCollateral);
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueInput(e.target.value);
  };

  // Handler for percentage click – sets amount to % of unified (available) balance
  const handlePercentageClick = (item: number) => {
    setPercentage(item);

    const calculatedAmount = (item / 100) * effectiveBalance;

    let formatted = "0";
    if (calculatedAmount > 0) {
      // Use appropriate decimals: ETH=18, stablecoins=6
      const decimals = selectedCurrency === "ETH" ? 18 : 6;
      formatted = calculatedAmount.toFixed(decimals).replace(/\.?0+$/, "");
    }

    setValueInput(formatted);
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
    <motion.article
      className={`relative flex justify-between gap-[20px] w-full p-[20px] rounded-[16px] border-[1px] ${isDark ? "bg-[#111111]" : "bg-white"
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
                items={
                  props.supportedTokens && props.supportedTokens.length > 0
                    ? props.supportedTokens
                    : DEFAULT_TOKENS
                }
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
                className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium placeholder:text-[#C7C7C7] ${isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#111111]" : "bg-white"
                  }`}
                type="text"
                placeholder="0.0"
                value={valueInput}
              />
              <div
                className={`text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"
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
                  className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${isDark ? "text-white" : ""
                    }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  aria-label="View sources breakdown"
                >
                  View Sources
                </motion.button>
              )}

              {/* Nexus bridging indicator — only show when bridging is actually needed */}
              {isWBSelected && props.nexusReady && needsBridging && (
                <motion.div
                  className={`flex items-center gap-[6px] mt-[4px] px-[8px] py-[4px] rounded-[8px] ${
                    isDark ? "bg-[#1A1035]" : "bg-[#F8F4FF]"
                  }`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="flex-shrink-0 w-[14px] h-[14px] rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #FC5457 10%, #703AE6 90%)" }}
                  >
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className={`text-[10px] font-medium ${isDark ? "text-[#C4A8FF]" : "text-[#703AE6]"}`}>
                    Will bridge from other chains via Nexus
                  </span>
                </motion.div>
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
            <div className={`p-[10px] flex gap-[8px] text-[16px] font-medium ${isDark ? "text-white" : ""
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
                    className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${percentage === item
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
              <div className={`py-[4px] pr-[4px] pl-[8px] ${isDark ? "bg-[#222222]" : "bg-[#F2EBFE]"} rounded-[8px]`}>
                <Dropdown
                  dropdownClassname="text-[14px] gap-[10px] "
                  classname="text-[16px] font-medium gap-[8px]"
                  items={[...BALANCE_TYPE_OPTIONS]}
                  selectedOption={selectedBalanceType}
                  setSelectedOption={(value) => {
                    setSelectedBalanceType(value);
                    if (props.onBalanceTypeChange) {
                      props.onBalanceTypeChange(value as string);
                    }
                  }}
                />
              </div>

              {/* Balance display – shows current chain or unified depending on context */}
              <motion.button
                type="button"
                onClick={handleUnifiedBalanceClick}
                className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${isDark ? "text-white" : "text-[#111111]"}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                aria-label="View balance breakdown"
              >
                {isWBSelected && props.nexusReady && (props.nexusTotal ?? 0) > currentChainBalance
                  ? `Balance across chains: ${formatAmount(effectiveBalance, selectedCurrency)} ${selectedCurrency}`
                  : `Balance: ${formatAmount(effectiveBalance, selectedCurrency)} ${selectedCurrency}`
                }
              </motion.button>
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
                  <div className={`text-[20px] font-medium ${isDark ? "text-white" : ""
                    }`}>
                    {formatAmount(collateral.amount, collateral.asset)}
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
                    className={`underline decoration-1 text-[12px] font-medium cursor-pointer text-left ${isDark ? "text-white" : ""
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
                className={`text-[12px] font-medium cursor-pointer hover:underline text-left ${isDark ? "text-white" : "text-[#111111]"
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                aria-label="View unified balance breakdown"
              >
                Balance: {formatAmount(collateral.unifiedBalance, collateral.asset)} {collateral.asset}
              </motion.button>
            </div>

            {/* Edit button */}
            <div className="min-w-[32px] flex-shrink-0">
              <motion.button
                type="button"
                onClick={() => props.onEdit?.(props.id!)}
                disabled={props.isAnyOtherEditing}
                className={`p-[8.73px] rounded-[8px] ${isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"} h-fit min-w-[32px] flex-shrink-0 ${props.isAnyOtherEditing
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
                    fill={isDark ? "#FFFFFF" : "#111111"}
                  />
                </svg>
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
              className={`cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-[8px] p-[12px] flex-shrink-0 ${isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
                }`}
              whileHover={{ scale: 1.05, backgroundColor: isDark ? "#333333" : "#F0F0F0" }}
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
                  fill={isDark ? "#FFFFFF" : "#111111"}
                />
              </svg>
            </motion.button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* View Sources dialogue — shows real deposit source breakdown */}
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
                heading="Your Deposit Amount Breakdown"
                asset={selectedCurrency}
                totalDeposit={depositAmount}
                breakdown={
                  props.nexusReady && props.nexusBreakdown && props.nexusBreakdown.length > 0
                    ? props.nexusBreakdown
                        .filter((b) => b.value > 0)
                        .map((b) => ({
                          name: SUPPORTED_CHAIN_NAMES[b.chainId] || b.chainName,
                          value: b.value,
                        }))
                    : [{ name: "Wallet", value: currentChainBalance }]
                }
                onClose={handleCloseViewSources}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Breakdown dialogue — shows real per-chain balances */}
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
                heading={
                  props.nexusReady && props.nexusBreakdown && props.nexusBreakdown.length > 1
                    ? "Balance Across Chains"
                    : "Wallet Balance"
                }
                asset={selectedCurrency}
                totalDeposit={effectiveBalance}
                breakdown={
                  props.nexusReady && props.nexusBreakdown && props.nexusBreakdown.length > 0
                    ? props.nexusBreakdown
                        .filter((b) => b.value > 0)
                        .map((b) => ({
                          name: SUPPORTED_CHAIN_NAMES[b.chainId] || b.chainName,
                          value: b.value,
                        }))
                    : [{ name: "Wallet", value: currentChainBalance }]
                }
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
          className={`cursor-pointer flex flex-col justify-center items-center w-[32px] h-[32px] rounded-full absolute -right-3 -top-2 ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"
            }`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.2, backgroundColor: isDark ? "#444444" : "#D0D0D0" }}
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
              fill={isDark ? "#FFFFFF" : "#111111"}
            />
          </svg>
        </motion.button>
      )}
    </motion.article>
  );
};
