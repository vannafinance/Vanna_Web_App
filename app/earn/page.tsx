"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { AccountStats } from "@/components/margin/account-stats";
import { tableBody, tableHeadings } from "@/lib/constants/earn";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { useUserStore } from "@/store/user";
import { RewardsTable } from "@/components/earn/rewards-table";

export default function Earn() {
  const userAddress = useUserStore((state) => state.address);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("vaults");
  
  // Tab-based data - you can pass different data for each tab
  const getTableDataForTab = (tabId: string) => {
    // For now, using same data for both tabs
    // You can customize this to return different data based on tabId
    if (tabId === "vaults") {
      return tableBody;
    } else if (tabId === "positions") {
      // Return empty data for positions tab to test empty state
      return { rows: [] };
    }
    return { rows: [] };
  };

  // Handle row click - navigate to earn detail page
  const handleRowClick = useCallback(
    (row: any, rowIndex: number) => {
      const id = row.cell[0]?.title;
      if (id) {
        router.push(`/earn/${id}`);
      }
    },
    [router]
  );
  return (
    <div>
      {userAddress && (
        <div className="p-[40px] w-full h-fit  flex gap-[24px]  ">
          <div className="flex gap-[16px] w-full h-fit ">
            <div className="w-[437.33px] h-fit">
              <Chart containerWidth="w-[437.33px]" containerHeight="h-[331px]" type="overall-deposit" />
            </div>
            <div className="w-[437.33px] h-fit" >
              <Chart containerWidth="w-[437.33px]" containerHeight="h-[331px]" type="net-apy" />
            </div>
            <div className="w-full h-fit">
              <RewardsTable />
            </div>
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
            supplyApyTab: true,
          }}
          heading={{
            tabsItems: [
              { id: "vaults", label: "Vaults" },
              { id: "positions", label: "Positions" },
            ],
            tabType: "underline",
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tableHeadings={tableHeadings}
          tableBody={getTableDataForTab(activeTab)}
          onRowClick={handleRowClick}
          hoverBackground="hover:bg-[#F1EBFD]"
        />
      </div>
    </div>
  );
}
