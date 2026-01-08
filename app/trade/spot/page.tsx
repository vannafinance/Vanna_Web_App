"use client";

import OrderBook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionTables from "@/components/spot/PositionTables";
import TradingPairInfo from "@/components/spot/TradingPairInfo";
import TradingPairSelector from "@/components/spot/TradingPairSelector";
import TradingViewChart from "@/components/ui/trading-view-chart";
import { useEffect, useRef, useState } from "react";

const Spot = () => {
  const [isTradingPairSelectorOpen, setIsTradingPairSelectorOpen] =
    useState(false);
  const tradingPairSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTradingPairSelectorOpen) return;

    // esc key close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTradingPairSelectorOpen(false);
    };

    //outside click close
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tradingPairSelectorRef.current &&
        !tradingPairSelectorRef.current.contains(e.target as Node)
      ) {
        setIsTradingPairSelectorOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTradingPairSelectorOpen]);

  return (
    <main className="w-full min-h-screen px-5 pt-10 bg-[#FFFFFF] grid grid-cols-[minmax(0,1fr)_316px] gap-2">
      <div className="flex flex-col flex-1 gap-2">
        {/* TradingPairInfo, charts & orderbook */}
        <div className="flex flex-col gap-2">
          {/* TradingPairInfo */}
          <div>
            <div ref={tradingPairSelectorRef} className="relative">
              <TradingPairInfo
                isOpen={isTradingPairSelectorOpen}
                onOpenPairSelector={() =>
                  setIsTradingPairSelectorOpen((prev) => !prev)
                }
              />
              {isTradingPairSelectorOpen && (
                <div className="absolute top-[60px] left-2  z-50 ">
                  <TradingPairSelector />
                </div>
              )}
            </div>

            {/* dex navigation dropdown */}
            <div></div>
          </div>

          {/* chart & orderBook */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg ">
              <TradingViewChart />
            </div>
            <div className=" w-[224px]  h-[541px] bg-[#F7F7F7] border border-[#E2E2E2] rounded-xl">
              <OrderBook />
            </div>
          </div>
        </div>

        {/* position table */}
        <div className="flex flex-col gap-3 rounded-lg">
          <PositionTables />
        </div>
      </div>

      {/* order Placement Form */}
      <div>
        <OrderPlacementForm />
      </div>
    </main>
  );
};

export default Spot;
