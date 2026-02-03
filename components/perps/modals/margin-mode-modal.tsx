"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
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
    <BaseModalContent
      title={`${pair} Margin Mode`}
      onClose={onClose}
      onConfirm={() => {
        onConfirm(selectedMode);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Isolated Mode */}
        <ModalRadioOption
          name="marginMode"
          value="isolated"
          checked={selectedMode === "isolated"}
          onChange={() => setSelectedMode("isolated")}
          title="Isolated Mode"
          description="Hedging mode is supported, and the risk of long positions and short positions is calculated separately. Under the isolated margin mode, a certain amount of margin is allocated to each position. If a position's margin falls below the maintenance margin level, the position will be liquidated, and the maximum loss incurred will be limited to the position's margin. You can add or reduce margin for a particular position in isolated margin mode."
        />

        {/* Cross Mode */}
        <ModalRadioOption
          name="marginMode"
          value="cross"
          checked={selectedMode === "cross"}
          onChange={() => setSelectedMode("cross")}
          title="Cross Mode"
          description="All positions under the same margin asset share the same margin balance. In the event of liquidation, traders may risk losing the full margin balance along with any positions under the margin asset."
        />
      </div>
    </BaseModalContent>
  );
};
