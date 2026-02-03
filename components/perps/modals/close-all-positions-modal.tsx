"use client";

import { BaseModalContent } from "../../ui/base-modal-content";

interface CloseAllPositionsModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const CloseAllPositionsModal = ({
  onClose,
  onConfirm,
}: CloseAllPositionsModalProps) => {
  return (
    <BaseModalContent
      title="Close Positions"
      width="418px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {/* Message */}
      <p className="text-[12px] leading-[18px] text-[#111111] font-medium">
        All positions will be closed at the best market price. Are you sure you
        want to close all positions?
      </p>
    </BaseModalContent>
  );
};
