"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";

export interface TabItem {
  id: string;
  label: string;
}

type TabType = "gradient" | "solid" | "underline" | "segment" | "ghost" | "ghost-compact";

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

const HOVER_GRADIENT =
  "linear-gradient(135deg, rgba(112, 58, 230, 0.08) 0%, rgba(112, 58, 230, 0.04) 100%)";
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

  // render segment type for orderPlacement form
  if (type === "segment") {
    return (
      <div
        className={`flex gap-4 rounded-xl border border-[#E2E2E2] p-1.5 bg-white ${containerClassName}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`cursor-pointer flex-1 rounded-lg p-0.5 text-[12px] font-semibold transition-colors ${
                isActive
                  ? "bg-linear-to-r from-[#FC5457] to-[#703AE6]"
                  : "bg-transparent"
              }`}
            >
              <div className="rounded-lg bg-white p-3 text-black">
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

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

  // Render ghost-compact type
  if (type === "ghost-compact") {
    return (
      <div
        className={`flex gap-1 bg-white p-1 rounded-lg ${containerClassName}`}
        onMouseLeave={() => setHoveredTab(null)}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              className={`cursor-pointer px-4 h-[39px] rounded-lg text-[12px] font-semibold ${tabClassName}`}
              animate={{
                backgroundColor: isActive
                  ? "#F1EBFD"
                  : isHovered
                    ? "rgba(241, 235, 253, 0.5)"
                    : "transparent",
                color: isActive ? "#703AE6" : "#111111",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Render gradient/solid/ghost types
  const containerPadding = (type === "solid" || type === "ghost") ? "p-[4px] w-fit h-fit" : "p-[6px]";
  const containerWidth = (type === "solid" || type === "ghost") ? "w-full" : "w-full";
  const tabWidth = customTabWidth 
    ? customTabWidth 
    : (type === "solid" ) ? "w-[160px]" : type === "ghost" ? "w-[180px]" : "";
  const tabPadding = (type === "solid" || type === "ghost") ? "py-[12px] px-[8px]" : "";
  const tabHeight = (type === "solid") ? "h-fit" :  (type === "ghost") ? "h-[38px]" : "h-[64px]";
  const useFlex1 = (type !== "solid" && type !== "ghost");

  return (
    <div className={containerClassName}>
      <div
        className={`border ${isDark ? "border-[#2A2A2A]" : "border-[#E2E2E2]"} ${containerWidth} flex gap-[16px] ${containerPadding} rounded-[12px] h-fit relative overflow-hidden ${
          isDark ? "bg-[#111111]" : "bg-white"
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
