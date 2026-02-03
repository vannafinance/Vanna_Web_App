"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { Checkbox } from "../../ui/Checkbox";

interface ChaseOrderModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const ChaseOrderModal = ({
  onClose,
  onConfirm,
}: ChaseOrderModalProps) => {
  const [dontRemind, setDontRemind] = useState(false);

  const handleConfirm = () => {
    if (dontRemind) {
      // Save preference to not show this modal again
      // This could be stored in localStorage or user preferences
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
      {/* Message */}
      <p className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
        After confirming to follow the best price in the order book, the buy
        order price will be adjusted to Bid 1, and the sell order price will be
        adjusted to Ask 1.
      </p>

      {/* Don't remind checkbox */}
      <div className="flex items-center gap-2 text-[12px] leading-[18px] font-medium">
        <Checkbox
          checked={dontRemind}
          onChange={(e) => setDontRemind(e.target.checked)}
        />
        <span className="text-[#464545]">
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
