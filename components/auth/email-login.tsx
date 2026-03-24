"use client";

import { useState, useRef, useEffect } from "react";
import { useLoginWithEmail } from "@privy-io/react-auth";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";

interface EmailLoginProps {
  onSuccess: () => void;
}

export function EmailLogin({ onSuccess }: EmailLoginProps) {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: () => onSuccess(),
    onError: (err) => {
      setError(typeof err === "string" ? err : "Login failed. Please try again.");
    },
  });

  const isAwaitingCode = state.status === "awaiting-code-input";

  useEffect(() => {
    if (isAwaitingCode) codeInputRefs.current[0]?.focus();
  }, [isAwaitingCode]);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setError("");
    try {
      await sendCode({ email: email.trim() });
    } catch {
      setError("Failed to send code. Check your email.");
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
    const fullCode = newCode.join("");
    if (fullCode.length === 6) loginWithCode({ code: fullCode });
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0)
      codeInputRefs.current[index - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    if (pasted.length === 6) loginWithCode({ code: pasted });
    else codeInputRefs.current[pasted.length]?.focus();
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isAwaitingCode ? (
          /* ── Email row ── */
          <motion.div
            key="email-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className={`flex items-center gap-3 px-4 py-[15px] rounded-[14px] border transition-colors cursor-text ${
                isDark
                  ? "bg-[#1A1A1A] border-[#2E2E2E] hover:border-[#3A3A3A]"
                  : "bg-[#F5F5F5] border-[#E0E0E0] hover:border-[#C0C0C0]"
              }`}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Envelope icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <rect x="2" y="4" width="20" height="16" rx="3"
                  stroke={isDark ? "#666666" : "#999999"} strokeWidth="1.5" />
                <path d="M2 7L12 13L22 7"
                  stroke={isDark ? "#666666" : "#999999"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendCode(); }}
                placeholder="your@email.com"
                className={`flex-1 bg-transparent outline-none text-[14px] ${
                  isDark
                    ? "text-white placeholder-[#555555]"
                    : "text-[#1F1F1F] placeholder-[#AAAAAA]"
                }`}
                aria-label="Email address"
              />

              <button
                onClick={handleSendCode}
                disabled={!email.trim() || state.status === "sending-code"}
                className={`text-[13px] font-semibold flex-shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? "text-[#AAAAAA] hover:text-white" : "text-[#777777] hover:text-[#1F1F1F]"
                }`}
              >
                {state.status === "sending-code" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── OTP row ── */
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-4 rounded-[14px] border ${
              isDark ? "bg-[#1A1A1A] border-[#2E2E2E]" : "bg-[#F5F5F5] border-[#E0E0E0]"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[13px] ${isDark ? "text-[#888888]" : "text-[#777777]"}`}>
                Code sent to <span className={isDark ? "text-white" : "text-[#1F1F1F]"}>{email}</span>
              </p>
              <button
                onClick={() => { setCode(["", "", "", "", "", ""]); setError(""); window.location.reload(); }}
                className="text-[12px] font-medium text-[#703AE6] hover:text-[#8D61EB] cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className={`w-11 h-12 text-center text-[18px] font-semibold rounded-xl outline-none transition-all ${
                    isDark
                      ? "bg-[#242424] border border-[#333333] text-white focus:border-[#703AE6]"
                      : "bg-white border border-[#DFDFDF] text-[#1F1F1F] focus:border-[#703AE6]"
                  }`}
                  style={{ fontFamily: "monospace" }}
                  aria-label={`Code digit ${i + 1}`}
                />
              ))}
            </div>

            {(state as { status: string }).status === "submitting-code" && (
              <div className="flex justify-center items-center gap-2 mt-3">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#703AE6] border-t-transparent animate-spin" />
                <span className={`text-[12px] ${isDark ? "text-[#777777]" : "text-[#949494]"}`}>
                  Verifying...
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-[12px] text-[#FC5457] font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
