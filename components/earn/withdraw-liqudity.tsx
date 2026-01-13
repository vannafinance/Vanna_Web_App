import { useState } from "react";
import { Dropdown } from "../ui/dropdown";
import { DropdownOptions } from "@/lib/constants";
import { InfoCard } from "../margin/info-card";
import { Button } from "../ui/button";
import { useUserStore } from "@/store/user";
import Image from "next/image";
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

export const WithdrawLiquidity = () => {
  const { isDark } = useTheme();
  const [selectedOption, setSelectedOption] = useState<string>("USDT");
  const [valueInUSD, setValueInUSD] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const userAddress = useUserStore((state) => state.address);

  return (
    <>
      <form className={`flex gap-[16px] items-start w-full h-fit border-[1px] rounded-[16px] p-[16px] ${
        isDark ? "bg-[#111111] border-[#333333]" : "bg-[#FFFFFF] border-[#E2E2E2]"
      }`}>
        <div className="w-full h-full flex flex-col gap-[44px] justify-between">
          <div className="w-fit h-fit flex items-center gap-[4px]">
            <span className="w-[20px] h-[20px]">
              <Image src={"/icons/eth-icon.png"} alt="vETH token icon" width={20} height={20} />
            </span>
            <h3 className={`text-[14px] font-semibold ${
              isDark ? "text-white" : "text-[#111111]"
            }`}>
              vETH
            </h3>
          </div>
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <div className="w-full h-fit">
              <label htmlFor="withdraw-amount" className="sr-only">
                Withdraw Amount
              </label>
              <input
                id="withdraw-amount"
                onChange={(e) => setValue(Number(e.target.value))}
                value={value}
                type="number"
                placeholder="Enter amount"
                className={`w-fit h-fit placeholder:text-[#C7C7C7] text-[16px] font-medium outline-none ${
                  isDark ? "text-white bg-[#111111]" : "bg-white"
                }`}
                aria-describedby="withdraw-usd-value"
              />
            </div>
            <output id="withdraw-usd-value" className={`w-full h-fit text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              {valueInUSD.toFixed(2)}
            </output>
          </div>
        </div>
        <div className="w-fit h-fit flex flex-col items-end self-end">
          <fieldset className="w-fit h-fit flex flex-col items-end gap-[4px]">
            <legend className={`text-[10px] font-semibold ${
              isDark ? "text-[#919191]" : "text-[#363636]"
            }`}>
              Transfer to:
            </legend>

            <span
              className="text-center w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium bg-[#F1EBFD] text-[#703AE6]"
              role="status"
              aria-label="Protocol Balance"
            >
              PB
            </span>
            <output className={`w-fit h-fit text-[10px] flex gap-[4px] font-semibold ${
              isDark ? "text-white" : ""
            }`}>
              Balance:{" "}
              <span className={`font-semibold text-[10px] ${
                isDark ? "text-white" : "text-[#363636]"
              }`}>
                {value.toFixed(2)}
              </span>
            </output>
          </fieldset>
        </div>
      </form>
      <section className="flex flex-col gap-[8px]" aria-label="Withdraw Details">
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </section>
      <Button
        text={
          !userAddress
            ? "Connect Wallet"
            : value === 0
            ? "Enter Amount"
            : "Withdraw Liquidity"
        }
        size="large"
        type="gradient"
        disabled={value === 0 ? true : false}
      />
    </>
  );
};
