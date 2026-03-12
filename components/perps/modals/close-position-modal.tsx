"use client";

import { useState } from "react";
import { ActivePositionType } from "../position-tables/active-positions-table";
import { QuantitySlider } from "../../ui/quantity-slider";
import { BaseModalContent } from "../../ui/base-modal-content";
import { AnimatedTabs } from "../../ui/animated-tabs";
import { useTheme } from "@/contexts/theme-context";

const CLOSE_POSITION_TABS = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
];

interface ClosePositionModalProps {
  position: ActivePositionType;
  defaultType: "market" | "limit";
  onClose: () => void;
  onConfirm: (data: {
    type: "market" | "limit";
    price?: number;
    quantity: number;
    percentage: number;
  }) => void;
}

export const ClosePositionModal = ({
  position,
  defaultType = "market",
  onClose,
  onConfirm,
}: ClosePositionModalProps) => {
  const { isDark } = useTheme();
  const [type, setType] = useState<"market" | "limit">(defaultType);
  const [closePrice, setClosePrice] = useState<string>(position.markPrice);
  const [percentage, setPercentage] = useState<number>(75);

  // Parse position size to calculate close quantity
  const maxCloseValue = parseFloat(position.positionSize.size) || 0;
  const calculatedQuantity = ((percentage / 100) * maxCloseValue).toFixed(3);
  const [closeQuantity, setCloseQuantity] =
    useState<string>(calculatedQuantity);

  // Extract unit from pair (e.g., BTCUSDT -> BTC)
  const pair = position.futures.pair;
  const unit = pair.replace(/USDT$/, "");

  // Update closeQuantity when percentage changes via slider
  const handlePercentageChange = (newPercentage: number) => {
    setPercentage(newPercentage);
    const newQuantity = ((newPercentage / 100) * maxCloseValue).toFixed(3);
    setCloseQuantity(newQuantity);
  };

  // Update percentage when closeQuantity changes via input
  const handleQuantityChange = (value: string) => {
    setCloseQuantity(value);
    const numericValue = parseFloat(value) || 0;
    if (maxCloseValue > 0) {
      const newPercentage = Math.min(
        100,
        Math.max(0, (numericValue / maxCloseValue) * 100),
      );
      setPercentage(Math.round(newPercentage));
    }
  };

  const handleConfirm = () => {
    onConfirm({
      type,
      price: type === "limit" ? parseFloat(closePrice) : undefined,
      quantity: parseFloat(closeQuantity),
      percentage,
    });
  };

  const textPrimary = isDark ? "text-[#FFFFFF]" : "text-[#111111]";
  const textSecondary = isDark ? "text-[#A7A7A7]" : "text-[#5C5B5B]";
  const inputBg = isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white";

  return (
    <BaseModalContent
      title="Close"
      width="418px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      {/* Limit / Market Close Toggle */}
      <AnimatedTabs
        type="ghost-compact"
        tabs={CLOSE_POSITION_TABS}
        activeTab={type}
        onTabChange={(tabId) => setType(tabId as "market" | "limit")}
        tabClassName="flex-1"
      />

      {/* Position Info Header */}
      <div className="flex items-center gap-1">
        <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
          S{pair}. {position.futures.mode}
        </span>
        <span className="rounded-[5px] bg-[#FFEEEE] px-2 py-1 text-[10px] leading-[15px] font-semibold text-[#FC5457]">
          Close Long {position.futures.leverage}
        </span>
      </div>

      {/* Price Details */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className={`text-[10px] leading-[15px] ${textSecondary} font-medium`}>
            Current Price
          </span>
          <span className={`text-[10px] leading-[15px] ${textPrimary} font-semibold`}>
            {position.markPrice} SUSDT
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[10px] leading-[15px] ${textSecondary} font-medium`}>
            Entry Price
          </span>
          <span className={`text-[10px] leading-[15px] ${textPrimary} font-semibold`}>
            {position.entryPrice} SUSDT
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[10px] leading-[15px] ${textSecondary} font-medium`}>
            Position
          </span>
          <span className={`text-[10px] leading-[15px] ${textPrimary} font-semibold`}>
            {position.positionSize.size} S{unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[10px] leading-[15px] ${textSecondary} font-medium`}>
            Placed
          </span>
          <span className={`text-[10px] leading-[15px] ${textPrimary} font-semibold`}>
            0.000 S{unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[10px] leading-[15px] ${textSecondary} font-medium`}>
            Max Close
          </span>
          <span className={`text-[10px] leading-[15px] ${textPrimary} font-semibold`}>
            {position.positionSize.size} S{unit}
          </span>
        </div>

        {/* Close Price Input - Only show in Limit mode */}
        {type === "limit" && (
          <div className={`flex items-center justify-between rounded-lg border ${inputBg} px-2 py-3`}>
            <span className={`text-[10px] leading-[100%] ${textPrimary}`}>
              Close price
            </span>
            <div className="flex flex-1 items-center gap-1">
              <input
                type="text"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className={`text-[12px] leading-[18px] font-medium ${textPrimary} text-right bg-transparent outline-none flex-1`}
              />
              <span className={`text-[10px] leading-[100%] font-medium ${textPrimary}`}>
                SUSDT
              </span>
            </div>
          </div>
        )}

        {/* Close Quantity Input */}
        <div className={`flex items-center justify-between rounded-lg border ${inputBg} px-2 py-3`}>
          <span className={`text-[10px] leading-[100%] ${textPrimary}`}>
            Close Quantity
          </span>
          <div className="flex flex-1 items-center gap-1">
            <input
              type="text"
              value={closeQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className={`text-[12px] leading-[18px] font-medium ${textPrimary} text-right bg-transparent outline-none flex-1`}
            />
            <span className={`text-[10px] leading-[100%] font-medium ${textPrimary}`}>
              S{unit}
            </span>
          </div>
        </div>
      </div>

      {/* Quantity Slider */}
      <QuantitySlider
        min={0}
        max={100}
        step={1}
        value={percentage}
        onChange={handlePercentageChange}
        markers={[0, 25, 50, 75, 100]}
      />

      {/* MMR Info Text */}
      <p className={`text-[12px] leading-[100%] ${isDark ? "text-[#A7A7A7]" : "text-[#76737B]"} `}>
        When MMR≥0%, the position will be closed at the market price. The higher
        the MMR, the higher the risk. Position liquidation/reduction will be
        triggered when the MMR reaches 100%.
      </p>
    </BaseModalContent>
  );
};
