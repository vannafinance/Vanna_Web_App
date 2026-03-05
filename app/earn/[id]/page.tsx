"use client";

/**
 * Earn Vault Detail Page
 *
 * WHAT CHANGED:
 * - OLD: Stats came from useEarnVaultStore (lost on refresh since persist=false)
 * - NEW: Fetches real vault stats from blockchain on mount via useFetchCompleteVaultStats
 *        Falls back to store data if available, then to loading state
 *
 * DATA FLOW:
 * 1. Asset name from URL param (e.g. /earn/USDC -> asset = "USDC")
 * 2. useFetchCompleteVaultStats(chainId, asset, publicClient) -> VaultStats
 * 3. Prices from /api/prices for USD conversion of token amounts
 * 4. Stats displayed: Total Supply, Available Liquidity, Utilization Rate, Supply APY
 */

import { AccountStatsGhost } from "@/components/earn/account-stats-ghost";
import { Form } from "@/components/earn/form";
import { Details } from "@/components/earn/details-tab";
import { YourPositions } from "@/components/earn/your-positions";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import Image from "next/image";
import { useState, use, useMemo, useEffect } from "react";
import { ActivityTab } from "@/components/earn/acitivity-tab";
import { AnalyticsTab } from "@/components/earn/analytics-tab";
import { MarginManagersTab } from "@/components/earn/margin-managers-tab";
import { CollateralLimitsTab } from "@/components/earn/collateral-limits-tab";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { iconPaths } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format-value";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import { useAccount, usePublicClient } from "wagmi";
import { useFetchCompleteVaultStats, VaultStats } from "@/lib/utils/earn/earnFetchers";
import { EarnAsset } from "@/lib/types";

const tabs = [
  { id: "your-positions", label: "Your Positions" },
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
  { id: "collateral-limits", label: "Collateral and Limits" },
  { id: "analytics", label: "Analytics" },
  { id: "margin-managers", label: "Margin Managers" },
];

export default function EarnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isDark } = useTheme();
  const router = useRouter();
  const selectedVault = useEarnVaultStore((state) => state.selectedVault);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Wagmi hooks for fetching real vault data
  const { chainId } = useAccount();
  const publicClient = usePublicClient();

  // Resolve asset from URL id (e.g. "USDC", "ETH", "USDT")
  const asset = useMemo(() => {
    const upper = id.toUpperCase();
    if (["ETH", "USDC", "USDT"].includes(upper)) return upper as EarnAsset;
    if (selectedVault?.title) return selectedVault.title.toUpperCase() as EarnAsset;
    return "ETH" as EarnAsset;
  }, [id, selectedVault]);

  // Fetch real vault stats from blockchain on mount
  const fetchVaultStats = useFetchCompleteVaultStats(chainId, asset, publicClient);
  const [vaultStats, setVaultStats] = useState<VaultStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setStatsLoading(true);

      // Fetch prices and vault stats in parallel
      const [stats, pricesData] = await Promise.all([
        fetchVaultStats().catch(() => null),
        fetch("/api/prices").then(r => r.json()).catch(() => ({ ETH: 2000, USDC: 1, USDT: 1 })),
      ]);

      if (cancelled) return;

      setVaultStats(stats);
      setPrices(pricesData);
      setStatsLoading(false);
    };

    loadStats();
    return () => { cancelled = true; };
  }, [fetchVaultStats]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBackToPools = () => {
    router.push("/earn");
  };

  // Get vault metadata from store or fallback
  const vaultData = useMemo(() => {
    if (selectedVault && selectedVault.id === id) {
      return selectedVault;
    }
    return {
      id: id,
      chain: asset,
      title: asset,
      tag: "Active",
    };
  }, [selectedVault, id, asset]);

  // Get icon path for the asset
  const iconPath = useMemo(() => {
    const assetName = vaultData.title.toUpperCase();
    return iconPaths[assetName] || "/icons/eth-icon.png";
  }, [vaultData.title]);

  // Build account stats from REAL blockchain data
  const accountStatsItems = useMemo(() => {
    const assetName = vaultData.title;
    const tokenPrice = prices[asset] || (asset === "ETH" ? prices["ETH"] || 0 : 1);

    if (vaultStats) {
      const totalSupplyUsd = vaultStats.totalAssetsFormatted * tokenPrice;
      const availableLiquidityUsd = vaultStats.availableLiquidity * tokenPrice;

      return [
        {
          id: "1",
          name: "Total Supply",
          amount: `$${formatNumber(totalSupplyUsd)}`,
          amountInToken: `${formatNumber(vaultStats.totalAssetsFormatted)} ${assetName}`,
        },
        {
          id: "2",
          name: "Available Liquidity",
          amount: `$${formatNumber(availableLiquidityUsd)}`,
          amountInToken: `${formatNumber(vaultStats.availableLiquidity)} ${assetName}`,
        },
        {
          id: "3",
          name: "Utilization Rate",
          amount: `${formatNumber(vaultStats.utilizationRate * 100)}%`,
        },
        {
          id: "4",
          name: "Supply APY",
          amount: `${formatNumber(vaultStats.supplyAPY)}%`,
        },
      ];
    }

    // Loading state
    if (statsLoading) {
      return [
        { id: "1", name: "Total Supply", amount: "...", amountInToken: `-- ${assetName}` },
        { id: "2", name: "Available Liquidity", amount: "...", amountInToken: `-- ${assetName}` },
        { id: "3", name: "Utilization Rate", amount: "..." },
        { id: "4", name: "Supply APY", amount: "..." },
      ];
    }

    // Fallback: no data
    return [
      { id: "1", name: "Total Supply", amount: "$0.00", amountInToken: `0 ${assetName}` },
      { id: "2", name: "Available Liquidity", amount: "$0.00", amountInToken: `0 ${assetName}` },
      { id: "3", name: "Utilization Rate", amount: "0%" },
      { id: "4", name: "Supply APY", amount: "0%" },
    ];
  }, [vaultData.title, vaultStats, statsLoading, prices, asset]);

  return (
    <main className="flex flex-col gap-[40px]">
      <header className="pt-[40px] px-[80px] w-full h-fit">
        <div className="w-full h-fit flex flex-col gap-[20px]">
          <nav aria-label="Breadcrumb">
            <button
              type="button"
              onClick={handleBackToPools}
              className={`w-fit h-fit flex gap-[12px] items-center cursor-pointer text-[16px] font-medium hover:text-[#703AE6] transition-colors ${
                isDark ? "text-white" : "text-[#5A5555]"
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
            <div className="flex gap-[16px]">
              <Image
                src={iconPath}
                alt={`${vaultData.title}-icon`}
                width={36}
                height={36}
              />
              <div className="w-fit h-fit flex gap-[8px] items-center">
                <h1 className={`w-fit h-fit text-[24px] font-bold ${
                  isDark ? "text-white" : "text-[#181822]"
                }`}>
                  {vaultData.title}
                </h1>
                <div className="w-fit h-fit flex gap-[8px] items-center">
                  <span className={`text-[12px] font-semibold text-center w-fit h-fit rounded-[4px] py-[2px] px-[6px] ${
                    isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4] text-[#0C0C0C]"
                  }`}>
                    V3
                  </span>
                  <span className={`text-[12px] font-semibold text-center w-fit h-fit rounded-[4px] py-[2px] px-[6px] ${
                    isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4] text-[#0C0C0C]"
                  }`}>
                    {vaultData.tag}
                  </span>
                </div>
              </div>
            </div>
            <div className={`text-[16px] font-semibold w-fit h-[48px] rounded-[12px] py-[12px] pr-[16px] pl-[8px] flex gap-[4px] ${
              isDark ? "bg-[#222222] text-white" : "bg-[#F4F4F4]"
            }`}>
              Network:{" "}
              <Image
                src={iconPath}
                alt={`${vaultData.chain}-icon`}
                width={20}
                height={20}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="px-[80px]" aria-label="Vault Statistics">
        <AccountStatsGhost items={accountStatsItems} />
      </section>

      <section className="px-[80px] pb-[80px] w-full h-fit" aria-label="Vault Details and Actions">
        <div className="flex gap-[20px] w-full h-fit">
          <article className="w-[700px] h-full flex flex-col gap-[24px]">
            <nav className="w-full h-[48px]" aria-label="Vault Information Tabs">
              <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                type="underline"
                tabClassName="w-[130px] h-[48px] text-[12px]"
                containerClassName="w-full"
              />
            </nav>
            {activeTab === "your-positions" && <YourPositions />}
            {activeTab === "details" && <Details selectedAsset={id as any} />}
            {activeTab === "activity" && <ActivityTab selectedAsset={asset} />}
            {activeTab === "analytics" && <AnalyticsTab selectedAsset={id as any} />}
            {activeTab === "margin-managers" && <MarginManagersTab selectedAsset={id as any} />}
            {activeTab === "collateral-limits" && <CollateralLimitsTab selectedAsset={id as any} />}
          </article>
          <aside aria-label="Transaction Form">
            <Form />
          </aside>
        </div>
      </section>
    </main>
  );
}
