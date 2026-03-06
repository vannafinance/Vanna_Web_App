import { useMemo } from "react";
import { AccountStatsGhost } from "../earn/account-stats-ghost";
import { AnimatedTabs } from "../ui/animated-tabs";
import { RewardsTable } from "../earn/rewards-table";
import { Chart } from "../earn/chart";

export const Lender = () => {

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

  return <div className="w-full h-fit flex flex-col gap-[40px]">
    <div className="w-full h-fit flex gap-[20px]">
      <div className="w-[422px] h-fit flex flex-col gap-[14px]">
                <AccountStatsGhost items={accountStatsItems} type="background" gridCols="grid-cols-2" gridRows="grid-rows-2" />
                <RewardsTable />
    </div>  

    <div className="h-[551px] w-[918px] rounded-[20px] border-[1px] p-[20px] bg-[#F7F7F7]">

    </div>
    </div>
            
  </div>;
}