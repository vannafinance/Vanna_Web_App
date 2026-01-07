import { useState } from "react";
import { Dropdown } from "../ui/dropdown";
import { DropdownOptions } from "@/lib/constants";
import { InfoCard } from "../margin/info-card";
import { Button } from "../ui/button";
import { useUserStore } from "@/store/user";
import Image from "next/image";

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
  const [selectedOption, setSelectedOption] = useState<string>("USDT");
  const [valueInUSD, setValueInUSD] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const userAddress = useUserStore((state) => state.address);

  return (
    <>
      <div className="flex gap-[16px] items-start w-full h-fit border-[1px] border-[#E2E2E2] rounded-[16px] bg-[#FFFFFF] p-[16px]">
        <div className="w-full h-full flex flex-col gap-[44px] justify-between">
          <div className="w-fit h-fit flex items-center gap-[4px]">
            <div className="w-[20px] h-[20px] ">
                <Image src={"/icons/eth-icon.png"} alt="eth-icon" width={20} height={20} />
            </div>
            <div className="text-[14px] font-semibold text-[#111111]">
                vETH
            </div>
          </div>
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <div className="w-full h-fit ">
              <input
                onChange={(e) => setValue(Number(e.target.value))}
                value={value}
                type="text"
                placeholder="Enter amount"
                className="w-full h-fit placeholder:text-[#CCCCCC] text-[16px] font-medium outline-none "
              />
            </div>
            <div className="w-full h-fit text-[10px] font-medium text-[#76737B]">
              {valueInUSD.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="w-fit h-fit flex flex-col items-end self-end">
          <div className="w-fit h-fit flex flex-col items-end  gap-[4px] ">
            <div className="text-[10px] font-semibold text-[#363636]">
              Transfer to:
            </div>

            <div
              className={`text-center w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium cursor-pointer bg-[#F1EBFD] text-[#703AE6]`}
            >
              PB
            </div>
            <div className="w-fit h-fit text-[10px] flex  gap-[4px] font-semibold  ">
              Balance:{" "}
              <span className="text-[#363636] font-semibold text-[10px]">
                {value.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </div>
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
