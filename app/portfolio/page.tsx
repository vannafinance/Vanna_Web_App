"use client";

import { Lender } from "@/components/portfolio/lender";
import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";



export default function PortfolioPage() {
  // Portfolio account stats items
  const tabs = [
    { id: "lender", label: "Lender" },
    { id: "trader", label: "Trader" },
  ];
  const [activeTab, setActiveTab] = useState<string>("lender");

  return <div className="py-[80px] px-[40px] w-full h-fit ">
    <div className="flex flex-col gap-[40px] w-full h-fit ">
      <div className="flex flex-col gap-[20px] w-full h-fit">
        <div className="flex justify-between w-full items-center ">
          <div className="w-full text-[24px] font-bold text-black">Portfolio</div>
          <div className="w-full flex gap-[8px] justify-end ">
            <Button width="w-[79px]" text="Deposit" size="small" type="solid" disabled={false} />
            <Button width="w-[79px]" text="Withdraw" size="small" type="solid" disabled={false} />
            <Button width="w-[79px]" text="Transfer" size="small" type="solid" disabled={false} />
            <Button width="w-[79px]" text="History" size="small" type="solid" disabled={false} />
          </div>
        </div>

        <PortfolioSection />

        

      </div>
      <div className="w-full h-fit flex flex-col gap-[24px]">
          <AnimatedTabs type="underline" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} tabClassName="w-[120px] h-[40px] text-[16px]" containerClassName="w-full" />
          {activeTab === "lender" && <Lender />}
          {activeTab === "trader" && <div>Trader</div>}
        </div>
    </div>
  </div>;
}