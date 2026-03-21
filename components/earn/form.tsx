import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedTabs } from "../ui/animated-tabs";
import { SupplyLiquidityTab } from "./supply-liquidity-tab";
import { WithdrawLiquidity } from "./withdraw-liqudity";
import { useTheme } from "@/contexts/theme-context";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const tabs = [
  { label: "Supply Liquidity ", id: "supply-liquidity" },
  { label: "Withdraw Liquidity", id: "withdraw-liquidity" },
];

export const Form = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("supply-liquidity");
  return (
    <motion.section 
      className={`w-[480px] h-fit rounded-[20px] border-[1px] p-[20px] flex flex-col gap-[20px] ${
        isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"
      }`}
      aria-label="Liquidity Management"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <nav className="w-full" aria-label="Liquidity Actions">
        <AnimatedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </nav>
      {activeTab === "supply-liquidity" && <SupplyLiquidityTab />}
      {activeTab === "withdraw-liquidity" && <WithdrawLiquidity />}
    </motion.section>
  );
};
