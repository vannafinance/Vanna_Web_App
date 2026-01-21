"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { AssetMode } from "@/lib/types";

interface AssetModeModalProps {
  defaultMode?: AssetMode;
  onConfirm: (mode: AssetMode) => void;
  onClose: () => void;
}

export const AssetModeModal = ({
  defaultMode = "single",
  onConfirm,
  onClose,
}: AssetModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<AssetMode>(defaultMode);

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        Asset Mode
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* Single-Asset Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("single")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="assetMode"
              value="single"
              checked={selectedMode === "single"}
              onChange={() => setSelectedMode("single")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Single-Asset Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Only supports USDT as margin for trading contracts. The profits
              and losses of positions with the same margin assets can offset one
              another. Supports cross margin and isolated margin
            </span>
          </div>
        </div>

        {/* Multi Asset Mode */}
        <div
          className="flex gap-1 cursor-pointer"
          onClick={() => setSelectedMode("multi")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="assetMode"
              value="multi"
              checked={selectedMode === "multi"}
              onChange={() => setSelectedMode("multi")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Multi Asset Mode
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Contracts can be traded across margin assets. The profits and
              losses of positions with different margin assets can offset one
              another. Supports cross margin
            </span>
          </div>
        </div>
      </div>
      {/* 
      Info Link
      <p className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
        Read about Multi-assets mode to better manage risk.
      </p> */}

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
