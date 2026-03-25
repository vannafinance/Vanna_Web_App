"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  usePrivy,
  useWallets,
  getEmbeddedConnectedWallet,
  useExportWallet,
} from "@privy-io/react-auth";
import { useDisconnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { useUserStore } from "@/store/user";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useMarginStore } from "@/store/margin-account-state";
import { WalletSelector } from "./wallet-selector";

export function UserMenu() {
  const { isDark } = useTheme();
  const { user, logout, linkEmail, linkGoogle, linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const { disconnect: disconnectWagmi } = useDisconnect();
  const embeddedWallet = getEmbeddedConnectedWallet(wallets);
  const { exportWallet } = useExportWallet();
  const resetUserStore = useUserStore((s) => s.reset);
  const resetMarginInfoStore = useMarginAccountInfoStore((s) => s.reset);

  const [isOpen, setIsOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Full disconnect: Privy logout + wagmi disconnect + clear all persisted stores
  const handleDisconnect = useCallback(async () => {
    if (isDisconnecting) return;
    setIsDisconnecting(true);
    setIsOpen(false);

    try {
      // 1. Disconnect wagmi (EOA wallets like MetaMask/Rabby)
      disconnectWagmi();

      // 2. Logout from Privy (clears embedded wallets + auth session)
      await logout();

      // 3. Reset all persisted Zustand stores so no stale user data remains
      resetUserStore();
      resetMarginInfoStore();

      // 4. Reset non-persisted margin state
      useMarginStore.setState({
        marginState: null,
        isLoading: false,
        lastError: null,
        fetchersReady: false,
        lastFetchTime: 0,
      });

      // 5. Clear any Nexus cached balances from localStorage
      if (typeof window !== "undefined") {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("nexus_bridge_balances_")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch (err) {
      console.error("[UserMenu] Disconnect failed:", err);
    } finally {
      setIsDisconnecting(false);
    }
  }, [isDisconnecting, disconnectWagmi, logout, resetUserStore, resetMarginInfoStore]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowWallets(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive display info
  const primaryWallet = wallets[0];
  const address = primaryWallet?.address;
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const email = user?.email?.address;
  const googleAccount = user?.google;
  const twitterAccount = user?.twitter;
  const appleAccount = user?.apple;
  const authMethod = email
    ? "email"
    : googleAccount
    ? "google"
    : twitterAccount
    ? "twitter"
    : appleAccount
    ? "apple"
    : "wallet";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowWallets(false);
        }}
        className={`flex items-center gap-2.5 py-2.5 pl-3 pr-4 rounded-xl font-semibold text-[14px] cursor-pointer transition-colors ${
          isDark
            ? "bg-[#1C1C1C] border border-[#2A2A2A] text-white hover:border-[#3A3A3A]"
            : "bg-[#F7F7F7] border border-[#DFDFDF] text-[#1F1F1F] hover:border-[#BFBFBF]"
        }`}
      >
        {/* Auth method icon */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #FC5457 10%, #703AE6 80%)",
          }}
        >
          {authMethod === "email" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="white" strokeWidth="2" />
              <path d="M2 7L12 13L22 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : authMethod === "google" ? (
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="white" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="white" fillOpacity="0.8" />
            </svg>
          ) : authMethod === "twitter" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white" />
            </svg>
          ) : authMethod === "apple" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="white" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="white" strokeWidth="2" />
              <circle cx="7" cy="16" r="1.5" fill="white" />
            </svg>
          )}
        </div>
        <span className="font-mono text-[13px]">{truncatedAddress}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={isDark ? "text-[#595959]" : "text-[#949494]"}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute right-0 top-full mt-2 w-[300px] rounded-xl overflow-hidden z-50 ${
              isDark
                ? "bg-[#141414] border border-[#2A2A2A]"
                : "bg-white border border-[#E5E7EB]"
            }`}
            style={{
              boxShadow: isDark
                ? "0 16px 48px rgba(0,0,0,0.5)"
                : "0 16px 48px rgba(0,0,0,0.12)",
            }}
          >
            {/* Gradient accent */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, #FC5457 0%, #703AE6 50%, #FF007A 100%)",
              }}
            />

            <AnimatePresence mode="wait">
              {!showWallets ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {/* User info section */}
                  <div className={`px-4 pt-4 pb-3 border-b ${isDark ? "border-[#222222]" : "border-[#F4F4F4]"}`}>
                    {email && (
                      <p
                        className={`text-[13px] font-medium ${
                          isDark ? "text-white" : "text-[#1F1F1F]"
                        }`}
                      >
                        {email}
                      </p>
                    )}
                    {googleAccount && (
                      <p
                        className={`text-[13px] font-medium ${
                          isDark ? "text-white" : "text-[#1F1F1F]"
                        }`}
                      >
                        {googleAccount.email}
                      </p>
                    )}
                    {twitterAccount && (
                      <p
                        className={`text-[13px] font-medium ${
                          isDark ? "text-white" : "text-[#1F1F1F]"
                        }`}
                      >
                        @{twitterAccount.username}
                      </p>
                    )}
                    {appleAccount && (
                      <p
                        className={`text-[13px] font-medium ${
                          isDark ? "text-white" : "text-[#1F1F1F]"
                        }`}
                      >
                        {appleAccount.email || "Apple Account"}
                      </p>
                    )}

                    {/* Address with copy */}
                    <button
                      onClick={copyAddress}
                      className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-mono cursor-pointer ${
                        isDark
                          ? "text-[#777777] hover:text-[#9F7BEE]"
                          : "text-[#949494] hover:text-[#703AE6]"
                      }`}
                    >
                      {truncatedAddress}
                      {copied ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
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
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
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
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    <MenuItem
                      isDark={isDark}
                      label="Wallets"
                      sublabel={`${wallets.length} connected`}
                      onClick={() => setShowWallets(true)}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="6"
                            width="20"
                            height="14"
                            rx="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M2 10H22"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="18"
                            cy="15"
                            r="1.5"
                            fill="currentColor"
                          />
                        </svg>
                      }
                      hasArrow
                    />

                    {!email && (
                      <MenuItem
                        isDark={isDark}
                        label="Link Email"
                        onClick={() => linkEmail()}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="2"
                              y="4"
                              width="20"
                              height="16"
                              rx="3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M2 7L12 13L22 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        }
                      />
                    )}

                    {!googleAccount && (
                      <MenuItem
                        isDark={isDark}
                        label="Link Google"
                        onClick={() => linkGoogle()}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 18 18"
                            fill="none"
                          >
                            <path
                              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                              fill="currentColor"
                              fillOpacity="0.6"
                            />
                          </svg>
                        }
                      />
                    )}

                    <MenuItem
                      isDark={isDark}
                      label="Link Wallet"
                      onClick={() => linkWallet()}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 5V19M5 12H19"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      }
                    />

                    {embeddedWallet && (
                      <MenuItem
                        isDark={isDark}
                        label="Export Private Key"
                        onClick={() => exportWallet()}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M15 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H15"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M10 17L15 12L10 7"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 12H3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        }
                      />
                    )}
                  </div>

                  {/* Disconnect */}
                  <div
                    className={`border-t px-2 py-1.5 ${
                      isDark ? "border-[#222222]" : "border-[#F4F4F4]"
                    }`}
                  >
                    <MenuItem
                      isDark={isDark}
                      label={isDisconnecting ? "Disconnecting..." : "Disconnect"}
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 21H5C3.89 21 3 20.1 3 19V5C3 3.89 3.89 3 5 3H9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M16 17L21 12L16 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 12H9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      }
                      danger
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="wallets"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.15 }}
                >
                  <WalletSelector onBack={() => setShowWallets(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  isDark,
  label,
  sublabel,
  onClick,
  icon,
  hasArrow,
  danger,
  disabled,
}: {
  isDark: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
  icon: React.ReactNode;
  hasArrow?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        danger
          ? isDark
            ? "text-[#FC5457] hover:bg-[#FC5457]/10"
            : "text-[#FC5457] hover:bg-[#FC5457]/5"
          : isDark
          ? "text-[#BFBFBF] hover:bg-[#1C1C1C] hover:text-white"
          : "text-[#595959] hover:bg-[#F7F7F7] hover:text-[#1F1F1F]"
      }`}
    >
      <span className={danger ? "text-[#FC5457]" : isDark ? "text-[#777777]" : "text-[#949494]"}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {sublabel && (
        <span
          className={`text-[11px] ${
            isDark ? "text-[#595959]" : "text-[#A9A9A9]"
          }`}
        >
          {sublabel}
        </span>
      )}
      {hasArrow && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={isDark ? "text-[#595959]" : "text-[#A9A9A9]"}
        >
          <path
            d="M4.5 3L7.5 6L4.5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
