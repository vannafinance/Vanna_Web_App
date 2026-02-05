"use client";

import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { Table } from "@/components/earn/table";
import { AccountStats } from "@/components/margin/account-stats";
import { useTheme } from "@/contexts/theme-context";
import { motion } from "framer-motion";
import {
  FARM_STATS_ITEMS,
  FARM_STATS_VALUES,
  farmTableBody,
  farmTableHeadings,
  MARGIN_ACCOUNT_STATS_ITEMS,
  MARGIN_ACCOUNT_STATS_VALUES,
  singleAssetTableBody,
  singleAssetTableHeadings
} from "@/lib/constants/farm";
import { useUserStore } from "@/store/user";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFarmStore } from "@/store/farm-store";

// Animation variants
const itemVariants = {
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

export default function FarmPage() {
  const [activeFilterTab, setActiveFilterTab] = useState<string>("lp-multiple-assets");
  const [activePositionFilterTab, setActivePositionFilterTab] = useState<string>("current-position");
  const [activeTab, setActiveTab] = useState<string>("vaults");
  const userAddress = useUserStore((state) => state.address);
  const { isDark } = useTheme();

  // Get filter tab type options based on active tab
  const filterTabTypeOptions = useMemo(() => {
    if (activeTab === "positions") {
      return [
        { id: "current-position", label: "Current Position" },
        { id: "position-history", label: "Position History" }
      ];
    }
    return [
      { id: "lp-multiple-assets", label: "LP/Multiple Assets" },
      { id: "lending-single-assets", label: "Lending/Single Assets" }
    ];
  }, [activeTab]);

  // Get active filter tab based on main tab
  const currentActiveFilterTab = useMemo(() => {
    if (activeTab === "positions") {
      return activePositionFilterTab;
    }
    return activeFilterTab;
  }, [activeTab, activeFilterTab, activePositionFilterTab]);

  // Handle filter tab change
  const handleFilterTabChange = useCallback((tabId: string) => {
    if (activeTab === "positions") {
      setActivePositionFilterTab(tabId);
    } else {
      setActiveFilterTab(tabId);
    }
  }, [activeTab]);

  const router = useRouter();
  const setFarmData = useFarmStore((state) => state.set);

  // Handle row click - navigate to detail page
  const handleRowClick = useCallback((row: any, rowIndex: number) => {
    // Determine tab type
    const tabType = activeFilterTab === "lending-single-assets" ? "single" : "multi";

    // Generate ID from row data (use first cell title or create unique ID)
    const rowId = row.cell?.[0]?.title?.toLowerCase().replace(/\s+/g, "-") ||
      row.cell?.[0]?.titles?.join("-").toLowerCase().replace(/\s+/g, "-") ||
      `row-${rowIndex}`;

    // Save row data and tab type to store
    setFarmData({
      selectedRow: row,
      tabType: tabType,
    });

    // Navigate to detail page
    router.push(`/farm/${rowId}`);
  }, [activeFilterTab, router, setFarmData]);

  // Get table data based on active filter tab
  const tableData = useMemo(() => {
    // If positions tab is active, return empty data
    if (activeTab === "positions") {
      return {
        headings: farmTableHeadings,
        body: { rows: [] }, // No data for now
      };
    }

    // For vaults tab, use existing logic
    if (activeFilterTab === "lending-single-assets") {
      return {
        headings: singleAssetTableHeadings,
        body: singleAssetTableBody,
      };
    }
    return {
      headings: farmTableHeadings,
      body: farmTableBody,
    };
  }, [activeTab, activeFilterTab]);

  return (
    <div className="w-full h-fit px-[40px] pt-[40px] pb-[80px] flex flex-col gap-[40px]">
      {userAddress && FARM_STATS_ITEMS.length > 0 && MARGIN_ACCOUNT_STATS_ITEMS.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`w-full h-fit p-[24px] border-[1px] rounded-[20px] flex flex-col gap-[40px] ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}
        >
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`w-full h-fit text-[20px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
            >
              Farm Stats
            </motion.div>
            <AccountStats darkBackgroundColor="#111111" items={FARM_STATS_ITEMS} values={FARM_STATS_VALUES} gridCols="grid-cols-2" backgroundColor="#FFFFFF" />
          </div>
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={`w-full h-fit text-[20px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
            >
              Margin Account Stats
            </motion.div>
            <AccountStats darkBackgroundColor="#111111" items={MARGIN_ACCOUNT_STATS_ITEMS} values={MARGIN_ACCOUNT_STATS_VALUES} gridCols="grid-cols-3" backgroundColor="#FFFFFF" />
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <Table
        filterDropdownPosition="left"
        heading={{
          tabsItems: [
            { label: "Vaults", id: "vaults" },
            { label: "Positions", id: "positions" }
          ],
          tabType: "underline"
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={{
          allChainDropdown: true,
          filters: activeTab === "positions"
            ? [] // No filters for positions tab
            : (activeFilterTab === "lending-single-assets"
              ? ["Protocol", "Vaults", "Curator"]
              : ["Protocol", "Vaults", "Curator", "Provider"]),
          supplyApyTab: activeTab === "positions" ? false : true,
          supplyApyLabel: activeFilterTab === "lending-single-assets" ? "Provider TVL" : "Vanna TVL",
          filterTabType: activeTab === "positions" ? "solid" : "ghost"
        }}
        filterTabTypeOptions={filterTabTypeOptions}
        activeFilterTab={currentActiveFilterTab}
        onFilterTabTypeChange={handleFilterTabChange}
        tableHeadings={tableData.headings}
        tableBody={tableData.body}
        onRowClick={activeTab === "vaults" ? handleRowClick : undefined}
      />
      </motion.div>
    </div>
  );
}