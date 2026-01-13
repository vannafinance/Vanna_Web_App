"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";

export interface TabItem {
  id: string;
  label: string;
}

type TabType = "gradient" | "solid" | "underline" | "ghost";

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  type?: TabType;
  containerClassName?: string;
  tabClassName?: string;
  indicatorClassName?: string;
}

const HOVER_GRADIENT = "linear-gradient(135deg, rgba(112, 58, 230, 0.08) 0%, rgba(112, 58, 230, 0.04) 100%)";
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onTabChange,
  type = "gradient",
  containerClassName = "",
  tabClassName = "",
  indicatorClassName = "",
}: AnimatedTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const { isDark } = useTheme();
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const indicatorWidth = `calc((100% - 12px) / ${tabs.length})`;

  // Helper to get text color
  const getTextColor = (isActive: boolean, isHovered: boolean) => {
    if (type === "solid" && isActive) return "#FFFFFF";
    if (type === "ghost" && isActive) return "#703AE6";
    if (type === "underline") {
      if (isActive) return "#703AE6";
      if (isDark) {
        if (isHovered && !isActive) return "#C7C7C7";
        return "#FFFFFF";
      }
      if (isHovered) return "#000000";
      return "#A7A7A7";
    }
    if (type === "gradient" || type === "solid") {
      if (isDark) return "#FFFFFF";
      if (isActive || isHovered) return "#000000";
      return "#64748b";
    }
    if (isActive || isHovered) return "#000000";
    return "#64748b";
  };

  // Helper to get background color
  const getBackground = (isActive: boolean, isHovered: boolean) => {
    if (isHovered && !isActive) return HOVER_GRADIENT;
    if (type === "solid" && isActive) return "#703AE6";
    if (type === "ghost" && isActive) return "#F1EBFD";
    return "transparent";
  };

  

  // Render underline type
  if (type === "underline") {
    return (
      <div className={` h-fit  ${containerClassName}`}>
        <div className="w-full  flex" onMouseLeave={() => setHoveredTab(null)}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <motion.div
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                className={`whitespace-nowrap  px-[20px] font-semibold flex items-center justify-center cursor-pointer relative ${tabClassName}`}
                animate={{
                  color: getTextColor(isActive, isHovered),
                  borderBottomWidth: isActive ? "2px" : "0px",
                  borderBottomColor: isActive ? "#703AE6" : "transparent",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {tab.label}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  

  // Render gradient/solid/ghost types
  const containerPadding = (type === "solid" || type === "ghost") ? "p-[4px] w-fit h-fit" : "p-[6px]";
  const containerWidth = (type === "solid" || type === "ghost") ? "w-full" : "w-full";
  const tabWidth = (type === "solid" ) ? "w-[160px]" : type === "ghost" ? "w-[180px]" : "";
  const tabPadding = (type === "solid" || type === "ghost") ? "py-[12px] px-[8px]" : "";
  const tabHeight = (type === "solid") ? "h-fit" :  (type === "ghost") ? "h-[38px]" : "h-[64px]";
  const useFlex1 = (type !== "solid" && type !== "ghost");

  return (
    <div className={containerClassName}>
      <div
        className={`border-[1px] ${containerWidth} flex gap-[16px] ${containerPadding} rounded-[12px] h-fit relative overflow-hidden ${
          isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"
        }`}
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Gradient indicator */}
        {type === "gradient" && (
          <motion.div
            className={`absolute top-[6px] left-[6px] h-[64px] rounded-[12px] bg-gradient p-[2px] ${indicatorClassName}`}
            style={{ width: indicatorWidth }}
            animate={{ x: `${currentIndex * 100}%` }}
            transition={SPRING_CONFIG}
          >
            <div className={`rounded-[12px] h-full w-full ${isDark ? "bg-[#111111]" : "bg-white"}`} />
          </motion.div>
        )}

        {/* Tab buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <motion.div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              className={`${tabWidth} ${tabPadding} hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center ${tabHeight} rounded-[10px] ${useFlex1 ? "flex-1" : ""} relative z-10 ${tabClassName}`}
              animate={{
                color: getTextColor(isActive, isHovered),
                background: getBackground(isActive, isHovered),
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {tab.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
