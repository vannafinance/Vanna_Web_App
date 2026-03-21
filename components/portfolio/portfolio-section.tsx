"use client"

import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "../ui/button";
import { AccountStats } from "../margin/account-stats";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { Chart } from "../earn/chart";

export const PortfolioSection = () => {
    const userAddress = useUserStore(user=>user.address)
    const { isDark } = useTheme();

    if (!userAddress) {
        return (
          <div className={`w-full h-auto min-h-[160px] sm:min-h-[200px] sm:h-[402px] ${isDark ? "bg-[#1a1a1a]" : "bg-[#F7F7F7]"} rounded-[16px] sm:rounded-[20px] border-[1px] flex flex-col items-center justify-center gap-3`}>
            <p className={`text-[13px] ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>Connect wallet to view portfolio</p>
            <div className="w-[80px] h-fit">
              <Button text="Login" size="small" type="solid" disabled={false} />
            </div>
          </div>
        );
    }

    return (
      <div className="w-full h-fit flex flex-col gap-4 sm:gap-[20px]">
        <AccountStats gridCols="grid-cols-1 sm:grid-cols-2" items={ACCOUNT_STATS_ITEMS.slice(0, 4)} values={{
            netHealthFactor: !userAddress ? "-" : 1.0,
            collateralLeftBeforeLiquidation: !userAddress ? "-" : 1000,
            netAvailableCollateral: !userAddress ? "-" : 1000,
            netProfitLoss: !userAddress ? "-" : 1000,
          }}/>
        <div className="w-full h-fit flex flex-col sm:flex-row gap-4 sm:gap-[24px]">
          <Chart type="net-profit-loss" containerHeight="h-[260px] sm:h-[331px]" containerWidth="w-full" />
          <Chart type="net-volume" containerHeight="h-[260px] sm:h-[331px]" containerWidth="w-full" />
        </div>
      </div>
    );
}