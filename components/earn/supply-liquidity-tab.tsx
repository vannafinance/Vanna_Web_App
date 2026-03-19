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
import { SwapIcon } from "@/components/icons";

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
        { id: "baseAPY", name: "Base APY (%)" },
        { id: "bonusAPY", name: "Bonus APY (%)" },
        { id: "rewardsAPY", name: "Rewards APY (%)" },
        { id: "youGetVETH", name: "You Get (vETH)" },
        { id: "ethPerVETH", name: "ETH per vETH" },
        { id: "currentAPY", name: "Current APY (%)" },
        { id: "projectedMonthlyFrom", name: "Projected Monthly Earnings (From)" },
        { id: "projectedMonthlyTo", name: "Projected Monthly Earnings (To)" },
        { id: "projectedYearlyFrom", name: "Projected Yearly Earnings (From)" },
        { id: "projectedYearlyTo", name: "Projected Yearly Earnings (To)" },
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
    if (selectedBalance === "WB") setIsBalanceBreakdownOpen(true);
  };

  const handleCloseBalanceBreakdown = () => setIsBalanceBreakdownOpen(false);

  return (
    <>
      <motion.form
        className={`flex flex-col sm:flex-row gap-4 sm:gap-[16px] items-stretch sm:items-center w-full h-fit border-[1px] rounded-[16px] p-3 sm:p-[16px] ${
          isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
      >
        {/* Left column: asset selector + amount */}
        <div className="w-full h-full flex flex-col gap-5 sm:gap-[44px] justify-between min-w-0 relative z-20">
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
                className={`w-full h-fit placeholder:text-[#C7C7C7] text-[16px] font-medium outline-none bg-transparent ${
                  isDark ? "text-white" : "text-[#111111]"
                }`}
                aria-describedby="usd-value"
              />
            </div>
            <output
              id="usd-value"
              className={`w-full h-fit text-[10px] font-medium ${
                isDark ? "text-[#919191]" : "text-[#76737B]"
              }`}
            >
              {valueInUSD.toFixed(2)}
            </output>
          </div>
        </div>

        {/* Right column: percentages + balance */}
        <div className="w-full sm:w-fit h-fit flex flex-col gap-4 sm:gap-[32px] items-start sm:items-end relative z-10">
          <fieldset className="w-full sm:w-fit h-fit flex flex-wrap gap-2 sm:gap-[8px]">
            <legend className="sr-only">Select deposit percentage</legend>
            {DEPOSIT_PERCENTAGES.map((item) => (
              <motion.button
                type="button"
                onClick={() => setSelectedPercentage(item)}
                key={item}
                className={`flex justify-center items-center cursor-pointer text-[13px] sm:text-[14px] font-semibold h-[40px] sm:h-[44px] rounded-[12px] px-[10px] ${
                  selectedPercentage === item
                    ? `${PERCENTAGE_COLORS[item]} text-white`
                    : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                }`}
                aria-pressed={selectedPercentage === item}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {item}%
              </motion.button>
            ))}
          </fieldset>

          <div className="w-full sm:w-fit h-fit flex flex-col items-start sm:items-end gap-[4px]">
            <fieldset className="flex w-fit h-fit rounded-[4px] gap-[4px] items-center">
              <legend className="sr-only">Select balance type</legend>
              <motion.button
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                PB
              </motion.button>
              <span
                className="w-[16px] h-[16px] flex items-center justify-center"
                aria-hidden="true"
              >
                <SwapIcon fill={isDark ? "#FFFFFF" : "#000000"} />
              </span>
              <motion.button
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                WB
              </motion.button>
            </fieldset>
            <output className="w-fit h-fit text-[10px] flex gap-[4px] font-semibold">
              <button
                type="button"
                onClick={handleBalanceBreakdownClick}
                className={`${
                  selectedBalance === "WB" ? "underline cursor-pointer" : ""
                } ${
                  isDark ? "text-white" : "text-[#111111]"
                } text-[10px] font-semibold`}
                disabled={selectedBalance !== "WB"}
              >
                {selectedBalance === "WB" ? "Unified Balance:" : "Balance:"}
              </button>
              <span className={isDark ? "text-white" : "text-[#363636]"}>
                {unifiedBalance.toFixed(2)}
              </span>
            </output>
          </div>
        </div>
      </motion.form>

      <motion.section
        className="flex flex-col gap-[8px]"
        aria-label="Supply Details"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" as const }}
      >
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" as const }}
      >
        <Button
          text={
            !userAddress
              ? "Connect Wallet"
              : value === 0
              ? "Enter Amount"
              : "Supply Liquidity"
          }
          size="large"
          type="gradient"
          disabled={value === 0}
        />
      </motion.div>

      <AnimatePresence>
        {isBalanceBreakdownOpen && (
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="balance-breakdown-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] px-4"
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
              className="w-full max-w-[420px]"
            >
              <AmountBreakdownDialogue
                heading={UNIFIED_BALANCE_BREAKDOWN_DATA.heading}
                asset={selectedOption}
                totalDeposit={unifiedBalance}
                breakdown={UNIFIED_BALANCE_BREAKDOWN_DATA.breakdown.map(
                  (item) => ({
                    name: item.name,
                    value: item.value,
                  }),
                )}
                onClose={handleCloseBalanceBreakdown}
              />
            </motion.article>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
