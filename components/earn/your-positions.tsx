import { useState } from "react";
import { Chart } from "./chart";
import { Table } from "./table";
import { useTheme } from "@/contexts/theme-context";
import { useUserPosition, useUserDepositHistory } from "@/lib/hooks/useUserPosition";
import { useVaultData } from "@/lib/hooks/useVaultData";
import { EarnAsset } from "@/lib/types";
import { iconPaths } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format-value";

const tabs = [
  { id: "current-positions", label: "Current Position" },
  { id: "positions-history", label: "Position History" },
];

export const YourPositions = ({ asset }: { asset: EarnAsset }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("current-positions");

  // On-chain position: balanceOf() → shares, convertToAssets(shares) → underlying value
  const { position } = useUserPosition(asset);
  const { depositHistory, loading } = useUserDepositHistory(asset);
  const { vault } = useVaultData(asset);

  const hasPosition = !position.loading && position.sharesFormatted > 0;
  // supplyAPY from on-chain DefaultRateModel (stored as decimal, e.g. 0.2906 → 29.06%)
  const supplyAPY = vault?.supplyAPY ? vault.supplyAPY * 100 : 0;
  // Removed poolShare — not shown in table layout

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Column headings aligned to match the Stellar-style layout
  const positionTableHeadings = [
    { label: "Pool", id: "pool" },
    { label: "Vault Shares", id: "shares" },
    { label: `${asset} Deposited`, id: "deposited" },
    { label: "USD Value", id: "usd-value" },
    { label: "APY", id: "apy" },
  ];

  // Row data from on-chain:
  // - sharesFormatted: balanceOf(user) → vToken balance
  // - assetsValue: convertToAssets(shares) → underlying token amount
  // - assetsValueUsd: assetsValue × priceUsd (from vault store)
  // - supplyAPY: from DefaultRateModel on-chain calculation
  const positionTableBody = hasPosition
    ? {
        rows: [
          {
            cell: [
              {
                icon: iconPaths[asset] || "/icons/eth-icon.png",
                title: asset,
                tags: ["Vanna", "Vault"],
              },
              {
                title: `${formatNumber(position.sharesFormatted, 4)} v${asset}`,
              },
              {
                title: `${formatNumber(position.assetsValue, 4)} ${asset}`,
              },
              {
                title: `$${formatNumber(position.assetsValueUsd)}`,
              },
              {
                title: `${formatNumber(supplyAPY)}%`,
              },
            ],
          },
        ],
      }
    : { rows: [] };

  return (
    <section
      className={`w-full h-full flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${
        isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
      }`}
      aria-label="Your Positions Overview"
    >
      {/* Supply chart */}
      <figure className="w-full flex-1 min-h-0">
        {loading ? (
          <div
            className={`w-full h-[393px] flex items-center justify-center ${
              isDark ? "text-white" : "text-gray-600"
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#703AE6]" />
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

      {/* Position table */}
      <article aria-label="My Position">
        <Table
          filterDropdownPosition="right"
          heading={{
            heading: "My Position",
            tabsItems: tabs,
            tabType: "solid",
          }}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tableHeadings={
            activeTab === "current-positions" ? positionTableHeadings : []
          }
          tableBody={
            activeTab === "current-positions" ? positionTableBody : { rows: [] }
          }
          tableBodyBackground={isDark ? "bg-[#111111]" : "bg-white"}
          filters={{
            customizeDropdown: true,
            filters: ["All"],
          }}
        />
      </article>
    </section>
  );
};
