"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { tableBody, tableHeadings } from "@/lib/constants/earn";
import { useUserStore } from "@/store/user";
import { RewardsTable } from "@/components/earn/rewards-table";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { useTheme } from "@/contexts/theme-context";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export default function Earn() {
  const { isDark } = useTheme();
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
        <motion.section
          className="px-4 sm:px-6 lg:px-[40px] pt-5 sm:pt-6 lg:pt-[40px] pb-2 sm:pb-6 lg:pb-[40px] w-full h-fit"
          aria-label="User Dashboard"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile section heading */}
          <motion.div className="flex items-center gap-3 mb-4 sm:hidden" variants={itemVariants}>
            <div className="w-1 h-[20px] rounded-full bg-[#703AE6]" />
            <h2 className={`text-[16px] font-bold ${isDark ? "text-white" : "text-[#111111]"}`}>Your Overview</h2>
          </motion.div>

          <motion.div className="flex flex-col xl:flex-row gap-4 w-full h-fit" variants={containerVariants}>
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-fit">
              <motion.article className="w-full min-w-0 h-fit" variants={itemVariants}>
                <Chart containerWidth="w-full" containerHeight="h-[300px] sm:h-[331px]" type="overall-deposit" />
              </motion.article>
              <motion.article className="w-full min-w-0 h-fit" variants={itemVariants}>
                <Chart containerWidth="w-full" containerHeight="h-[300px] sm:h-[331px]" type="net-apy" />
              </motion.article>
            </div>
            <motion.aside className="w-full h-fit" variants={itemVariants}>
              <RewardsTable />
            </motion.aside>
          </motion.div>
        </motion.section>
      )}

      <motion.section
        className="px-4 sm:px-6 lg:px-[40px] py-4 sm:py-6 lg:py-[40px] w-full h-fit"
        aria-label="Vaults and Positions"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
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
      </motion.section>
    </main>
  );
}
