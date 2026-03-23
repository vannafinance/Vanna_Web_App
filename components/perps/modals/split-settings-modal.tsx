"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
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
    <BaseModalContent
      title="Split Settings"
      onClose={onClose}
      onConfirm={() => {
        onConfirm(selectedMode);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Qty. per order */}
        <ModalRadioOption
          name="splitSettings"
          value="qty-per-order"
          checked={selectedMode === "qty-per-order"}
          onChange={() => setSelectedMode("qty-per-order")}
          title="Qty. per order"
          description="Set the futures quantity for each sub-order."
        />

        {/* No. of split orders */}
        <ModalRadioOption
          name="splitSettings"
          value="no-of-split-orders"
          checked={selectedMode === "no-of-split-orders"}
          onChange={() => setSelectedMode("no-of-split-orders")}
          title="No. of split orders"
          description="Set the total number of split orders."
        />
      </div>
    </BaseModalContent>
  );
};
