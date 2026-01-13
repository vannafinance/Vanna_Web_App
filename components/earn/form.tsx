import { useState } from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { SupplyLiquidityTab } from "./supply-liquidity-tab";
import { WithdrawLiquidity } from "./withdraw-liqudity";

const tabs = [
  { label: "Supply Liquidity ", id: "supply-liquidity" },
  { label: "Withdraw Liquidity", id: "withdraw-liquidity" },
];

export const Form = () => {
  const [activeTab, setActiveTab] = useState<string>("supply-liquidity");
  return (
    <section 
      className="w-[480px] h-fit rounded-[20px] border-[1px] border-[#E2E2E2] bg-[#F4F4F4] p-[20px] flex flex-col gap-[20px]"
      aria-label="Liquidity Management"
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
    </section>
  );
};
