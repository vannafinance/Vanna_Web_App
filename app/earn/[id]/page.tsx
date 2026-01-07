"use client";

import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { Form } from "@/components/earn/form";
import { Details } from "@/components/earn/details-tab";
import { YourPositions } from "@/components/earn/your-positions";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import Image from "next/image";
import { useState, use } from "react";
import { ActivityTab } from "@/components/earn/acitivity-tab";
import { AnalyticsTab } from "@/components/earn/analytics-tab";
import { MarginManagersTab } from "@/components/earn/margin-managers-tab";
import { CollateralLimitsTab } from "@/components/earn/collateral-limits-tab";

const tabs = [
  { id: "your-positions", label: "Your Positions" },
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
  { id: "collateral-limits", label: "Collateral and Limits" },
  { id: "analytics", label: "Analytics" },
  { id: "margin-managers", label: "Margin Managers" },
];

export default function EarnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<string>("your-positions");
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col gap-[40px]">
      <div className="pt-[40px] px-[80px] w-full h-fit ">
        <div className="w-full h-fit flex flex-col gap-[20px]">
          <div className="w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium text-[#5A5555] ">
            <svg
              width="9"
              height="16"
              viewBox="0 0 9 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 1L1 8L8 15"
                stroke="#5A5555"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to pools
          </div>
          <div className="w-full h-fit flex gap-[16px] items-center ">
            <div className="flex gap-[16px]">
              <Image
                src={"/icons/eth-icon.png"}
                alt="eth-icon"
                width={36}
                height={36}
              />
              <div className="w-fit h-fit flex gap-[8px] items-center ">
                <div className="w-fit h-fit text-[24px] font-bold text-[#181822]">
                  ETH
                </div>
                <div className="w-fit h-fit flex gap-[8px] items-center ">
                  <div className="text-[12px] font-semibold text-[#0C0C0C]  text-center w-fit h-fit rounded-[4px] bg-[#F4F4F4] py-[2px] px-[6px] ">
                    V3
                  </div>
                  <div className="text-[12px] font-semibold text-[#0C0C0C]  text-center w-fit h-fit rounded-[4px] bg-[#F4F4F4] py-[2px] px-[6px] ">
                    Active
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[16px] font-semibold w-fit h-[48px] rounded-[12px] py-[12px] pr-[16px] pl-[8px] flex gap-[4px] bg-[#F4F4F4] ">
              Network:{" "}
              <Image
                src={"/icons/eth-icon.png"}
                alt="eth-icon"
                width={20}
                height={20}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="px-[80px] ">
        <AccountStatsGhost />
      </div>

      <div className="px-[80px] pb-[80px] w-full h-fit ">
        <div className="flex gap-[20px] w-full h-fit ">
          <div className="w-[780px] h-full flex flex-col gap-[24px] ">
            <div className="w-full h-[48px]">
              <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                type="underline"
                tabClassName="w-[130px] h-[48px] text-[12px]"
                containerClassName="w-[780px]"
              />
            </div>
            {activeTab === "your-positions" && <YourPositions />}
            {activeTab === "details" && <Details />}
            {activeTab === "activity" && <ActivityTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "margin-managers" && <MarginManagersTab />}
            {activeTab === "collateral-limits" && <CollateralLimitsTab />}
          </div>
          <Form />
        </div>
      </div>
    </div>
  );
}
