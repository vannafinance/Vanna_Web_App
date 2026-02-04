"use client";

import { Carousel } from "@/components/ui/carousel";
import { NetworkDropdown } from "@/components/network-dropdown";
import {
  CAROUSEL_ITEMS,
  MARGIN_ACCOUNT_INFO_ITEMS,
  MARGIN_ACCOUNT_MORE_DETAILS_ITEMS,
} from "@/lib/constants/margin";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { InfoCard } from "@/components/margin/info-card";
import { LeverageCollateral } from "@/components/margin/leverage-collateral";
import { Positionstable } from "@/components/margin/positions-table";
import { AccountStats } from "@/components/margin/account-stats";
import { Position } from "@/lib/types";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { useUserStore } from "@/store/user";
import { formatValue } from "@/lib/utils/format-value";
import { ACCOUNT_STATS_ITEMS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";
import { useMarginStore } from "@/store/margin-account-state";
import { usePublicClient, useChainId } from "wagmi";
import { useFetchAccountCheck, useFetchCollateralState, useFetchBorrowState } from "@/lib/utils/margin/marginFetchers";

const Margin = () => {
  const { isDark } = useTheme();
  // State to trigger tab switch to Repay Loan
  const [switchToRepayTab, setSwitchToRepayTab] = useState(false);

  // Ref for scrolling to LeverageCollateral component
  const leverageCollateralRef = useRef<HTMLDivElement>(null);

  // Common function to scroll to leverage section
  const scrollToLeverageSection = () => {
    if (leverageCollateralRef.current) {
      leverageCollateralRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Scroll to LeverageCollateral when repay is clicked
  useEffect(() => {
    if (switchToRepayTab) {
      // Small delay to ensure tab switch happens first
      setTimeout(() => {
        scrollToLeverageSection();
      }, 100);
    }
  }, [switchToRepayTab]);

  const userAddress = useUserStore((state) => state.address);
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const marginState = useMarginStore((state) => state.marginState);
  const isLoadingMargin = useMarginStore((state) => state.isLoading);
  const marginError = useMarginStore((state) => state.lastError);
  const reloadMarginState = useMarginStore((state) => state.reloadMarginState);

  const hasMarginAccount = useMarginAccountInfoStore(
    (state) => state.hasMarginAccount
  );

  // ============================================
  // CRITICAL: Initialize margin data fetchers at page level
  // This ensures AccountStats has data available when it renders
  // ============================================
  const fetchAccountCheck = useFetchAccountCheck(chainId, userAddress as `0x${string}`, publicClient);
  const fetchCollateralState = useFetchCollateralState(chainId, publicClient);
  const fetchBorrowState = useFetchBorrowState(chainId, publicClient);

  // Register fetchers in store
  useEffect(() => {
    const fetchers = {
      fetchAccountCheck,
      fetchCollateralState,
      fetchBorrowState,
    };
    useMarginStore.getState().setFetchers(fetchers);
    console.log('[Margin Page] Fetchers registered');
  }, [fetchAccountCheck, fetchCollateralState, fetchBorrowState]);

  // Initial data load when wallet connects
  useEffect(() => {
    if (!publicClient || !chainId || !userAddress) {
      console.log('[Margin Page] Waiting for wallet connection...', { publicClient: !!publicClient, chainId, userAddress });
      return;
    }

    console.log('[Margin Page] Wallet connected, loading margin state...', { chainId, address: userAddress });

    // Small delay to ensure fetchers are registered
    const timer = setTimeout(() => {
      reloadMarginState(true);  // Force refresh on page load
    }, 500);

    return () => clearTimeout(timer);
  }, [publicClient, chainId, userAddress, reloadMarginState]);

  // Derived Account Stats from real marginState
  // ============================================
  // Account Stats Semantic Mapping:
  // 1. Net Health Factor: Health ratio (∞ = safe, 1.0 = liquidation threshold)
  // 2. Collateral Left Before Liquidation: Equity (Collateral - Debt)
  // 3. Net Available Collateral: TOTAL collateral value in margin account
  // 4. Net Amount Borrowed: Total current debt
  // 5. Net P&L: Not yet implemented (needs historical tracking)
  //
  // NOTE: "Net Available Collateral" represents your TOTAL deposited collateral,
  // NOT the additional borrowing capacity. This makes semantic sense as it shows
  // "what collateral is available in your account".
  // ============================================
  const accountStats = useMemo(() => {
    // Return null for loading state to differentiate from actual zero values
    if (!marginState) {
      console.log('[Account Stats] No margin state available');
      return null;
    }

    const hf = marginState.hf || 0;
    const collateral = marginState.collateralUsd || 0;
    const borrow = marginState.borrowUsd || 0;
    const maxBorrow = marginState.maxBorrow || 0;
    const maxWithdraw = marginState.maxWithdraw || 0;

    // Collateral Left Before Liquidation = Equity (safety buffer)
    // This is the net value: Collateral - Debt
    // Represents the value that would remain after paying off all debt
    const collateralLeft = Math.max(0, collateral - borrow);

    // Net Available Collateral = Total collateral value in margin account
    // This represents the TOTAL amount of collateral you have deposited
    // NOT the borrowing capacity (that would be maxBorrow)
    const netAvailableCollateral = collateral;

    const stats = {
      netHealthFactor: hf,
      collateralLeftBeforeLiquidation: collateralLeft,
      netAvailableCollateral: netAvailableCollateral,
      netAmountBorrowed: borrow,
      netProfitAndLoss: 0, // TODO: Needs historical data for PnL
    };

    console.log('[Account Stats] Calculated:', stats);
    return stats;
  }, [marginState]);

  // Format data for InfoCard component
  const marginAccountInfo = useMemo(() => {
    // Show loading or zero state
    if (isLoadingMargin || !marginState) {
      return {
        totalBorrowedValue: 0,
        totalCollateralValue: 0,
        totalValue: 0,
        avgHealthFactor: 0,
        timeToLiquidation: "--",
        borrowRate: "Variable",
        liquidationPremium: "5%",
        liquidationFee: "1%",
        debtLimit: 0,
        minDebt: "10 USD",
        maxDebt: 0,
      };
    }

    const borrow = marginState.borrowUsd || 0;
    const collateral = marginState.collateralUsd || 0;
    return {
      totalBorrowedValue: borrow,
      totalCollateralValue: collateral,
      totalValue: collateral - borrow,
      avgHealthFactor: marginState.hf || 0,
      timeToLiquidation: "--",
      borrowRate: "Variable",
      liquidationPremium: "5%",
      liquidationFee: "1%",
      debtLimit: marginState.maxBorrow || 0,
      minDebt: "10 USD",
      maxDebt: marginState.maxBorrow || 0,
    };
  }, [marginState, isLoadingMargin]);

  // Format account stats value - defined outside rendering
  const formatAccountStatValue = (itemId: string, value: number) => {
    if (itemId === "netHealthFactor") {
      // Handle Infinity for health factor (no debt = infinite health)
      // Also treat very high HF (>999) as infinity for display
      if (value === Infinity || !isFinite(value) || value >= 999) {
        return "∞";
      }
      return formatValue(value, {
        type: "health-factor",
        showZeroAsDash: true, // Show dash for zero health factor (unusual state)
      });
    }

    // For monetary values, show $0.00 instead of dashes
    return `$${formatValue(value, {
      type: "number",
      useLargeFormat: true,
      showZeroAsDash: false, // Show 0.00 instead of --
    })}`;
  };

  // Prepare account stats values for AccountStats component
  const accountStatsValues = useMemo(() => {
    const values = ACCOUNT_STATS_ITEMS.reduce((acc, item) => {
      // Loading state - show loading spinner
      if (isLoadingMargin && !accountStats) {
        acc[item.id] = "⟳";  // Unicode loading symbol
        return acc;
      }

      // No data available (no margin account or data not loaded yet)
      if (!accountStats) {
        acc[item.id] = "-";
        return acc;
      }

      const value = accountStats[item.id as keyof typeof accountStats] ?? 0;

      // Always format the value, even if it's 0
      // Only show "-" for Net Profit & Loss when there's no historical data
      if (value === 0 && item.id === "netProfitAndLoss") {
        acc[item.id] = "-";
      } else {
        acc[item.id] = formatAccountStatValue(item.id, value);
      }

      return acc;
    }, {} as Record<string, string>);

    console.log('[Account Stats Values] Generated:', values);
    return values;
  }, [accountStats, isLoadingMargin]);

  return (
    <main className="w-full">
      {/* Error banner for margin data loading issues */}
      <AnimatePresence>
        {marginError && (
          <motion.div
            className="w-full px-[80px] pt-[20px]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className={`${
              marginError.includes("wait") || marginError.includes("Rate limit")
                ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                : "bg-red-100 border-red-400 text-red-700"
            } border px-4 py-3 rounded relative flex items-center gap-3`} role="alert">
              {/* Icon */}
              {marginError.includes("wait") || marginError.includes("Rate limit") ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}

              {/* Message */}
              <div className="flex-1">
                <span className="block sm:inline">{marginError}</span>
              </div>

              {/* Close button */}
              <button
                onClick={() => useMarginStore.getState().clearError()}
                className="flex-shrink-0 ml-auto"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel section - displays promotional items */}
      <motion.section
        className="w-full h-fit  pb-[48px] px-[80px] pt-[80px] "
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <Carousel items={[...CAROUSEL_ITEMS]} autoplayInterval={5000} />
      </motion.section>

      {userAddress && (
        <motion.section
          className="px-[80px]  w-full h-[405px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <AccountStats
            items={ACCOUNT_STATS_ITEMS}
            values={accountStatsValues}
          />
        </motion.section>
      )}

      {/* Main leverage section */}
      <section className=" w-full p-[80px]  flex flex-col gap-[48px]">
        {/* Section header with network dropdown */}
        <motion.header
          className="w-full flex gap-[20px] items-center"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className={`text-[34px] font-semibold ${isDark ? "text-white" : ""}`}>
            Leverage your Collateral
          </h1>
          {/* Loading Spinner Icon */}
          {isLoadingMargin && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <svg
                className="animate-spin h-6 w-6 text-[#703AE6]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Loading...
              </span>
            </motion.div>
          )}
          <div className="flex-shrink-0">
            <NetworkDropdown />
          </div>
        </motion.header>

        {/* Two column layout: Leverage form and Info card */}
        <div className="flex gap-[36px] relative" ref={leverageCollateralRef}>
          {/* Left: Leverage collateral form */}
          <LeverageCollateral
            switchToRepayTab={switchToRepayTab}
            onTabSwitched={() => setSwitchToRepayTab(false)}
          />

          {/* Right: Margin account info card - sticky */}
          <motion.aside
            className="flex flex-col gap-[20px] w-full h-fit sticky top-[80px] self-start"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Info card header */}
            <motion.header
              className="flex gap-[10px] items-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Vanna logo icon */}
              <motion.div
                className={`border-[1px] flex flex-col justify-center items-center p-2 rounded-[11px] w-[62px] h-[62px] ${
                  ""
                }`}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <Image
                  alt={"vanna"}
                  src={"/logos/vanna-icon.png"}
                  width={34.82}
                  height={31.28}
                />
              </motion.div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-[24px] font-bold ${isDark ? "text-white" : ""}`}>
                    Margin Account Info
                  </h2>
                  {/* Small loading spinner for info card */}
                  {isLoadingMargin && (
                    <motion.svg
                      className="animate-spin h-5 w-5 text-[#703AE6]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </motion.svg>
                  )}
                </div>
                <p className={`w-full text-[16px] font-medium text-[#A3A3A3]`}>
                  {isLoadingMargin ? "Fetching latest data..." : "Stay updated details and status."}
                </p>
              </div>
            </motion.header>

            {/* Info card with expandable sections */}
            <InfoCard
              data={marginAccountInfo}
              items={[...MARGIN_ACCOUNT_INFO_ITEMS]}
              showExpandable={true}
              expandableSections={[
                {
                  title: "MORE DETAILS",
                  headingBold: true,
                  items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS],
                  defaultExpanded: true,
                  delay: 0.1,
                },
                {
                  title: "ORACLES AND LTS",
                  headingBold: true,
                  items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS],
                  defaultExpanded: false,
                  delay: 0.2,
                },
              ]}
            />
          </motion.aside>
        </div>

        {/* Positions table section */}
        {userAddress && (
          <motion.section
            className="w-full h-fit "
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Positionstable
              onRepayClick={() => setSwitchToRepayTab(true)}
              onOpenPositionClick={scrollToLeverageSection}
            />
          </motion.section>
        )}
      </section>
    </main>
  );
};

export default Margin;
