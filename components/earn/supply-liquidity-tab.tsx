import { useState } from "react";
import { Dropdown } from "../ui/dropdown";
import { DropdownOptions } from "@/lib/constants";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS, UNIFIED_BALANCE_BREAKDOWN_DATA } from "@/lib/constants/margin";
import { InfoCard } from "../margin/info-card";
import { Button } from "../ui/button";
import { AmountBreakdownDialogue } from "../ui/amount-breakdown-dialogue";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";

const infoPropsData = {
  data: {
    youGetVETH: 100,
    ethPerVETH: 1.002889,

    currentAPY: 4.95,
    baseAPY: 2.79,
    bonusAPY: 0.25,
    rewardsAPY: 1.9,

    projectedMonthlyFrom: 0,
    projectedMonthlyTo: 100000,

    projectedYearlyFrom: 0,
    projectedYearlyTo: 100000,
  },

  expandableSections: [
    {
      title: "More Details",
      headingBold: false,
      defaultExpanded: false,
      items: [
        {
          id: "baseAPY",
          name: "Base APY (%)",
        },
        {
          id: "bonusAPY",
          name: "Bonus APY (%)",
        },
        {
          id: "rewardsAPY",
          name: "Rewards APY (%)",
        },
        {
          id: "youGetVETH",
          name: "You Get (vETH)",
        },
        {
          id: "ethPerVETH",
          name: "ETH per vETH",
        },
        {
          id: "currentAPY",
          name: "Current APY (%)",
        },
        {
          id: "projectedMonthlyFrom",
          name: "Projected Monthly Earnings (From)",
        },
        {
          id: "projectedMonthlyTo",
          name: "Projected Monthly Earnings (To)",
        },
        {
          id: "projectedYearlyFrom",
          name: "Projected Yearly Earnings (From)",
        },
        {
          id: "projectedYearlyTo",
          name: "Projected Yearly Earnings (To)",
        },
      ],
    },
  ],

  showExpandable: true,
};

export const SupplyLiquidityTab = () => {
  const { isDark } = useTheme();
  const [selectedOption, setSelectedOption] = useState<string>("USDT");
  const [valueInUSD, setValueInUSD] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const [selectedPercentage, setSelectedPercentage] = useState<number>(10);
  const [selectedBalance, setSelectedBalance] = useState<string>("PB");
  const [unifiedBalance, setUnifiedBalance] = useState<number>(0);
  const [isBalanceBreakdownOpen, setIsBalanceBreakdownOpen] = useState(false);
  const userAddress = useUserStore((state) => state.address);

  const handleBalanceBreakdownClick = () => {
    if (selectedBalance === "WB") {
      setIsBalanceBreakdownOpen(true);
    }
  };

  const handleCloseBalanceBreakdown = () => {
    setIsBalanceBreakdownOpen(false);
  };
  return (
    <>
      <form className={`flex gap-[16px] items-center w-full h-fit border-[1px] rounded-[16px] p-[16px] ${
        isDark ? "bg-[#111111] border-[#333333]" : "bg-[#FFFFFF] border-[#E2E2E2]"
      }`}>
        <div className="w-full h-full flex flex-col gap-[44px] justify-between">
          <div className="w-full h-fit">
            <label htmlFor="asset-select" className="sr-only">
              Select Asset
            </label>
            <Dropdown
              items={DropdownOptions}
              setSelectedOption={setSelectedOption}
              selectedOption={selectedOption}
              classname="w-fit gap-[4px] items-center"
              dropdownClassname="w-full"
            />
          </div>
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <div className="w-full h-fit">
              <label htmlFor="supply-amount" className="sr-only">
                Supply Amount
              </label>
              <input
                id="supply-amount"
                onChange={(e) => setValue(Number(e.target.value))}
                value={value}
                type="number"
                placeholder="Enter amount"
                className={`w-full h-fit placeholder:text-[#C7C7C7] text-[16px] font-medium outline-none ${
                  isDark ? "text-white bg-[#111111]" : "bg-white"
                }`}
                aria-describedby="usd-value"
              />
            </div>
            <output id="usd-value" className={`w-full h-fit text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              {valueInUSD.toFixed(2)}
            </output>
          </div>
        </div>
        <div className="w-fit h-fit flex flex-col gap-[32px] items-end">
          <fieldset className="w-full h-fit flex gap-[8px]">
            <legend className="sr-only">Select deposit percentage</legend>
            {DEPOSIT_PERCENTAGES.map((item) => {
              return (
                <button
                  type="button"
                  onClick={() => setSelectedPercentage(item)}
                  key={item}
                  className={`flex justify-center items-center cursor-pointer text-[14px] font-semibold w-fit h-[44px] rounded-[12px] p-[10px] ${
                    selectedPercentage === item
                      ? `${PERCENTAGE_COLORS[item]} text-white`
                      : isDark
                      ? "bg-[#222222] text-white"
                      : "bg-[#F4F4F4] text-black"
                  }`}
                  aria-pressed={selectedPercentage === item}
                >
                  {item}%
                </button>
              );
            })}
          </fieldset>
          <div className="w-fit h-fit flex flex-col items-end gap-[4px]">
            <fieldset className="flex w-fit h-fit rounded-[4px] gap-[4px] items-center">
              <legend className="sr-only">Select balance type</legend>
              <button
                type="button"
                onClick={() => setSelectedBalance("PB")}
                className={`w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium cursor-pointer ${
                  selectedBalance === "PB"
                    ? "bg-[#F1EBFD] text-[#703AE6]"
                    : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                }`}
                aria-pressed={selectedBalance === "PB"}
                aria-label="Protocol Balance"
              >
                PB
              </button>
              <span className="w-[16px] h-[16px] flex items-center justify-center" aria-hidden="true">
                <svg
                  width="12"
                  height="11"
                  viewBox="0 0 12 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.9986 6.75H0.125171C0.0564207 6.75 0.000170742 6.80625 0.000170742 6.875V7.8125C0.000170742 7.88125 0.0564207 7.9375 0.125171 7.9375H9.58142L7.32673 10.7969C7.26267 10.8781 7.32048 11 7.42517 11H8.55798C8.63455 11 8.70642 10.9656 8.75486 10.9047L11.3924 7.55937C11.6502 7.23125 11.4174 6.75 10.9986 6.75ZM11.3752 3.0625H1.91892L4.17361 0.203125C4.23767 0.121875 4.17986 0 4.07517 0H2.94236C2.8658 0 2.79392 0.0343751 2.74548 0.0953126L0.107983 3.44063C-0.149829 3.76875 0.0829833 4.25 0.500171 4.25H11.3752C11.4439 4.25 11.5002 4.19375 11.5002 4.125V3.1875C11.5002 3.11875 11.4439 3.0625 11.3752 3.0625Z"
                    fill={isDark ? "#FFFFFF" : "#000000"}
                  />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBalance("WB")}
                className={`w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium cursor-pointer ${
                  selectedBalance === "WB"
                    ? "bg-[#F1EBFD] text-[#703AE6]"
                    : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                }`}
                aria-pressed={selectedBalance === "WB"}
                aria-label="Wallet Balance"
              >
                WB
              </button>
            </fieldset>
            <output className="w-fit h-fit text-[10px] flex gap-[4px] font-semibold">
              <button
                type="button"
                onClick={handleBalanceBreakdownClick}
                className={`${selectedBalance==="WB"?"underline cursor-pointer":""} ${
                  isDark ? "text-white" : "text-[#111111]"
                } text-[10px] font-semibold`}
                disabled={selectedBalance !== "WB"}
              >
                {selectedBalance==="WB"?"Unified Balance:":"Balance:"}
              </button>
              <span className={isDark ? "text-white" : "text-[#363636]"}>
                {unifiedBalance.toFixed(2)}
              </span>
            </output>
          </div>
        </div>
      </form>
      <section className="flex flex-col gap-[8px]" aria-label="Supply Details">
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </section>
      <Button
        text={!userAddress ? "Connect Wallet" : value === 0 ? "Enter Amount" : "Supply Liquidity"}
        size="large"
        type="gradient"
        disabled={value === 0 ? true : false}
      />

      <AnimatePresence>
        {isBalanceBreakdownOpen && (
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="balance-breakdown-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseBalanceBreakdown}
          >
            <motion.article
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AmountBreakdownDialogue
                heading={UNIFIED_BALANCE_BREAKDOWN_DATA.heading}
                asset={selectedOption}
                totalDeposit={unifiedBalance}
                breakdown={UNIFIED_BALANCE_BREAKDOWN_DATA.breakdown.map(item => ({
                  name: item.name,
                  value: item.value
                }))}
                onClose={handleCloseBalanceBreakdown}
              />
            </motion.article>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

