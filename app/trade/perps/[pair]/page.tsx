"use client";

import PerpsOrderPlacementForm from "@/components/perps/perps-order-placement-form";
import PositionTables from "@/components/perps/position-tables";
import TradingPairInfo from "@/components/ui/TradingPairInfo";
import TradingPairSearch from "@/components/spot/spot-orderbook/TradingPairSearch";
import { Dropdown } from "@/components/ui/dropdown";
import TradingViewChart from "@/components/ui/trading-view-chart";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { NonOrderBook } from "@/components/perps/non-orderbook";
import { useTheme } from "@/contexts/theme-context";

const PROTCOL_OPTIONS = ["Aster", "Avantis"];
const NET_RATE_INTERVALS = ["1h", "4h", "8h", "24h"];

const Perps = () => {
  const { isDark } = useTheme();
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
  const [netRateInterval, setNetRateInterval] = useState("1h");
  const [mobileTab, setMobileTab] = useState<"trade" | "chart">("trade");
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);

  const startDrag = (clientY: number) => {
    dragStartY.current = clientY;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging.current) return;
    const deltaY = clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.3s ease-out";
      if (currentTranslateY.current > 150) {
        sheetRef.current.style.transform = "translateY(100%)";
        setTimeout(() => setIsOrderSheetOpen(false), 300);
      } else {
        sheetRef.current.style.transform = "translateY(0)";
      }
    }
    currentTranslateY.current = 0;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) =>
    startDrag(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) =>
    moveDrag(e.touches[0].clientY);
  const handleTouchEnd = () => endDrag();

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientY);
    const onMouseMove = (ev: MouseEvent) => moveDrag(ev.clientY);
    const onMouseUp = () => {
      endDrag();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const perpNonOrderbookStats = [
    { label: "Mark price", value: "3,377.55" },
    { label: "OI (L/S)", value: "10.6M / 9.1M" },
    { label: "Index Price", value: "3,377.55" },
    { label: "24h vol", value: "3.21B" },
    {
      label: "Net rate(L/S)",
      value: "-0.0005% / None",
      dropdown: {
        items: NET_RATE_INTERVALS,
        selectedOption: netRateInterval,
        onSelect: setNetRateInterval,
      },
    },
    { label: "Est ann funding", value: "+0.0100%" },
  ];

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

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOrderSheetOpen || isTradingPairSelectorOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOrderSheetOpen, isTradingPairSelectorOpen]);

  return (
    <main
      className={`w-full min-h-screen px-3 pt-3 pb-20 md:pb-5 md:px-5 md:pt-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_316px] xl:grid-cols-[minmax(0,1fr)_316px] gap-2 ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}
    >
      {/* Left column */}
      <div className="flex flex-col gap-2">
        {/* TradingPairInfo — xl+ only */}
        <div
          ref={tradingPairSelectorRef}
          className="hidden xl:flex gap-2 relative z-100"
        >
          <div className="flex-1">
            <TradingPairInfo
              isOpen={isTradingPairSelectorOpen}
              onOpenPairSelector={() =>
                setIsTradingPairSelectorOpen((prev) => !prev)
              }
              pair={pair}
              market="perps"
              icon={icon}
              stats={perpNonOrderbookStats}
            />
          </div>

          {/* dex navigation dropdown */}
          <div
            className={`rounded-lg p-4 flex gap-5 ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-[#F7F7F7] border border-[#E2E2E2]"}`}
          >
            <div className="flex flex-col gap-1">
              <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                Protocol
              </div>
              <Dropdown
                items={PROTCOL_OPTIONS}
                selectedOption={protocol}
                setSelectedOption={(val) => setProtocol(val)}
                classname={` gap-2 font-medium text-[12px] leading-[18px] ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
                dropdownClassname="text-[12px] leading-[18px] font-medium "
              />
            </div>
          </div>
          {isTradingPairSelectorOpen && (
            <div className="absolute top-[72px] left-0 right-0 z-999">
              <TradingPairSearch
                onSelectPair={(pair) => {
                  const market = pair.marketType === "spot" ? "spot" : "perps";
                  router.push(
                    `/trade/${market}/${pair.base.toLowerCase()}usdc`,
                  );
                  setIsTradingPairSelectorOpen(false);
                }}
                onClose={() => setIsTradingPairSelectorOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Trade / Chart tabs — below xl */}
        <div
          className={`xl:hidden flex items-center rounded-lg overflow-hidden p-1 ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-white border border-[#E2E2E2]"}`}
        >
          <button
            className={`flex-1 py-3 text-center font-semibold text-[12px] leading-[100%] rounded-lg transition-colors ${
              mobileTab === "trade"
                ? "bg-[#703AE6] text-white"
                : isDark
                  ? "text-[#A7A7A7]"
                  : "text-[#111111]"
            }`}
            onClick={() => setMobileTab("trade")}
          >
            Trade
          </button>
          <button
            className={`flex-1 py-3 text-center font-semibold text-[12px] leading-[100%] rounded-lg transition-colors ${
              mobileTab === "chart"
                ? "bg-[#703AE6] text-white"
                : isDark
                  ? "text-[#A7A7A7]"
                  : "text-[#111111]"
            }`}
            onClick={() => setMobileTab("chart")}
          >
            Chart
          </button>
        </div>

        {/* xl+: Chart + Orderbook side by side */}
        <div className="hidden xl:flex gap-2">
          <div className="flex-1 rounded-lg h-[541px]">
            <TradingViewChart />
          </div>
          <div
            className={`w-[224px] h-[541px] p-2 rounded-xl ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-[#F7F7F7] border border-[#E2E2E2]"}`}
          >
            <NonOrderBook />
          </div>
        </div>

        {/* Below xl: tab-based content */}
        <div className="xl:hidden">
          {mobileTab === "chart" ? (
            <div className="flex flex-col gap-2">
              {/* Protocol dropdown */}
              <div
                className={`rounded-lg p-4 flex gap-5 relative z-10 ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-[#F7F7F7] border border-[#E2E2E2]"}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
                    Chart Protocol
                  </div>
                  <Dropdown
                    items={PROTCOL_OPTIONS}
                    selectedOption={protocol}
                    setSelectedOption={(val) => setProtocol(val)}
                    classname={` gap-2 font-medium text-[12px] leading-[18px] ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
                    dropdownClassname="text-[12px] leading-[18px] font-medium "
                  />
                </div>
              </div>
              <div
                ref={tradingPairSelectorRef}
                className={`relative ${isTradingPairSelectorOpen ? "z-100" : "z-0"}`}
              >
                <TradingPairInfo
                  isOpen={isTradingPairSelectorOpen}
                  onOpenPairSelector={() =>
                    setIsTradingPairSelectorOpen((prev) => !prev)
                  }
                  pair={pair}
                  market="perps"
                  icon={icon}
                  stats={perpNonOrderbookStats}
                />
                {isTradingPairSelectorOpen && (
                  <div className="absolute top-[72px] left-0 right-0 z-999">
                    <TradingPairSearch
                      onSelectPair={(pair) => {
                        const market =
                          pair.marketType === "spot" ? "spot" : "perps";
                        router.push(
                          `/trade/${market}/${pair.base.toLowerCase()}usdc`,
                        );
                        setIsTradingPairSelectorOpen(false);
                      }}
                      onClose={() => setIsTradingPairSelectorOpen(false)}
                    />
                  </div>
                )}
              </div>
              <div className="rounded-lg h-[400px] md:h-[500px]">
                <TradingViewChart />
              </div>
            </div>
          ) : (
            <div
              className={`p-2 rounded-xl ${isDark ? "bg-[#222222] border border-[#333333]" : "bg-[#F7F7F7] border border-[#E2E2E2]"}`}
            >
              <NonOrderBook />
            </div>
          )}
        </div>

        {/* Position tables — inside left column */}
        <div className="min-w-0">
          <PositionTables />
        </div>
      </div>

      {/* Right column: Order placement form — md+ only */}
      <div className="hidden md:block md:row-span-2">
        <PerpsOrderPlacementForm />
      </div>

      {/* Mobile: Sticky bottom buttons */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] flex gap-3 px-4 py-3 ${isDark ? "bg-[#222222] border-t border-[#333333]" : "bg-white border-t border-[#E2E2E2]"}`}
      >
        <button
          onClick={() => setIsOrderSheetOpen(true)}
          className="flex-1 py-3 rounded-lg text-[14px] font-semibold text-white bg-[#24A0A9] active:opacity-80 cursor-pointer"
        >
          Buy / Long
        </button>
        <button
          onClick={() => setIsOrderSheetOpen(true)}
          className="flex-1 py-3 rounded-lg text-[14px] font-semibold text-white bg-[#FC5457] active:opacity-80 cursor-pointer"
        >
          Sell / Short
        </button>
      </div>

      {/* Mobile: Order placement bottom sheet */}
      {isOrderSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[200] bg-black/50"
          onClick={() => setIsOrderSheetOpen(false)}
        >
          <div
            ref={sheetRef}
            className={`absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl transition-transform duration-300 ease-out scrollbar-hide ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar — drag to close */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              <div
                className={`w-10 h-1 rounded-full ${isDark ? "bg-[#444444]" : "bg-[#D5D5D5]"}`}
              />
            </div>
            <div className="px-2 pb-4">
              <PerpsOrderPlacementForm />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Perps;
