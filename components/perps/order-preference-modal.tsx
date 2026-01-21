"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { OrderPreferenceType } from "@/lib/types";

interface OrderPreferenceModalProps {
  defaultMode?: OrderPreferenceType;
  onConfirm: (mode: OrderPreferenceType) => void;
  onClose: () => void;
}

export const OrderPreferenceModal = ({
  defaultMode = "faster-execution",
  onConfirm,
  onClose,
}: OrderPreferenceModalProps) => {
  const [selectedMode, setSelectedMode] =
    useState<OrderPreferenceType>(defaultMode);

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        Order Preference
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* Faster Execution */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("faster-execution")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="orderPreference"
              value="faster-execution"
              checked={selectedMode === "faster-execution"}
              onChange={() => setSelectedMode("faster-execution")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Faster Execution
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Ensures that each order is placed at the best price, with the
              prices continuously adjusted as the market changes to enable
              faster execution.
            </span>
          </div>
        </div>

        {/* Fixed Distance */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("fixed-distance")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="orderPreference"
              value="fixed-distance"
              checked={selectedMode === "fixed-distance"}
              onChange={() => setSelectedMode("fixed-distance")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Fixed Distance
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Distance from Bid 1/Ask 1. Ensures that each order is placed at a
              fixed distance from the best price, with the prices continuously
              adjusted as the market changes to achieve a better execution
              price.
            </span>
          </div>
        </div>

        {/* Fixed Price */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("fixed-price")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="orderPreference"
              value="fixed-price"
              checked={selectedMode === "fixed-price"}
              onChange={() => setSelectedMode("fixed-price")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Fixed Price
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Each sub-order is placed at a fixed price.
            </span>
          </div>
        </div>
      </div>

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
            onClick={() => {
              onConfirm(selectedMode);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
