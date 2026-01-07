import { useState } from "react";
import { StatsCard } from "../ui/stats-card";
import { getPercentage } from "@/lib/utils/helper";
import { formatValue } from "@/lib/utils/format-value";

const maxEth = 200000;
const maxUsd = 200000;

const addresses = [
  {
    heading: "Underlying ETH token",
    address: "0x8292...17eD",
    tooltip: "Address of the underlying ETH token",
  },
  {
    heading: "ETH vault",
    address: "0xaf53...9BB2",
    tooltip: "Vault contract holding ETH liquidity",
  },
  {
    heading: "Risk Curator",
    address: "0x9453...5685",
    tooltip: "Manages protocol risk parameters",
  },
  {
    heading: "Fee Receiver",
    address: "0xbE6b...EDF3",
    tooltip: "Receives protocol fees",
  },
  {
    heading: "Oracle router address",
    address: "0xD188...2F47",
    tooltip: "Routes price data from oracles",
  },
  {
    heading: "Interest rate model address",
    address: "0xfBae...8BcC",
    tooltip: "Defines borrowing and lending interest rates",
  },
];

const items = [
  {
    heading: "Available Liquidity",
    mainInfo: "102.24k ETH",
    subInfo: "$361.98M",
    tooltip: "Total ETH available for borrowing",
  },
  {
    heading: "Supply APY",
    mainInfo: "7.74%",
    subInfo: "$119.95M of $631.17M",
    tooltip: "Annual percentage yield for suppliers",
  },
  {
    heading: "Borrow APY",
    mainInfo: "8.57%",
    tooltip: "Annual percentage yield for borrowers",
  },
  {
    heading: "Utilization Rate",
    mainInfo: "24.34%",
    tooltip: "Ratio of borrowed assets to supplied assets",
  },
  {
    heading: "Liquidation Penalty",
    mainInfo: "Dynamic Range",
    subInfo: "0–15%",
    tooltip: "Penalty applied during liquidation events",
  },
  {
    heading: "Oracle Price",
    mainInfo: "$3506.48",
    tooltip: "Current oracle price of ETH",
  },
  {
    heading: "Share Token Exchange Rate",
    mainInfo: "1.002889",
    tooltip: "Exchange rate between share token and ETH",
  },
];

export const Details = () => {
  const [totalSupplied, setTotalSupplied] = useState({
    inEth: 100000,
    inUsd: 4700,
  });
  const [totalBorrowed, setTotalBorrowed] = useState({
    inEth: 134000,
    inUsd: 4700,
  });

  return (
    <div className="w-full h-fit flex flex-col gap-[16px] rounded-[20px] border-[1px] border-[#E2E2E2] bg-[#F4F4F4] ">
      <div className="w-full h-fit rounded-[20px] pt-[24px] px-[24px] flex flex-col gap-[16px] ">
        <div className="w-full h-fit text-[20px] font-semibold">Statistics</div>
        <div className="w-full h-fit flex items-center rounded-[16px]  gap-[12px] bg-[#FFFFFF] ">
          <StatsCard
            percentage={getPercentage(totalSupplied.inEth, maxEth)}
            heading="Total Supplied"
            mainInfo={`${formatValue(totalSupplied.inEth, {
              type: "number",
              useLargeFormat: true,
            })} ETH of ${formatValue(maxEth, {
              type: "number",
              useLargeFormat: true,
            })} ETH`}
            subInfo={`${formatValue(totalSupplied.inUsd, {
              type: "number",
              useLargeFormat: true,
            })} USD of ${formatValue(maxUsd, {
              type: "number",
              useLargeFormat: true,
            })} USD`}
            pie={true}
          />
          <StatsCard
            percentage={getPercentage(totalBorrowed.inEth, maxEth)}
            heading="Total Borrowed"
            mainInfo={`${formatValue(totalBorrowed.inEth, {
              type: "number",
              useLargeFormat: true,
            })} ETH of ${formatValue(maxEth, {
              type: "number",
              useLargeFormat: true,
            })} ETH`}
            subInfo={`${formatValue(totalBorrowed.inUsd, {
              type: "number",
              useLargeFormat: true,
            })} USD of ${formatValue(maxUsd, {
              type: "number",
              useLargeFormat: true,
            })} USD`}
            pie={true}
          />
        </div>
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-x-[15px]">
          {items.map((item, idx) => {
            return (
              <StatsCard
                key={idx}
                heading={item.heading}
                mainInfo={item.mainInfo}
                subInfo={item.subInfo}
                tooltip={item.tooltip}
              />
            );
          })}
        </div>
        <div className="w-full h-fit rounded-[20px] pb-[24px] ">
          <div className="text-[20px] font-semibold w-full h-fit ">
            Adresses
          </div>
          <div className="w-full h-full grid grid-cols-3 grid-rows-2 ">
            {addresses.map((item, idx) => {
              return (
                <StatsCard
                  key={idx}
                  heading={item.heading}
                  address={item.address}
                  tooltip={item.tooltip}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
