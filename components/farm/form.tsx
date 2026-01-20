import { AnimatedTabs } from "../ui/animated-tabs"
import { useState } from "react"
import { AddLiquidity } from "./add-liquidity"
import { RemoveLiquidity } from "./remove-liquidity"
import { useTheme } from "@/contexts/theme-context"

export const Form = () => {
  const [activeTab, setActiveTab] = useState<string>("add-liquidity")
  const { isDark } = useTheme()
  return (
    <div className={`w-[480px] border-[1px] rounded-[20px] p-[16px] h-fit flex flex-col gap-[24px] ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <AnimatedTabs 
        type="gradient" 
        tabs={[
          { id: "add-liquidity", label: "Add" }, 
          { id: "remove-liquidity", label: "Remove" }
        ]} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      {activeTab === "add-liquidity" && <AddLiquidity />}
      {activeTab === "remove-liquidity" && <RemoveLiquidity />}
    </div>
  )
}