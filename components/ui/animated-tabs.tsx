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

  // Find current tab index for animation
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

  // Calculate indicator width based on number of tabs
  const indicatorWidth = `calc((100% - 12px) / ${tabs.length})`;

  // Render underline type (limit/market/trigger style)
  if (type === "underline") {
    return (
      <div
        className={`w-full h-fit border-b-[1px] border-[#E2E2E2] ${containerClassName}`}
      >
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
                  color: isActive
                    ? "#703AE6"
                    : isHovered
                    ? "#000000"
                    : "#A7A7A7",
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

  return (
    <div className={containerClassName}>
      {/* Tab switcher container */}
      <div
        className="border-[1px] border-[#E2E2E2] w-full bg-white flex gap-[16px] p-[6px] rounded-[12px] h-fit relative overflow-hidden"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Animated tab indicator background (only moves on click) */}
        {type === "gradient" ? (
          <motion.div
            className={`absolute top-[6px] left-[6px] h-[67px] rounded-[12px] bg-gradient p-[2px] ${indicatorClassName}`}
            style={{
              width: indicatorWidth,
            }}
            animate={{
              x: `${currentIndex * 100}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            <div className="bg-white rounded-[12px] h-full w-full" />
          </motion.div>
        ) : (
          <motion.div
            className={`absolute top-[6px] left-[6px] h-[67px] rounded-[12px] bg-[#703AE6] ${indicatorClassName}`}
            style={{
              width: indicatorWidth,
            }}
            animate={{
              x: `${currentIndex * 100}%`,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          />
        )}

        {/* Tab buttons */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          // Determine text color based on type and state
          const getTextColor = () => {
            if (type === "solid" && isActive) {
              return "#FFFFFF"; // White for active tab in solid type
            }
            if (isActive || isHovered) {
              return "#000000"; // Black for active/hovered in gradient type
            }
            return "#64748b"; // Gray for inactive
          };

          return (
            <motion.div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              className={`hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center h-[67px] rounded-[12px] flex-1 relative z-10 ${tabClassName}`}
              animate={{
                color: getTextColor(),
                background:
                  isHovered && !isActive
                    ? "linear-gradient(135deg, rgba(112, 58, 230, 0.08) 0%, rgba(112, 58, 230, 0.04) 100%)"
                    : "transparent",
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
