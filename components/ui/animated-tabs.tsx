"use client";

import { motion } from "framer-motion";
import { useState, useEffect, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  externalTabId?: string;
  onTabChange?: (tabId: string) => void;
  containerClassName?: string;
  tabClassName?: string;
  indicatorClassName?: string;
}

export const AnimatedTabs = ({
  tabs,
  defaultTabId,
  externalTabId,
  onTabChange,
  containerClassName = "",
  tabClassName = "",
  indicatorClassName = "",
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(
    defaultTabId || tabs[0]?.id || ""
  );
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Handle external tab control
  useEffect(() => {
    if (externalTabId && tabs.some((tab) => tab.id === externalTabId)) {
      setActiveTab(externalTabId);
      if (onTabChange) {
        onTabChange(externalTabId);
      }
    }
  }, [externalTabId, tabs, onTabChange]);

  // Determine which tab to display (hovered or active)
  const displayTab = hoveredTab || activeTab;

  // Find current tab index for animation
  const currentIndex = tabs.findIndex((tab) => tab.id === displayTab);

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Calculate indicator width based on number of tabs
  const indicatorWidth = `calc((100% - 12px) / ${tabs.length})`;

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {/* Tab switcher container */}
      <div
        className="border-[1px] border-[#E2E2E2] w-full bg-white flex p-[6px] rounded-[16px] h-[79px] relative overflow-hidden"
        onMouseLeave={() => setHoveredTab(null)}
      >
        {/* Animated tab indicator background */}
        <motion.div
          className={`absolute top-[6px] left-[6px] h-[67px] rounded-[16px] bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px] ${indicatorClassName}`}
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
          <div className="bg-white rounded-[14px] h-full w-full" />
        </motion.div>

        {/* Tab buttons */}
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            className={`hover:cursor-pointer text-[16px] font-semibold flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10 ${tabClassName}`}
            animate={{
              color:
                hoveredTab === tab.id || activeTab === tab.id
                  ? "#000000"
                  : "#64748b",
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {tab.label}
          </motion.div>
        ))}
      </div>

      {/* Tab content */}
      {tabs.map((tab) => (
        <div key={tab.id}>
          {activeTab === tab.id && tab.content}
        </div>
      ))}
    </div>
  );
};

