import { useState } from "react";
import { Chart } from "./chart"
import { Table } from "./table"
import { useTheme } from "@/contexts/theme-context";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { useUserDepositHistory } from "@/lib/hooks/useUserPosition";
import { EarnAsset } from "@/lib/types";

const tabs = [{id:"current-positions",label:"Current Positions"},{id:"positions-history",label:"Positions History"}]

export const YourPositions = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("current-positions");

  // Get selected vault to determine which asset to fetch
  const selectedVault = useEarnVaultStore((state) => state.selectedVault);
  const asset = (selectedVault?.title || "ETH") as EarnAsset;

  // Fetch user's deposit history
  const { depositHistory, currentValue, loading } = useUserDepositHistory(asset);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <section
      className={`w-full h-full flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${
        isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
      }`}
      aria-label="Your Positions Overview"
    >
      <figure className="w-full flex-1 min-h-0">
        {loading ? (
          <div className={`w-full h-[393px] flex items-center justify-center ${
            isDark ? "text-white" : "text-gray-600"
          }`}>
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#703AE6]"></div>
              <p className="text-sm">Loading your position...</p>
            </div>
          </div>
        ) : (
          <Chart
            type="my-supply"
            currencyTab={true}
            height={393}
            containerWidth="w-full"
            containerHeight="h-full"
            customData={depositHistory}
          />
        )}
      </figure>

      <article aria-label="Your Transactions">
        <Table
          filterDropdownPosition="right"
          heading={{
            heading: "Your Transactions",
            tabsItems: tabs,
            tabType: "solid"
          }}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tableHeadings={[]}
          tableBody={{rows: []}}
          tableBodyBackground="bg-white"
          filters={{
            customizeDropdown: true,
            filters: ["All"]
          }}
        />
      </article>
    </section>
  );
};