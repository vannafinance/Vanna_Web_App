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
    onComplete: () => {
      setConnecting(false);
      onSuccess();
    },
    onError: () => {
      setConnecting(false);
    },
  });

  const handleConnect = () => {
    setConnecting(true);
    login({ loginMethods: ["wallet"] });
  };

  return (
    <div>
      {/* Connect button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleConnect}
        disabled={connecting}
        className="w-full py-4 rounded-xl text-[15px] font-semibold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #703AE6 0%, #9F5BFF 50%, #703AE6 100%)",
          backgroundSize: "200% 200%",
        }}
      >
        <div className="flex items-center justify-center gap-2.5">
          {connecting ? (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5" />
              <path d="M2 10H22" stroke="white" strokeWidth="1.5" />
              <circle cx="18" cy="15" r="1.5" fill="white" />
            </svg>
          )}
          <span>Connect Wallet</span>
        </div>
      </motion.button>

      {/* Supported wallets */}
      <div className="mt-5">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider text-center mb-3 ${
            isDark ? "text-[#444444]" : "text-[#BBBBBB]"
          }`}
        >
          Supported wallets
        </p>
        <div className="flex justify-center gap-3">
          {/* MetaMask */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1A1A1A] border border-[#252525] hover:border-[#F6851B]/30"
                : "bg-[#FAFAFA] border border-[#ECECEC] hover:border-[#F6851B]/30"
            }`}
            title="MetaMask"
          >
            <svg width="26" height="26" viewBox="0 0 35 33" fill="none">
              <path d="M32.958 1l-13.134 9.718 2.442-5.727L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.066 1l13.02 9.809-2.328-5.818L2.066 1zM28.196 23.725l-3.495 5.338 7.483 2.06 2.143-7.282-6.131-.116zM1.698 23.841l2.13 7.282 7.47-2.06-3.483-5.338-6.117.116z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.87 14.564l-2.078 3.14 7.405.337-.247-7.97-5.08 4.493zM24.155 14.564l-5.157-4.584-.17 8.06 7.405-.336-2.078-3.14zM11.298 29.063l4.47-2.16-3.86-3.012-.61 5.172zM20.256 26.903l4.457 2.16-.596-5.172-3.861 3.012z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24.713 29.063l-4.457-2.16.364 2.903-.039 1.231 4.132-1.974zM11.298 29.063l4.145 1.974-.026-1.231.35-2.903-4.47 2.16z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.521 22.037l-3.718-1.092 2.626-1.205 1.092 2.297zM19.503 22.037l1.092-2.297 2.639 1.205-3.731 1.092z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.298 29.063l.636-5.338-4.12.116 3.484 5.222zM23.09 23.725l.623 5.338 3.483-5.222-4.106-.116zM26.233 17.704l-7.405.337.688 3.996 1.092-2.297 2.639 1.205 2.986-3.24zM11.803 20.945l2.626-1.205 1.092 2.297.688-3.996-7.405-.337 2.999 3.24z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.804 17.704l3.089 6.025-.104-2.784-2.985-3.24zM23.247 20.945l-.117 2.784 3.103-6.025-2.986 3.24zM16.209 18.04l-.688 3.997.87 4.48.195-5.904-.377-2.573zM18.828 18.04l-.364 2.56.182 5.917.87-4.48-.688-3.997z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.516 22.037l-.87 4.48.624.44 3.861-3.012.117-2.784-3.732.876zM11.803 20.945l.104 2.784 3.86 3.012.624-.44-.87-4.48-3.718-.876z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.568 31.037l.04-1.231-.338-.285h-4.516l-.325.285.026 1.231-4.145-1.974 1.45 1.179 2.935 2.034h4.593l2.948-2.034 1.45-1.18-4.118 1.975z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.256 26.903l-.624-.44h-3.622l-.624.44-.35 2.903.325-.285h4.516l.338.285-.35-2.903z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M33.517 11.353l1.114-5.364L32.958 1l-12.702 9.412 4.886 4.132 6.905 2.01 1.524-1.776-.662-.48 1.053-.959-.805-.622 1.053-.805-.695-.53zM.394 5.989l1.114 5.364-.714.53 1.053.804-.805.623 1.053.96-.662.479 1.524 1.776 6.905-2.01 4.886-4.132L2.066 1 .394 5.989z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32.047 16.554l-6.905-2.01 2.078 3.14-3.103 6.024 4.106-.052h6.131l-2.307-7.102zM10.87 14.544l-6.906 2.01-2.293 7.102h6.117l4.106.052-3.089-6.025 2.065-3.14zM18.828 18.04l.442-7.632 2.014-5.416H13.74l2.014 5.416.442 7.632.17 2.586.012 5.89h3.622l.013-5.89.182-2.586z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Coinbase */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1A1A1A] border border-[#252525] hover:border-[#0052FF]/30"
                : "bg-[#FAFAFA] border border-[#ECECEC] hover:border-[#0052FF]/30"
            }`}
            title="Coinbase Wallet"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0052FF" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM13.5 13C13.224 13 13 13.224 13 13.5V18.5C13 18.776 13.224 19 13.5 19H18.5C18.776 19 19 18.776 19 18.5V13.5C19 13.224 18.776 13 18.5 13H13.5Z"
                fill="white"
              />
            </svg>
          </div>

          {/* WalletConnect */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1A1A1A] border border-[#252525] hover:border-[#3B99FC]/30"
                : "bg-[#FAFAFA] border border-[#ECECEC] hover:border-[#3B99FC]/30"
            }`}
            title="WalletConnect"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#3B99FC" />
              <path
                d="M10.4 12.8C13.5 9.7 18.5 9.7 21.6 12.8L22 13.2C22.1 13.3 22.1 13.5 22 13.6L20.7 14.9C20.65 14.95 20.55 14.95 20.5 14.9L20 14.4C17.8 12.2 14.2 12.2 12 14.4L11.5 14.9C11.45 14.95 11.35 14.95 11.3 14.9L10 13.6C9.9 13.5 9.9 13.3 10 13.2L10.4 12.8Z"
                fill="white"
              />
              <path
                d="M24 15.2L25.2 16.4C25.3 16.5 25.3 16.7 25.2 16.8L20 22C19.9 22.1 19.7 22.1 19.6 22L16.2 18.6C16.175 18.575 16.125 18.575 16.1 18.6L12.7 22C12.6 22.1 12.4 22.1 12.3 22L7.1 16.8C7 16.7 7 16.5 7.1 16.4L8.3 15.2C8.4 15.1 8.6 15.1 8.7 15.2L12.1 18.6C12.125 18.625 12.175 18.625 12.2 18.6L15.6 15.2C15.7 15.1 15.9 15.1 16 15.2L19.4 18.6C19.425 18.625 19.475 18.625 19.5 18.6L22.9 15.2C23 15.1 23.2 15.1 23.3 15.2L24 15.2Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Phantom */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1A1A1A] border border-[#252525] hover:border-[#AB9FF2]/30"
                : "bg-[#FAFAFA] border border-[#ECECEC] hover:border-[#AB9FF2]/30"
            }`}
            title="Phantom"
          >
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#AB9FF2" />
              <circle cx="12" cy="15" r="2" fill="white" />
              <circle cx="20" cy="15" r="2" fill="white" />
            </svg>
          </div>

          {/* More */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-[#1A1A1A] border border-[#252525] hover:border-[#555555]"
                : "bg-[#FAFAFA] border border-[#ECECEC] hover:border-[#CCCCCC]"
            }`}
            title="More wallets"
          >
            <span
              className={`text-[11px] font-bold ${
                isDark ? "text-[#555555]" : "text-[#AAAAAA]"
              }`}
            >
              +50
            </span>
          </div>
        </div>
      </div>

      {/* Info text */}
      <p
        className={`mt-5 text-[12px] text-center leading-relaxed ${
          isDark ? "text-[#555555]" : "text-[#AAAAAA]"
        }`}
      >
        No wallet? Switch to <span className={isDark ? "text-[#9F7BEE]" : "text-[#703AE6]"}>Email &amp; Social</span> tab
        — we&apos;ll create one for you.
      </p>
    </div>
  );
}
