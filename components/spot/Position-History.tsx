import React, { useState } from "react";
import { Button } from "../ui/button";
import { OpenOrdersTable } from "./OpenOrdersTable";

type TabType =
  | "openOrders"
  | "orderHistory"
  | "tradeHistory"
  | "activePositions";

const PositionHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("openOrders");

  const tabs = [
    { id: "openOrders" as TabType, label: "Open Orders", count: 0 },
    { id: "orderHistory" as TabType, label: "Order History", count: null },
    { id: "tradeHistory" as TabType, label: "Trade History", count: null },
    { id: "activePositions" as TabType, label: "Active Positions", count: 0 },
  ];

  return (
    <div className="w-full h-screen bg-gray-50 ">
      <div className="w-full h-full p-0.5 bg-white  overflow-hidden flex flex-col gap-2">
        {/* Tabs Header */}
        <div className="flex ">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium transition-colors  px-4 py-2 flex ${
                activeTab === tab.id
                  ? "text-[#703AE6] bg-purple-50 rounded-lg"
                  : "text-[#111111] hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="py-[3px] font-semibold">
                {tab.label}
                {tab.count !== null && `(${tab.count})`}
              </div>
              {/* {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
              )} */}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 border border-[#E2E2E2] rounded-lg">
          <button className="px-4 py-2 bg-[#F1EBFD] text-[#703AE6] font-semibold rounded-lg ">
            Connect your Wallet
          </button>
          {/* <OpenOrdersTable /> */}
        </div>
      </div>
    </div>
  );
};

export default PositionHistory;
