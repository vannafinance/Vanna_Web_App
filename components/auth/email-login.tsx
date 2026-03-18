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
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: () => {
      onSuccess();
    },
    onError: (err) => {
      setError(typeof err === "string" ? err : "Login failed. Please try again.");
    },
  });

  const isAwaitingCode = state.status === "awaiting-code-input";

  // Auto-focus first OTP input when code view appears
  useEffect(() => {
    if (isAwaitingCode) {
      codeInputRefs.current[0]?.focus();
    }
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

    // Auto-advance to next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      loginWithCode({ code: fullCode });
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === 6) {
      loginWithCode({ code: pasted });
    } else {
      codeInputRefs.current[pasted.length]?.focus();
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isAwaitingCode ? (
          <motion.div
            key="email-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            <label
              className={`text-[12px] font-semibold uppercase tracking-wider ${
                isDark ? "text-[#777777]" : "text-[#949494]"
              }`}
            >
              Email
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendCode();
                }}
                placeholder="you@example.com"
                className={`flex-1 px-4 py-3 rounded-xl text-[14px] outline-none transition-all ${
                  isDark
                    ? "bg-[#1C1C1C] border border-[#2A2A2A] text-white placeholder-[#595959] focus:border-[#703AE6]"
                    : "bg-[#F7F7F7] border border-[#DFDFDF] text-[#1F1F1F] placeholder-[#A9A9A9] focus:border-[#703AE6]"
                }`}
                aria-label="Email address"
              />
              <button
                onClick={handleSendCode}
                disabled={
                  !email.trim() || state.status === "sending-code"
                }
                className="px-5 py-3 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #FC5457 10%, #703AE6 80%)",
                }}
              >
                {state.status === "sending-code" ? (
                  <Spinner />
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="code-input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <label
                className={`text-[12px] font-semibold uppercase tracking-wider ${
                  isDark ? "text-[#777777]" : "text-[#949494]"
                }`}
              >
                Verification Code
              </label>
              <button
                onClick={() => {
                  setCode(["", "", "", "", "", ""]);
                  setError("");
                  window.location.reload();
                }}
                className={`text-[12px] font-medium cursor-pointer ${
                  isDark
                    ? "text-[#703AE6] hover:text-[#8D61EB]"
                    : "text-[#703AE6] hover:text-[#5029A3]"
                }`}
              >
                Change email
              </button>
            </div>

            <p
              className={`text-[13px] mt-1.5 mb-4 ${
                isDark ? "text-[#777777]" : "text-[#949494]"
              }`}
            >
              Sent to{" "}
              <span className={isDark ? "text-white" : "text-[#1F1F1F]"}>
                {email}
              </span>
            </p>

            {/* OTP Code Boxes */}
            <div
              className="flex gap-2 justify-center"
              onPaste={handleCodePaste}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    codeInputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-[20px] font-semibold rounded-xl outline-none transition-all ${
                    isDark
                      ? "bg-[#1C1C1C] border border-[#2A2A2A] text-white focus:border-[#703AE6] focus:bg-[#1A1530]"
                      : "bg-[#F7F7F7] border border-[#DFDFDF] text-[#1F1F1F] focus:border-[#703AE6] focus:bg-[#F1EBFD]"
                  }`}
                  style={{ fontFamily: "monospace" }}
                  aria-label={`Code digit ${i + 1}`}
                />
              ))}
            </div>

            {(state as { status: string }).status === "submitting-code" && (
              <div className="flex justify-center mt-4">
                <Spinner />
                <span
                  className={`ml-2 text-[13px] ${
                    isDark ? "text-[#777777]" : "text-[#949494]"
                  }`}
                >
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
          className="mt-3 text-[12px] text-[#FC5457] font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

function Spinner() {
  return (
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
  );
}
