"use client";
import React from "react";

// TabButton Component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-6 text-[14px] leading-5 transition-all duration-200 ${
        isActive
          ? "text-[#703AE6] border-b-2 border-[#703AE6] font-semibold"
          : "text-[#A7A7A7] border-b-2 border-transparent hover:text-gray-600 font-medium"
      }`}
    >
      {label}
    </button>
  );
};

// TabGroup Component
interface Tab {
  id: string;
  label: string;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex w-full border-b border-b-[#E2E2E2]">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
};

export default TabGroup;
