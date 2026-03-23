"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { AccountStats } from "@/components/margin/account-stats";
import { tableHeadings } from "@/lib/constants/earn";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { useUserStore } from "@/store/user";
import { RewardsTable } from "@/components/earn/rewards-table";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { useEarnTableData } from "@/lib/hooks/useEarnTableData";
import { useOverallDepositHistory, useNetAPYHistory } from "@/lib/hooks/useUserTotalPositions";

export default function Earn() {
  const userAddress = useUserStore((state) => state.address);
  const setSelectedVault = useEarnVaultStore((state) => state.set);
  const router = useRouter();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState("vaults");

  // Fetch real blockchain data for the table
  const { tableData, loading: tableLoading } = useEarnTableData();

  // Fetch user's overall deposit and APY history
  const { depositHistory, currentTotal, loading: depositLoading } = useOverallDepositHistory();
  const { apyHistory, totalEarnings, loading: apyLoading } = useNetAPYHistory();

  // Tab-based data - you can pass different data for each tab
  const getTableDataForTab = (tabId: string) => {
    if (tabId === "vaults") {
      // Return real blockchain data
      return tableData;
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
      <section className="p-[40px] w-full h-fit flex gap-[24px]" aria-label="Protocol Dashboard">
        <div className="flex gap-[16px] w-full h-fit">
          <article className="w-[437.33px] h-fit">
            {depositLoading ? (
              <div className="w-[437.33px] h-[331px] flex items-center justify-center border rounded-[16px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#703AE6]"></div>
                  <p className="text-[#999999] text-xs">Loading deposits...</p>
                </div>
              </div>
            ) : (
              <Chart
                containerWidth="w-[437.33px]"
                containerHeight="h-[331px]"
                type="overall-deposit"
                customData={depositHistory}
              />
            )}
          </article>
          <article className="w-[437.33px] h-fit">
            {apyLoading ? (
              <div className="w-[437.33px] h-[331px] flex items-center justify-center border rounded-[16px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#703AE6]"></div>
                  <p className="text-[#999999] text-xs">Loading APY...</p>
                </div>
              </div>
            ) : (
              <Chart
                containerWidth="w-[437.33px]"
                containerHeight="h-[331px]"
                type="net-apy"
                customData={apyHistory}
              />
            )}
          </article>
          <aside className="w-full h-fit">
            <RewardsTable />
          </aside>
        </div>
      </section>

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
        {tableLoading && activeTab === "vaults" ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#703AE6]"></div>
              <p className="text-[#999999] text-sm">Loading vault data from blockchain...</p>
            </div>
          </div>
        ) : (
          <Table
            filterDropdownPosition="right"
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
        )}
      </section>
    </main>
  );
}
