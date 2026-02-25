"use client";

import { useParams } from "next/navigation";
import { useFarmStore } from "@/store/farm-store";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { iconPaths } from "@/lib/constants";
import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { LEVERAGE_HEALTH_STATS_ITEMS } from "@/lib/constants/farm";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { transactionTableBody, transactionTableHeadings } from "@/components/earn/acitivity-tab";
import { Form } from "@/components/farm/form";
import { farmTableBody, singleAssetTableBody } from "@/lib/constants/farm";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { MARGIN_ACCOUNT_INFO_ITEMS, MARGIN_ACCOUNT_MORE_DETAILS_ITEMS } from "@/lib/constants/margin";
import { InfoCard } from "@/components/margin/info-card";
import { motion } from "framer-motion";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
// Statistics items for farm vault details
const items = [
  { heading: "Total Value Locked", mainInfo: "$0.00", subInfo: "0 tokens", tooltip: "Total value locked in this vault" },
  { heading: "APR", mainInfo: "0.00%", subInfo: "Annual", tooltip: "Annual percentage rate" },
  { heading: "Daily APR", mainInfo: "0.00%", subInfo: "Daily", tooltip: "Daily percentage rate" },
  { heading: "Your Deposit", mainInfo: "$0.00", subInfo: "0 tokens", tooltip: "Your deposited amount" },
  { heading: "Your Earnings", mainInfo: "$0.00", subInfo: "0 tokens", tooltip: "Your earned rewards" },
  { heading: "Pool Share", mainInfo: "0.00%", subInfo: "of total", tooltip: "Your share of the pool" },
];
import { StatsCard } from "@/components/ui/stats-card";

const UI_TABS = [
  { id: "all-transactions", label: "All Transactions" },
  { id: "analytics", label: "Analytics" },
];

export default function FarmDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isDark } = useTheme();

  const [activeUiTab, setActiveUiTab] = useState<string>("all-transactions");

  const handleUiTabChange = (tabId: string) => {
    setActiveUiTab(tabId);
  };


  const totalBorrowedValue = useMarginAccountInfoStore(
    (state) => state.totalBorrowedValue
  );
  const totalCollateralValue = useMarginAccountInfoStore(
    (state) => state.totalCollateralValue
  );
  const totalValue = useMarginAccountInfoStore((state) => state.totalValue);
  const avgHealthFactor = useMarginAccountInfoStore(
    (state) => state.avgHealthFactor
  );
  const timeToLiquidation = useMarginAccountInfoStore(
    (state) => state.timeToLiquidation
  );
  const borrowRate = useMarginAccountInfoStore((state) => state.borrowRate);
  const liquidationPremium = useMarginAccountInfoStore(
    (state) => state.liquidationPremium
  );
  const liquidationFee = useMarginAccountInfoStore(
    (state) => state.liquidationFee
  );
  const debtLimit = useMarginAccountInfoStore((state) => state.debtLimit);
  const minDebt = useMarginAccountInfoStore((state) => state.minDebt);
  const maxDebt = useMarginAccountInfoStore((state) => state.maxDebt);
  const hasMarginAccount = useMarginAccountInfoStore(
    (state) => state.hasMarginAccount
  );


  // Format data for InfoCard component
  const marginAccountInfo = {
    totalBorrowedValue,
    totalCollateralValue,
    totalValue,
    avgHealthFactor,
    timeToLiquidation,
    borrowRate,
    liquidationPremium,
    liquidationFee,
    debtLimit,
    minDebt,
    maxDebt,
  };
  // Get row data and tab type from store
  const selectedRow = useFarmStore((state) => state.selectedRow);
  const tabType = useFarmStore((state) => state.tabType);

  // Function to find row data from constants based on id
  const findRowFromId = useCallback((searchId: string) => {
    // Search in multi-asset table
    for (const row of farmTableBody.rows) {
      const firstCell = row.cell?.[0];
      if (firstCell?.titles && firstCell.titles.length > 0) {
        const rowId = firstCell.titles.join("-").toLowerCase().replace(/\s+/g, "-");
        if (rowId === searchId.toLowerCase()) {
          return { row, tabType: "multi" as const };
        }
      } else if (firstCell?.title) {
        const rowId = firstCell.title.toLowerCase().replace(/\s+/g, "-");
        if (rowId === searchId.toLowerCase()) {
          return { row, tabType: "multi" as const };
        }
      }
    }

    // Search in single-asset table
    for (const row of singleAssetTableBody.rows) {
      const firstCell = row.cell?.[0];
      if (firstCell?.title) {
        const rowId = firstCell.title.toLowerCase().replace(/\s+/g, "-");
        if (rowId === searchId.toLowerCase()) {
          return { row, tabType: "single" as const };
        }
      }
    }

    return null;
  }, []);

  // Get row data - from store if available, otherwise fetch from constants using id
  const rowData = useMemo(() => {
    if (selectedRow && tabType) {
      return { row: selectedRow, tabType };
    }

    // If store data not available, fetch from constants
    if (id) {
      const found = findRowFromId(id);
      if (found) {
        return found;
      }
    }

    return null;
  }, [selectedRow, tabType, id, findRowFromId]);

  // Extract data from row
  const farmData = useMemo(() => {
    if (!rowData || !rowData.row || !rowData.row.cell || rowData.row.cell.length === 0) {
      return {
        title: id,
        titles: null,
        chain: "ETH",
        tags: [],
      };
    }

    const firstCell = rowData.row.cell[0];
    const titles = (firstCell as any).titles || null;
    const title = titles
      ? titles.join(" / ")
      : firstCell.title || id;
    const chain = (firstCell as any).chain || "ETH";
    const tags = (firstCell as any).tags || [];

    return {
      title,
      titles,
      chain,
      tags,
    };
  }, [rowData, id]);

  // Get icon path for single asset
  const iconPath = useMemo(() => {
    if (farmData.titles && farmData.titles.length > 0) {
      // For multi-asset, use first title
      return iconPaths[farmData.titles[0].toUpperCase()] || "/icons/eth-icon.png";
    }
    // Try to get icon from iconPaths using title or chain
    const assetName = farmData.title.split(" / ")[0]?.toUpperCase() || farmData.chain.toUpperCase();
    return iconPaths[assetName] || iconPaths[farmData.chain.toUpperCase()] || "/icons/eth-icon.png";
  }, [farmData.title, farmData.titles, farmData.chain]);

  // Get chain icon path (16px)
  const chainIconPath = useMemo(() => {
    return iconPaths[farmData.chain.toUpperCase()] || "/icons/eth-icon.png";
  }, [farmData.chain]);

  // Check if multi-asset type
  const isMultiAsset = rowData?.tabType === "multi" && farmData.titles && farmData.titles.length > 1;

  // Tab state for table
  const [activeTab, setActiveTab] = useState<string>("current-position");

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Get table body based on active tab
  const tableBodyData = useMemo(() => {
    if (activeTab === "position-history") {
      return { rows: [] }; // No data for position history
    }
    return transactionTableBody; // Show data for current position
  }, [activeTab]);

  const handleBackToPools = () => {
    router.push("/farm");
  };

  return (
    <main className="flex flex-col gap-[40px] pt-[40px] px-[40px] pb-[80px]">
      <header className=" w-full h-fit">
        <div className="w-full h-fit flex flex-col gap-[20px]">
          <nav aria-label="Breadcrumb">
            <button
              type="button"
              onClick={handleBackToPools}
              className={`w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium hover:text-[#703AE6] transition-colors ${isDark ? "text-white" : "text-[#5A5555]"
                }`}
            >
              <svg
                width="9"
                height="16"
                viewBox="0 0 9 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1L1 8L8 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to pools
            </button>
          </nav>
          <div className="w-full h-fit flex gap-[16px] items-center">
            {/* Chain icon for multi-asset type - 16px */}
            {isMultiAsset && (
              <Image
                src={chainIconPath}
                alt={`${farmData.chain}-icon`}
                width={16}
                height={16}
              />
            )}
            <div className="flex gap-[16px]">
              {isMultiAsset ? (
                // Multi-asset icons (half-half display like table)
                <div className="flex items-center -space-x-[18px]">
                  {farmData.titles?.map((titleName: string, iconIdx: number) => {
                    const assetIconPath = iconPaths[titleName.toUpperCase()];
                    if (!assetIconPath) return null;
                    return (
                      <Image
                        key={iconIdx}
                        src={assetIconPath}
                        alt={titleName}
                        width={36}
                        height={36}
                        className={`rounded-full ${isDark ? "border-[1px] border-black" : "border-[1px] border-white"
                          }`}
                      />
                    );
                  })}
                </div>
              ) : (
                // Single asset icon
                <Image
                  src={iconPath}
                  alt={`${farmData.title}-icon`}
                  width={36}
                  height={36}
                />
              )}
              <div className="w-fit h-fit flex gap-[8px] items-center">
                <h1 className={`w-fit h-fit text-[24px] font-bold ${isDark ? "text-white" : "text-[#181822]"
                  }`}>
                  {farmData.title}
                </h1>
                <div className="w-fit h-fit flex gap-[8px] items-center">
                  {farmData.tags.slice(0, 2).map((tag: string | number, index: number) => (
                    <span
                      key={index}
                      className={`text-[12px] font-semibold text-center w-fit h-fit rounded-[4px] py-[2px] px-[6px] bg-[#703AE6] text-white
                      `}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Three icons after Active tag - 24px, rounded-full, bg #F4F4F4 */}
                {isMultiAsset && <div className="w-fit h-fit flex gap-[4px] items-center">
                  {/* Sort icon */}
                  <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F4] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.1382 3.80392C13.0082 3.93392 12.8375 3.99923 12.6668 3.99923C12.4962 3.99923 12.3255 3.93392 12.1955 3.80392L10.6668 2.27527V9.99925C10.6668 10.3673 10.3688 10.6659 10.0002 10.6659C9.63151 10.6659 9.33351 10.3673 9.33351 9.99925V2.27527L7.80485 3.80392C7.54418 4.06459 7.12285 4.06459 6.86218 3.80392C6.60151 3.54325 6.60151 3.12187 6.86218 2.86121L9.52818 0.195193C9.59018 0.133193 9.66345 0.0845 9.74545 0.0505C9.90811 -0.0168333 10.0922 -0.0168333 10.2549 0.0505C10.3369 0.0845 10.4102 0.133193 10.4722 0.195193L13.1382 2.86121C13.3988 3.12187 13.3988 3.54325 13.1382 3.80392ZM5.52885 9.52785L4.00019 11.0565V3.33257C4.00019 2.96457 3.70219 2.6659 3.33353 2.6659C2.96486 2.6659 2.66686 2.96457 2.66686 3.33257V11.0565L1.13821 9.52785C0.877547 9.26719 0.456167 9.26719 0.1955 9.52785C-0.0651667 9.78852 -0.0651667 10.2099 0.1955 10.4706L2.86152 13.1366C2.92352 13.1986 2.9968 13.2473 3.07881 13.2813C3.16014 13.3153 3.24686 13.3326 3.33353 13.3326C3.42019 13.3326 3.50691 13.3147 3.58825 13.2813C3.67025 13.2473 3.74353 13.1986 3.80553 13.1366L6.47151 10.4706C6.73218 10.2099 6.73218 9.78852 6.47151 9.52785C6.21085 9.26719 5.78951 9.26719 5.52885 9.52785Z" fill="#111111" />
                    </svg>
                  </div>
                  {/* Eye icon */}
                  <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F4] flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M0 7.29167C0 5.3578 0.768227 3.50313 2.13568 2.13568C3.50313 0.768227 5.3578 0 7.29167 0C9.22554 0 11.0802 0.768227 12.4477 2.13568C13.8151 3.50313 14.5833 5.3578 14.5833 7.29167C14.5833 9.22554 13.8151 11.0802 12.4477 12.4477C11.0802 13.8151 9.22554 14.5833 7.29167 14.5833C5.3578 14.5833 3.50313 13.8151 2.13568 12.4477C0.768227 11.0802 0 9.22554 0 7.29167ZM6.33333 5.04917C5.55538 5.68898 5.03554 6.58894 4.87 7.5825L4.3225 10.8733C4.19667 11.6325 5.08 12.1425 5.67417 11.6533L8.25 9.53417C9.02795 8.89435 9.5478 7.99439 9.71333 7.00083L10.26 3.71C10.3867 2.95083 9.50333 2.44083 8.90917 2.93L6.33333 5.04917Z" fill="#111111" />
                    </svg>
                  </div>
                  {/* Share icon */}
                  <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F4] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.112 8.88802C10.3542 8.88802 9.6849 9.27083 9.28385 9.84896L4.35937 7.24219C4.40885 7.05729 4.44531 6.86719 4.44531 6.66667C4.44531 6.46615 4.41146 6.27604 4.35937 6.09115L9.28385 3.48438C9.6849 4.0651 10.3516 4.44531 11.112 4.44531C12.3385 4.44531 13.3333 3.45052 13.3333 2.22396C13.3333 0.997396 12.3385 0 11.112 0C9.88542 0 8.89062 0.994792 8.89062 2.22135C8.89062 2.24219 8.89583 2.26302 8.89583 2.28385L3.71354 5.02865C3.31771 4.66927 2.79948 4.44531 2.22396 4.44531C0.994792 4.44531 0 5.4401 0 6.66667C0 7.89323 0.994792 8.88802 2.22135 8.88802C2.79688 8.88802 3.3151 8.66406 3.71094 8.30469L8.89323 11.0495C8.89323 11.0703 8.88802 11.0911 8.88802 11.112C8.88802 12.3385 9.88281 13.3333 11.1094 13.3333C12.3359 13.3333 13.3307 12.3385 13.3307 11.112C13.3307 9.88542 12.3385 8.88802 11.112 8.88802Z" fill="#111111" />
                    </svg>
                  </div>
                </div>}
              </div>
            </div>

          </div>
        </div>
      </header>
      {!isMultiAsset && <section className="w-full h-fit ">
        <AccountStatsGhost items={LEVERAGE_HEALTH_STATS_ITEMS} />
      </section>}
      <section className="w-full h-fit flex gap-[20px] ">
        
        <div className="w-full h-fit flex flex-col gap-[10px]">
          <div className="w-full h-fit">
            <AnimatedTabs containerClassName="w-full h-fit" tabClassName="w-full h-fit" type="solid" tabs={UI_TABS} activeTab={activeUiTab} onTabChange={handleUiTabChange} />
          </div>
          {activeUiTab === "all-transactions" ? (
            <div className={`w-full h-fit flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${
              isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
            }`}>
              <Chart  type="farm" heading="1 WISE = <0.001 WETH ($0.159)" downtrend="0.07%" />
              <Table
                filterDropdownPosition="right"
                tableBodyBackground={isDark ? "bg-[#222222]" : "bg-white"}
                heading={{
                  heading: "All Transactions",
                  tabsItems: [
                    { id: "current-position", label: "Current Position" },
                    { id: "position-history", label: "Position History" }
                  ],
                  tabType: "solid"
                }}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                filters={{ filters: ["All"], customizeDropdown: true }}
                tableHeadings={transactionTableHeadings}
                tableBody={tableBodyData}
              />
            </div>
          ) : (
            <div className={`w-full h-fit flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${
              isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
            }`}>
              <h2 className={`w-full h-fit text-[20px] font-semibold ${
                isDark ? "text-white" : ""
              }`}>Statistics</h2>
              <article className="w-full h-full grid grid-cols-3 grid-rows-3 gap-x-[15px]" aria-label="Vault Statistics">
          {items.map((item, idx) => {
            return (
              <StatsCard
                key={idx}
                heading={item.heading}
                mainInfo={item.mainInfo}
                subInfo={item.subInfo}
                tooltip={item.tooltip}
              />
            );
          })}
        </article>
            </div>
            
          )}
        </div>
        <div className="w-[480px] h-fit flex flex-col gap-[20px]">
          <Form />
                  </div>

      </section>
    </main>
  );
}