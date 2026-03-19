"use client";

import { Carousel } from "@/components/ui/carousel";
import {
  CAROUSEL_ITEMS,
  MARGIN_ACCOUNT_INFO_ITEMS,
  MARGIN_ACCOUNT_MORE_DETAILS_ITEMS,
} from "@/lib/constants/margin";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

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

  

  // Account statistics state
  const [accountStats, setAccountStats] = useState({
    netHealthFactor: 567777,
    collateralLeftBeforeLiquidation: 173663,
    netAvailableCollateral: 1000,
    netAmountBorrowed: 770,
    netProfitAndLoss: 0,
  });

  // Get margin account info from global store using selector to prevent unnecessary re-renders
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

  // Format account stats value - defined outside rendering
  const formatAccountStatValue = (itemId: string, value: number) => {
    if (itemId === "netHealthFactor") {
      return formatValue(value, { type: "health-factor" });
    }
    return formatValue(value, {
      type: "number",
      useLargeFormat: true,
    });
  };

  // Prepare account stats values for AccountStats component
  const accountStatsValues = ACCOUNT_STATS_ITEMS.reduce((acc, item) => {
    if (!hasMarginAccount) {
      acc[item.id] = "-";
      return acc;
    }

    const value = accountStats[item.id as keyof typeof accountStats] || 0;
    
    if (value === 0) {
      acc[item.id] = "-";
    } else {
      acc[item.id] = formatAccountStatValue(item.id, value);
    }
    
    return acc;
  }, {} as Record<string, string>);

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="w-full pb-[72px] lg:pb-0">
      {/* Carousel section */}
      <motion.section
        className="w-full h-fit px-4 sm:px-8 lg:px-[80px] pt-5 sm:pt-10 lg:pt-[80px] pb-5 sm:pb-[48px]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <Carousel items={[...CAROUSEL_ITEMS]} autoplayInterval={5000} />
      </motion.section>

      {/* Account stats - horizontal scroll on mobile */}
      {userAddress && (
        <motion.section
          className="px-4 sm:px-8 lg:px-[80px] w-full h-auto pb-2 sm:pb-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <AccountStats items={ACCOUNT_STATS_ITEMS} values={accountStatsValues} />
        </motion.section>
      )}

      {/* Main leverage section */}
      <section className="w-full px-4 sm:px-8 lg:px-[80px] py-5 sm:py-8 lg:py-[80px] flex flex-col gap-5 sm:gap-8 lg:gap-[48px]">
        {/* Section heading */}
        <motion.header
          className="w-full flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className={`w-1 h-[28px] sm:h-[36px] rounded-full bg-[#703AE6]`} />
          <h1 className={`text-[22px] sm:text-[32px] lg:text-[38px] font-bold ${isDark ? "text-white" : ""}`}>
            Leverage your Collateral
          </h1>
        </motion.header>

        {/* Mobile bottom sheet for leverage form */}
        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <LeverageCollateral
            switchToRepayTab={switchToRepayTab}
            onTabSwitched={() => setSwitchToRepayTab(false)}
          />
        </BottomSheet>

        {/* Desktop: Two column layout */}
        <div className="hidden lg:flex gap-[36px] relative" ref={leverageCollateralRef}>
          <LeverageCollateral
            switchToRepayTab={switchToRepayTab}
            onTabSwitched={() => setSwitchToRepayTab(false)}
          />
          <motion.aside
            className="flex flex-col gap-[20px] w-full h-fit sticky top-[80px] self-start"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.header className="flex gap-[10px]" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, ease: "easeOut" }}>
              <motion.div className="border-[1px] flex flex-col justify-center items-center p-2 rounded-[11px] w-[62px] h-[62px]" initial={{ scale: 0, rotate: -180 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, type: "spring", stiffness: 200 }}>
                <Image alt={"vanna"} src={"/logos/vanna-icon.png"} width={34.82} height={31.28} />
              </motion.div>
              <div className="flex flex-col">
                <h2 className={`w-full text-[24px] font-bold ${isDark ? "text-white" : ""}`}>Margin Account Info</h2>
                <p className="w-full text-[16px] font-medium text-[#A3A3A3]">Stay updated details and status.</p>
              </div>
            </motion.header>
            <InfoCard data={marginAccountInfo} items={[...MARGIN_ACCOUNT_INFO_ITEMS]} showExpandable={true} expandableSections={[
              { title: "MORE DETAILS", headingBold: true, items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS], defaultExpanded: true, delay: 0.1 },
              { title: "ORACLES AND LTS", headingBold: true, items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS], defaultExpanded: false, delay: 0.2 },
            ]} />
          </motion.aside>
        </div>

        {/* Mobile: Account Info section with card wrapper */}
        <motion.div
          className="flex lg:hidden flex-col gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-1 h-[20px] rounded-full bg-[#703AE6]`} />
            <h2 className={`text-[16px] font-bold ${isDark ? "text-white" : ""}`}>
              Margin Account Info
            </h2>
          </div>
          <InfoCard data={marginAccountInfo} items={[...MARGIN_ACCOUNT_INFO_ITEMS]} showExpandable={true} expandableSections={[
            { title: "MORE DETAILS", headingBold: true, items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS], defaultExpanded: false, delay: 0.1 },
            { title: "ORACLES AND LTS", headingBold: true, items: [...MARGIN_ACCOUNT_MORE_DETAILS_ITEMS], defaultExpanded: false, delay: 0.2 },
          ]} />
        </motion.div>

        {/* Positions table section */}
        {userAddress && (
          <motion.section
            className="w-full h-fit"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Positionstable onRepayClick={() => setSwitchToRepayTab(true)} onOpenPositionClick={scrollToLeverageSection} />
          </motion.section>
        )}
      </section>

      {/* Mobile: Fixed bottom bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex flex-col items-center lg:hidden border-t"
        style={{ backgroundColor: isDark ? '#111111' : '#ffffff', borderColor: isDark ? '#222222' : '#f0f0f0' }}
      >
        <motion.button
          type="button"
          className="py-1.5 cursor-pointer"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          onClick={() => { setSwitchToRepayTab(false); setSheetOpen(true); }}
          aria-label="Open leverage form"
        >
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
            <path d="M2 8L10 2L18 8" stroke={isDark ? '#555' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <div className="flex gap-3 w-full px-4 pb-[max(8px,env(safe-area-inset-bottom))]">
          <Button text="Leverage Assets" type="solid" size="medium" onClick={() => { setSwitchToRepayTab(false); setSheetOpen(true); }} disabled={false} />
          <Button text="Repay Loan" type="ghost" size="medium" onClick={() => { setSwitchToRepayTab(true); setSheetOpen(true); }} disabled={false} />
        </div>
      </div>
    </main>
  );
};

export default Margin;
