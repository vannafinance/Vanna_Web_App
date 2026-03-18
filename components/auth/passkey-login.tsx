"use client";

import { useLoginWithPasskey } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";

interface PasskeyLoginProps {
  onSuccess: () => void;
}

export function PasskeyLogin({ onSuccess }: PasskeyLoginProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const { loginWithPasskey } = useLoginWithPasskey({
    onComplete: () => {
      setLoading(false);
      onSuccess();
    },
    onError: () => {
      setLoading(false);
    },
  });

  const handlePasskey = async () => {
    setLoading(true);
    try {
      await loginWithPasskey();
    } catch {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={handlePasskey}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
        isDark
          ? "bg-[#1C1C1C] border border-[#2A2A2A] text-white hover:border-[#3A3A3A]"
          : "bg-white border border-[#DFDFDF] text-[#1F1F1F] hover:border-[#BFBFBF]"
      }`}
      aria-label="Continue with Passkey"
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className={isDark ? "text-[#777777]" : "text-[#595959]"}
        >
          <path
            d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M20 18L20 22M20 22L22 20M20 22L18 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.41 22C3.41 18.13 7.26 15 12 15C13.28 15 14.5 15.22 15.62 15.62"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span>Continue with Passkey</span>
    </motion.button>
  );
}
