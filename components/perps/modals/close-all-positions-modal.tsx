"use client";

import { BaseModalContent } from "../../ui/base-modal-content";
import { useTheme } from "@/contexts/theme-context";

interface CloseAllPositionsModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const CloseAllPositionsModal = ({
  onClose,
  onConfirm,
}: CloseAllPositionsModalProps) => {
  const { isDark } = useTheme();
  return (
    <BaseModalContent
      title="Close Positions"
      width="418px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {/* Message */}
      <p className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
        All positions will be closed at the best market price. Are you sure you
        want to close all positions?
      </p>
    </BaseModalContent>
  );
};
