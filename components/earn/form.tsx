import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedTabs } from "../ui/animated-tabs";
import { SupplyLiquidityTab } from "./supply-liquidity-tab";
import { WithdrawLiquidity } from "./withdraw-liqudity";
import { useTheme } from "@/contexts/theme-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

const tabs = [
  { label: "Supply Liquidity", id: "supply-liquidity" },
  { label: "Withdraw Liquidity", id: "withdraw-liquidity" },
];

export const Form = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("supply-liquidity");
  const [sheetOpen, setSheetOpen] = useState(false);

  function openSheet(tab: string) {
    setActiveTab(tab);
    setSheetOpen(true);
  }

  const formContent = (
    <>
      <nav className="w-full" aria-label="Liquidity Actions">
        <AnimatedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </nav>
      {activeTab === "supply-liquidity" && <SupplyLiquidityTab />}
      {activeTab === "withdraw-liquidity" && <WithdrawLiquidity />}
    </>
  );

  return (
    <>
      {/* ── Desktop: inline card ── */}
      <motion.section
        className={`hidden lg:flex w-full lg:w-[480px] h-fit rounded-[20px] border-[1px] p-5 flex-col gap-5 ${
          isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
        }`}
        aria-label="Liquidity Management"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {formContent}
      </motion.section>

      {/* ── Mobile: two trigger buttons + bottom sheet ── */}
      <div className="lg:hidden w-full flex flex-col items-center gap-1">
        <motion.button
          type="button"
          className="cursor-pointer"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          onClick={() => openSheet("supply-liquidity")}
          aria-label="Open liquidity form"
        >
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
            <path d="M2 8L10 2L18 8" stroke={isDark ? '#919191' : '#A0A0A0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            text="Supply"
            size="medium"
            type="solid"
            disabled={false}
            onClick={() => openSheet("supply-liquidity")}
          />
          <Button
            text="Withdraw"
            size="medium"
            type="ghost"
            disabled={false}
            onClick={() => openSheet("withdraw-liquidity")}
          />
        </div>

        <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <div className="flex flex-col gap-4 pb-2">{formContent}</div>
        </BottomSheet>
      </div>
    </>
  );
};
