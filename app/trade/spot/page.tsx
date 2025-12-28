"use client";

import Orderbook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionTables from "@/components/spot/PositionTables";
import TradingViewChart from "@/components/ui/trading-view-chart";
import Image from "next/image";
import { useState } from "react";

const Spot = () => {
  const [activeTab, setActiveTab] = useState<"chart" | "info">("chart");
  return (
    <main className="min-h-screen w-full py-10   flex flex-col gap-4 bg-white overflow-x-hidden">
      <div className=" px-5 grid grid-cols-[minmax(0,1fr)_380px] gap-4 overflow-hidden ">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="bg-[#F7F7F7] border border-[#E2E2E2] flex-1 rounded-lg p-4 flex gap-5">
              <div className="flex gap-3 px-4">
                <Image src="./icons/btc.svg" alt="BTC" height={24} width={24} />
                <div>
                  <div className="text-[#151517] text-[16px] leading-6 font-semibold">
                    ETHUSDT
                  </div>
                  <div className=" text-[#57585C]  text-[12px] leading-[18px] font-medium">
                    Perpetual
                  </div>
                </div>
              </div>
              <div className="flex flex-col text-[#01BC8D] ">
                <div className="text-[16px] leading-6 font-semibold">
                  3,377.88
                </div>
                <div className="flex gap-px">
                  <div className="text-[12px] leading-[18px] font-medium">
                    +52.47 
                  </div>
                  <div className="text-[12px] leading-[18px] font-medium">
                    (+1.58%)
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  Mark price
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  3,377.55
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  index Price
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  3,377.55
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  24h high
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  3,377.55
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  24h low
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  3,377.55
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  24h quantity (ETH)
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  951.99k
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  24hVolume
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  3,377.55
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  Funding Rate/Countdown
                </div>
                <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
                  +0.0100% /03:15:55
                </div>
              </div>
            </div>

            {/* Chart and OrderBook */}
            <div className=" w-full flex gap-4 bg-white">
              <div className=" flex  flex-1  flex-col gap-3">
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

                <div className="flex-1 rounded-lg ">
                  <TradingViewChart />
                </div>
              </div>

              <div className=" w-fit h-[574px] bg-[#F7F7F7] border border-[#E2E2E2] rounded-xl">
                <Orderbook />
              </div>
            </div>
          </div>

          <div className="max-h-[449px]  bg-white flex flex-col">
            <PositionTables />
          </div>
        </section>

        <aside className="rounded-2xl bg-white w-full min-w-0 ">
          <OrderPlacementForm />
        </aside>
      </div>
    </main>
  );
};

export default Spot;
