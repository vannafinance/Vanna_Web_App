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
import { useEarnVaultStore } from "@/store/earn-vault-store";

export default function Earn() {
  const userAddress = useUserStore((state) => state.address);
  const setSelectedVault = useEarnVaultStore((state) => state.set);
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
      const cells = row.cell;
      const id = cells[0]?.title;
      
      if (id) {
        // Save selected vault data to store
        const vaultData = {
          id: id,
          chain: cells[0]?.chain || "ETH",
          title: cells[0]?.title || "",
          tag: cells[0]?.tag || "Active",
          assetsSupplied: {
            title: cells[1]?.title || "",
            tag: cells[1]?.tag || "",
          },
          supplyApy: {
            title: cells[2]?.title || "",
            tag: cells[2]?.tag || "",
          },
          assetsBorrowed: {
            title: cells[3]?.title || "",
            tag: cells[3]?.tag || "",
          },
          borrowApy: {
            title: cells[4]?.title || "",
            tag: cells[4]?.tag || "",
          },
          utilizationRate: {
            title: cells[5]?.title || "",
            tag: cells[5]?.tag || "",
          },
          collateral: {
            onlyIcons: cells[6]?.onlyIcons || [],
            tag: cells[6]?.tag || "Collateral",
          },
        };
        
        setSelectedVault({ selectedVault: vaultData });
        router.push(`/earn/${id}`);
      }
    },
    [router, setSelectedVault]
  );
  return (
    <main>
      {userAddress && (
        <section className="p-[40px] w-full h-fit flex gap-[24px]" aria-label="User Dashboard">
          <div className="flex gap-[16px] w-full h-fit">
            <article className="w-[437.33px] h-fit">
              <Chart containerWidth="w-[437.33px]" containerHeight="h-[331px]" type="overall-deposit" />
            </article>
            <article className="w-[437.33px] h-fit">
              <Chart containerWidth="w-[437.33px]" containerHeight="h-[331px]" type="net-apy" />
            </article>
            <aside className="w-full h-fit">
              <RewardsTable />
            </aside>
          </div>
        </section>
      )}

      <section className="h-[206px] w-full pt-[40px] px-[40px]" aria-label="Account Statistics">
        <AccountStats
          items={ACCOUNT_STATS_ITEMS.slice(0, 3)}
          values={{
            netHealthFactor: !userAddress ? "-" : 1.0,
            collateralLeftBeforeLiquidation: !userAddress ? "-" : 1000,
            netAvailableCollateral: !userAddress ? "-" : 1000,
          }}
        />
      </section>

      <section className="p-[40px] w-full h-fit" aria-label="Vaults and Positions">
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
      </section>
    </main>
  );
}
