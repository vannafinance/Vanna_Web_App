"use client";

import { Carousel } from "@/components/ui/carousel";
import { NetworkDropdown } from "@/components/network-dropdown";
import {
  accountStatsItems,
  carouselItems,
  DropdownOptions,
  marginAccountInfoItems,
  marginAccountMoreDetailsItems,
} from "@/lib/constants";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import ToggleButton from "@/components/ui/Toogle";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownOptionsType } from "@/lib/types";
import { LeverageSlider } from "@/components/ui/LeverageSlider";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Dialogue } from "@/components/ui/dialogue";

type Tabs = "Leverage your Assets" | "Repay Loan";
type Modes = "Deposit" | "Borrow";

const depositPercentage = [10, 25, 50, 100];

const percentageColors: Record<number, string> = {
  10: "bg-[#703AE6]",
  25: "bg-[#FC5457]",
  50: "bg-[#E63ABB]",
  100: "bg-[#FF007A]",
};

const maxLeverage = 10


const Margin = () => {
  const [activeTab, setActiveTab] = useState<Tabs>("Leverage your Assets");
  const [detailsTabExpand, setDetailsTabExpand] = useState(true);
  const [selectedDepositPercentage,setDepositPercentage] = useState<number>(10)
  const [oraclesTabExpand, setOraclesTabExpand] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<Tabs | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [accountStats, setAccountStats] = useState({
    netHealthFactor: 567777,
    collateralLeftBeforeLiquidation: 173663,
    netAvailableCollateral: 1000,
    netAmountBorrowed: 770,
    netProfitAndLoss: 0,
  });
  const [selectedCurrency, setSelectedCurrency] = useState<DropdownOptionsType>(
    DropdownOptions[0]
  );
  const [depositValue,setDepositValue] = useState<string>("0.0")
  const [leverage, setLeverage] = useState<number>(5);
  const [marginAccountInfo, setMarginAccountInfo] = useState({
    totalBorrowedValue: 100,
    totalCollateralValue: 2,
    totalValue: 0,
    avgHealthFactor: 0,
    timeToLiquidation: 0,
    borrowRate: 0,
    liquidationPremium: 0,
    liquidationFee: 0,
    debtLimit: 0,
    minDebt: 0,
    maxDebt: 0,
  });
  const [isCreateMarginDialogueOpen, setIsCreateMarginDialogueOpen] =
    useState(false);
  const [isSecondDialogueOpen, setIsSecondDialogueOpen] = useState(false);

  const displayTab = hoveredTab || activeTab;

  return (
    <div className=" w-full">
      <motion.div
        className="w-full pb-[30px] px-[80px] pt-[80px]"
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
      <motion.div
        className="pb-[30px] px-[80px] pt-[80px] w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="border-[1px] border-[#E2E2E2] bg-[#F7F7F7] rounded-[24px] ">
          <div className="grid grid-cols-3 gap-[20px] p-[20px]">
            {accountStatsItems.map((item, idx) => {
              return (
                <motion.div
                  className=" rounded-[10px] col-span-1"
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <div className="p-[20px] min-h-[146px] flex items-start gap-[16px]">
                    <motion.div
                      className=" w-[52px] h-[52px] flex flex-col justify-center items-center p-[2.89px] bg-white rounded-[69.33px] flex-shrink-0"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: idx * 0.1 + 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <Image
                        width={23.11}
                        height={23.11}
                        alt={item.id}
                        src={item.icon}
                      />
                    </motion.div>
                    <div className=" flex flex-col gap-[32px] flex-1">
                      <div className="flex flex-col justify-center  w-[284px] h-[50px] text-[20px]  font-semibold">
                        {item.name}
                      </div>
                      <motion.div
                        className="text-[32px] font-bold"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: idx * 0.1 + 0.3 }}
                      >
                        {item.id === "netHealthFactor" ? "" : "$"}
                        {accountStats[item.id as keyof typeof accountStats] ||
                          "0"}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
      <motion.div
        className="w-full p-[80px] flex flex-col gap-[48px]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="w-full flex gap-[20px] items-center"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-[34px] font-semibold">
            Leverage Your Collateral
          </div>
          <div className="flex-shrink-0">
            <NetworkDropdown />
          </div>
        </motion.div>
        <div className="flex gap-[36px]">
          <motion.div
            className="flex flex-col justify-between rounded-[26px] bg-[#E2E2E2] py-[36px] px-[16px] w-[691px] h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
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
            <div className="w-full flex flex-col gap-[36px] pt-8">
              <motion.div
                className="w-full flex justify-end text-[14px] font-medium gap-2 items-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
              >
                Deposit{" "}
                <ToggleButton
                  size="small"
                  onToggle={() => {
                    mode == "Borrow" ? setMode("Deposit") : setMode("Borrow");
                  }}
                />{" "}
                Borrow
              </motion.div>
              <motion.div
                className="w-full flex flex-col gap-[8px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="w-full text-[16px] font-medium">Deposit</div>
                <motion.div
                  className="w-full flex justify-between items-start h-[202px] p-[20px] bg-white rounded-[16px] border-[1px] border-[#E2E2E2]"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="h-full flex flex-col items-start justify-between p-[10px]">
                    <Dropdown
                      selectedOption={selectedCurrency}
                      setSelectedOption={setSelectedCurrency}
                      items={DropdownOptions}
                    />
                    <div className="h-[77px] flex flex-col gap-[8px] pr-[10px]">
                      <div>
                        <input type="text" placeholder="0.0" onChange={(e)=>{setDepositValue(e.target.value)}} value={depositValue} className="w-full focus:border-0 focus:outline-none text-[24px] font-semibold"></input>
                      </div>
                      
                      <div className="text-[12px] font-medium text-[#76737B]">
                        0.0
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-[8px]">
                    {depositPercentage.map((item, idx) => {
                      return (
                        <motion.div
                        className={`
                          ${selectedDepositPercentage === item 
                              ? `${percentageColors[item]} text-white`
                              : "bg-[#F4F4F4] text-black"
                          }
                          w-[95px] h-[44px] flex items-center justify-center
                          text-[14px] font-semibold rounded-[12px] cursor-pointer
                        `}
                        key={item}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={()=>{setDepositPercentage(item)}}
                        >
                          {item}%
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
                <motion.div
                  className="w-fit hover:cursor-pointer hover:bg-[#F1EBFD] py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
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
                      strokeWidth="1.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Collateral
                </motion.div>
              </motion.div>
              <motion.div
                className="w-full flex flex-col gap-[8px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              >
                <div className="w-full text-[16px] font-medium">Borrow</div>
                <motion.div
                  className="border-[1px] border-[#E2E2E2] w-[659px] bg-white py-[24px] px-[16px] rounded-[16px]"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="items-start h-full flex flex-col gap-[20px] p-[10px]">
                    <div className="flex items-center gap-[10px]">
                      <Dropdown
                        selectedOption={selectedCurrency}
                        setSelectedOption={setSelectedCurrency}
                        items={DropdownOptions}
                      />
                      <div className="bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px] rounded-[8px] flex-shrink-0">
                        <button
                          onClick={() => {
                            setLeverage(maxLeverage);
                          }}
                          className={`${leverage===maxLeverage?"bg-gradient text-white":"bg-white"} cursor-pointer w-full h-full  flex items-center justify-center py-[8px] px-[16px] rounded-[7px] text-[14px] font-medium text-[#181822] hover:opacity-90 transition-opacity whitespace-nowrap`}
                        >
                          Max Value
                        </button>
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
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <Button
                  disabled={false}
                  size="large"
                  text="Create your Margin Account"
                  type="gradient"
                  onClick={() => setIsCreateMarginDialogueOpen(true)}
                />
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-[20px] w-full h-full"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className="flex gap-[10px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="border-[1px] border-[#E2E2E2] flex flex-col justify-center items-center p-2 rounded-[11px] w-[62px] h-[62px]"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <Image
                  alt={"vanna"}
                  src={"/logos/vanna-icon.png"}
                  width={34.82}
                  height={31.28}
                />
              </motion.div>
              <div>
                <div className="w-full text-[24px] font-bold ">
                  Margin Account Info
                </div>
                <div className="w-full text-[16px] font-medium text-[#A3A3A3]">
                  Stay updated details and status.
                </div>
              </div>
            </motion.div>
            <motion.div
              className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {marginAccountInfoItems.map((item, idx) => {
                return (
                  <motion.div
                    key={item.id}
                    className="flex justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <div className="text-[14px] font-medium">{item.name}</div>
                    <div className="text-[14px] font-medium">
                      {marginAccountInfo[
                        item.id as keyof typeof marginAccountInfo
                      ] === 0 ||
                      marginAccountInfo[
                        item.id as keyof typeof marginAccountInfo
                      ] === null ||
                      marginAccountInfo[
                        item.id as keyof typeof marginAccountInfo
                      ] === undefined
                        ? "--"
                        : marginAccountInfo[
                            item.id as keyof typeof marginAccountInfo
                          ]}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            <motion.div
              className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
              <motion.div
                onClick={() => {
                  setDetailsTabExpand(!detailsTabExpand);
                }}
                className="items-center cursor-pointer flex justify-between text-[16px] font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                MORE DETAILS
                <motion.svg
                  width="13"
                  height="8"
                  viewBox="0 0 13 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ rotate: detailsTabExpand ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path
                    d="M11.91 8.38201e-05L12.97 1.06108L7.193 6.84008C7.10043 6.93324 6.99036 7.00717 6.8691 7.05761C6.74785 7.10806 6.61783 7.13403 6.4865 7.13403C6.35517 7.13403 6.22514 7.10806 6.10389 7.05761C5.98264 7.00717 5.87257 6.93324 5.78 6.84008L0 1.06108L1.06 0.00108375L6.485 5.42508L11.91 8.38201e-05Z"
                    fill="black"
                  />
                </motion.svg>
              </motion.div>
              <AnimatePresence>
                {detailsTabExpand && (
                  <motion.div
                    className="flex flex-col gap-[24px]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {marginAccountMoreDetailsItems.map((item, idx) => {
                      return (
                        <motion.div
                          key={item.id}
                          className="flex justify-between"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <div className="text-[14px] font-medium">
                            {item.name}
                          </div>
                          <div className="text-[14px] font-medium">
                            {marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === 0 ||
                            marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === null ||
                            marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === undefined
                              ? "--"
                              : marginAccountInfo[
                                  item.id as keyof typeof marginAccountInfo
                                ]}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
              <motion.div
                onClick={() => {
                  setOraclesTabExpand(!oraclesTabExpand);
                }}
                className="items-center cursor-pointer flex justify-between text-[16px] font-bold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ORACLES AND LTS
                <motion.svg
                  width="13"
                  height="8"
                  viewBox="0 0 13 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ rotate: oraclesTabExpand ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path
                    d="M11.91 8.38201e-05L12.97 1.06108L7.193 6.84008C7.10043 6.93324 6.99036 7.00717 6.8691 7.05761C6.74785 7.10806 6.61783 7.13403 6.4865 7.13403C6.35517 7.13403 6.22514 7.10806 6.10389 7.05761C5.98264 7.00717 5.87257 6.93324 5.78 6.84008L0 1.06108L1.06 0.00108375L6.485 5.42508L11.91 8.38201e-05Z"
                    fill="black"
                  />
                </motion.svg>
              </motion.div>
              <AnimatePresence>
                {oraclesTabExpand && (
                  <motion.div
                    className="flex flex-col gap-[24px]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {marginAccountMoreDetailsItems.map((item, idx) => {
                      return (
                        <motion.div
                          key={item.id}
                          className="flex justify-between"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <div className="text-[14px] font-medium">
                            {item.name}
                          </div>
                          <div className="text-[14px] font-medium">
                            {marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === 0 ||
                            marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === null ||
                            marginAccountInfo[
                              item.id as keyof typeof marginAccountInfo
                            ] === undefined
                              ? "--"
                              : marginAccountInfo[
                                  item.id as keyof typeof marginAccountInfo
                                ]}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      <AnimatePresence>
        {isCreateMarginDialogueOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCreateMarginDialogueOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                buttonOnClick={() => {
                  setIsCreateMarginDialogueOpen(false);
                  setIsSecondDialogueOpen(true);
                }}
                buttonText="Create Your Account"
                content={[
                  { line: "Connect your wallet to get started." },
                  {
                    line: "Confirm your Margin Account we will generate a unique address for you.",
                  },
                  { line: "Make a deposit to activate borrowing." },
                ]}
                heading="Create Margin Account"
                onClose={() => setIsCreateMarginDialogueOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSecondDialogueOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsSecondDialogueOpen(false)}
          >
            <motion.div
              className="w-full max-w-[891px]"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                description="Before you proceed, please review and accept the terms of borrowing on VANNA. This agreement ensures you understand the risks, responsibilities, and conditions associated with using the platform."
                buttonOnClick={() => {
                  setIsSecondDialogueOpen(false);
                }}
                buttonText="Sign Agreement"
                content={[
                  {
                    line: "Collateral Requirement",
                    points: [
                      "All borrowed positions must remain fully collateralized.",
                      "If collateral value falls below the liquidation threshold, your position may be liquidated.",
                    ],
                  },
                  {
                    line: "Borrow Limits & Leverage",
                    points: [
                      "You may only borrow assets up to the maximum Loan-to-Value (LTV) allowed.",
                      "Leverage is enabled only when collateral value supports it.",
                    ],
                  },
                  {
                    line: "Interest & Fees",
                    points: [
                      "Interest rates are variable and accrue in real time.",
                      "Additional protocol fees may apply for borrowing or liquidation events.",
                    ],
                  },
                  {
                    line: "Liquidation Risk",
                    points: [
                      "Market volatility can reduce collateral value.",
                      "If your position health factor drops below safe limits, collateral may be partially or fully liquidated without prior notice.",
                    ],
                  },
                  {
                    line: "User Responsibility",
                    points: [
                      "You are responsible for monitoring your positions, balances, and risks.",
                      "VANNA is a non-custodial protocol; all actions are initiated by your wallet.",
                    ],
                  },
                  {
                    line: "No Guarantee of Returns",
                    points: [
                      "Using borrowed assets in trading, farming, or external protocols involves risk.",
                      "VANNA does not guarantee profits or protection against losses.",
                    ],
                  },
                ]}
                heading="Review and Sign Agreement"
                checkboxContent="I have read and agree to the VANNA Borrow Agreement."
                onClose={() => setIsSecondDialogueOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Margin;
