"use client";

import OrderBook from "@/components/spot/OrderBook";
import OrderPlacementForm from "@/components/spot/OrderPlacementForm";
import PositionTables from "@/components/spot/PositionTables";
import { Dropdown } from "@/components/ui/dropdown";
import TradingViewChart from "@/components/ui/trading-view-chart";
import { useEffect, useRef, useState } from "react";
import TradingPairInfo from "@/components/ui/TradingPairInfo";
import TradingPairSearch from "@/components/spot/TradingPairSearch";
import { useParams, useRouter } from "next/navigation";

const PROTCOL_OPTIONS = ["Aster", "Avantis"];

const spotStats = [
  { label: "24h High", value: "3,377.55" },
  { label: "24h Low", value: "3,210.10" },
  { label: "24h Change", value: "951.99k" },
  { label: "24h Volume", value: "3.21B" },
  { label: "Market Cap", value: "3.21B" },
];

const Spot = () => {
  const params = useParams<{ pair: string }>();
  const rawPair = params.pair;
  const base = rawPair.replace("usdc", "").toUpperCase();
  const pair = `${base}USDC`;
  const icon = `/coins/${base.toLowerCase()}.svg`;

  const router = useRouter();
  const [isTradingPairSelectorOpen, setIsTradingPairSelectorOpen] =
    useState(false);
  const tradingPairSelectorRef = useRef<HTMLDivElement>(null);
  const [protocol, setProtocol] = useState("Aster");

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
        <div className="flex flex-col  gap-2">
          {/* TradingPairInfo */}
          <div className="flex  gap-2">
            <div ref={tradingPairSelectorRef} className="relative flex-1">
              <TradingPairInfo
                isOpen={isTradingPairSelectorOpen}
                onOpenPairSelector={() =>
                  setIsTradingPairSelectorOpen((prev) => !prev)
                }
                pair={pair}
                market="spot"
                icon={icon}
                stats={spotStats}
              />
              {isTradingPairSelectorOpen && (
                <div className="absolute top-[60px] left-2  z-150 ">
                  <TradingPairSearch
                    onSelectPair={(pair) => {
                      const market =
                        pair.marketType === "spot" ? "spot" : "perps";
                      router.push(
                        `/trade/${market}/${pair.base.toLowerCase()}usdc`
                      );
                      setIsTradingPairSelectorOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* dex navigation dropdown */}
            <div className="bg-[#F7F7F7] border border-[#E2E2E2]  rounded-lg p-4 flex gap-5">
              <div className="flex flex-col gap-1">
                <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                  Protocol
                </div>
                <Dropdown
                  items={PROTCOL_OPTIONS}
                  selectedOption={protocol}
                  setSelectedOption={(val) => setProtocol(val)}
                  classname=" gap-2 text-[#111111] font-medium text-[12px] leading-[18px] "
                  dropdownClassname="text-[12px] leading-[18px] font-medium "
                />
              </div>
            </div>
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
