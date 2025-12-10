import { DropdownOptions, iconPaths } from "@/lib/constants";
import { Dropdown } from "../ui/dropdown";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LeverageSlider } from "../ui/leverage-slider";
import { BorrowInfo } from "@/lib/types";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const maxLeverage = 10;

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
  // Mode-specific configuration
  const modeConfig = {
    Deposit: {
      maxItems: 1,
      showTotal: false,
      showInputBoxes: false,
    },
    Borrow: {
      maxItems: 2,
      showTotal: true,
      showInputBoxes: true,
    },
  };

  const config = modeConfig[mode];

  // Form state
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string>
  >({});
  const [inputValues, setInputValues] = useState<Record<number, number>>({});

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
    setLeverage(maxLeverage);
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

  return (
    <motion.div
      className="flex flex-col gap-[20px] bg-white rounded-[16px] py-[24px] px-[16px] border-[1px] border-[#E2E2E2]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top section: Asset selector or borrowed items display */}
      <div className="flex justify-between ">
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
                    leverage === maxLeverage
                      ? "bg-gradient text-white"
                      : "bg-white "
                  } `}
                >
                  Max Value
                </motion.div>
                
              </motion.button>
              <div className="text-[12px] font-medium text-neutral-400">18000 USDC</div> 
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
                <div className="text-[14px] font-medium">Borrowed Amount:</div>
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

                          <div className="text-[12px] font-medium flex flex-col gap-[4px]">
                            <div>
                              {inputValue > 0 ? inputValue : "0"}{" "}
                                {selectedOption}
                            </div>
                            <div className="text-[10px] text-[#111111]">
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
              <div className="text-[14px] font-medium">Borrowed Amount:</div>
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

                        <div className="text-[12px] font-medium flex flex-col gap-[4px]">
                          <div>
                            {inputValue > 0 ? inputValue : "0"}{" "}
                            {selectedOption}
                          </div>
                          <div className="text-[10px] text-[#111111]">
                            {inputValue > 0 ? inputValue.toFixed(2) : "0.00"} USD
                          </div>
                        </div>
                      </div>
                      {idx < config.maxItems - 1 && (
                        <motion.span
                          className="text-[20px] font-bold"
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
                <div className="text-[14px] font-medium">
                  Total Borrowed Value:
                </div>
                <div className="text-[14px] font-medium">
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
      </div>

      {/* Input boxes for borrow items */}
      {showInputBoxes && (
        <motion.div
          className="flex gap-[8px] items-center justify-center"
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
                    className="p-[16px] bg-[#F7F7F7] border-[1px] border-[#E2E2E2] rounded-[16px] flex justify-between items-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col gap-[16px]">
                      <div>
                        <Dropdown
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
                            className="w-full text-[20px] focus:border-[0px] focus:outline-none font-medium"
                            type="text"
                            placeholder="0.0"
                            value={inputValues[idx]?.toString() || ""}
                          />
                        </div>
                        <div
                          className="text-[12px] font-medium text-[#76737B]"
                          aria-live="polite"
                        >
                          {inputValue > 0 ? inputValue.toFixed(2) : "0.00"} USD
                        </div>
                      </div>
                    </div>
                    <div className="w-full flex flex-col justify-end items-end gap-[16px] ">
                      <div className="w-full  flex gap-[4px] p-[8px] text-[12px] font-semibold ">
                        Amount in %
                        <div className="flex flex-col items-center justify-center w-[20px] h-[20px]">
                          <svg
                            width="12"
                            height="7"
                            viewBox="0 0 12 7"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M0.833008 0.833252L5.83301 5.83325L10.833 0.833252"
                              stroke="#111111"
                              strokeWidth="1.66667"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="px-[10px] flex flex-col justify-end items-end gap-[4px]">
                        <div className="text-[20px] font-semibold">
                          {item?.percentage || 0}
                        </div>
                        <div className="text-[12px] font-medium text-[#76737B]">
                          {item
                            ? `1${selectedOption} = $1.00` // 1:1 conversion
                            : "0.00 USD"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {idx < config.maxItems - 1 && (
                    <motion.div
                      className="text-[20px] font-bold w-[36px] h-[36px] rounded-[48px] flex items-center justify-center"
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
        </motion.div>
      )}

      {/* Leverage slider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <LeverageSlider
          value={leverage}
          onChange={setLeverage}
          max={maxLeverage}
          min={0}
          step={1}
        />
      </motion.div>
    </motion.div>
  );
};
