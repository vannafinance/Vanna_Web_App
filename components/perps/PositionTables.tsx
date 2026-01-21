import { useUserStore } from "@/store/user";
import { useState } from "react";
import OpenOrdersTable from "./OpenOrdersTable";
import OrderHistoryTable from "./OrderHistoryTable";
import TransactionHistoryTable from "./TransactionHistory";
import OrderDetailsTable from "./OrderDetailsTable";
import TradeHistoryTable from "./TradeHistoryTable";
import ActivePositionsTable from "./ActivePositionsTable";

type TabType =
  | "openOrders"
  | "orderHistory"
  | "tradeHistory"
  | "position"
  | "orderDetails"
  | "transactionHistory"
  | "assets";

type FilterTabType =
  | "limitMarket"
  | "trailingStop"
  | "tpSl"
  | "trigger"
  | "iceberg"
  | "twap";

const PositionTables = () => {
  const userAddress = useUserStore((state) => state.address);
  const [activeTab, setActiveTab] = useState<TabType>("openOrders");
  const [activeFilterTab, setActiveFilterTab] =
    useState<FilterTabType>("limitMarket");

  const tabs = [
    {
      id: "position" as TabType,
      label: "Positions",
      count: null,
    },
    {
      id: "openOrders" as TabType,
      label: "Open Orders",
      count: null,
    },
    { id: "orderHistory" as TabType, label: "Order History", count: null },
    {
      id: "tradeHistory" as TabType,
      label: "Trade History",
      count: null,
    },
    {
      id: "orderDetails" as TabType,
      label: "Order Details",
      count: null,
    },
    {
      id: "transactionHistory" as TabType,
      label: "Transaction History",
      count: null,
    },
    { id: "assets" as TabType, label: "Assets", count: null },
  ];

  const filterTabs = [
    {
      id: "limitMarket" as FilterTabType,
      label: "Limit | Market",
      count: 4,
    },
    {
      id: "trailingStop" as FilterTabType,
      label: "Trailing stop",
      count: 2,
    },
    {
      id: "tpSl" as FilterTabType,
      label: "TP/SL",
      count: 0,
    },
    {
      id: "trigger" as FilterTabType,
      label: "Trigger",
      count: 0,
    },
    {
      id: "iceberg" as FilterTabType,
      label: "Iceberg",
      count: 0,
    },
    {
      id: "twap" as FilterTabType,
      label: "TWAP",
      count: 0,
    },
  ];

  return (
    <div
      className={`w-full rounded-lg ${
        !userAddress ? "bg-white" : "bg-[#F7F7F7]"
      }   overflow-hidden flex flex-col gap-2`}
    >
      {/* Tabs */}
      <div className="flex p-0.5 gap-6 ">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer text-[12px] font-semibold  transition-colors py-2 px-4 ${
                activeTab === tab.id
                  ? "text-[#703AE6] bg-[#F1EBFD] rounded-lg"
                  : "text-[#111111] hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>
        <div></div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-5 ">
        <div className="flex bg-[#FFFFFF] p-1 rounded-lg border border-[#E2E2E2] ">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id)}
              className={`px-4 py-3 text-[12px] font-semibold rounded-lg transition-colors ${
                activeFilterTab === tab.id
                  ? "bg-[#703AE6] text-white"
                  : "text-[#111111] hover:bg-gray-100"
              }`}
            >
              {tab.label}
              {`(${tab.count})`}
            </button>
          ))}
        </div>
        {/* filter all  */}
        <div></div>
      </div>

      {!userAddress ? (
        <div className="flex-1 flex  items-center justify-center bg-gray-50 border border-[#E2E2E2] rounded-lg">
          <button className="px-4 py-2 bg-[#F1EBFD] text-[#703AE6] font-semibold rounded-lg ">
            Connect your Wallet
          </button>
        </div>
      ) : (
        <>
          {activeTab === "position" && <ActivePositionsTable />}
          {activeTab === "openOrders" && <OpenOrdersTable />}
          {activeTab === "orderHistory" && <OrderHistoryTable />}
          {activeTab === "tradeHistory" && <TradeHistoryTable />}
          {activeTab === "orderDetails" && <OrderDetailsTable />}
          {activeTab === "transactionHistory" && <TransactionHistoryTable />}
        </>
      )}
    </div>
  );
};

export default PositionTables;
