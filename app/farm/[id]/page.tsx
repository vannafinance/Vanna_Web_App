"use client";

import { useParams } from "next/navigation";
import { useFarmStore } from "@/store/farm-store";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import Image from "next/image";
import { useMemo, useState, useCallback, useEffect } from "react";
import { iconPaths } from "@/lib/constants";
import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { farmLiquidationStatsData, farmStatsData, LEVERAGE_HEALTH_STATS_ITEMS } from "@/lib/constants/farm";
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
import { items } from "@/components/earn/details-tab";
import { StatsCard } from "@/components/ui/stats-card";
import { FarmStatsCard } from "@/components/farm/stats";
import { Button } from "@/components/ui/button";
import { RangeSelector } from "@/components/farm/range-selector";
import { DepositTokensForm } from "@/components/farm/deposit-tokens-form";
import { useUserStore } from "@/store/user";
import { 
  ChevronLeftIcon, 
  SortIcon, 
  CompassIcon, 
  ShareIcon, 
  MinusIcon, 
  PlusIcon, 
  WarningIcon 
} from "@/components/icons";

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const UI_TABS = [
  { id: "all-transactions", label: "All Transactions" },
  { id: "analytics", label: "Analytics" },
];

export default function FarmDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isDark } = useTheme();

  const userAddress = useUserStore(user => user.address);

  const [activeUiTab, setActiveUiTab] = useState<string>("all-transactions");
  const [showAddLiquidity, setShowAddLiquidity] = useState<boolean>(false);

  const handleUiTabChange = (tabId: string) => {
    setActiveUiTab(tabId);
  };

  const handleAddLiquidityClick = () => {
    setShowAddLiquidity(!showAddLiquidity);
  };

  // Range selector state and fake data - separate for each token
  const [usdcRangeMin, setUsdcRangeMin] = useState<number>(0.0001);
  const [usdcRangeMax, setUsdcRangeMax] = useState<number>(0.0004);
  const [ethRangeMin, setEthRangeMin] = useState<number>(0.0001);
  const [ethRangeMax, setEthRangeMax] = useState<number>(0.0004);

  // Generate chart data with deterministic values (SSR-safe, no Math.random)
  const usdcChartData = useMemo(() => {
    const data: Array<{ x: number; y: number }> = [];
    const center = 0.00025;
    const variance = 0.0001;
    for (let i = 0; i <= 50; i++) {
      const x = 0.0000 + (i / 50) * 0.0005;
      const normalizedX = (x - center) / variance;
      const baseHeight = Math.exp(-(normalizedX * normalizedX) / 2) * 100;
      // Use deterministic variation based on index instead of Math.random()
      const variation = (Math.sin(i * 0.5) + 1) * 10;
      const y = Math.max(10, baseHeight + variation);
      data.push({ x, y });
    }
    return data;
  }, []);

  // Generate chart data for ETH (SSR-safe, no Math.random)
  const ethChartData = useMemo(() => {
    const data: Array<{ x: number; y: number }> = [];
    const center = 0.0003;
    const variance = 0.00012;
    for (let i = 0; i <= 50; i++) {
      const x = 0.0000 + (i / 50) * 0.0005;
      const normalizedX = (x - center) / variance;
      const baseHeight = Math.exp(-(normalizedX * normalizedX) / 2) * 100;
      // Use deterministic variation based on index instead of Math.random()
      const variation = (Math.cos(i * 0.4) + 1) * 10;
      const y = Math.max(10, baseHeight + variation);
      data.push({ x, y });
    }
    return data;
  }, []);

  const handleUsdcRangeChange = useCallback((min: number, max: number) => {
    setUsdcRangeMin(min);
    setUsdcRangeMax(max);
  }, []);

  const handleEthRangeChange = useCallback((min: number, max: number) => {
    setEthRangeMin(min);
    setEthRangeMax(max);
  }, []);

  // Calculate min and max price based on range values (asset1 per asset2)
  const minPrice = useMemo(() => {
    if (ethRangeMin === 0) return "0.0000";
    const price = usdcRangeMin / ethRangeMin;
    return price.toFixed(4);
  }, [usdcRangeMin, ethRangeMin]);

  const maxPrice = useMemo(() => {
    if (ethRangeMax === 0) return "0.0000";
    const price = usdcRangeMax / ethRangeMax;
    return price.toFixed(4);
  }, [usdcRangeMax, ethRangeMax]);

  // State for manual input values
  const [minPriceInput, setMinPriceInput] = useState<string>(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState<string>(maxPrice);

  // Update input values when calculated prices change
  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  // Validate and sanitize price input
  const handlePriceInputChange = useCallback((value: string, setter: (val: string) => void) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    const validated = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
    setter(validated);
  }, []);


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

  // Loading state skeleton
  if (!rowData) {
    return (
      <main className="flex flex-col gap-[40px] pt-[40px] px-[40px] pb-[80px]">
        <div className="w-full h-fit flex justify-between">
          <div className="w-full h-fit flex flex-col gap-[20px]">
            <button
              type="button"
              onClick={handleBackToPools}
              className={`w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium hover:text-[#703AE6] transition-colors ${isDark ? "text-white" : "text-[#5A5555]"}`}
              aria-label="Back to pools"
            >
              <ChevronLeftIcon />
              Back to pools
            </button>
            <div className="animate-pulse">
              <div className={`h-[36px] w-[200px] rounded-[8px] ${isDark ? "bg-[#222222]" : "bg-gray-200"}`} />
            </div>
          </div>
        </div>
        <div className={`w-full h-[400px] rounded-[20px] animate-pulse ${isDark ? "bg-[#111111]" : "bg-gray-200"}`} />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-[40px] pt-[40px] px-[40px] pb-[80px]">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        className=" w-full h-fit flex justify-between"
      >
        <div className="w-full h-fit flex flex-col gap-[20px]">
          <nav aria-label="Breadcrumb">
            <motion.button
              type="button"
              onClick={handleBackToPools}
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium hover:text-[#703AE6] transition-colors ${isDark ? "text-white" : "text-[#5A5555]"
                }`}
            >
              <ChevronLeftIcon />
              Back to pools
            </motion.button>
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
                <motion.div
                  className="flex items-center -space-x-[18px]"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              ) : (
                // Single asset icon
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <Image
                    src={iconPath}
                    alt={`${farmData.title}-icon`}
                    width={36}
                    height={36}
                  />
                </motion.div>
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
                    <SortIcon />
                  </div>
                  {/* Eye icon */}
                  <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F4] flex items-center justify-center">
                    <CompassIcon />
                  </div>
                  {/* Share icon */}
                  <div className="w-[24px] h-[24px] rounded-full bg-[#F4F4F4] flex items-center justify-center">
                    <ShareIcon />
                  </div>
                </div>}
              </div>
            </div>

          </div>
        </div>
        {isMultiAsset && !showAddLiquidity && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-[164px] h-fit"
          >
            <Button
              type="solid"
              size="medium"
              disabled={!userAddress}
              text="+ Add Liquidity"
              onClick={handleAddLiquidityClick}
              aria-label={userAddress ? "Add liquidity to pool" : "Connect wallet to add liquidity"}
            />
          </motion.div>
        )}
      </motion.header>
      {!isMultiAsset && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.2 }}
          className="w-full h-fit "
        >
          <AccountStatsGhost items={LEVERAGE_HEALTH_STATS_ITEMS} />
        </motion.section>
      )}
      {!isMultiAsset && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
          transition={{ delay: 0.3 }}
          className="w-full h-fit flex gap-[20px] "
        >

        <motion.div variants={itemVariants} className="w-full h-fit flex flex-col gap-[10px]">
          <div className="w-full h-fit">
            <AnimatedTabs containerClassName="w-full h-fit" tabClassName="w-full h-fit" type="solid" tabs={UI_TABS} activeTab={activeUiTab} onTabChange={handleUiTabChange} />
          </div>
          {activeUiTab === "all-transactions" ? (
            <div className={`w-full h-fit flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
              }`}
            >
              <Chart type="farm" heading="1 WISE = <0.001 WETH ($0.159)" downtrend="0.07%" />
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
            <div className={`w-full h-fit flex flex-col gap-[24px] rounded-[20px] border-[1px] p-[24px] ${isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
              }`}
            >
              <h2 className={`w-full h-fit text-[20px] font-semibold ${isDark ? "text-white" : ""
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
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="w-[480px] h-fit flex flex-col gap-[20px]"
        >
          <Form />
        </motion.div>

      </motion.section>
      )}

      {isMultiAsset && (
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
          transition={{ delay: 0.2 }}
          className="w-full h-fit flex gap-[24px] "
        >
        <motion.div variants={itemVariants} className="w-full h-fit flex flex-col gap-[24px]">
          {showAddLiquidity ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.05,
                  },
                },
              }}
              className="w-full h-fit flex flex-col gap-[8px]"
            >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className={`w-full h-fit rounded-[16px] border-[1px] p-[24px] ${isDark ? "bg-[#1A1A1A]" : "bg-[#F7F7F7]"
              }`}
            >
              <RangeSelector
                token1Name="USDC"
                token2Name="ETH"
                token1ChartData={usdcChartData}
                token2ChartData={ethChartData}
                token1MinValue={usdcRangeMin}
                token1MaxValue={usdcRangeMax}
                token2MinValue={ethRangeMin}
                token2MaxValue={ethRangeMax}
                onToken1RangeChange={handleUsdcRangeChange}
                onToken2RangeChange={handleEthRangeChange}
                height={250}
                xAxisLabels={["0.0000", "0.0001", "0.0002", "0.0003", "0.0004", "0.0005"]}
                showControls={true}
              />
              
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className={`w-full h-fit flex rounded-[16px] border-[1px] p-[20px] gap-[8px] ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"} `}
              >
                <div className={`w-full h-fit flex flex-col gap-[20px] rounded-[16px] border-[1px] p-[20px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"} `}
                >
                  <div className="w-full h-fit flex flex-col ">
                    <h3 className={`w-full h-fit text-[16px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>Max Price</h3>
                    <p className="w-full h-fit text-[12px] text-[#A7A7A7]">{farmData.title.split(" / ")[0]} per {farmData.title.split(" / ")[1]}</p>
                  </div>
                  <div className="w-full h-fit flex justify-between items-center">
                    <input 
                      type="text" 
                      value={maxPriceInput}
                      onChange={(e) => handlePriceInputChange(e.target.value, setMaxPriceInput)}
                      className={`w-full h-[40px] min-h-[40px] rounded-[8px] border-[1px] pb-[4px] text-[24px] font-bold ${isDark ? "text-[#FFFFFF]" : "text-[#111827]"} border-none  outline-none`} 
                      placeholder="0.0000"
                      aria-label={`Maximum price: ${farmData.title.split(" / ")[0]} per ${farmData.title.split(" / ")[1]}`}
                      inputMode="decimal"
                    />
                    <div className="w-fit h-fit flex gap-[4px] items-center ">
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-[24px] h-[24px] bg-[#F1EBFD] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease maximum price"
                        disabled={!userAddress}
                      >
                        <MinusIcon />
                      </motion.button>
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-[24px] h-[24px] bg-[#F1EBFD] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase maximum price"
                        disabled={!userAddress}
                      >
                        <PlusIcon />
                      </motion.button>
                    </div>

                  </div>
                </div>
                <div className={`w-full h-fit flex flex-col gap-[20px] rounded-[16px] border-[1px] p-[20px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"} `}
                >
                  <div className="w-full h-fit flex flex-col ">
                    <h3 className={`w-full h-fit text-[16px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>Min Price</h3>
                    <p className="w-full h-fit text-[12px] text-[#A7A7A7]">{farmData.title.split(" / ")[0]} per {farmData.title.split(" / ")[1]}</p>
                  </div>
                  <div className="w-full h-fit flex justify-between items-center">
                    <input 
                      type="text" 
                      value={minPriceInput}
                      onChange={(e) => handlePriceInputChange(e.target.value, setMinPriceInput)}
                      className={`w-full h-[40px] min-h-[40px] rounded-[8px] border-[1px] pb-[4px] text-[24px] font-bold ${isDark ? "text-[#FFFFFF]" : "text-[#111827]"} border-none  outline-none`} 
                      placeholder="0.0000"
                      aria-label={`Minimum price: ${farmData.title.split(" / ")[0]} per ${farmData.title.split(" / ")[1]}`}
                      inputMode="decimal"
                    />
                    <div className="w-fit h-fit flex gap-[4px] items-center ">
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-[24px] h-[24px] bg-[#F1EBFD] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease minimum price"
                        disabled={!userAddress}
                      >
                        <MinusIcon />
                      </motion.button>
                      <motion.button 
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-[24px] h-[24px] bg-[#F1EBFD] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase minimum price"
                        disabled={!userAddress}
                      >
                        <PlusIcon />
                      </motion.button>
                    </div>

                  </div>
                </div>

              </motion.div>
            </motion.div>
          ) : (
            <div className={`w-full h-fit flex flex-col gap-[24px] ${isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"} border-[1px] rounded-[20px] p-[24px]`}
            >
              <Chart type="farm" heading="1 WISE = <0.001 WETH ($0.159)" downtrend="0.07%" />
              <Table
                filterDropdownPosition="right"
                tableBodyBackground={isDark ? "bg-[#222222]" : "bg-white"}
                heading={{
                  heading: "Your Transactions",
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
              <Table
                filterDropdownPosition="right"
                tableBodyBackground={isDark ? "bg-[#222222]" : "bg-white"}
                heading={{
                  heading: "All Transactions",
                }}
                filters={{ filters: ["All"] }}
                tableHeadings={transactionTableHeadings}
                tableBody={tableBodyData}
              />
            </div>
          )}
        </motion.div>
        {!showAddLiquidity && (
          <motion.div
            variants={itemVariants}
            className="w-[400px] h-fit"
          >
            <FarmStatsCard items={farmStatsData} />
          </motion.div>
        )}
        {showAddLiquidity && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.1,
                },
              },
            }}
            className="w-fit h-fit flex flex-col gap-[20px]"
          >
            {!userAddress && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className={`w-[400px] rounded-[12px] border-[1px] p-[16px] flex items-center gap-[12px] ${isDark ? "bg-[#1A1A1A] border-[#595959] text-[#FFFFFF]" : "bg-[#FFF9E6] border-[#FFD700] text-[#111111]"}`}
                role="alert"
                aria-live="polite"
              >
                <WarningIcon />
                <span className="text-[14px] font-medium">Connect your wallet to add liquidity</span>
              </motion.div>
            )}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <DepositTokensForm assets={[`${farmData.title.split(" / ")[0]}`,`${farmData.title.split(" / ")[1]}`]} />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="w-[400px] h-fit"
            >
              <FarmStatsCard items={farmLiquidationStatsData} />
            </motion.div>
          </motion.div>
        )}
      </motion.section>
      )}
    </main>
  );
}