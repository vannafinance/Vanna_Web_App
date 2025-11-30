import { DropdownOptions, iconPaths } from "@/lib/constants";
import { Dropdown } from "../ui/dropdown";
import { useState, useEffect, useMemo } from "react";
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
  // Local state for borrow items
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);

  // Form state
  const [selectedOptionAsset1, setSelectedOptionAsset1] = useState(
    DropdownOptions[0]
  );
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, (typeof DropdownOptions)[0]>
  >({});
  const [inputValues, setInputValues] = useState<Record<number, number>>({});

  // Mode-based max items: Deposit = 1, Borrow = 2
  const maxItems = mode === "Deposit" ? 1 : 2;
  
  // Slice items based on mode limit
  const displayItems = useMemo(
    () => borrowItems.slice(0, maxItems),
    [borrowItems, maxItems]
  );

  // Reset form when items array is empty
  useEffect(() => {
    if (borrowItems.length === 0) {
      setInputValues({});
      setSelectedOptions({});
    }
  }, [borrowItems.length]);

  // Create BorrowInfo items from user input
  useEffect(() => {
    const newBorrowItems: BorrowInfo[] = [];
    
    for (let idx = 0; idx < maxItems; idx++) {
      const selectedOption = selectedOptions[idx];
      const inputValue = inputValues[idx] || 0;
      
      if (selectedOption && inputValue > 0) {
        // Calculate USD value (1:1 conversion)
        const usdValue = inputValue;
        // Calculate percentage of total deposit
        const percentage = totalDeposit > 0 ? (usdValue / totalDeposit) * 100 : 0;
        
        newBorrowItems.push({
          assetData: {
            asset: `0x${selectedOption.name}`,
            amount: inputValue.toString(),
          },
          percentage: Number(percentage.toFixed(2)),
          usdValue: usdValue,
        });
      }
    }
    
    setBorrowItems(newBorrowItems);
  }, [selectedOptions, inputValues, maxItems, totalDeposit]);

  // Notify parent when borrow items change
  useEffect(() => {
    if (onBorrowItemsChange) {
      onBorrowItemsChange(borrowItems);
    }
  }, [borrowItems, onBorrowItemsChange]);

  // Calculate total borrowed value
  const totalBorrowedValue = useMemo(
    () => displayItems.reduce((sum, item) => sum + item.usdValue, 0),
    [displayItems]
  );

  // UI visibility flags
  const showSingleItemUI = useMemo(
    () => mode === "Deposit" && (displayItems.length === 0 || displayItems.length === 1),
    [mode, displayItems]
  );
  
  const showMultipleItemsUI = useMemo(
    () => mode === "Borrow" && (displayItems.length === 0 || displayItems.length >= 1),
    [mode, displayItems]
  );

  // Handler for max leverage click
  const handleMaxLeverage = () => {
    setLeverage(maxLeverage);
  };

  // Handler for selected option change
  const handleSetSelectedOption = (idx: number) => {
    return (option: typeof DropdownOptions[0] | ((prev: typeof DropdownOptions[0]) => typeof DropdownOptions[0])) => {
      const selected =
        typeof option === "function"
          ? option(selectedOptions[idx] || DropdownOptions[0])
          : option;
      setSelectedOptions((prev) => ({
        ...prev,
        [idx]: selected as (typeof DropdownOptions)[0],
      }));
    };
  };

  // Handler for input change
  const handleInputChange = (idx: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value) || 0;
      setInputValues((prev) => ({
        ...prev,
        [idx]: value,
      }));
    };
  };

  return (
    <motion.div
      className="flex flex-col gap-[20px] bg-white rounded-[16px] py-[24px] px-[16px] border-[1px] border-[#E2E2E2]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top section: Asset selector or borrowed items display */}
      <div className="flex justify-between">
        {/* Deposit mode: Single asset selector */}
        <AnimatePresence mode="wait">
          {showSingleItemUI && (
            <motion.div
              key="single-item"
              className="flex gap-[10px] items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Asset dropdown */}
              <div>
                <Dropdown
                  items={DropdownOptions}
                  selectedOption={selectedOptionAsset1}
                  setSelectedOption={setSelectedOptionAsset1}
                />
              </div>

              {/* Max Value button */}
              <motion.button
                type="button"
                onClick={handleMaxLeverage}
                className="cursor-pointer rounded-[8px] bg-gradient p-[1px]"
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
                  animate={{
                    backgroundColor:
                      leverage === maxLeverage ? undefined : undefined,
                  }}
                >
                  Max Value
                </motion.div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Borrow mode: Display borrowed items */}
        <AnimatePresence mode="wait">
          {showMultipleItemsUI && (
            <motion.div
              key="multiple-items"
              className="w-full flex justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Borrowed items list */}
              <div className="flex flex-col gap-[12px]">
                <div className="text-[14px] font-medium">Borrowed Amount:</div>
                <div className="flex gap-[12px]">
                  {displayItems.length > 0 ? (
                    displayItems.map((item, idx) => {
                      return (
                        <motion.div
                          key={item.assetData.asset}
                          className="flex gap-[12px]"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                        >
                          <div className="flex gap-[4px] justify-start">
                            <div className="flex flex-col justify-top items-top">
                              <Image
                                src={
                                  iconPaths[item.assetData.asset.split("0x")[1]]
                                }
                                alt={item.assetData.asset}
                                width={16}
                                height={16}
                              />
                            </div>

                            <div className="text-[12px] font-medium flex flex-col gap-[4px]">
                              <div>
                                {item.assetData.amount}{" "}
                                {item.assetData.asset.split("0x")[1]}
                              </div>
                              <div className="text-[10px] text-[#111111]">
                                {item.usdValue} USD
                              </div>
                            </div>
                          </div>
                          {idx < displayItems.length - 1 && (
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
                    })
                  ) : (
                    <div className="text-[12px] font-medium text-[#76737B]">
                      No borrowed items
                    </div>
                  )}
                </div>
              </div>

              {/* Total borrowed value */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input boxes for borrow items */}
      <AnimatePresence>
        {showMultipleItemsUI && (
          <motion.div
            key="input-boxes"
            className="flex gap-[8px] items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Map through max items */}
            {Array.from({ length: maxItems }).map((_, idx) => {
              const item = displayItems[idx];
              const selectedOption = selectedOptions[idx] || DropdownOptions[0];
              return (
                <motion.div
                  key={`input-${idx}-${selectedOption.id}`}
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
                        />
                      </div>
                      <div className="flex flex-col gap-[4px]">
                        <div>
                          <label htmlFor={`borrow-amount-input-${idx}`} className="sr-only">
                            Borrow amount for {selectedOption.name}
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
                        <div className="text-[12px] font-medium text-[#76737B]" aria-live="polite">
                          {item
                            ? (
                                (inputValues[idx] || 0) *
                                (item.usdValue /
                                  (parseFloat(item.assetData.amount) || 1))
                              ).toFixed(2)
                            : "0.00"}{" "}
                          USD
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
                            ? `1${item.assetData.asset.split("0x")[1]} = $${(
                                item.usdValue /
                                (parseFloat(item.assetData.amount) || 1)
                              ).toFixed(2)}`
                            : "0.00 USD"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {idx < maxItems - 1 && (
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
      </AnimatePresence>

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
        />
      </motion.div>
    </motion.div>
  );
};
