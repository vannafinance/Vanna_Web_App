"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
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
    <BaseModalContent
      title="Asset Mode"
      onClose={onClose}
      onConfirm={() => {
        onConfirm(selectedMode);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Single-Asset Mode */}
        <ModalRadioOption
          name="assetMode"
          value="single"
          checked={selectedMode === "single"}
          onChange={() => setSelectedMode("single")}
          title="Single-Asset Mode"
          description="Only supports USDT as margin for trading contracts. The profits and losses of positions with the same margin assets can offset one another. Supports cross margin and isolated margin"
        />

        {/* Multi Asset Mode */}
        <ModalRadioOption
          name="assetMode"
          value="multi"
          checked={selectedMode === "multi"}
          onChange={() => setSelectedMode("multi")}
          title="Multi Asset Mode"
          description="Contracts can be traded across margin assets. The profits and losses of positions with different margin assets can offset one another. Supports cross margin"
        />
      </div>
    </BaseModalContent>
  );
};
