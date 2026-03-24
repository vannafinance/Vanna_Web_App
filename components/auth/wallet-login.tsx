"use client";

import { useLogin } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";

interface WalletLoginProps {
  onSuccess: () => void;
}

export function WalletLogin({ onSuccess }: WalletLoginProps) {
  const { isDark } = useTheme();
  const [connecting, setConnecting] = useState(false);

  const { login } = useLogin({
    onComplete: () => { setConnecting(false); onSuccess(); },
    onError: () => { setConnecting(false); },
  });

  const handleConnect = () => {
    setConnecting(true);
    login({ loginMethods: ["wallet"] });
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      disabled={connecting}
      className={`w-full flex items-center gap-3.5 px-4 py-[15px] rounded-[14px] border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        isDark
          ? "bg-[#1A1A1A] border-[#2E2E2E] hover:border-[#3A3A3A] hover:bg-[#202020]"
          : "bg-[#F5F5F5] border-[#E0E0E0] hover:border-[#BFBFBF] hover:bg-[#EFEFEF]"
      }`}
      aria-label="Continue with a wallet"
    >
      {/* Wallet icon */}
      {connecting ? (
        <div className="w-5 h-5 rounded-full border-2 border-[#703AE6]/40 border-t-[#703AE6] animate-spin flex-shrink-0" />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <rect x="2" y="6" width="20" height="14" rx="3"
            stroke={isDark ? "#888888" : "#777777"} strokeWidth="1.5" />
          <path d="M2 10H22"
            stroke={isDark ? "#888888" : "#777777"} strokeWidth="1.5" />
          <circle cx="18" cy="15" r="1.5"
            fill={isDark ? "#888888" : "#777777"} />
        </svg>
      )}
      <span className={`text-[14px] font-medium ${isDark ? "text-white" : "text-[#1F1F1F]"}`}>
        Continue with a wallet
      </span>
    </motion.button>
  );
}
