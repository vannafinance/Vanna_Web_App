"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
import { OrderPreferenceType } from "@/lib/types";

interface OrderPreferenceModalProps {
  defaultMode?: OrderPreferenceType;
  onConfirm: (mode: OrderPreferenceType) => void;
  onClose: () => void;
}

export const OrderPreferenceModal = ({
  defaultMode = "faster-execution",
  onConfirm,
  onClose,
}: OrderPreferenceModalProps) => {
  const [selectedMode, setSelectedMode] =
    useState<OrderPreferenceType>(defaultMode);

  return (
    <BaseModalContent
      title="Order Preference"
      onClose={onClose}
      onConfirm={() => {
        onConfirm(selectedMode);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Faster Execution */}
        <ModalRadioOption
          name="orderPreference"
          value="faster-execution"
          checked={selectedMode === "faster-execution"}
          onChange={() => setSelectedMode("faster-execution")}
          title="Faster Execution"
          description="Ensures that each order is placed at the best price, with the prices continuously adjusted as the market changes to enable faster execution."
        />

        {/* Fixed Distance */}
        <ModalRadioOption
          name="orderPreference"
          value="fixed-distance"
          checked={selectedMode === "fixed-distance"}
          onChange={() => setSelectedMode("fixed-distance")}
          title="Fixed Distance"
          description="Distance from Bid 1/Ask 1. Ensures that each order is placed at a fixed distance from the best price, with the prices continuously adjusted as the market changes to achieve a better execution price."
        />

        {/* Fixed Price */}
        <ModalRadioOption
          name="orderPreference"
          value="fixed-price"
          checked={selectedMode === "fixed-price"}
          onChange={() => setSelectedMode("fixed-price")}
          title="Fixed Price"
          description="Each sub-order is placed at a fixed price."
        />
      </div>
    </BaseModalContent>
  );
};
