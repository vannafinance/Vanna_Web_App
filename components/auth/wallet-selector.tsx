"use client";

import { useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";

interface WalletSelectorProps {
  onBack: () => void;
}

const walletTypeLabels: Record<string, string> = {
  privy: "Embedded Wallet",
  privy_smart_wallet: "Smart Wallet",
  metamask: "MetaMask",
  coinbase_wallet: "Coinbase",
  walletconnect: "WalletConnect",
  injected: "Browser Wallet",
};

export function WalletSelector({ onBack }: WalletSelectorProps) {
  const { isDark } = useTheme();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address: activeAddress } = useAccount();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b ${
          isDark ? "border-[#222222]" : "border-[#F4F4F4]"
        }`}
      >
        <button
          onClick={onBack}
          className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
            isDark ? "hover:bg-[#222222]" : "hover:bg-[#F4F4F4]"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={isDark ? "text-[#777777]" : "text-[#949494]"}
          >
            <path
              d="M9 3L5 7L9 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          className={`text-[13px] font-semibold ${
            isDark ? "text-white" : "text-[#1F1F1F]"
          }`}
        >
          Your Wallets
        </span>
      </div>

      {/* Wallet List */}
      <div className="py-2 px-2 space-y-1">
        {wallets.map((wallet) => {
          const isActive =
            activeAddress?.toLowerCase() === wallet.address.toLowerCase();
          const label =
            walletTypeLabels[wallet.walletClientType] ||
            wallet.walletClientType;
          const truncated = `${wallet.address.slice(
            0,
            6
          )}...${wallet.address.slice(-4)}`;

          return (
            <motion.button
              key={wallet.address}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveWallet(wallet)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? isDark
                    ? "bg-[#703AE6]/10 border border-[#703AE6]/30"
                    : "bg-[#F1EBFD] border border-[#703AE6]/20"
                  : isDark
                  ? "border border-transparent hover:bg-[#1C1C1C]"
                  : "border border-transparent hover:bg-[#F7F7F7]"
              }`}
            >
              {/* Wallet type indicator */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold ${
                  wallet.walletClientType === "privy"
                    ? "bg-gradient-to-br from-[#FC5457] to-[#703AE6] text-white"
                    : wallet.walletClientType === "privy_smart_wallet"
                    ? "bg-gradient-to-br from-[#703AE6] to-[#FF007A] text-white"
                    : isDark
                    ? "bg-[#222222] text-[#777777]"
                    : "bg-[#F4F4F4] text-[#949494]"
                }`}
              >
                {wallet.walletClientType === "privy"
                  ? "E"
                  : wallet.walletClientType === "privy_smart_wallet"
                  ? "S"
                  : label.charAt(0)}
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-[13px] font-semibold truncate ${
                      isDark ? "text-white" : "text-[#1F1F1F]"
                    }`}
                  >
                    {label}
                  </p>
                  {isActive && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-[#703AE6]"
                      style={{
                        background: isDark
                          ? "rgba(112, 58, 230, 0.15)"
                          : "rgba(112, 58, 230, 0.1)",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p
                  className={`text-[12px] font-mono ${
                    isDark ? "text-[#595959]" : "text-[#A9A9A9]"
                  }`}
                >
                  {truncated}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(wallet.address);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? "hover:bg-[#2A2A2A]" : "hover:bg-[#DFDFDF]"
                }`}
              >
                {copied === wallet.address ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13L9 17L19 7"
                      stroke="#32EEE2"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={isDark ? "text-[#595959]" : "text-[#A9A9A9]"}
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M5 15V5C5 3.89 5.89 3 7 3H17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </motion.button>
          );
        })}
      </div>

      {wallets.length === 0 && (
        <div
          className={`px-4 py-6 text-center text-[13px] ${
            isDark ? "text-[#595959]" : "text-[#A9A9A9]"
          }`}
        >
          No wallets connected
        </div>
      )}
    </div>
  );
}
