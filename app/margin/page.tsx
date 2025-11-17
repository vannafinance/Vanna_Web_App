"use client";

import { Carousel } from "@/components/ui/carousel";
import { NetworkDropdown } from "@/components/network-dropdown";
import { carouselItems, DropdownOptions } from "@/lib/constants";
import { motion } from "framer-motion";
import { useState } from "react";
import ToggleButton from "@/components/ui/Toogle";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownOptionsType } from "@/lib/types";
import { LeverageSlider } from "@/components/ui/LeverageSlider";
import { Button } from "@/components/ui/button";

type Tabs = "Leverage your Assets" | "Repay Loan";
type Modes = "Deposit" | "Borrow";
const depositLevels = [10, 25, 50, 100];

const Margin = () => {
  const [activeTab, setActiveTab] = useState<Tabs>("Leverage your Assets");
  const [hoveredTab, setHoveredTab] = useState<Tabs | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [selectedCurrency, setSelectedCurrency] = useState<DropdownOptionsType>(
    DropdownOptions[0]
  );
  const [leverage, setLeverage] = useState<number>(5);
  const [maxLeverage,seLeverage] = useState<number>(10); 
  const displayTab = hoveredTab || activeTab;

  return (
    <div className="w-full">
      <motion.div
        className="w-full pb-[48px] px-[80px] pt-[80px]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <Carousel items={carouselItems} autoplayInterval={5000} />
      </motion.div>
      <div className="w-full p-[80px] flex flex-col gap-[48px]">
        <div className="w-full flex gap-[20px] items-center">
          <div className="text-[34px] font-semibold">
            Leverage Your Collateral
          </div>
          <div className="flex-shrink-0">
            <NetworkDropdown />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[26px] bg-[#E2E2E2] py-[36px] px-[16px] w-[691px] h-[893px]">
          <div className="w-full bg-white flex p-[6px] rounded-[16px] h-[79px] relative overflow-hidden">
            <motion.div
              className="absolute top-[6px] left-[6px] h-[67px] rounded-[16px] bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px]"
              style={{ width: "calc(50% - 6px)" }}
              initial={false}
              animate={{
                x: displayTab === "Leverage your Assets" ? 0 : "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
              }}
            >
              <div className="bg-white rounded-[14px] h-full w-full" />
            </motion.div>

            <motion.div
              onClick={() => {
                setActiveTab("Leverage your Assets");
              }}
              onMouseEnter={() => {
                setHoveredTab("Leverage your Assets");
              }}
              onMouseLeave={() => {
                setHoveredTab(null);
              }}
              className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
              animate={{
                color:
                  hoveredTab === "Leverage your Assets" ||
                  activeTab === "Leverage your Assets"
                    ? "#000000"
                    : "#64748b",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              Leverage your Assets
            </motion.div>

            <motion.div
              onClick={() => {
                setActiveTab("Repay Loan");
              }}
              onMouseEnter={() => {
                setHoveredTab("Repay Loan");
              }}
              onMouseLeave={() => {
                setHoveredTab(null);
              }}
              className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
              animate={{
                color:
                  hoveredTab === "Repay Loan" || activeTab === "Repay Loan"
                    ? "#000000"
                    : "#64748b",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              Repay Loan
            </motion.div>
          </div>
          <div className="w-full flex flex-col gap-[34px]">
            <div className="w-full flex justify-end text-[14px] font-medium gap-2 items-center">
              Deposit{" "}
              <ToggleButton
                size="small"
                onToggle={() => {
                  mode == "Borrow" ? setMode("Deposit") : setMode("Borrow");
                }}
              />{" "}
              Borrow
            </div>
            <div className="w-full flex flex-col gap-[8px]">
              <div className="w-full text-[16px] font-medium">
                Deposit
              </div>
              <div className="w-full flex justify-between items-start h-[202px] p-[20px] bg-white rounded-[16px] border-[1px] border-[#E2E2E2]">
                <div className="h-full flex flex-col justify-between p-[10px]">
                  <Dropdown
                    selectedOption={selectedCurrency}
                    setSelectedOption={setSelectedCurrency}
                    items={DropdownOptions}
                  />
                  <div className="h-[77px] flex flex-col gap-[8px] pr-[10px]">
                    <div className="text-[24px] font-semibold">
                      2000
                    </div>
                    <div className="text-[12px] font-medium text-[#76737B]">
                      0.0
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-[8px]">
                  {depositLevels.map((item) => {
                    return (
                      <div
                        className="w-[95px] h-[44px] flex items-center justify-center text-[14px] font-semibold rounded-[12px] bg-[#703AE6] text-white cursor-pointer hover:opacity-90 transition-opacity"
                        key={item}
                      >
                        {item}%
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="hover:cursor-pointer py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center">
                  <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.33332 0.666748V10.0001M0.666656 5.33341H9.99999"
                    stroke="#703AE6"
                    stroke-width="1.33333"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>                
                Add Collateral
              </div>
            </div>
            <div className="w-full flex flex-col gap-[8px]">
              <div className="w-full text-[16px] font-medium">
                Borrow
              </div>
              <div className="border-[1px] border-[#E2E2E2] w-[659px] bg-white py-[24px] px-[16px] rounded-[16px]">
                <div className="items-start h-full flex flex-col gap-[20px] p-[10px]">
                  <div className="flex items-center gap-[10px]">
                    <Dropdown
                      selectedOption={selectedCurrency}
                      setSelectedOption={setSelectedCurrency}
                      items={DropdownOptions}
                    />
                    <div className="bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px] rounded-[8px] flex-shrink-0">
                      <button onClick={()=>{setLeverage(maxLeverage)}} className="cursor-pointer w-full h-full bg-white flex items-center justify-center py-[8px] px-[16px] rounded-[7px] text-[14px] font-medium text-[#181822] hover:opacity-90 transition-opacity whitespace-nowrap">Max Value</button>
                    </div>
                  </div>
                  
                  <div className="w-full">
                    <LeverageSlider
                      min={0}
                      max={10}
                      step={0.01}
                      value={leverage}
                      onChange={setLeverage}
                      markers={[0, 2, 4, 6, 8, 10]}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Button disabled={false} size="large" text="Create your Margin Account" type="gradient"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Margin;
