"use client";

import { iconPaths } from "@/lib/constants";
import { Dropdown } from "../ui/dropdown";
import { useState, useEffect, useCallback } from "react";
import { LeverageSlider } from "../ui/leverage-slider";
import { BorrowInfo } from "@/lib/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { MAX_LEVERAGE, MODE_CONFIG } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";

type Mode = "Deposit" | "Borrow";

interface BorrowBoxProps {
  mode?: Mode;
  leverage: number;
  setLeverage: (value: number) => void;
  totalDeposit: number;
  onBorrowItemsChange?: (items: BorrowInfo[]) => void;
  onAssetChange?: (asset: string) => void;
  onOverMaxChange?: (isOver: boolean) => void;
  borrowAmount?: number;
  maxBorrowAmount?: number;
  assetPrice?: number;
  supportedTokens?: string[];
  tokenPrices?: Record<string, number>;
}

export const BorrowBox = ({
  mode = "Deposit",
  leverage,
  setLeverage,
  totalDeposit,
  onBorrowItemsChange,
  onAssetChange,
  onOverMaxChange,
  borrowAmount,
  maxBorrowAmount,
  assetPrice = 0,
  supportedTokens = [],
  tokenPrices = {},
}: BorrowBoxProps) => {
  const { isDark } = useTheme();

  // Use supportedTokens for dropdown, fallback to all earn vault tokens
  const tokenOptions =
    supportedTokens.length > 0 ? supportedTokens : ["ETH", "USDC", "USDT"];
  const config = MODE_CONFIG[mode];

  // ── Core form state ──────────────────────────────────────────────────────
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  // Per-box "Amount in %" | "Amount in $" selector
  const [selectedAmountTypes, setSelectedAmountTypes] = useState<Record<number, string>>({});

  // Numeric values used for calculations
  const [inputValues, setInputValues] = useState<Record<number, number>>({});
  // Raw strings for the LEFT (token amount) inputs — preserves trailing "."
  const [rawInputValues, setRawInputValues] = useState<Record<number, string>>({});

  // Numeric values for the RIGHT (% or $) inputs
  const [secondaryInputValues, setSecondaryInputValues] = useState<Record<number, number>>({});
  // Raw strings for the RIGHT inputs
  const [rawSecondaryInputValues, setRawSecondaryInputValues] = useState<Record<number, string>>({});

  // ── Sync Deposit-mode borrow amount from parent ───────────────────────────
  useEffect(() => {
    if (mode === "Deposit" && borrowAmount !== undefined) {
      setInputValues((prev) => ({ ...prev, 0: borrowAmount }));
      setRawInputValues((prev) => ({ ...prev, 0: borrowAmount.toString() }));
    }
  }, [mode, borrowAmount]);

  // ── Notify parent whenever borrow items change ────────────────────────────
  useEffect(() => {
    const newBorrowItems: BorrowInfo[] = [];

    for (let idx = 0; idx < config.maxItems; idx++) {
      const selectedOption = selectedOptions[idx];
      const inputValue = inputValues[idx] || 0;

      if (selectedOption && inputValue > 0) {
        const price = tokenPrices[selectedOption] || assetPrice || 1;
        const usdValue = inputValue * price;
        const percentage =
          totalDeposit > 0 ? (inputValue / totalDeposit) * 100 : 0;

        newBorrowItems.push({
          assetData: {
            asset: selectedOption,
            amount: inputValue.toString(),
          },
          percentage: Number(percentage.toFixed(2)),
          usdValue: Number(usdValue.toFixed(2)),
        });
      }
    }

    if (onBorrowItemsChange) {
      onBorrowItemsChange(newBorrowItems);
    }

    // Initial asset notification for Deposit mode
    if (mode === "Deposit" && onAssetChange && !selectedOptions[0]) {
      onAssetChange(tokenOptions[0]);
    }
  }, [selectedOptions, inputValues, config.maxItems, totalDeposit, onBorrowItemsChange, mode, onAssetChange, tokenPrices, assetPrice]);

  // Helper: get token price, never falls back to 1 (wrong for ETH)
  const getPrice = useCallback(
    (token: string): number => tokenPrices[token] || assetPrice || 0,
    [tokenPrices, assetPrice]
  );

  // ── Computed totals ───────────────────────────────────────────────────────
  const totalBorrowedValue =
    mode === "Borrow"
      ? (() => {
          let total = 0;
          for (let i = 0; i < config.maxItems; i++) {
            const token = selectedOptions[i] || tokenOptions[0];
            const amount = inputValues[i] || 0;
            total += amount * getPrice(token);
          }
          return total;
        })()
      : (inputValues[0] || 0) * getPrice(selectedOptions[0] || tokenOptions[0]);

  // True when user has entered more USD value than the max borrowable
  const isOverMax =
    mode === "Borrow" &&
    maxBorrowAmount !== undefined &&
    maxBorrowAmount > 0 &&
    totalBorrowedValue > maxBorrowAmount;

  // Notify parent so it can disable the Execute button
  useEffect(() => {
    if (onOverMaxChange) onOverMaxChange(isOverMax);
  }, [isOverMax, onOverMaxChange]);

  const showInputBoxes = config.showInputBoxes;
  const showTotal = config.showTotal;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMaxLeverage = useCallback(() => {
    setLeverage(MAX_LEVERAGE);
  }, [setLeverage]);

  const handleSetSelectedOption = useCallback(
    (idx: number) =>
      (option: string | ((prev: string) => string)) => {
        setSelectedOptions((prev) => {
          const currentValue = prev[idx];
          const selected =
            typeof option === "function"
              ? option(currentValue || tokenOptions[0])
              : option;

          if (idx === 0 && onAssetChange) {
            onAssetChange(selected);
          }
          return { ...prev, [idx]: selected };
        });

        // Clear secondary inputs when token changes (price context changes)
        setSecondaryInputValues((prev) => ({ ...prev, [idx]: 0 }));
        setRawSecondaryInputValues((prev) => ({ ...prev, [idx]: "" }));
      },
    [onAssetChange, tokenOptions]
  );

  // LEFT input: user types the raw token amount
  const handleTokenInputChange = useCallback(
    (idx: number) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;

        const parsed = raw === "" || raw === "." ? 0 : parseFloat(raw);

        // Allow input even if over max — parent shows "exceeded" warning + disables submit

        setRawInputValues((prev) => ({ ...prev, [idx]: raw }));
        setInputValues((prev) => ({ ...prev, [idx]: parsed }));

        // Sync the secondary input display to reflect new token amount
        const amountType = selectedAmountTypes[idx] || "Amount in %";
        const token = selectedOptions[idx] || tokenOptions[0];
        const price = getPrice(token);

        if (price > 0) {
          if (amountType === "Amount in %" && maxBorrowAmount && maxBorrowAmount > 0) {
            const pct = (parsed * price / maxBorrowAmount) * 100;
            setSecondaryInputValues((prev) => ({ ...prev, [idx]: pct }));
            setRawSecondaryInputValues((prev) => ({
              ...prev,
              [idx]: parsed > 0 ? pct.toFixed(2) : "",
            }));
          } else if (amountType === "Amount in $") {
            const usd = parsed * price;
            setSecondaryInputValues((prev) => ({ ...prev, [idx]: usd }));
            setRawSecondaryInputValues((prev) => ({
              ...prev,
              [idx]: parsed > 0 ? usd.toFixed(2) : "",
            }));
          }
        }
      },
    [mode, maxBorrowAmount, inputValues, selectedAmountTypes, selectedOptions, tokenOptions, getPrice]
  );

  // RIGHT input: user types % or $ — drives the LEFT token amount
  const handleSecondaryInputChange = useCallback(
    (idx: number) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;

        const parsed = raw === "" || raw === "." ? 0 : parseFloat(raw);
        setRawSecondaryInputValues((prev) => ({ ...prev, [idx]: raw }));
        setSecondaryInputValues((prev) => ({ ...prev, [idx]: parsed }));

        const amountType = selectedAmountTypes[idx] || "Amount in %";
        const token = selectedOptions[idx] || tokenOptions[0];
        const price = getPrice(token);

        let tokenAmount = 0;
        if (amountType === "Amount in %" && maxBorrowAmount && maxBorrowAmount > 0 && price > 0) {
          // pct of max borrowable (in USD), then convert to tokens
          tokenAmount = (parsed / 100) * maxBorrowAmount / price;
        } else if (amountType === "Amount in $" && price > 0) {
          // USD → token amount
          tokenAmount = parsed / price;
        } else if (amountType === "Amount in $" && price === 0) {
          // Price unknown — treat input as token amount directly to avoid blocking
          tokenAmount = parsed;
        }

        // Allow input even if over max — warning banner shown below

        const tokenRaw = tokenAmount > 0 ? tokenAmount.toFixed(6) : "";
        setRawInputValues((prev) => ({ ...prev, [idx]: tokenRaw }));
        setInputValues((prev) => ({ ...prev, [idx]: tokenAmount }));
      },
    [selectedAmountTypes, selectedOptions, tokenOptions, getPrice, maxBorrowAmount, mode, inputValues]
  );

  const handleLeverageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "") {
        setLeverage(1);
        return;
      }
      const value = Number(inputValue);
      if (!isNaN(value)) {
        const clampedValue = Math.max(1, Math.min(MAX_LEVERAGE, value));
        setLeverage(clampedValue);
      }
    },
    [setLeverage]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.section
      className={`flex flex-col gap-[20px] rounded-[16px] py-[24px] px-[16px] border-[1px] ${
        isDark ? "bg-[#111111]" : "bg-white"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* ── Top section ──────────────────────────────────────────────────── */}
      <header className="flex justify-between">
        {/* Deposit mode */}
        {mode === "Deposit" && (
          <>
            <motion.div
              className="flex gap-[10px] items-top"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <Dropdown
                  dropdownClassname="text-[14px] gap-[10px]"
                  items={tokenOptions}
                  selectedOption={selectedOptions[0] || tokenOptions[0]}
                  setSelectedOption={handleSetSelectedOption(0)}
                  classname="text-[16px] font-medium gap-[8px]"
                />
              </div>

              <div className="flex flex-col gap-[6px] items-center">
                <motion.button
                  type="button"
                  onClick={handleMaxLeverage}
                  className="h-fit cursor-pointer rounded-[8px] bg-gradient p-[1px]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  aria-label="Set maximum leverage"
                >
                  <motion.div
                    className={`py-[8px] px-[16px] rounded-[8px] text-[14px] font-medium ${
                      leverage === MAX_LEVERAGE
                        ? "bg-gradient text-white"
                        : isDark
                        ? "bg-[#111111] text-white"
                        : "bg-white"
                    }`}
                  >
                    Max Value
                  </motion.div>
                </motion.button>
                <div className="text-[12px] font-medium text-neutral-400">
                  {maxBorrowAmount && maxBorrowAmount > 0
                    ? `${maxBorrowAmount.toFixed(2)} ${selectedOptions[0] || ""}`
                    : "0.00"}
                </div>
              </div>
            </motion.div>

            {/* Borrowed Amount — Deposit mode */}
            <motion.div
              className="flex flex-col justify-end items-end gap-[12px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-end gap-[12px]">
                <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                  Borrowed Amount:
                </div>
                {(() => {
                  const token = selectedOptions[0] || tokenOptions[0];
                  const amount = inputValues[0] || 0;
                  const price = getPrice(token);
                  const usdStr = price > 0 ? (amount * price).toFixed(2) : "—";
                  return (
                    <div className="flex gap-[4px] items-center">
                      {iconPaths[token] && (
                        <Image src={iconPaths[token]} alt={token} width={26} height={26} />
                      )}
                      <div className={`text-[12px] font-medium flex flex-col gap-[4px] ${isDark ? "text-white" : ""}`}>
                        <div>{amount > 0 ? amount.toFixed(4) : "0"} {token}</div>
                        <div className={`text-[10px] ${isDark ? "text-[#919191]" : "text-[#777]"}`}>
                          {amount > 0 ? usdStr : "0.00"} USD
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}

        {/* Borrow mode */}
        {mode === "Borrow" && (
          <motion.div
            className="w-full flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Borrowed items */}
            <div className="flex flex-col gap-[12px]">
              <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                Borrowed Amount:
              </div>
              <div className="flex gap-[12px] items-center">
                {Array.from({ length: config.maxItems }).map((_, idx) => {
                  const token = selectedOptions[idx] || tokenOptions[0];
                  const amount = inputValues[idx] || 0;
                  const price = getPrice(token);

                  return (
                    <motion.div
                      key={idx}
                      className="flex gap-[12px] items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex gap-[4px] items-center">
                        {iconPaths[token] && (
                          <Image src={iconPaths[token]} alt={token} width={16} height={16} />
                        )}
                        <div className={`text-[12px] font-medium flex flex-col gap-[4px] ${isDark ? "text-white" : ""}`}>
                          <div>
                            {amount > 0 ? amount.toFixed(4) : "0"} {token}
                          </div>
                          <div className={`text-[10px] ${isDark ? "text-[#919191]" : "text-[#777]"}`}>
                            {amount > 0 && price > 0 ? (amount * price).toFixed(2) : "0.00"} USD
                          </div>
                        </div>
                      </div>

                      {/* Separator between items */}
                      {idx < config.maxItems - 1 && (
                        <motion.span
                          className={`text-[20px] font-bold ${isDark ? "text-white" : ""}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: (idx + 1) * 0.1 }}
                        >
                          :
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Total borrow amount */}
            {showTotal && (
              <div className="flex flex-col justify-end items-end gap-[12px]">
                <div className="text-[14px] font-medium">Total Borrow Amount:</div>
                <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                  $
                  {totalBorrowedValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-[12px] font-medium text-[#76737B]">
                  Max Borrowable: $
                  {maxBorrowAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0.00"}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </header>

      {/* ── Input boxes (Borrow mode) ─────────────────────────────────────── */}
      {showInputBoxes && (
        <motion.section
          className="flex gap-[8px] items-stretch justify-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {Array.from({ length: config.maxItems }).map((_, idx) => {
            const token = selectedOptions[idx] || tokenOptions[0];
            const amount = inputValues[idx] || 0;
            const price = getPrice(token);
            const amountType = selectedAmountTypes[idx] || "Amount in %";

            // Label for the secondary input
            const priceDisplay =
              price > 0
                ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "loading...";
            const secondaryLabel =
              amountType === "Amount in %"
                ? `% of max borrowable ($${maxBorrowAmount?.toFixed(2) || "0.00"})`
                : `1 ${token} = ${priceDisplay}`;

            return (
              <motion.div
                key={idx}
                className="flex gap-[8px] items-center flex-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                {/* Card — flex-1 so both boxes share equal width */}
                <motion.div
                  className={`flex-1 p-[16px] border-[1px] rounded-[16px] flex justify-between items-stretch gap-[12px] ${
                    isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* LEFT — token dropdown + amount input */}
                  <div className="flex flex-col gap-[16px]">
                    <Dropdown
                      dropdownClassname="text-[14px] gap-[10px]"
                      items={tokenOptions}
                      selectedOption={token}
                      setSelectedOption={handleSetSelectedOption(idx)}
                      classname="text-[16px] font-medium gap-[8px]"
                    />
                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor={`borrow-token-input-${idx}`} className="sr-only">
                        Token amount for {token}
                      </label>
                      <input
                        id={`borrow-token-input-${idx}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={rawInputValues[idx] ?? ""}
                        onChange={handleTokenInputChange(idx)}
                        className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium placeholder:text-[#C7C7C7] ${
                          isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#222222]" : "bg-[#F7F7F7]"
                        }`}
                      />
                      <div className={`text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`} aria-live="polite">
                        {amount > 0 && price > 0 ? `≈ $${(amount * price).toFixed(2)}` : "0.00"} USD
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — amount-type dropdown + secondary input */}
                  <div className="flex flex-col justify-between items-end gap-[16px]">
                    {/* Abbreviated labels prevent text-wrap height jump */}
                    <Dropdown
                      dropdownClassname="text-[14px] gap-[10px]"
                      items={["Amount in %", "Amount in $"]}
                      selectedOption={amountType}
                      setSelectedOption={(val) =>
                        setSelectedAmountTypes((prev) => ({ ...prev, [idx]: val as string }))
                      }
                      classname="text-[16px] font-medium gap-[8px] whitespace-nowrap"
                    />
                    <div className="flex flex-col items-end gap-[4px]">
                      <label htmlFor={`borrow-secondary-input-${idx}`} className="sr-only">
                        {amountType === "Amount in %" ? "Percentage" : "USD amount"} for {token}
                      </label>
                      <input
                        id={`borrow-secondary-input-${idx}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={rawSecondaryInputValues[idx] ?? ""}
                        onChange={handleSecondaryInputChange(idx)}
                        className={`focus:outline-none text-[20px] font-semibold w-full text-right placeholder:text-[#C7C7C7] ${
                          isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#222222]" : "bg-[#F7F7F7]"
                        }`}
                      />
                      <div className={`text-[11px] font-medium text-right ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
                        {secondaryLabel}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Separator colon between boxes */}
                {idx < config.maxItems - 1 && (
                  <motion.div
                    className={`text-[20px] font-bold w-[36px] h-[36px] rounded-[48px] flex items-center justify-center ${
                      isDark ? "text-white" : ""
                    }`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: (idx + 1) * 0.1 }}
                  >
                    :
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.section>
      )}

      {/* ── Exceeded-max warning ─────────────────────────────────────────── */}
      {isOverMax && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-[8px] px-[12px] py-[10px] rounded-[10px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/30"
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-[16px] h-[16px] shrink-0 text-[#FF3B3B]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-[13px] font-medium text-[#FF3B3B]">
            Total borrow (${totalBorrowedValue.toFixed(2)}) exceeds max borrowable (${maxBorrowAmount?.toFixed(2)}). Please reduce your amounts.
          </span>
        </motion.div>
      )}

      {/* ── Leverage slider ───────────────────────────────────────────────── */}
      <motion.section
        className="relative z-0 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div
          className={`flex gap-[2px] items-center rounded-[8px] border-[1px] p-[2px] ${
            isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E2E2E2]"
          }`}
        >
          <motion.button
            type="button"
            onClick={() => leverage > 1 && setLeverage(leverage - 1)}
            disabled={leverage <= 1}
            className={`w-[20px] h-[40px] flex items-center justify-center rounded-[6px] text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDark ? "text-white hover:bg-[#222222]" : "hover:bg-[#F7F7F7]"
            }`}
            whileHover={{ scale: leverage > 1 ? 1.05 : 1 }}
            whileTap={{ scale: leverage > 1 ? 0.95 : 1 }}
            aria-label="Decrease leverage"
          >
            −
          </motion.button>

          <input
            value={leverage}
            type="number"
            min={1}
            max={MAX_LEVERAGE}
            onChange={handleLeverageChange}
            className={`w-[40px] h-[40px] focus:outline-none bg-transparent p-[10px] text-[16px] font-medium text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isDark ? "text-white" : ""
            }`}
          />

          <motion.button
            type="button"
            onClick={() => leverage < MAX_LEVERAGE && setLeverage(leverage + 1)}
            disabled={leverage >= MAX_LEVERAGE}
            className={`w-[20px] h-[40px] flex items-center justify-center rounded-[6px] text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDark ? "text-white hover:bg-[#222222]" : "hover:bg-[#F7F7F7]"
            }`}
            whileHover={{ scale: leverage < MAX_LEVERAGE ? 1.05 : 1 }}
            whileTap={{ scale: leverage < MAX_LEVERAGE ? 0.95 : 1 }}
            aria-label="Increase leverage"
          >
            +
          </motion.button>
        </div>

        <div className="w-[500px] px-[5px]">
          <LeverageSlider
            value={leverage}
            onChange={setLeverage}
            max={MAX_LEVERAGE}
            min={1}
            step={1}
            markers={[1, 3, 5, 7, 10]}
          />
        </div>
      </motion.section>
    </motion.section>
  );
};
