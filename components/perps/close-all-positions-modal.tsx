"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";

interface CloseAllPositionsModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const CloseAllPositionsModal = ({
  onClose,
  onConfirm,
}: CloseAllPositionsModalProps) => {
  return (
    <motion.div
      className="w-[418px] rounded-[20px] p-5 bg-[#F7F7F7] flex flex-col gap-5"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <h3 className="text-[16px] leading-6 font-semibold text-[#111111]">
        Close Positions
      </h3>

      {/* Message */}
      <p className="text-[12px] leading-[18px] text-[#111111]">
        All positions will be closed at the best market price. Are you sure you
        want to close all positions?
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-2">
        <div className="flex-1">
          <Button
            text="Cancel"
            size="small"
            type="ghost"
            disabled={false}
            onClick={onClose}
          />
        </div>
        <div className="flex-1">
          <Button
            text="Confirm"
            size="small"
            type="solid"
            disabled={false}
            onClick={onConfirm}
          />
        </div>
      </div>
    </motion.div>
  );
};
