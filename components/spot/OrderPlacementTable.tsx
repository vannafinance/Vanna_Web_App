"use client";

import { useState } from "react";
import TabGroup from "../ui/TabButton";
import BuySellToggle from "../ui/BuySellToggle";

const tabs = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "trigger", label: "Trigger" },
];

const OrderPlacementTable = () => {
  const [activeTab, setActiveTab] = useState("limit");
  const [orderType, setOrderType] = useState("buy");
  return (
    <div className="flex flex-1 flex-col rounded-[20px] bg-[#F7F7F7] h-[727px] p-4 gap-5">
      <div className=" overflow-hidden">
        <TabGroup
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex items-center ">
        <BuySellToggle
          className="bg-[#FFFFFF]"
          onChange={(type) => setOrderType(type)}
        />
      </div>

      <div>
        <div></div>
        <div>Toggle</div>
      </div>

      <div>Entry Price</div>
      <div>Total Amount</div>
      <div>Take Profit</div>
      <div>Stop loss</div>
      <div>Risk</div>
      <div>Time in Force</div>
      <div>Place Order</div>
    </div>
  );
};

export default OrderPlacementTable;
