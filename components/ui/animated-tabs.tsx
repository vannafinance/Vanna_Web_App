"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
}

type TabType = "gradient" | "solid" | "underline";

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
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const indicatorWidth = `calc((100% - 12px) / ${tabs.length})`;

  // Helper to get text color
  const getTextColor = (isActive: boolean, isHovered: boolean) => {
    if (type === "solid" && isActive) return "#FFFFFF";
    if (type === "underline") {
      if (isActive) return "#703AE6";
      if (isHovered) return "#000000";
      return "#A7A7A7";
    }
    if (isActive || isHovered) return "#000000";
    return "#64748b";
  };

  // Helper to get background color
  const getBackground = (isActive: boolean, isHovered: boolean) => {
    if (isHovered && !isActive) return HOVER_GRADIENT;
    if (type === "solid" && isActive) return "#703AE6";
    return "transparent";
  };

  // Render underline type
  if (type === "underline") {
    return (
      <div className={`w-full h-fit border-b-[1px] border-[#E2E2E2] ${containerClassName}`}>
        <div className="w-full flex" onMouseLeave={() => setHoveredTab(null)}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <motion.div
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                className={`w-full py-[8px] text-[14px] font-semibold flex items-center justify-center cursor-pointer relative ${tabClassName}`}
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

  

  // Render gradient/solid types
  const containerPadding = type === "solid" ? "p-[4px] w-fit h-fit" : "p-[6px]";
  const tabWidth = type === "solid" ? "w-[160px]" : "";
  const tabPadding = type === "solid" ? "py-[12px] px-[8px]" : "";
  const tabHeight = type === "solid" ? "h-fit" : "h-[67px]";
  const useFlex1 = type !== "solid";

  return (
    <div className={containerClassName}>
      <div
        className={`border-[1px] border-[#E2E2E2] w-full bg-white flex gap-[16px] ${containerPadding} rounded-[12px] h-fit relative overflow-hidden`}
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Gradient indicator */}
        {type === "gradient" && (
          <motion.div
            className={`absolute top-[6px] left-[6px] h-[67px] rounded-[12px] bg-gradient p-[2px] ${indicatorClassName}`}
            style={{ width: indicatorWidth }}
            animate={{ x: `${currentIndex * 100}%` }}
            transition={SPRING_CONFIG}
          >
            <div className="bg-white rounded-[12px] h-full w-full" />
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
              className={`${tabWidth} ${tabPadding} hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center ${tabHeight} rounded-[12px] ${useFlex1 ? "flex-1" : ""} relative z-10 ${tabClassName}`}
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
