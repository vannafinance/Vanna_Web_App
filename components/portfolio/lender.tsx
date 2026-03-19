import { useMemo } from "react";
import { AccountStatsGhost } from "../earn/account-stats-ghost";
import { RewardsTable } from "../earn/rewards-table";
import { useTheme } from "@/contexts/theme-context";

export const Lender = () => {
    const { isDark } = useTheme();

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

  return (
    <div className="w-full h-fit flex flex-col gap-6 sm:gap-[40px]">
      <div className="w-full h-fit flex flex-col lg:flex-row gap-4 lg:gap-[20px]">
        <div className="w-full lg:w-[422px] h-fit flex flex-col gap-[14px]">
          <AccountStatsGhost items={accountStatsItems} type="background" gridCols="grid-cols-2" gridRows="grid-rows-2" />
          <RewardsTable />
        </div>

        <div className={`w-full h-[300px] sm:h-[551px] rounded-[20px] border-[1px] p-4 sm:p-[20px] ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}>
        </div>
      </div>
    </div>
  );
}