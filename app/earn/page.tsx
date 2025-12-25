"use client";

import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { AccountStats } from "@/components/margin/account-stats";
import { tableBody, tableHeadings } from "@/lib/constants/earn";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { useUserStore } from "@/store/user";

export default function Earn() {
  const userAddress = useUserStore((state) => state.address);
  return (
    <div>
      {userAddress && (
        <div className="p-[40px] w-full h-fit  flex gap-[24px]  ">
          <div className="flex gap-[24px] w-full h-fit ">
            <div className="w-[732px] h-[510px]">
              <Chart type="overall-deposit" currencyTab={true} />
            </div>
            <div className="flex-1 min-w-0">
              <Chart type="deposit-apy" />
            </div>
            <div></div>
          </div>
        </div>
      )}

      <div className="h-[206px] w-full pt-[40px] px-[40px]">
        <AccountStats
          items={ACCOUNT_STATS_ITEMS.slice(0, 3)}
          values={{
            netHealthFactor: !userAddress ? "-" : 1.0,
            collateralLeftBeforeLiquidation: !userAddress ? "-" : 1000,
            netAvailableCollateral: !userAddress ? "-" : 1000,
          }}
        />
      </div>

      <div className="p-[40px] w-full h-fit ">
        <Table
            
          filters={{
            filters: ["Deposit", "Collateral"],
            allChainDropdown: true,
          }}
          heading={{
            tabsItems: [
              { id: "vaults", label: "Vaults" },
              { id: "positions", label: "Positions" },
            ],
            tabType: "underline",
          }}
          tableHeadings={tableHeadings}
          tableBody={tableBody}
        />
      </div>
    </div>
  );
}
