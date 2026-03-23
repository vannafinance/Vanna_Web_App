"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { usePrivy, useWallets, useLoginWithOAuth } from "@privy-io/react-auth";
import { EmailLogin } from "./email-login";
import { SocialLogin } from "./social-login";
import { WalletLogin } from "./wallet-login";

type AuthTab = "social" | "wallet";
type ModalStep =
  | "login"
  | "verifying"
  | "terms"
  | "creating-wallet"
  | "ready";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOAuthReturn?: boolean;
  oauthProvider?: string | null;
}

export function LoginModal({ isOpen, onClose, isOAuthReturn = false, oauthProvider = null }: LoginModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<AuthTab>("social");
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [step, setStep] = useState<ModalStep>(isOAuthReturn ? "verifying" : "login");
  const [authProvider, setAuthProvider] = useState<string>(oauthProvider || "google");

  // ── CRITICAL: Mount useLoginWithOAuth at the modal level so it's always active ──
  // Privy needs this hook mounted to process OAuth redirect params.
  // Without it, the redirect params sit in the URL but never get processed.
  useLoginWithOAuth({
    onComplete: ({ isNewUser, wasAlreadyAuthenticated }) => {
      if (wasAlreadyAuthenticated) return; // Already handled
      if (isNewUser) {
        setStep("terms");
      } else {
        setStep("ready");
      }
    },
    onError: () => {
      setStep("login");
    },
  });

  // Detect auth provider from user object — only when user is loaded
  useEffect(() => {
    if (!user) return;
    if (user.google) setAuthProvider("google");
    else if (user.twitter) setAuthProvider("twitter");
    else if (user.apple) setAuthProvider("apple");
    else if (user.email) setAuthProvider("email");
    else setAuthProvider("wallet");
  }, [user]);

  // ── Also watch Privy state as a backup transition ──
  useEffect(() => {
    if (step !== "verifying") return;
    if (!ready || !authenticated) return;

    if (wallets.length > 0) {
      setStep("ready");
    } else {
      setStep("terms");
    }
  }, [step, ready, authenticated, wallets.length]);

  // ── Timeout: if stuck on verifying for 10s, fall back to login ──
  useEffect(() => {
    if (step !== "verifying") return;
    const timeout = setTimeout(() => {
      setStep("login");
    }, 10000);
    return () => clearTimeout(timeout);
  }, [step]);

  // ── In-modal auth success (email/social click inside modal) ──
  const handleAuthSuccess = useCallback(() => {
    setStep("verifying");
  }, []);

  // ── Terms accepted → create wallet or skip if already exists ──
  const handleAcceptTerms = useCallback(() => {
    if (wallets.length > 0) {
      setStep("ready");
    } else {
      setStep("creating-wallet");
    }
  }, [wallets.length]);

  // ── Watch for wallet creation to complete ──
  useEffect(() => {
    if (step === "creating-wallet" && wallets.length > 0) {
      setStep("ready");
    }
  }, [step, wallets.length]);

  // ── Auto-close after "ready" state ──
  useEffect(() => {
    if (step === "ready") {
      const timer = setTimeout(() => {
        onClose();
        setTimeout(() => setStep("login"), 300);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  // ── Reset step when modal opens fresh (not OAuth return) ──
  useEffect(() => {
    if (isOpen && !authenticated && !isOAuthReturn) {
      setStep("login");
    }
  }, [isOpen, authenticated, isOAuthReturn]);

  if (!isOpen) return null;

  const isNonDismissable =
    step === "verifying" || step === "creating-wallet" || step === "ready";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{
              background: isDark
                ? "radial-gradient(ellipse at center, rgba(112, 58, 230, 0.08) 0%, rgba(0,0,0,0.7) 100%)"
                : "radial-gradient(ellipse at center, rgba(112, 58, 230, 0.05) 0%, rgba(0,0,0,0.4) 100%)",
            }}
            onClick={isNonDismissable ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Card */}
          <motion.div
            className={`relative z-10 w-[420px] max-w-[94vw] overflow-hidden rounded-2xl ${
              isDark
                ? "bg-[#141414] border border-[#2A2A2A]"
                : "bg-white border border-[#E5E7EB]"
            }`}
            style={{
              boxShadow: isDark
                ? "0 0 80px rgba(112, 58, 230, 0.12), 0 24px 48px rgba(0,0,0,0.4)"
                : "0 0 80px rgba(112, 58, 230, 0.08), 0 24px 48px rgba(0,0,0,0.12)",
            }}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Top accent line */}
            <div
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, #FC5457 0%, #703AE6 50%, #FF007A 100%)",
              }}
            />

            <AnimatePresence mode="wait">
              {step === "login" && (
                <LoginStep
                  key="login"
                  isDark={isDark}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onClose={onClose}
                  onSuccess={handleAuthSuccess}
                />
              )}

              {step === "verifying" && (
                <VerifyingStep
                  key="verifying"
                  isDark={isDark}
                  provider={authProvider}
                />
              )}

              {step === "terms" && (
                <TermsStep
                  key="terms"
                  isDark={isDark}
                  onAccept={handleAcceptTerms}
                  onDecline={() => {
                    onClose();
                    setTimeout(() => setStep("login"), 300);
                  }}
                />
              )}

              {step === "creating-wallet" && (
                <CreatingWalletStep key="creating-wallet" isDark={isDark} />
              )}

              {step === "ready" && (
                <ReadyStep
                  key="ready"
                  isDark={isDark}
                  address={wallets[0]?.address}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Step 1: Login ─── */
function LoginStep({
  isDark,
  activeTab,
  setActiveTab,
  onClose,
  onSuccess,
}: {
  isDark: boolean;
  activeTab: AuthTab;
  setActiveTab: (tab: AuthTab) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="px-7 pt-6 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-[22px] font-semibold tracking-tight ${
                isDark ? "text-white" : "text-[#1F1F1F]"
              }`}
            >
              Welcome to Vanna
            </h2>
            <p
              className={`text-[13px] mt-1 ${
                isDark ? "text-[#777777]" : "text-[#949494]"
              }`}
            >
              Connect to start trading derivatives
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isDark
                ? "hover:bg-[#222222] text-[#777777]"
                : "hover:bg-[#F4F4F4] text-[#949494]"
            }`}
            aria-label="Close login modal"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          className={`mt-6 flex p-1 rounded-xl ${
            isDark ? "bg-[#1C1C1C]" : "bg-[#F4F4F4]"
          }`}
        >
          <TabButton
            label="Email & Social"
            isActive={activeTab === "social"}
            onClick={() => setActiveTab("social")}
            isDark={isDark}
          />
          <TabButton
            label="Wallet"
            isActive={activeTab === "wallet"}
            onClick={() => setActiveTab("wallet")}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-7 pb-6 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === "social" ? (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <EmailLogin onSuccess={onSuccess} />
              <Divider isDark={isDark} />
              <SocialLogin onSuccess={onSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <WalletLogin onSuccess={onSuccess} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className={`px-7 py-3 text-center text-[11px] border-t ${
          isDark
            ? "border-[#222222] text-[#595959]"
            : "border-[#F4F4F4] text-[#949494]"
        }`}
      >
        By continuing, you agree to Vanna&apos;s Terms of Service
      </div>
    </motion.div>
  );
}

/* ─── Step: Verifying ─── */
function VerifyingStep({
  isDark,
  provider,
}: {
  isDark: boolean;
  provider: string;
}) {
  const providerLabel =
    provider === "google"
      ? "Google"
      : provider === "twitter"
      ? "X"
      : provider === "apple"
      ? "Apple"
      : provider === "email"
      ? "Email"
      : "Wallet";

  const providerIcon = () => {
    switch (provider) {
      case "google":
        return (
          <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
        );
      case "twitter":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill={isDark ? "white" : "#0F1419"} />
          </svg>
        );
      case "apple":
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill={isDark ? "white" : "#000"} />
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke={isDark ? "white" : "#1F1F1F"} strokeWidth="1.5" />
            <path d="M2 7L12 13L22 7" stroke={isDark ? "white" : "#1F1F1F"} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-7"
    >
      {/* Provider icon with pulsing ring */}
      <div className="relative mb-6">
        <motion.div
          className="absolute inset-[-8px] rounded-full"
          style={{
            border: `2px solid ${isDark ? "rgba(112, 58, 230, 0.3)" : "rgba(112, 58, 230, 0.2)"}`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDark ? "bg-[#1C1C1C] border border-[#2A2A2A]" : "bg-[#F7F7F7] border border-[#E5E7EB]"
          }`}
        >
          {providerIcon()}
        </div>
      </div>

      <h3
        className={`text-[18px] font-semibold ${
          isDark ? "text-white" : "text-[#1F1F1F]"
        }`}
      >
        Verifying with {providerLabel}
      </h3>
      <p
        className={`text-[13px] mt-2 ${
          isDark ? "text-[#777777]" : "text-[#949494]"
        }`}
      >
        Please wait...
      </p>

      {/* Subtle progress bar */}
      <div
        className={`w-48 h-1 rounded-full mt-6 overflow-hidden ${
          isDark ? "bg-[#1C1C1C]" : "bg-[#F4F4F4]"
        }`}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #703AE6, #FF007A)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Terms Agreement ─── */
function TermsStep({
  isDark,
  onAccept,
  onDecline,
}: {
  isDark: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-10 flex flex-col items-center"
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
          isDark ? "bg-[#1C1C1C]" : "bg-[#F4F4F4]"
        }`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
            stroke={isDark ? "#BFBFBF" : "#595959"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 3V8C13 8.55228 13.4477 9 14 9H19"
            stroke={isDark ? "#BFBFBF" : "#595959"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3
        className={`text-[20px] font-semibold ${
          isDark ? "text-white" : "text-[#1F1F1F]"
        }`}
      >
        One last step
      </h3>
      <p
        className={`text-[14px] mt-2 text-center ${
          isDark ? "text-[#777777]" : "text-[#949494]"
        }`}
      >
        By signing up, you agree to our terms and privacy policy.
      </p>

      {/* Links */}
      <div className="w-full mt-6 space-y-2">
        <a
          href="https://vanna.finance/terms"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-colors ${
            isDark
              ? "bg-[#1C1C1C] border border-[#2A2A2A] text-[#BFBFBF] hover:border-[#3A3A3A] hover:text-white"
              : "bg-[#F7F7F7] border border-[#E5E7EB] text-[#595959] hover:border-[#BFBFBF] hover:text-[#1F1F1F]"
          }`}
        >
          <span className="text-[14px] font-medium">View Terms</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M15 3H21V9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 14L21 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </a>

        <a
          href="https://vanna.finance/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-colors ${
            isDark
              ? "bg-[#1C1C1C] border border-[#2A2A2A] text-[#BFBFBF] hover:border-[#3A3A3A] hover:text-white"
              : "bg-[#F7F7F7] border border-[#E5E7EB] text-[#595959] hover:border-[#BFBFBF] hover:text-[#1F1F1F]"
          }`}
        >
          <span className="text-[14px] font-medium">View Privacy Policy</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M15 3H21V9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 14L21 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </div>

      {/* Buttons */}
      <div className="w-full mt-6 space-y-2.5">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAccept}
          className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white cursor-pointer transition-all"
          style={{
            background:
              "linear-gradient(135deg, #FC5457 10%, #703AE6 80%)",
          }}
        >
          Accept
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDecline}
          className={`w-full py-3.5 rounded-xl text-[15px] font-semibold cursor-pointer transition-all ${
            isDark
              ? "bg-[#1C1C1C] border border-[#2A2A2A] text-[#BFBFBF] hover:border-[#3A3A3A]"
              : "bg-white border border-[#E5E7EB] text-[#595959] hover:border-[#BFBFBF]"
          }`}
        >
          No thanks
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Step 3: Creating Wallet ─── */
function CreatingWalletStep({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 px-7"
    >
      {/* Animated spinner */}
      <div className="relative w-16 h-16 mb-6">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderTopColor: "#703AE6",
            borderRightColor: "#FC5457",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            border: "3px solid transparent",
            borderBottomColor: "#FF007A",
            borderLeftColor: "#703AE6",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Wallet icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect
              x="2"
              y="6"
              width="20"
              height="14"
              rx="3"
              stroke={isDark ? "#777777" : "#949494"}
              strokeWidth="1.5"
            />
            <path
              d="M2 10H22"
              stroke={isDark ? "#777777" : "#949494"}
              strokeWidth="1.5"
            />
            <circle
              cx="18"
              cy="15"
              r="1.5"
              fill={isDark ? "#777777" : "#949494"}
            />
          </svg>
        </div>
      </div>

      <h3
        className={`text-[18px] font-semibold ${
          isDark ? "text-white" : "text-[#1F1F1F]"
        }`}
      >
        Creating your wallet
      </h3>
      <p
        className={`text-[13px] mt-2 ${
          isDark ? "text-[#777777]" : "text-[#949494]"
        }`}
      >
        Please wait...
      </p>
    </motion.div>
  );
}

/* ─── Step 4: Ready ─── */
function ReadyStep({
  isDark,
  address,
}: {
  isDark: boolean;
  address?: string;
}) {
  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-7"
    >
      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "linear-gradient(135deg, #703AE6 0%, #32EEE2 100%)",
        }}
      >
        <motion.svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <motion.path
            d="M5 13L9 17L19 7"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          />
        </motion.svg>
      </motion.div>

      <h3
        className={`text-[18px] font-semibold ${
          isDark ? "text-white" : "text-[#1F1F1F]"
        }`}
      >
        You&apos;re all set!
      </h3>

      {truncated && (
        <p
          className={`text-[13px] mt-2 font-mono ${
            isDark ? "text-[#777777]" : "text-[#949494]"
          }`}
        >
          {truncated}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Shared Components ─── */
function TabButton({
  label,
  isActive,
  onClick,
  isDark,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${
        isActive
          ? isDark
            ? "text-white"
            : "text-[#1F1F1F]"
          : isDark
          ? "text-[#595959] hover:text-[#777777]"
          : "text-[#949494] hover:text-[#595959]"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="auth-tab-indicator"
          className={`absolute inset-0 rounded-lg ${
            isDark ? "bg-[#222222]" : "bg-white"
          }`}
          style={{
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.08)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center gap-3 my-3.5">
      <div
        className={`flex-1 h-px ${isDark ? "bg-[#222222]" : "bg-[#DFDFDF]"}`}
      />
      <span
        className={`text-[11px] font-medium uppercase tracking-wider ${
          isDark ? "text-[#595959]" : "text-[#A9A9A9]"
        }`}
      >
        or
      </span>
      <div
        className={`flex-1 h-px ${isDark ? "bg-[#222222]" : "bg-[#DFDFDF]"}`}
      />
    </div>
  );
}
