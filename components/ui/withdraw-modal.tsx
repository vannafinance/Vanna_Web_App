"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TransferCollateral } from "@/components/margin/transfer-collateral";
import { useTheme } from "@/contexts/theme-context";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const WithdrawModal = ({
  isOpen,
  onClose,
  title = "Withdraw",
}: WithdrawModalProps) => {
  const { isDark } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className={`relative z-10 w-[520px] max-h-[90vh] overflow-y-auto rounded-[24px] border-[1px] ${
              isDark
                ? "bg-[#111111] border-[#333333]"
                : "bg-white border-[#E2E2E2]"
            } p-[24px] flex flex-col gap-[16px]`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h2
                className={`text-[20px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? "hover:bg-[#333333]" : "hover:bg-[#F7F7F7]"
                }`}
                aria-label="Close modal"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 1L1 13M1 1L13 13"
                    stroke={isDark ? "#ffffff" : "#111111"}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <TransferCollateral />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
