"use client";

import { useTheme } from "@/contexts/theme-context";
import { Token } from "./types";
import { TokenSelector } from "./TokenSelector";
import { motion } from "framer-motion";

interface SwapInputProps {
  label: string;
  token: Token | null;
  amount: string;
  amountUsd: string | null;
  balance: string | null;
  isReadOnly?: boolean;
  isLoading?: boolean;
  onTokenSelect: () => void;
  onAmountChange?: (val: string) => void;
  onMaxClick?: () => void;
  showMax?: boolean;
}

export const SwapInput = ({
  label,
  token,
  amount,
  amountUsd,
  balance,
  isReadOnly = false,
  isLoading = false,
  onTokenSelect,
  onAmountChange,
  onMaxClick,
  showMax = false,
}: SwapInputProps) => {
  const { isDark } = useTheme();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onAmountChange?.(val);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-2 transition-colors ${
        isDark
          ? "bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#333333]"
          : "bg-[#F7F7F7] border border-[#EEEEEE] hover:border-[#E2E2E2]"
      }`}
    >
      {/* Label */}
      <span
        className={`text-[12px] font-medium leading-[18px] ${isDark ? "text-[#A7A7A7]" : "text-[#777777]"}`}
      >
        {label}
      </span>

      {/* Token + Amount row */}
      <div className="flex items-center justify-between gap-3">
        <TokenSelector token={token} onClick={onTokenSelect} />

        {/* Amount input */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-end">
              <div
                className={`h-8 w-32 rounded-lg animate-pulse ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"}`}
              />
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={handleInputChange}
              readOnly={isReadOnly}
              className={`w-full text-right text-[28px] md:text-[32px] font-semibold leading-none bg-transparent outline-none placeholder:opacity-30 ${
                isReadOnly ? "cursor-default" : ""
              } ${isDark ? "text-white placeholder:text-[#555555]" : "text-[#111111] placeholder:text-[#CCCCCC]"}`}
            />
          )}
        </div>
      </div>

      {/* Balance + USD value row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {balance !== null && (
            <span
              className={`text-[12px] font-medium leading-[18px] ${isDark ? "text-[#777777]" : "text-[#A7A7A7]"}`}
            >
              Balance: {balance}
            </span>
          )}
          {showMax && balance !== null && (
            <motion.button
              type="button"
              onClick={onMaxClick}
              whileTap={{ scale: 0.95 }}
              className="text-[12px] font-semibold leading-[18px] text-[#703AE6] hover:text-[#8D61EB] cursor-pointer transition-colors"
            >
              MAX
            </motion.button>
          )}
        </div>
        {amountUsd && (
          <span
            className={`text-[12px] font-medium leading-[18px] ${isDark ? "text-[#777777]" : "text-[#A7A7A7]"}`}
          >
            ≈ ${amountUsd}
          </span>
        )}
      </div>
    </div>
  );
};
