"use client";

import { useLoginWithOAuth } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";

interface SocialLoginProps {
  onSuccess: () => void;
}

export function SocialLogin({ onSuccess }: SocialLoginProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => { setLoading(null); onSuccess(); },
    onError: (err) => {
      setLoading(null);
      setError(typeof err === "string" ? err : "Login failed. Please try again.");
    },
  });

  const handleOAuth = (provider: "google" | "apple" | "twitter") => {
    setLoading(provider);
    setError("");
    initOAuth({ provider });
  };

  const rowClass = `flex items-center gap-3.5 px-4 py-[15px] rounded-[14px] border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
    isDark
      ? "bg-[#1A1A1A] border-[#2E2E2E] hover:border-[#3A3A3A] hover:bg-[#202020]"
      : "bg-[#F5F5F5] border-[#E0E0E0] hover:border-[#BFBFBF] hover:bg-[#EFEFEF]"
  }`;

  return (
    <div className="flex flex-col gap-[10px]">
      {/* Google */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth("google")}
        disabled={loading !== null}
        className={rowClass}
        aria-label="Continue with Google"
      >
        {loading === "google" ? (
          <div className="w-5 h-5 rounded-full border-2 border-[#4285F4]/40 border-t-[#4285F4] animate-spin flex-shrink-0" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
        )}
        <span className={`text-[14px] font-medium ${isDark ? "text-white" : "text-[#1F1F1F]"}`}>
          Google
        </span>
      </motion.button>

      {/* Apple */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth("apple")}
        disabled={loading !== null}
        className={rowClass}
        aria-label="Continue with Apple"
      >
        {loading === "apple" ? (
          <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-current animate-spin flex-shrink-0" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path
              d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
              fill={isDark ? "white" : "#000000"}
            />
          </svg>
        )}
        <span className={`text-[14px] font-medium ${isDark ? "text-white" : "text-[#1F1F1F]"}`}>
          Apple
        </span>
      </motion.button>

      {/* X (Twitter) */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOAuth("twitter")}
        disabled={loading !== null}
        className={rowClass}
        aria-label="Continue with X"
      >
        {loading === "twitter" ? (
          <div className={`w-5 h-5 rounded-full border-2 border-t-current animate-spin flex-shrink-0 ${isDark ? "border-white/20" : "border-black/20"}`} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              fill={isDark ? "white" : "#0F1419"}
            />
          </svg>
        )}
        <span className={`text-[14px] font-medium ${isDark ? "text-white" : "text-[#1F1F1F]"}`}>
          X
        </span>
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[12px] text-[#FC5457] font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
