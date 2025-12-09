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
      className={`flex-1 py-3 px-6 text-base font-semibold transition-all duration-200 ${
        isActive
          ? "text-purple-600 border-b-2 border-purple-600"
          : "text-gray-400 border-b-2 border-transparent hover:text-gray-600"
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
