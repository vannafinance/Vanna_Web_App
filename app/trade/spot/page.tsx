"use client";

import Orderbook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionTables from "@/components/spot/PositionTables";
import TradingViewChart from "@/components/ui/trading-view-chart";
import { useState } from "react";

const Spot = () => {
  const [activeTab, setActiveTab] = useState<"chart" | "info">("chart");
  return (
    <main className="min-h-screen w-full py-10  flex flex-col gap-4 bg-white overflow-x-hidden">
      <div className="px-5 grid grid-cols-[minmax(0,1fr)_380px] gap-4 overflow-hidden ">
        <section className="flex flex-col gap-4">
          <div className=" w-full flex gap-4 bg-white">
            <div className=" flex  flex-1 flex-col gap-3">
              <div className="flex gap-1 rounded-md">
                <button
                  onClick={() => setActiveTab("chart")}
                  className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition
                        ${
                          activeTab === "chart"
                            ? "bg-[#F1EBFD] text-[#703AE6]"
                            : "text-[#111111] hover:bg-white"
                        }`}
                >
                  Chart
                </button>

                <button
                  onClick={() => setActiveTab("info")}
                  className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition
                        ${
                          activeTab === "info"
                            ? "bg-[#F1EBFD] text-[#703AE6]"
                            : "text-[#111111] hover:bg-white"
                        }`}
                >
                  Info
                </button>
              </div>

              <div className="flex-1 rounded-lg h-full">
                <TradingViewChart />
              </div>
            </div>

            <div className="w-full max-w-[335px]  h-[616px] rounded-xl  ">
              <Orderbook />
            </div>
          </div>

          <div className="max-h-[449px]  bg-white flex flex-col">
            <PositionTables />
          </div>
        </section>

        <aside className="rounded-2xl bg-white w-full  ">
          <OrderPlacementForm />
        </aside>
      </div>
    </main>
  );
};

export default Spot;
