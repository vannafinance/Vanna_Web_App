import { useState } from "react";
import { Dropdown } from "../ui/dropdown";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownOptions } from "@/lib/constants";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { DetailsPanel } from "../ui/details-panel";
import { Button } from "../ui/button";
import { useTheme } from "@/contexts/theme-context";

export const TransferCollateral = () => {
  const { isDark } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USDC");
  const [valueInput, setValueInput] = useState<string>("");
  const [valueInUsd, setValueInUsd] = useState<number>(0.0);
  const [percentage, setPercentage] = useState<number>(0);

  const handlePercentageClick = (item: number) => {
    setPercentage(item);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueInput(value);
    setValueInUsd(Number(value) * 100);
  };

  const handleMaxValueClick = () => {
    setValueInput("2000");
    setValueInUsd(2000);
  };

  const handleTransferClick = () => {
    console.log("Transfer clicked");
  };

  return (
    <motion.section 
      className="flex flex-col justify-between gap-[24px] pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.article 
        className={`flex flex-col gap-[24px] rounded-[16px] p-[20px] border-[1px] ${
          isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.header
          key="editing"
          className="flex flex-col sm:flex-row justify-between gap-3"
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
                dropdownClassname="text-[14px] font-medium gap-[8px]"
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key="editing-middle"
                className="flex gap-2 sm:gap-[8px] flex-wrap"
                role="group"
                aria-label="Deposit percentage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {DEPOSIT_PERCENTAGES.map((item) => {
                  return (
                    <motion.button
                      type="button"
                      key={item}
                      onClick={() => handlePercentageClick(item)}
                      className={`h-[40px] sm:h-[44px] w-auto min-w-[60px] sm:w-[95px] text-center text-[13px] sm:text-[14px] text-medium cursor-pointer ${
                        percentage === item
                          ? `${PERCENTAGE_COLORS[item]} text-white`
                          : isDark
                          ? "bg-[#222222] text-white"
                          : "bg-[#F4F4F4]"
                      } p-2 sm:p-[10px] rounded-[12px]`}
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
              </motion.div>
            </AnimatePresence>
          </motion.header>
        <motion.section 
          className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-[10px] sm:items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div 
            className="px-[10px] flex flex-col gap-[8px]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <label htmlFor={`collateral-amount-input`} className="sr-only">
              Collateral amount
            </label>
            <input
              id={`collateral-amount-input`}
              onChange={handleInputChange}
              className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium placeholder:text-[#C7C7C7] bg-transparent ${
                isDark ? "placeholder:text-[#A7A7A7] text-white" : ""
              }`}
              type="text"
              placeholder="0.0"
              value={valueInput}
            />
            <motion.p
              className={`text-[12px] font-medium ${
                isDark ? "text-[#919191]" : "text-[#76737B]"
              }`}
              aria-live="polite"
              key={valueInUsd}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {valueInUsd} USD
            </motion.p>
          </motion.div>
          <motion.aside 
            className="flex flex-col gap-[8px] items-end"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <p className={`text-[10px] font-medium ${isDark ? "text-white" : ""}`}>
              Transfer To: <span className="font-semibold">WB</span>
            </p>
            <p className={`text-[20px] font-medium ${isDark ? "text-white" : ""}`}>2000 USD</p>

            <motion.button
              onClick={handleMaxValueClick}
              className="cursor-pointer bg-[#FFE6F2] rounded-[4px] py-[4px] px-[8px] text-[12px] font-medium text-[#FF007A]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Max Value
            </motion.button>
          </motion.aside>
        </motion.section>
      </motion.article>
      <motion.aside
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <DetailsPanel
          items={[{ title: "Transfer Collateral", value: "2000 USD" }]}
        />
      </motion.aside>
      <motion.section 
        className="flex flex-col gap-[16px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <Button
            text="Transfer"
            size="large"
            type="gradient"
            disabled={Number(valueInput)>0?false:true}
            onClick={handleTransferClick}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Button
            text="Flash Close"
            size="large"
            type="ghost"
            disabled={Number(valueInput)>0?false:true}
            onClick={handleTransferClick}
          />
        </motion.div>
      </motion.section>
    </motion.section>
  );
};


