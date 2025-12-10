import { useState } from "react";
import { Dropdown } from "../ui/dropdown";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownOptions } from "@/lib/constants";
import { depositPercentage, percentageColors } from "./collateral-box";
import { DetailsPanel } from "../ui/details-panel";
import { Button } from "../ui/button";

export const TransferCollateral = () => {
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
    <div className="flex flex-col justify-between gap-[24px] pt-8">
      <div className="flex flex-col gap-[24px] rounded-[16px] p-[20px] bg-[#FFFFFF] border-[1px] border-[#E2E2E2] ">
        <div className="">
          <motion.div
            key="editing"
            className="flex justify-between "
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
            <AnimatePresence mode="wait">
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
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="flex justify-between gap-[10px] items-center ">
          <div className="px-[10px] flex flex-col gap-[8px]">
            <div>
              <label htmlFor={`collateral-amount-input`} className="sr-only">
                Collateral amount
              </label>
              <input
                id={`collateral-amount-input`}
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
          </div>
          <div className="flex flex-col gap-[8px] items-end">
            <div className=" text-[10px] font-medium ">
              Transfer To: <span className="font-semibold">PB</span>
            </div>
            <div className="text-[20px] font-medium ">2000 USD</div>

            <button
              onClick={handleMaxValueClick}
              className="cursor-pointer bg-[#FFE6F2] rounded-[4px] py-[4px] px-[8px] text-[12px] font-medium text-[#FF007A] "
            >
              Max Value
            </button>
          </div>
        </div>
      </div>
      <div>
        <DetailsPanel
          items={[{ title: "Transfer Collateral", value: "2000 USD" }]}
        />
      </div>
      <div className="flex flex-col gap-[16px]">
        <div>
          <Button
            text="Transfer"
            size="large"
            type="gradient"
            disabled={Number(valueInput)>0?false:true}
            onClick={handleTransferClick}
          />
        </div>
        <div>
          <Button
            text="Flash Close"
            size="large"
            type="ghost"
            disabled={Number(valueInput)>0?false:true}
            onClick={handleTransferClick}
          />
        </div>
      </div>
    </div>
  );
};
