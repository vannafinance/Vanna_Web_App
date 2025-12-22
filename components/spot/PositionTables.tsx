import React, { useState } from "react";
import OpenOrdersTable from "./OpenOrdersTable";
import OrderHistoryTable from "./OrderHistoryTable";
import TradeHistoryTable from "./TradeHistoryTable";
import ActivePositionsTable from "./ActivePositionTable";
import { useUserStore } from "@/store/user";
import { useSpotTradeStore } from "@/store/spot-trade-store";

type TabType =
  | "openOrders"
  | "orderHistory"
  | "tradeHistory"
  | "activePositions";

const PositionTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("activePositions");
  const userAddress = useUserStore((state) => state.address);
  const activePositions = useSpotTradeStore((state) => state.activePositions);
  const openOrders = useSpotTradeStore((state) => state.openOrders);

  const activePositionsCount = activePositions.length;
  const openOrdersCount = openOrders.length;

  const tabs = [
    {
      id: "activePositions" as TabType,
      label: "Active Positions",
      count: activePositionsCount,
    },
    {
      id: "openOrders" as TabType,
      label: "Open Orders",
      count: openOrdersCount,
    },
    { id: "orderHistory" as TabType, label: "Order History", count: null },
    { id: "tradeHistory" as TabType, label: "Trade History", count: null },
  ];

  return (
    <div
      className={`w-full h-[388px] p-0.5 rounded-lg ${
        !userAddress ? "bg-white" : "bg-[#F7F7F7]"
      }   overflow-hidden flex flex-col gap-2`}
    >
      {/* Tabs Header */}
      <div className="flex ">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer text-sm font-medium transition-colors  px-4 py-2 flex ${
              activeTab === tab.id
                ? "text-[#703AE6] bg-[#F1EBFD] rounded-lg"
                : "text-[#111111] hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="py-[3px] font-semibold">
              {tab.label}
              {tab.count !== null && `(${tab.count})`}
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      {!userAddress ? (
        <div className="flex-1 flex h-[388px] items-center justify-center bg-gray-50 border border-[#E2E2E2] rounded-lg">
          <button className="px-4 py-2 bg-[#F1EBFD] text-[#703AE6] font-semibold rounded-lg ">
            Connect your Wallet
          </button>
        </div>
      ) : (
        <>
          {activeTab === "openOrders" && <OpenOrdersTable />}
          {activeTab === "orderHistory" && <OrderHistoryTable />}
          {activeTab === "tradeHistory" && <TradeHistoryTable />}
          {activeTab === "activePositions" && <ActivePositionsTable />}
        </>
      )}
    </div>
  );
};

export default PositionTables;
