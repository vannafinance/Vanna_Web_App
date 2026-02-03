"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { LeverageSlider } from "../../ui/leverage-slider";
import { Checkbox } from "../../ui/Checkbox";
import Image from "next/image";

interface AdjustLeverageModalProps {
  pair?: string;
  defaultValue?: number;
  max?: number;
  onConfirm: (val: number, batchAdjust: boolean) => void;
  onClose: () => void;
}

export const AdjustLeverageModal = ({
  pair = "ETHUSDT",
  defaultValue = 8,
  max = 20,
  onConfirm,
  onClose,
}: AdjustLeverageModalProps) => {
  const [leverage, setLeverage] = useState(defaultValue);
  const [batchAdjust, setBatchAdjust] = useState(false);

  const handleIncrement = () => {
    setLeverage((v) => Math.min(max, v + 1));
  };

  const handleDecrement = () => {
    setLeverage((v) => Math.max(1, v - 1));
  };

  return (
    <BaseModalContent
      title="Adjust Leverage"
      subtitle={pair}
      onClose={onClose}
      onConfirm={() => {
        onConfirm(leverage, batchAdjust);
        onClose();
      }}
    >
      <div>
        <div className="w-[360px] rounded-lg p-0.5 flex items-center gap-1 bg-[#FFFFFF]">
          {/* Minus Button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={leverage <= 1}
            className="w-9 h-9 rounded-lg bg-[#F4F4F4] flex items-center justify-center text-[24px] font-medium text-[#111111] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D5D5D5] transition-colors"
          >
            <Image src="/icons/minus.svg" alt="minus" width={16} height={16} />
          </button>

          {/* Leverage Input */}
          <div className="flex-1 h-9 flex items-center justify-center gap-1">
            <input
              type="text"
              value={leverage}
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty input for editing
                if (val === "") return;
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  setLeverage(Math.min(max, Math.max(1, num)));
                }
              }}
              className="w-12 text-center text-[16px] leading-[24px] font-medium text-[#111111] outline-none"
            />
            <span className="text-[16px] leading-[24px] font-medium text-[#6F6F6F]">
              ×
            </span>
          </div>

          {/* Plus Button */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={leverage >= max}
            className="w-9 h-9 rounded-lg bg-[#F4F4F4] flex items-center justify-center text-[24px] font-medium text-[#111111] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#D5D5D5] transition-colors"
          >
            <Image src="/icons/plus.svg" alt="plus" width={16} height={16} />
          </button>
        </div>

        {/* Leverage Slider */}
        <div className="pr-2.5">
          <LeverageSlider
            min={0}
            max={10}
            step={1}
            value={leverage > 10 ? 10 : leverage}
            onChange={(val) => setLeverage(val)}
            markers={[0, 2, 4, 6, 8, 10]}
          />
        </div>
      </div>

      {/* Batch Adjust Checkbox */}
      <div className="text-[10px] leading-[15px] font-medium text-[#5C5B5B]">
        <Checkbox
          label={`Batch adjust all USDT-M Futures leverages (≤${max}×)`}
          checked={batchAdjust}
          onChange={(e) => setBatchAdjust(e.target.checked)}
        />
      </div>
    </BaseModalContent>
  );
};
