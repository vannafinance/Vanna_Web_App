"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import {
  TpSlMode,
 
  TpSlPositionData,
} from "@/lib/types";
import { EntirePositionTab } from "./tp-sl-entire-tab";
import { PartialPositionTab } from "./tp-sl-partial-tab";
import { TrailingTab } from "./tp-sl-trailing-tab";
import { MmrSlTab } from "./tp-sl-mmr-tab";

interface TpSlModalProps {
  defaultMode?: TpSlMode;
  position?: TpSlPositionData;
  onClose: () => void;
  onConfirm?: (data: { mode: TpSlMode }) => void;
}

export const TpSlModal = ({
  defaultMode = "entire_position",
  position,
  onClose,
  onConfirm,
}: TpSlModalProps) => {
  const [selectedMode, setSelectedMode] = useState<TpSlMode>(defaultMode);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  return (
    <BaseModalContent
      title={
        <>
          <span>TP/SL</span>
          <Image src="/icons/info.svg" alt="info" width={16} height={16} />
        </>
      }
      width="524px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={() => {
        onConfirm?.({ mode: selectedMode });
        onClose();
      }}
    >
      {/* position info: pair & leverage */}
      <div className="flex gap-1">
        <div className="text-[12px] leading-[18px] font-semibold text-[#111111]">
          {position?.pair || "SBTCUSDT"}. {position?.mode || "Cross"}
        </div>
        <div className="rounded-[5px] bg-[#EBFCFD] py-1 px-2 text-[10px] leading-[15px] font-semibold text-[#32E2EE]">
          Open long {position?.leverage || "10x"}
        </div>
      </div>

      {/* price grid */}
      <div className="grid grid-cols-3 gap-x-5 gap-y-5">
        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Last Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.lastPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Entry price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Limit order
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#111111]">
            Mark Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.markPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Last Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.lastPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#111111]">
            Est. Liquidation Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.estLiquidationPrice || "102,964"} USDT
          </span>
        </div>
      </div>

      {/* tabs */}
      <div className="bg-white flex gap-1 p-1 rounded-lg ">
        <button
          type="button"
          onClick={() => setSelectedMode("entire_position")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "entire_position"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Entire Position
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("partial_position")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "partial_position"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Partial Position
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("trailing")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "trailing"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Trailing TP/SL
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("mmr_sl")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "mmr_sl"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          MMR SL
        </button>
      </div>

      {/* fields based on selected mode */}
      {selectedMode === "entire_position" && <EntirePositionTab />}

      {selectedMode === "partial_position" && <PartialPositionTab />}

      {selectedMode === "trailing" && <TrailingTab />}

      {selectedMode === "mmr_sl" && <MmrSlTab />}
    </BaseModalContent>
  );
};
