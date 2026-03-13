"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { AnimatedTabs } from "../../ui/animated-tabs";
import { TpSlMode, TpSlPositionData } from "@/lib/types";
import { EntirePositionTab } from "./tp-sl-entire-tab";
import { PartialPositionTab } from "./tp-sl-partial-tab";
import { TrailingTab } from "./tp-sl-trailing-tab";
import { MmrSlTab } from "./tp-sl-mmr-tab";
import { useTheme } from "@/contexts/theme-context";

const TP_SL_TABS = [
  { id: "entire_position", label: "Entire Position" },
  { id: "partial_position", label: "Partial Position" },
  { id: "trailing", label: "Trailing TP/SL" },
  { id: "mmr_sl", label: "MMR SL" },
];

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
  const { isDark } = useTheme();
  const [selectedMode, setSelectedMode] = useState<TpSlMode>(defaultMode);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  const textPrimary = isDark ? "text-[#FFFFFF]" : "text-[#111111]";

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
        <div className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
          {position?.pair || "SBTCUSDT"}. {position?.mode || "Cross"}
        </div>
        <div className="rounded-[5px] bg-[#EBFCFD] py-1 px-2 text-[10px] leading-[15px] font-semibold text-[#32E2EE]">
          Open long {position?.leverage || "10x"}
        </div>
      </div>

      {/* price grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-5">
        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Last Price
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
            {position?.lastPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Entry price
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Limit order
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={`flex text-[10px] leading-[15px] font-medium ${textPrimary}`}>
            Mark Price
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
            {position?.markPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={`flex text-[10px] leading-[15px] font-medium ${textPrimary}`}>
            Est. Liquidation Price
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${textPrimary}`}>
            {position?.estLiquidationPrice || "102,964"} USDT
          </span>
        </div>
      </div>

      {/* tabs */}
      <AnimatedTabs
        type="ghost-compact"
        tabs={TP_SL_TABS}
        activeTab={selectedMode}
        onTabChange={(tabId) => setSelectedMode(tabId as TpSlMode)}
        tabClassName="flex-1 text-[10px] md:text-[12px]"
      />

      {/* fields based on selected mode */}
      {selectedMode === "entire_position" && <EntirePositionTab />}

      {selectedMode === "partial_position" && <PartialPositionTab />}

      {selectedMode === "trailing" && <TrailingTab />}

      {selectedMode === "mmr_sl" && <MmrSlTab />}
    </BaseModalContent>
  );
};
