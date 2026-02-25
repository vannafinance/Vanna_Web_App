"use client"


import { useUserStore } from "@/store/user";
import { Button } from "../ui/button";
import { AccountStats } from "../margin/account-stats";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { Chart } from "../earn/chart";
import { netVolumeData } from "@/lib/constants/portfolio";

export const PortfolioSection = () => {
    const userAddress = useUserStore(user=>user.address)

    if (!userAddress) {
        return <div className="w-full h-[402px] bg-[#F7F7F7] rounded-[20px] border-[1px] p-[8px] flex flex-col items-center justify-center">
            <div className="w-[70px] h-fit ">
              <Button text="Login" size="small" type="solid" disabled={false} />  
            </div>
            
        </div>;
    }

    return <div className="w-full h-fit flex flex-col gap-[20px]">
        <AccountStats gridCols="grid-cols-2" items={ACCOUNT_STATS_ITEMS.slice(0, 4)} values={{
            netHealthFactor: !userAddress ? "-" : 1.0,
            collateralLeftBeforeLiquidation: !userAddress ? "-" : 1000,
            netAvailableCollateral: !userAddress ? "-" : 1000,
            netProfitLoss: !userAddress ? "-" : 1000,
          }}/>
          <div className="w-full h-fit flex gap-[24px] ">
            <Chart type="net-profit-loss" containerHeight="h-[331px]" containerWidth="w-full" />
            <Chart type="net-volume" containerHeight="h-[331px]" containerWidth="w-full" />
          </div>
    </div>;
}