"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { SplitSettingsType } from "@/lib/types";

interface SplitSettingsModalProps {
  defaultMode?: SplitSettingsType;
  onConfirm: (mode: SplitSettingsType) => void;
  onClose: () => void;
}

export const SplitSettingsModal = ({
  defaultMode = "qty-per-order",
  onConfirm,
  onClose,
}: SplitSettingsModalProps) => {
  const [selectedMode, setSelectedMode] =
    useState<SplitSettingsType>(defaultMode);

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        Split Settings
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* Qty. per order */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("qty-per-order")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="splitSettings"
              value="qty-per-order"
              checked={selectedMode === "qty-per-order"}
              onChange={() => setSelectedMode("qty-per-order")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Qty. per order
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Set the futures quantity for each sub-order.
            </span>
          </div>
        </div>

        {/* No. of split orders */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("no-of-split-orders")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="splitSettings"
              value="no-of-split-orders"
              checked={selectedMode === "no-of-split-orders"}
              onChange={() => setSelectedMode("no-of-split-orders")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              No. of split orders
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Set the total number of split orders.
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
