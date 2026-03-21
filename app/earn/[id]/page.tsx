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

const parseAmountValue = (value?: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[$,]/g, "").trim();
  const lastChar = cleaned.slice(-1).toUpperCase();
  const numPart = cleaned.slice(0, -1);

  if (lastChar === "K") return parseFloat(numPart) * 1000;
  if (lastChar === "M") return parseFloat(numPart) * 1000000;
  if (lastChar === "B") return parseFloat(numPart) * 1000000000;
  return parseFloat(cleaned) || 0;
};

const tabs = [
  { id: "your-positions", label: "Your Positions" },
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
  { id: "collateral-limits", label: "Collateral and Limits" },
  { id: "analytics", label: "Analytics" },
  { id: "margin-managers", label: "Margin Managers" },
];

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function EarnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isDark } = useTheme();
  const router = useRouter();
  const selectedVault = useEarnVaultStore((state) => state.selectedVault);
  const [activeTab, setActiveTab] = useState<string>("details");

  const handleTabChange = (tab: string) => setActiveTab(tab);
  const handleBackToPools = () => router.push("/earn");

  const vaultData = useMemo(() => {
    if (selectedVault && selectedVault.id === id) return selectedVault;
    return { id, chain: "ETH", title: id, tag: "Active" };
  }, [selectedVault, id]);

  const iconPath = useMemo(() => {
    const assetName = vaultData.title.toUpperCase();
    return iconPaths[assetName] || "/icons/eth-icon.png";
  }, [vaultData.title]);

  const accountStatsItems = useMemo(() => {
    const assetName = vaultData.title;
    const totalSupplyAmount = parseAmountValue(
      "assetsSupplied" in vaultData
        ? vaultData.assetsSupplied?.title
        : undefined,
    );
    const totalBorrowedAmount = parseAmountValue(
      "assetsBorrowed" in vaultData
        ? vaultData.assetsBorrowed?.title
        : undefined,
    );
    const availableLiquidity = totalSupplyAmount - totalBorrowedAmount;
    const utilizationRate = parseFloat(
      ("utilizationRate" in vaultData
        ? vaultData.utilizationRate?.title?.replace("%", "")
        : undefined) || "6.5",
    );
    const supplyApy = parseFloat(
      ("supplyApy" in vaultData
        ? vaultData.supplyApy?.title?.replace("%", "")
        : undefined) || "2.5",
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
    <main className="flex flex-col gap-6 sm:gap-8 lg:gap-[40px]">
      {/* ─── Header ─── */}
      <motion.header
        className="pt-5 sm:pt-8 lg:pt-[40px] px-4 sm:px-8 lg:px-[80px] w-full h-fit"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full h-fit flex flex-col gap-3 sm:gap-4 lg:gap-[20px]">
          {/* Back button */}
          <nav aria-label="Breadcrumb">
            <motion.button
              type="button"
              onClick={handleBackToPools}
              className={`w-fit h-fit flex gap-2 items-center cursor-pointer text-[14px] sm:text-[16px] font-medium hover:text-[#703AE6] transition-colors ${
                isDark ? "text-white" : "text-[#5A5555]"
              }`}
              whileHover={{ x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeftIcon stroke="currentColor" strokeWidth={2} />
              Back to pools
            </motion.button>
          </nav>

          {/* Vault title row -- stacks on mobile */}
          <motion.div
            className="w-full h-fit flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center"
            variants={itemVariants}
          >
            <div className="flex gap-3 sm:gap-[16px] items-center min-w-0 flex-wrap">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <Image
                  src={iconPath}
                  alt={`${vaultData.title}-icon`}
                  width={36}
                  height={36}
                />
              </motion.div>
              <div className="flex gap-2 items-center flex-wrap">
                <h1
                  className={`text-[20px] sm:text-[24px] font-bold ${
                    isDark ? "text-white" : "text-[#181822]"
                  }`}
                >
                  {vaultData.title}
                </h1>
                <div className="flex gap-[6px] items-center">
                  <span
                    className={`text-[12px] font-semibold text-center rounded-[4px] py-[2px] px-[6px] ${
                      isDark
                        ? "bg-[#222222] text-white"
                        : "bg-[#F4F4F4] text-[#0C0C0C]"
                    }`}
                  >
                    V3
                  </span>
                  <span
                    className={`text-[12px] font-semibold text-center rounded-[4px] py-[2px] px-[6px] ${
                      isDark
                        ? "bg-[#222222] text-white"
                        : "bg-[#F4F4F4] text-[#0C0C0C]"
                    }`}
                  >
                    {vaultData.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Network badge */}
            <div
              className={`text-[14px] sm:text-[16px] font-semibold w-fit h-[40px] sm:h-[48px] rounded-[12px] py-2 sm:py-[12px] pr-3 sm:pr-[16px] pl-2 sm:pl-[8px] flex gap-[6px] items-center ${
                isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4]"
              }`}
            >
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

      {/* ─── Stats Row ─── */}
      <motion.section
        className="px-4 sm:px-8 lg:px-[80px]"
        aria-label="Vault Statistics"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <AccountStatsGhost
          items={accountStatsItems}
          gridCols="grid-cols-2 lg:grid-cols-4"
          gridRows="grid-rows-2 lg:grid-rows-1"
        />
      </motion.section>

      {/* ─── Content: Tabs + Form ─── */}
      <motion.section
        className="px-4 sm:px-8 lg:px-[80px] pb-8 lg:pb-[80px] w-full h-fit"
        aria-label="Vault Details and Actions"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="flex flex-col lg:flex-row gap-5 w-full h-fit"
          variants={contentVariants}
        >
          {/* Left: Info tabs */}
          <motion.article
            className="w-full lg:flex-1 lg:max-w-[700px] h-full flex flex-col gap-4 lg:gap-[24px] min-w-0"
            variants={itemVariants}
          >
            <nav className="w-full" aria-label="Vault Information Tabs">
              <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                type="underline"
                tabClassName="h-[42px] sm:h-[48px] text-[11px] sm:text-[12px]"
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

          {/* Right: Supply / Withdraw form */}
          <motion.aside
            aria-label="Transaction Form"
            variants={itemVariants}
            className="w-full lg:w-auto mt-4 lg:mt-0"
          >
            <Form />
          </motion.aside>
        </motion.div>
      </motion.section>
    </main>
  );
}
