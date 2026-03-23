"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { Checkbox } from "../../ui/Checkbox";
import { useTheme } from "@/contexts/theme-context";

interface ChaseOrderModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const ChaseOrderModal = ({
  onClose,
  onConfirm,
}: ChaseOrderModalProps) => {
  const { isDark } = useTheme();
  const [dontRemind, setDontRemind] = useState(false);

  const handleConfirm = () => {
    if (dontRemind) {
    }
    onConfirm();
  };

  return (
    <BaseModalContent
      title="Chase order"
      width="418px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <p className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
        After confirming to follow the best price in the order book, the buy
        order price will be adjusted to Bid 1, and the sell order price will be
        adjusted to Ask 1.
      </p>

      <div className="flex items-center gap-2 text-[12px] leading-[18px] font-medium">
        <Checkbox
          checked={dontRemind}
          onChange={(e) => setDontRemind(e.target.checked)}
        />
        <span className={isDark ? "text-[#A7A7A7]" : "text-[#464545]"}>
          Don&apos;t remind me again (edit in{" "}
          <span className="text-[#703AE6] cursor-pointer hover:underline">
            Preferences
          </span>{" "}
          )
        </span>
      </div>
    </BaseModalContent>
  );
};
