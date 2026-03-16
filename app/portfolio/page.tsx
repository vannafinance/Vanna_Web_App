"use client";

import { useState, useMemo, useEffect } from "react";
import { useUserStore } from "@/store/user";
import { useMarginStore } from "@/store/margin-account-state";
import { usePublicClient, useChainId } from "wagmi";
import {
  useFetchAccountCheck,
  useFetchCollateralState,
  useFetchBorrowState,
} from "@/lib/utils/margin/marginFetchers";
import { formatValue } from "@/lib/utils/format-value";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { AccountStats } from "@/components/margin/account-stats";
import { Chart } from "@/components/earn/chart";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Lender } from "@/components/portfolio/lender";
import { TraderSection } from "@/components/portfolio/trader-section";
import { DepositModal } from "@/components/ui/deposit-modal";
import { WithdrawModal } from "@/components/ui/withdraw-modal";

// ── Portfolio stat card definitions ──────────────────────────────────────────
const PORTFOLIO_STATS_ITEMS = [
  {
    id: "totalPortfolioBalance",
    name: "Total Portfolio Balance",
    icon: "/margin/dollar.png",
  },
  {
    id: "netAvailableCollateral",
    name: "Net Available Collateral",
    icon: "/margin/liquidation.png",
  },
  {
    id: "marginAccountBalance",
    name: "Margin Account Balance",
    icon: "/margin/retry.png",
  },
  {
    id: "availablePortfolioBalance",
    name: "Available Portfolio Balance",
    icon: "/margin/bag.png",
  },
] as const;

const MAIN_TABS = [
  { id: "lender", label: "Lender" },
  { id: "trader", label: "Trader" },
];

export default function PortfolioPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("trader");

  // ── Modal states ─────────────────────────────────────────
  const [depositOpen,  setDepositOpen]  = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // ── Chain / wallet ────────────────────────────────────────
  const userAddress = useUserStore((s) => s.address);
  const chainId     = useChainId();
  const publicClient = usePublicClient();

  const marginState     = useMarginStore((s) => s.marginState);
  const isLoadingMargin = useMarginStore((s) => s.isLoading);
  const reloadMarginState = useMarginStore((s) => s.reloadMarginState);

  // Register margin fetchers (same pattern as margin/page.tsx)
  const fetchAccountCheck   = useFetchAccountCheck(chainId, userAddress as `0x${string}`, publicClient);
  const fetchCollateralState = useFetchCollateralState(chainId, publicClient);
  const fetchBorrowState    = useFetchBorrowState(chainId, publicClient);

  useEffect(() => {
    useMarginStore.getState().setFetchers({
      fetchAccountCheck,
      fetchCollateralState,
      fetchBorrowState,
    });
  }, [fetchAccountCheck, fetchCollateralState, fetchBorrowState]);

  useEffect(() => {
    if (!publicClient || !chainId || !userAddress) return;
    const t = setTimeout(() => reloadMarginState(true), 500);
    return () => clearTimeout(t);
  }, [publicClient, chainId, userAddress, reloadMarginState]);

  // ── Portfolio overview stats ──────────────────────────────
  const portfolioStatsValues = useMemo(() => {
    const loading = isLoadingMargin && !marginState;
    if (loading) {
      return PORTFOLIO_STATS_ITEMS.reduce(
        (acc, item) => ({ ...acc, [item.id]: "⟳" }),
        {} as Record<string, string>
      );
    }
    const collateral  = marginState?.collateralUsd ?? 0;
    const borrow      = marginState?.borrowUsd     ?? 0;
    const maxWithdraw = marginState?.maxWithdraw   ?? 0;
    const fmt = (v: number) =>
      `$${formatValue(v, { type: "number", useLargeFormat: true })}`;
    return {
      totalPortfolioBalance:    fmt(collateral),
      netAvailableCollateral:   fmt(collateral),
      marginAccountBalance:     fmt(Math.max(0, collateral - borrow)),
      availablePortfolioBalance: fmt(maxWithdraw),
    };
  }, [marginState, isLoadingMargin]);

  return (
    <div className="py-[80px] px-[80px] w-full h-fit">
      <div className="flex flex-col gap-[40px] w-full">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex justify-between w-full items-center">
          <h1 className={`text-[24px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}>
            Portfolio
          </h1>
          <div className="flex gap-[8px]">
            <Button
              width="w-fit"
              text="Deposit"
              size="small"
              type="solid"
              disabled={false}
              onClick={() => setDepositOpen(true)}
            />
            <Button
              width="w-fit"
              text="Withdraw"
              size="small"
              type="solid"
              disabled={false}
              onClick={() => setWithdrawOpen(true)}
            />
            <Button
              width="w-fit"
              text="Transfer"
              size="small"
              type="solid"
              disabled={false}
              onClick={() => setTransferOpen(true)}
            />
            <Button
              width="w-fit"
              text="History"
              size="small"
              type="ghost"
              disabled={false}
            />
          </div>
        </div>

        {/* ── Portfolio stats (2×2 grid) ──────────────────────── */}
        {userAddress && (
          <div className="w-full h-[405px]">
            <AccountStats
              items={[...PORTFOLIO_STATS_ITEMS]}
              values={portfolioStatsValues}
              gridCols="grid-cols-2"
            />
          </div>
        )}

        {/* ── Charts row ─────────────────────────────────────── */}
        <div className="w-full flex gap-[24px]">
          <Chart
            type="net-profit-loss"
            containerHeight="h-[331px]"
            containerWidth="w-full"
          />
          <Chart
            type="net-volume"
            containerHeight="h-[331px]"
            containerWidth="w-full"
          />
        </div>

        {/* ── Lender / Trader tabs ────────────────────────────── */}
        <div className="flex flex-col gap-[24px]">
          <AnimatedTabs
            type="underline"
            tabs={MAIN_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            containerClassName={`border-b ${isDark ? "border-[#333]" : "border-[#E5E7EB]"}`}
            tabClassName="py-[12px] text-[16px]"
          />
          {activeTab === "lender" ? <Lender /> : <TraderSection />}
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <DepositModal  isOpen={depositOpen}  onClose={() => setDepositOpen(false)} />
      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw" />
      <WithdrawModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} title="Transfer Collateral" />
    </div>
  );
}
