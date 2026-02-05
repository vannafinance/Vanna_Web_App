import { AnimatedTabs } from "../ui/animated-tabs"
import { useState } from "react"
import { AddLiquidity } from "./add-liquidity"
import { RemoveLiquidity } from "./remove-liquidity"
import { useTheme } from "@/contexts/theme-context"
import { motion, AnimatePresence } from "framer-motion"

export const Form = () => {
  const [activeTab, setActiveTab] = useState<string>("add-liquidity")
  const { isDark } = useTheme()
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`w-[480px] border-[1px] rounded-[20px] p-[16px] h-fit flex flex-col gap-[24px] ${
        isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
      }`}
    >
      <AnimatedTabs 
        type="gradient" 
        tabs={[
          { id: "add-liquidity", label: "Add" }, 
          { id: "remove-liquidity", label: "Remove" }
        ]} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <AnimatePresence mode="wait">
        {activeTab === "add-liquidity" && (
          <motion.div
            key="add"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <AddLiquidity />
          </motion.div>
        )}
        {activeTab === "remove-liquidity" && (
          <motion.div
            key="remove"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <RemoveLiquidity />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}