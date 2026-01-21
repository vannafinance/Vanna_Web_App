"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { PositionMode } from "@/lib/types";

interface PositionModeModalProps {
  defaultMode?: PositionMode;
  onConfirm: (mode: PositionMode) => void;
  onClose: () => void;
}

export const PositionModeModal = ({
  defaultMode = "one-way",
  onConfirm,
  onClose,
}: PositionModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<PositionMode>(defaultMode);

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        Position Mode
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* One-Way Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("one-way")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="positionMode"
              value="one-way"
              checked={selectedMode === "one-way"}
              onChange={() => setSelectedMode("one-way")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              One-Way Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
            In one-way mode, a contract can only hold positions in one direction
            </span>
          </div>
        </div>

        {/* Hedge Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("hedge")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="positionMode"
              value="hedge"
              checked={selectedMode === "hedge"}
              onChange={() => setSelectedMode("hedge")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Hedge Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
            In the hedge mode, one contract can hold position in both long and short directions at the same time, and hedge positions in different directions under the same contract
            </span>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-[10px] leading-[15px] font-medium text-[#919191]">
      If users have existing positions or open orders, they could not adjust the position mode. This position mode adjustment applies to all perpetual contracts.
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
