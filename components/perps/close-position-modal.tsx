"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ActivePositionType } from "./ActivePositionsTable";
import { Button } from "../ui/button";
import { QuantitySlider } from "../ui/quantity-slider";

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

  return (
    <motion.div
      className="w-[418px] rounded-[20px] p-5 bg-[#F7F7F7] flex flex-col gap-5"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <h3 className="text-[16px] leading-6 font-semibold text-[#111111]">
        Close
      </h3>

      {/* Limit / Market Close Toggle */}
      <div className="flex gap-1 rounded-lg p-1 bg-white">
        <button
          type="button"
          onClick={() => setType("limit")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            type === "limit"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Limit
        </button>
        <button
          type="button"
          onClick={() => setType("market")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            type === "market"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Market
        </button>
      </div>

      {/* Position Info Header */}
      <div className="flex items-center gap-1">
        <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
          S{pair}. {position.futures.mode}
        </span>
        <span className="rounded-[5px] bg-[#FFEEEE] px-2 py-1 text-[10px] leading-[15px] font-semibold text-[#FC5457]">
          Close Long {position.futures.leverage}
        </span>
      </div>

      {/* Price Details */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
            Current Price
          </span>
          <span className="text-[10px] leading-[15px] text-[#111111] font-semibold">
            {position.markPrice} SUSDT
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
            Entry Price
          </span>
          <span className="text-[10px] leading-[15px] text-[#111111] font-semibold">
            {position.entryPrice} SUSDT
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
            Position
          </span>
          <span className="text-[10px] leading-[15px] text-[#111111] font-semibold">
            {position.positionSize.size} S{unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
            Placed
          </span>
          <span className="text-[10px] leading-[15px] text-[#111111] font-semibold">
            0.000 S{unit}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
            Max Close
          </span>
          <span className="text-[10px] leading-[15px] text-[#111111] font-semibold">
            {position.positionSize.size} S{unit}
          </span>
        </div>

        {/* Close Price Input - Only show in Limit mode */}

        {type === "limit" && (
          <div className="flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-2 py-3">
            <span className="text-[10px] leading-[100%] text-[#111111]">
              Close price
            </span>
            <div className="flex flex-1 items-center gap-1">
              <input
                type="text"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className="text-[12px] leading-[18px] font-medium text-[#111111] text-right bg-transparent outline-none flex-1"
              />
              <span className="text-[10px] leading-[100%] font-medium text-[#111111]">
                SUSDT
              </span>
            </div>
          </div>
        )}

        {/* Close Quantity Input */}
        <div className="flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-2 py-3">
          <span className="text-[10px] leading-[100%] text-[#111111]">
            Close Quantity
          </span>
          <div className="flex flex-1 items-center gap-1">
            <input
              type="text"
              value={closeQuantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-[12px] leading-[18px] font-medium text-[#111111] text-right bg-transparent outline-none flex-1"
            />
            <span className="text-[10px] leading-[100%] font-medium text-[#111111]">
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
      <p className="text-[12px] leading-[100%] text-[#76737B] ">
        When MMR≥0%, the position will be closed at the market price. The higher
        the MMR, the higher the risk. Position liquidation/reduction will be
        triggered when the MMR reaches 100%.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Button
            text="Cancel"
            size="small"
            type="ghost"
            disabled={false}
            onClick={onClose}
          />
        </div>
        <div className="flex-1">
          <Button
            text="Confirm"
            size="small"
            type="solid"
            disabled={false}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </motion.div>
  );
};
