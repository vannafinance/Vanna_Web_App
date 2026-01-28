"use client";

import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { PortfolioSection } from "@/components/portfolio/portfolio-section";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function PortfolioPage() {
  // Portfolio account stats items
  const accountStatsItems = useMemo(() => {
    return [
      {
        id: "1",
        name: "Total Assets",
        amount: "$1000",
      },
      {
        id: "2",
        name: "Net P&L",
        amount: "$1000",
      },
      {
        id: "3",
        name: "Total Volume",
        amount: "$1000",
      },
    ];
  }, []);

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
            <div className="w-[422px] h-fit">
                <AccountStatsGhost items={accountStatsItems} type="background" gridCols="grid-cols-2" gridRows="grid-rows-2" />
            </div>
            
        </div>
    </div>
  </div>;
}