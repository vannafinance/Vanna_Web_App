import { DropdownOptions, iconPaths } from "@/lib/constants";
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
}

export const BorrowBox = ({
  mode = "Deposit",
  leverage,
  setLeverage,
  totalDeposit,
  onBorrowItemsChange,
}: BorrowBoxProps) => {
  const { isDark } = useTheme();
  const config = MODE_CONFIG[mode];

  // Form state
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string>
  >({});
  const [selectedAmountType, setSelectedAmountType] = useState<string>("Amount in %");
  const [inputValues, setInputValues] = useState<Record<number, number>>({});
  const [percentageInputValues, setPercentageInputValues] = useState<Record<number, number>>({});
  const [usdInputValues, setUsdInputValues] = useState<Record<number, number>>({});

  // Combined useEffect: Create BorrowInfo items and notify parent
  useEffect(() => {
    const newBorrowItems: BorrowInfo[] = [];

    for (let idx = 0; idx < config.maxItems; idx++) {
      const selectedOption = selectedOptions[idx];
      const inputValue = inputValues[idx] || 0;

      if (selectedOption && inputValue > 0) {
        // Calculate percentage of total deposit
        const percentage =
          totalDeposit > 0 ? (inputValue / totalDeposit) * 100 : 0;

        newBorrowItems.push({
          assetData: {
            asset: `0x${selectedOption}`,
            amount: inputValue.toString(),
          },
          percentage: Number(percentage.toFixed(2)),
          usdValue: inputValue, // 1:1 conversion
        });
      }
    }

    // Directly call parent callback
    if (onBorrowItemsChange) {
      onBorrowItemsChange(newBorrowItems);
    }
  }, [selectedOptions, inputValues, config.maxItems, totalDeposit, onBorrowItemsChange]);

  // Calculate total borrowed value inline (simple calculation)
  const totalBorrowedValue = mode === "Borrow" 
    ? (inputValues[0] || 0) + (inputValues[1] || 0)
    : (inputValues[0] || 0);

  // Simplified UI visibility flags
  const showInputBoxes = config.showInputBoxes;
  const showTotal = config.showTotal;

  // Handler for max leverage click
  const handleMaxLeverage = useCallback(() => {
    setLeverage(MAX_LEVERAGE);
  }, [setLeverage]);

  // Handler for selected option change - memoized to prevent re-renders
  const handleSetSelectedOption = useCallback((idx: number) => {
    return (
      option:
        | string
        | ((prev: string) => string)
    ) => {
      setSelectedOptions((prev) => {
        const currentValue = prev[idx];
        const selected =
          typeof option === "function"
            ? option(currentValue || DropdownOptions[0])
            : option;
        return {
          ...prev,
          [idx]: selected,
        };
      });
    };
  }, []);

  // Handler for input change - memoized to prevent re-renders
  const handleInputChange = useCallback((idx: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setInputValues((prev) => ({
        ...prev,
        [idx]: value,
      }));
    };
  }, []);

  const handlePercentageInputChange = useCallback((idx: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setPercentageInputValues((prev) => ({
        ...prev,
        [idx]: value,
      }));
    };
  }, []);

  const handleLeverageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty string for better UX while typing
    if (inputValue === "") {
      setLeverage(0);
      return;
    }
    const value = Number(inputValue);
    // Validate: must be a number, between 0 and MAX_LEVERAGE
    if (!isNaN(value)) {
      const clampedValue = Math.max(0, Math.min(MAX_LEVERAGE, value));
      setLeverage(clampedValue);
    }
  }, [setLeverage, MAX_LEVERAGE]);

  return (
    <motion.section
      className={`flex flex-col gap-[20px] rounded-[16px] py-[24px] px-[16px] border-[1px] ${
        isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E2E2E2]"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top section: Asset selector or borrowed items display */}
      <header className="flex justify-between ">
        {/* Deposit mode: Single asset selector */}
        {mode === "Deposit" && (
          <>
            <motion.div
              className="flex gap-[10px] items-top "
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Asset dropdown */}
              <div>
                <Dropdown

                  dropdownClassname="text-[14px] gap-[10px] "
                  items={DropdownOptions}
                  selectedOption={selectedOptions[0] || DropdownOptions[0]}
                  setSelectedOption={handleSetSelectedOption(0)}
                  classname="text-[16px] font-medium gap-[8px]"
                />
              </div>

              {/* Max Value button */}
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
                  } `}
                >
                  Max Value
                </motion.div>
                
              </motion.button>
              <div className={`text-[12px] font-medium ${
                isDark ? "text-[#919191]" : "text-neutral-400"
              }`}>18000 USDC</div> 
              </div>
              
            </motion.div>

            {/* Borrowed Amount section for Deposit mode */}
            <motion.div
              className="flex flex-col justify-end items-end gap-[12px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-end gap-[12px]">
                <div className={`text-[14px] font-medium ${
                  isDark ? "text-white" : ""
                }`}>Borrowed Amount:</div>
                <div className="flex gap-[12px]">
                  {Array.from({ length: 1 }).map((_, idx) => {
                    const selectedOption =
                      selectedOptions[0] || DropdownOptions[0];
                    const inputValue = inputValues[0] || 0;

                    return (
                      <motion.div
                        key={idx}
                        className="flex gap-[12px]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex gap-[4px] justify-start">
                          <div className="flex flex-col justify-top items-top">
                            <Image
                              src={iconPaths[selectedOption]}
                              alt={selectedOption}
                              width={16}
                              height={16}
                            />
                          </div>

                          <div className={`text-[12px] font-medium flex flex-col gap-[4px] ${
                            isDark ? "text-white" : ""
                          }`}>
                            <div>
                              {inputValue > 0 ? inputValue : "0"}{" "}
                                {selectedOption}
                            </div>
                            <div className={`text-[10px] ${
                              isDark ? "text-[#919191]" : "text-[#111111]"
                            }`}>
                              {inputValue > 0 ? inputValue.toFixed(2) : "0.00"} USD
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Borrow mode: Display borrowed items */}
        {mode === "Borrow" && (
          <motion.div
            className="w-full flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Borrowed items list */}
            <div className="flex flex-col gap-[12px]">
              <div className={`text-[14px] font-medium ${
                isDark ? "text-white" : ""
              }`}>Borrowed Amount:</div>
              <div className="flex gap-[12px]">
                {Array.from({ length: config.maxItems }).map((_, idx) => {
                  const selectedOption =
                    selectedOptions[idx] || DropdownOptions[0];
                  const inputValue = inputValues[idx] || 0;

                  return (
                    <motion.div
                      key={idx}
                      className="flex gap-[12px]"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex gap-[4px] justify-start">
                        <div className="flex flex-col justify-top items-top">
                          <Image
                            src={iconPaths[selectedOption]}
                            alt={selectedOption}
                            width={16}
                            height={16}
                          />
                        </div>

                        <div className={`text-[12px] font-medium flex flex-col gap-[4px] ${
                          isDark ? "text-white" : ""
                        }`}>
                          <div>
                            {inputValue > 0 ? inputValue : "0"}{" "}
                            {selectedOption}
                          </div>
                          <div className={`text-[10px] ${
                            isDark ? "text-[#919191]" : "text-[#111111]"
                          }`}>
                            {inputValue > 0 ? inputValue.toFixed(2) : "0.00"} USD
                          </div>
                        </div>
                      </div>
                      {idx < config.maxItems - 1 && (
                        <motion.span
                          className={`text-[20px] font-bold ${
                            isDark ? "text-white" : ""
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: (idx + 1) * 0.1,
                          }}
                        >
                          :
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Total borrowed value */}
            {showTotal && (
              <div className="flex flex-col justify-end items-end gap-[12px]">
                <div className={`text-[14px] font-medium ${
                  isDark ? "text-white" : ""
                }`}>
                  Total Borrowable Amount:
                </div>
                <div className={`text-[14px] font-medium ${
                  isDark ? "text-white" : ""
                }`}>
                  $
                  {totalBorrowedValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </header>

      {/* Input boxes for borrow items */}
      {showInputBoxes && (
        <motion.section
          className="flex gap-[8px] items-center justify-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Map through max items */}
          {Array.from({ length: config.maxItems }).map((_, idx) => {
              const selectedOption = selectedOptions[idx] || DropdownOptions[0];
              const inputValue = inputValues[idx] || 0;
              
              // Calculate item data inline (no need for displayItems)
              const item: BorrowInfo | null = selectedOption && inputValue > 0 ? {
                assetData: {
                  asset: `0x${selectedOption}`,
                  amount: inputValue.toString(),
                },
                percentage: totalDeposit > 0 ? Number(((inputValue / totalDeposit) * 100).toFixed(2)) : 0,
                usdValue: inputValue,
              } : null;
              return (
                <motion.div
                  key={idx}
                  className="flex gap-[8px] items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <motion.div
                    className={`p-[16px] border-[1px] rounded-[16px] flex justify-between items-center ${
                      isDark ? "bg-[#222222] border-[#333333]" : "bg-[#F7F7F7] border-[#E2E2E2]"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col gap-[16px]">
                      <div>
                        <Dropdown
                          dropdownClassname="text-[14px] gap-[10px] "
                          items={DropdownOptions}
                          selectedOption={
                            selectedOptions[idx] || DropdownOptions[0]
                          }
                          setSelectedOption={handleSetSelectedOption(idx)}
                          classname="text-[16px] font-medium gap-[8px]"
                        />
                      </div>
                      <div className="flex flex-col gap-[4px]">
                        <div>
                          <label
                            htmlFor={`borrow-amount-input-${idx}`}
                            className="sr-only"
                          >
                            Borrow amount for {selectedOption}
                          </label>
                          <input
                            id={`borrow-amount-input-${idx}`}
                            onChange={handleInputChange(idx)}
                            className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium placeholder:text-[#C7C7C7] ${
                              isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#222222]" : "bg-[#F7F7F7]"
                            }`}
                            type="text"
                            placeholder="0.0"
                            value={inputValues[idx]?.toString() || ""}
                          />
                        </div>
                        <div
                          className={`text-[12px] font-medium ${
                            isDark ? "text-[#919191]" : "text-[#76737B]"
                          }`}
                          aria-live="polite"
                        >
                          {inputValue > 0 ? inputValue.toFixed(2) : "0.00"} USD
                        </div>
                      </div>
                    </div>
                    <div className="w-full flex flex-col justify-end items-end gap-[20px] ">
                      <div>
                        <Dropdown dropdownClassname="text-[14px] gap-[10px] " items={["Amount in %","Amount in $"]}  selectedOption={selectedAmountType} setSelectedOption={setSelectedAmountType} classname="text-[16px] font-medium gap-[8px]" />
                      </div>
                      <div className="px-[10px] flex flex-col justify-end items-end gap-[4px]">
                        <input 
                          type="text" 
                          placeholder="0.0" 
                          onChange={handlePercentageInputChange(idx)} 
                          className={`focus:outline-none text-[20px] font-semibold w-full text-right placeholder:text-[#C7C7C7] ${
                            isDark ? "placeholder:text-[#A7A7A7] text-white bg-[#222222]" : "bg-[#F7F7F7]"
                          }`}
                          value={percentageInputValues[idx] || 0} 
                        />
                        <div className={`text-[12px] font-medium ${
                          isDark ? "text-[#919191]" : "text-[#76737B]"
                        }`}>
                          {item
                            ? `1${selectedOption} = $1.00` // 1:1 conversion
                            : "0.00 USD"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
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

      {/* Leverage slider */}
      <motion.section
        className="relative z-0 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className={`flex gap-[2px] items-center rounded-[8px] border-[1px] p-[2px] ${
          isDark ? "bg-[#111111] border-[#333333]" : "bg-white border-[#E2E2E2]"
        }`}>
          {/* - Button */}
          <motion.button
            type="button"
            onClick={() => {
              if (leverage > 1) {
                setLeverage(leverage - 1);
              }
            }}
            disabled={leverage === 1}
            className={`w-[20px] h-[40px] flex items-center justify-center rounded-[6px] text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDark ? "text-white hover:bg-[#222222]" : "hover:bg-[#F7F7F7]"
            }`}
            whileHover={{ scale: leverage === 1 ? 1.05 : 1 }}
            whileTap={{ scale: leverage === 1 ? 0.95 : 1 }}
            aria-label="Increase leverage"
          >
            -
          </motion.button>
          
          {/* Input */}
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
          
          {/* + Button */}
          <motion.button
            type="button"
            onClick={() => {
              if (leverage < MAX_LEVERAGE) {
                setLeverage(leverage + 1);
              }
            }}
            disabled={leverage >= MAX_LEVERAGE}
            className={`w-[20px] h-[40px] flex items-center justify-center rounded-[6px] text-[16px] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDark ? "text-white hover:bg-[#222222]" : "hover:bg-[#F7F7F7]"
            }`}
            whileHover={{ scale: leverage >= MAX_LEVERAGE ? 1.05 : 1 }}
            whileTap={{ scale: leverage >= MAX_LEVERAGE ? 0.95 : 1 }}
            aria-label="Decrease leverage"
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
          markers={[1,3,5,7,10]}
        />
        </div>
        
      </motion.section>
    </motion.section>
  );
};
