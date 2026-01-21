"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { MarginMode } from "@/lib/types";

interface MarginModeModalProps {
  pair?: string;
  defaultMode?: MarginMode;
  onConfirm: (mode: MarginMode) => void;
  onClose: () => void;
}

export const MarginModeModal = ({
  pair = "BTCUSDT",
  defaultMode = "isolated",
  onConfirm,
  onClose,
}: MarginModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<MarginMode>(defaultMode);

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        {pair} Margin Mode
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* Isolated Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("isolated")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="marginMode"
              value="isolated"
              checked={selectedMode === "isolated"}
              onChange={() => setSelectedMode("isolated")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Isolated Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Hedging mode is supported, and the risk of long positions and
              short positions is calculated separately. Under the isolated
              margin mode, a certain amount of margin is allocated to each
              position. If a position&apos;s margin falls below the maintenance
              margin level, the position will be liquidated, and the maximum
              loss incurred will be limited to the position&apos;s margin. You
              can add or reduce margin for a particular position in isolated
              margin mode.
            </span>
          </div>
        </div>

        {/* Cross Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("cross")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="marginMode"
              value="cross"
              checked={selectedMode === "cross"}
              onChange={() => setSelectedMode("cross")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Cross Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              All positions under the same margin asset share the same margin
              balance. In the event of liquidation, traders may risk losing the
              full margin balance along with any positions under the margin
              asset.
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
