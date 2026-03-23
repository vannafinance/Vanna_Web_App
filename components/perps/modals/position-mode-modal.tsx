"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
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
    <BaseModalContent
      title="Position Mode"
      onClose={onClose}
      onConfirm={() => {
        onConfirm(selectedMode);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* One-Way Mode */}
        <ModalRadioOption
          name="positionMode"
          value="one-way"
          checked={selectedMode === "one-way"}
          onChange={() => setSelectedMode("one-way")}
          title="One-Way Mode"
          description="In one-way mode, a contract can only hold positions in one direction"
        />

        {/* Hedge Mode */}
        <ModalRadioOption
          name="positionMode"
          value="hedge"
          checked={selectedMode === "hedge"}
          onChange={() => setSelectedMode("hedge")}
          title="Hedge Mode"
          description="In the hedge mode, one contract can hold position in both long and short directions at the same time, and hedge positions in different directions under the same contract"
        />
      </div>

      {/* Info Text */}
      <p className="text-[10px] leading-[15px] font-medium text-[#919191]">
        If users have existing positions or open orders, they could not adjust
        the position mode. This position mode adjustment applies to all
        perpetual contracts.
      </p>
    </BaseModalContent>
  );
};
