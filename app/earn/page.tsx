"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { tableBody, tableHeadings } from "@/lib/constants/earn";
import { useUserStore } from "@/store/user";
import { useEarnVaultStore } from "@/store/earn-vault-store";

const CHART_HEIGHT = "h-[331px]";

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
  const userAddress = useUserStore((state) => state.address);
  const setSelectedVault = useEarnVaultStore((state) => state.set);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("vaults");

  const getTableDataForTab = (tabId: string) => {
    if (tabId === "vaults") {
      return tableBody;
    } else if (tabId === "positions") {
      return { rows: [] };
    }
    return { rows: [] };
  };

  const handleRowClick = useCallback(
    (row: any, rowIndex: number) => {
      const cells = row.cell;
      const id = cells[0]?.title;

      if (id) {
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
      {/* Logged in: two charts, 50% / 50% on md+, same height */}
      {userAddress && (
        <motion.section
          className="p-4 sm:p-6 lg:p-[40px] w-full"
          aria-label="Deposit and APY charts"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <motion.article
              className="w-full min-w-0 flex flex-col"
              variants={itemVariants}
            >
              <Chart
                containerWidth="w-full"
                containerHeight={CHART_HEIGHT}
                type="overall-deposit"
              />
            </motion.article>
            <motion.article
              className="w-full min-w-0 flex flex-col"
              variants={itemVariants}
            >
              <Chart
                containerWidth="w-full"
                containerHeight={CHART_HEIGHT}
                type="net-apy"
              />
            </motion.article>
          </div>
        </motion.section>
      )}

      <motion.section
        className={`p-4 sm:p-6 lg:p-[40px] w-full h-fit ${
          !userAddress ? "pt-6 sm:pt-8 lg:pt-10" : ""
        }`}
        aria-label="Vaults and Positions"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: userAddress ? 0.1 : 0 }}
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
