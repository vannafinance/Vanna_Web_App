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
  customTabWidth?: string; // Custom width for tabs (e.g., "w-[200px]")
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
  customTabWidth,
}: AnimatedTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const { isDark } = useTheme();
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const indicatorWidth = `calc((100% - 12px) / ${tabs.length})`;

  // Helper to get text color
  const getTextColor = (isActive: boolean, isHovered: boolean) => {
    if (type === "solid" && isActive) return "#FFFFFF";
    if (type === "ghost") {
      if (isActive) return "#703AE6";
      if (isDark) {
        return "#FFFFFF"; // Inactive ghost tabs: white in dark mode
      }
      return "#64748b"; // Inactive ghost tabs: gray in light mode
    }
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
      <div className={`h-fit ${containerClassName}`}>
        <div
          className="w-full flex overflow-x-auto no-scrollbar"
          onMouseLeave={() => setHoveredTab(null)}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <motion.div
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                className={`whitespace-nowrap min-w-max px-3 sm:px-[20px] font-semibold flex items-center justify-center cursor-pointer relative ${tabClassName}`}
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
  const containerPadding = (type === "solid" || type === "ghost") ? "p-[4px]" : "p-[6px]";
  const tabWidth = customTabWidth 
    ? customTabWidth 
    : (type === "solid") ? "min-w-0 sm:w-[160px]" : type === "ghost" ? "min-w-0 sm:w-[180px]" : "";
  const tabPadding = (type === "solid" || type === "ghost") ? "py-[10px] sm:py-[12px] px-[6px] sm:px-[8px]" : "";
  const tabHeight = (type === "solid") ? "h-fit" : (type === "ghost") ? "h-[38px]" : "h-[48px] sm:h-[64px]";

  const isGradient = type === "gradient";

  return (
    <div className={containerClassName}>
      <div
        className={`border-[1px] w-full flex gap-1 sm:gap-[16px] ${containerPadding} rounded-[12px] h-fit relative ${
          isGradient ? "overflow-x-auto no-scrollbar sm:overflow-hidden" : "overflow-hidden"
        } ${
          isDark ? "bg-[#111111]" : "bg-white"
        }`}
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Gradient indicator -- hidden on mobile when scrollable */}
        {isGradient && (
          <motion.div
            className={`absolute top-[6px] left-[6px] h-[48px] sm:h-[64px] rounded-[12px] bg-gradient p-[2px] hidden sm:block ${indicatorClassName}`}
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
              className={`${isGradient ? "min-w-max px-3 sm:px-0 sm:min-w-0 sm:flex-1" : `${tabWidth} flex-1`} ${tabPadding} whitespace-nowrap hover:cursor-pointer text-[12px] sm:text-[16px] font-semibold flex flex-col justify-center text-center ${tabHeight} rounded-[10px] relative z-10 ${tabClassName}`}
              animate={{
                color: getTextColor(isActive, isHovered),
                background: isGradient ? (isActive ? (isDark ? "rgba(112,58,230,0.15)" : "rgba(112,58,230,0.08)") : getBackground(isActive, isHovered)) : getBackground(isActive, isHovered),
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
