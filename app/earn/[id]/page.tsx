"use client";

import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { Form } from "@/components/earn/form";
import { Details } from "@/components/earn/details-tab";
import { YourPositions } from "@/components/earn/your-positions";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import Image from "next/image";
import { useState, use, useMemo } from "react";
import { motion } from "framer-motion";
import { ActivityTab } from "@/components/earn/acitivity-tab";
import { AnalyticsTab } from "@/components/earn/analytics-tab";
import { MarginManagersTab } from "@/components/earn/margin-managers-tab";
import { CollateralLimitsTab } from "@/components/earn/collateral-limits-tab";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { iconPaths } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format-value";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import { ChevronLeftIcon } from "@/components/icons";

// Helper function to parse values with K/M/B suffixes
const parseAmountValue = (value?: string): number => {
  if (!value) return 0;

  // Remove $ and commas
  const cleaned = value.replace(/[$,]/g, '').trim();

  // Check for suffix
  const lastChar = cleaned.slice(-1).toUpperCase();
  const numPart = cleaned.slice(0, -1);

  if (lastChar === 'K') {
    return parseFloat(numPart) * 1000;
  } else if (lastChar === 'M') {
    return parseFloat(numPart) * 1000000;
  } else if (lastChar === 'B') {
    return parseFloat(numPart) * 1000000000;
  } else {
    // No suffix, just parse the number
    return parseFloat(cleaned) || 0;
  }
};

const tabs = [
  { id: "your-positions", label: "Your Positions" },
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
  { id: "collateral-limits", label: "Collateral and Limits" },
  { id: "analytics", label: "Analytics" },
  { id: "margin-managers", label: "Margin Managers" },
];

// Animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
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

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export default function EarnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isDark } = useTheme();
  const router = useRouter();
  const selectedVault = useEarnVaultStore((state) => state.selectedVault);
  const [activeTab, setActiveTab] = useState<string>("details");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBackToPools = () => {
    router.push("/earn");
  };

  // Get vault data - either from store or use id as fallback
  const vaultData = useMemo(() => {
    if (selectedVault && selectedVault.id === id) {
      return selectedVault;
    }
    // Fallback data if store is empty (e.g., direct URL access)
    return {
      id: id,
      chain: "ETH",
      title: id,
      tag: "Active",
    };
  }, [selectedVault, id]);

  // Get icon path for the asset
  const iconPath = useMemo(() => {
    // Try to get icon from iconPaths, fallback to eth-icon
    const assetName = vaultData.title.toUpperCase();
    return iconPaths[assetName] || "/icons/eth-icon.png";
  }, [vaultData.title]);

  // Prepare account stats items
  const accountStatsItems = useMemo(() => {
    const assetName = vaultData.title;

    // Parse amounts from vault data
    const totalSupplyAmount = parseAmountValue(
      'assetsSupplied' in vaultData ? vaultData.assetsSupplied?.title : undefined
    );
    const totalBorrowedAmount = parseAmountValue(
      'assetsBorrowed' in vaultData ? vaultData.assetsBorrowed?.title : undefined
    );

    // Calculate Available Liquidity = Total Supply - Total Borrowed
    const availableLiquidity = totalSupplyAmount - totalBorrowedAmount;

    const utilizationRate = parseFloat(
      ('utilizationRate' in vaultData ? vaultData.utilizationRate?.title?.replace('%', '') : undefined) || "6.5"
    );
    const supplyApy = parseFloat(
      ('supplyApy' in vaultData ? vaultData.supplyApy?.title?.replace('%', '') : undefined) || "2.5"
    );

    return [
      {
        id: "1",
        name: "Total Supply",
        amount: `$${formatNumber(totalSupplyAmount || 1000)}`,
        amountInToken: `${formatNumber(20)} ${assetName}`,
      },
      {
        id: "2",
        name: "Available Liquidity",
        amount: `$${formatNumber(availableLiquidity || 3400)}`,
        amountInToken: `${formatNumber(30.4)} ${assetName}`,
      },
      {
        id: "3",
        name: "Utilization Rate",
        amount: `${formatNumber(utilizationRate)}%`,
      },
      {
        id: "4",
        name: "Supply APY",
        amount: `${formatNumber(supplyApy)}%`,
      },
    ];
  }, [vaultData]);

  return (
    <main className="flex flex-col gap-[40px]">
      <motion.header
        className="pt-[40px] px-[80px] w-full h-fit"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full h-fit flex flex-col gap-[20px]">
          <nav aria-label="Breadcrumb">
            <motion.button
              type="button"
              onClick={handleBackToPools}
              className={`w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium hover:text-[#703AE6] transition-colors ${isDark ? "text-white" : "text-[#5A5555]"
                }`}
              whileHover={{ x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeftIcon stroke="currentColor" strokeWidth={2} />
              Back to pools
            </motion.button>
          </nav>
          <motion.div
            className="w-full h-fit flex gap-[16px] items-center"
            variants={itemVariants}
          >
            <div className="flex gap-[16px]">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={iconPath}
                  alt={`${vaultData.title}-icon`}
                  width={36}
                  height={36}
                />
              </motion.div>
              <div className="w-fit h-fit flex gap-[8px] items-center">
                <h1 className={`w-fit h-fit text-[24px] font-bold ${isDark ? "text-white" : "text-[#181822]"
                  }`}>
                  {vaultData.title}
                </h1>
                <div className="w-fit h-fit flex gap-[8px] items-center">
                  <span className={`text-[12px] font-semibold text-center w-fit h-fit rounded-[4px] py-[2px] px-[6px] ${isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4] text-[#0C0C0C]"
                    }`}>
                    V3
                  </span>
                  <span className={`text-[12px] font-semibold text-center w-fit h-fit rounded-[4px] py-[2px] px-[6px] ${isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4] text-[#0C0C0C]"
                    }`}>
                    {vaultData.tag}
                  </span>
                </div>
              </div>
            </div>
            <div className={`text-[16px] font-semibold w-fit h-[48px] rounded-[12px] py-[12px] pr-[16px] pl-[8px] flex gap-[4px] ${isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4]"
              }`}>
              Network:{" "}
              <Image
                src={iconPath}
                alt={`${vaultData.chain}-icon`}
                width={20}
                height={20}
              />
            </div>
          </motion.div>
        </div>
      </motion.header>

      <motion.section
        className="px-[80px]"
        aria-label="Vault Statistics"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <AccountStatsGhost items={accountStatsItems} gridCols="lg:grid-cols-4 grid-cols-2" gridRows="lg:grid-rows-1 grid-rows-2" />
      </motion.section>

      <motion.section
        className="px-[40px] lg:px-[80px] pb-[80px] w-full h-fit"
        aria-label="Vault Details and Actions"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex flex-col  lg:flex-row  gap-[20px] w-full h-fit" variants={contentVariants}>
          <motion.article
            className="w-full lg:w-[700px] h-full flex flex-col gap-[24px]"
            variants={itemVariants}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="w-full h-[48px]" aria-label="Vault Information Tabs">
              <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                type="underline"
                tabClassName="w-[130px] lg:w-[130px]  h-[48px] text-[12px]"
                containerClassName="w-full"
              />
            </nav>
            {activeTab === "your-positions" && <YourPositions />}
            {activeTab === "details" && <Details />}
            {activeTab === "activity" && <ActivityTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "margin-managers" && <MarginManagersTab />}
            {activeTab === "collateral-limits" && <CollateralLimitsTab />}
          </motion.article>
          <motion.aside
            aria-label="Transaction Form"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="mt-[24px] lg:mt-0"
          >
            <Form />
          </motion.aside>
        </motion.div>
      </motion.section>
    </main>
  );
}
