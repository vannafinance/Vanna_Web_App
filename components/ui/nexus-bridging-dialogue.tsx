"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpinnerIcon } from "@/components/icons";
import { useTheme } from "@/contexts/theme-context";
import type { NexusStep, NexusFlowStatus } from "@/lib/nexus";
import Image from "next/image";
import { iconPaths } from "@/lib/constants";

// Per-phase estimated seconds (cumulative total ~90s worst case)
const PHASE_DURATIONS = [5, 10, 15, 40, 20]; // prep, approve, sign, bridge, confirm
const TOTAL_ESTIMATE = PHASE_DURATIONS.reduce((a, b) => a + b, 0);

// Map raw SDK step names → phase index
const PHASE_MAP: Record<string, number> = {
  INTENT_ACCEPTED: 0,
  ALLOWANCE_USER_APPROVAL: 1,
  ALLOWANCE_APPROVAL_MINED: 1,
  ALLOWANCE_ALL_DONE: 1,
  INTENT_HASH_SIGNED: 2,
  INTENT_SUBMITTED: 3,
  INTENT_COLLECTION: 3,
  INTENT_COLLECTION_COMPLETE: 3,
  INTENT_FULFILLED: 3,
  TRANSACTION_SENT: 4,
  TRANSACTION_CONFIRMED: 4,
};

const PHASES = [
  "Preparing intent",
  "Approving tokens",
  "Signing transaction",
  "Bridging funds",
  "Confirming",
];

function getCompletedPhases(steps: NexusStep[]): number {
  if (steps.length === 0) return 0;
  let max = -1;
  for (const s of steps) {
    if (s.isDone) {
      const key = s.name.toUpperCase().replace(/\s+/g, "_");
      const p = PHASE_MAP[key];
      if (p !== undefined && p > max) max = p;
    }
  }
  return max + 1;
}

interface NexusBridgingDialogueProps {
  heading: string;
  status: NexusFlowStatus;
  steps: NexusStep[];
  startTime: number | null;
  explorerUrl?: string | null;
  onClose: () => void;
  asset?: string;
  amount?: string;
  sourceChain?: string;
  destChain?: string;
}

export const NexusBridgingDialogue = ({
  heading,
  status,
  steps,
  startTime,
  explorerUrl,
  onClose,
  asset,
  amount,
  sourceChain,
  destChain,
}: NexusBridgingDialogueProps) => {
  const { isDark } = useTheme();
  const [now, setNow] = useState(Date.now());

  const isRunning =
    status === "simulating" || status === "confirming" || status === "executing";

  // Tick every 100ms while running
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [isRunning]);

  const completed = useMemo(() => {
    if (status === "success") return PHASES.length;
    if (steps.length > 0) return getCompletedPhases(steps);
    if (status === "simulating") return 0;
    if (status === "confirming") return 1;
    if (status === "executing") return 2;
    return 0;
  }, [steps, status]);

  // Smart remaining time: estimate based on which phases are left
  const remaining = useMemo(() => {
    if (status === "success") return 0;
    if (!startTime) return TOTAL_ESTIMATE;

    const elapsed = (now - startTime) / 1000;
    // Sum durations of remaining phases
    const estRemaining = PHASE_DURATIONS.slice(completed).reduce((a, b) => a + b, 0);
    // Also consider elapsed time already spent in current phase
    const estCompleted = PHASE_DURATIONS.slice(0, completed).reduce((a, b) => a + b, 0);
    const phaseElapsed = Math.max(0, elapsed - estCompleted);
    const currentPhaseDur = PHASE_DURATIONS[completed] || 20;
    const currentRemaining = Math.max(0, currentPhaseDur - phaseElapsed);

    return Math.max(0, currentRemaining + estRemaining - (PHASE_DURATIONS[completed] || 0));
  }, [completed, startTime, now, status]);

  const progress = PHASES.length > 0 ? completed / PHASES.length : 0;
  const R = 46;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress);

  const fmtTime = (s: number) => {
    if (s <= 0) return "Almost done";
    if (s < 5) return "< 5s";
    if (s < 10) return "< 10s";
    return `~${Math.ceil(s)}s`;
  };

  return (
    <motion.div
      className={`relative overflow-hidden flex flex-col items-center w-[380px] rounded-[20px] ${
        isDark ? "bg-[#0C0C0C] border border-[#1E1E1E]" : "bg-white border border-[#EBEBEB]"
      }`}
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        boxShadow: isDark
          ? "0 24px 64px rgba(112, 58, 230, 0.18), 0 4px 20px rgba(0,0,0,0.5)"
          : "0 24px 64px rgba(112, 58, 230, 0.08), 0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {/* Gradient accent */}
      <div className="w-full h-[3px] bg-gradient" />

      <div className="w-full flex flex-col items-center gap-[20px] px-[28px] py-[24px]">

        {/* Title */}
        <motion.div
          className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        >
          {status === "success" ? "Bridge Complete" : status === "error" ? "Bridge Failed" : heading}
        </motion.div>

        {/* Progress ring */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
        >
          {isRunning && (
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(112,58,230,0.06) 60%, transparent 100%)" }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={R} fill="none" stroke={isDark ? "#1A1A1A" : "#F0F0F0"} strokeWidth="5" />
            <motion.circle
              cx="55" cy="55" r={R} fill="none"
              stroke="url(#rG)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              transform="rotate(-90 55 55)"
            />
            <defs>
              <linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FC5457" />
                <stop offset="100%" stopColor="#703AE6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status === "success" ? (
              <motion.svg
                width="32" height="32" viewBox="0 0 24 24" fill="none"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <motion.path
                  d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                />
              </motion.svg>
            ) : status === "error" ? (
              <span className="text-[#EF4444] text-[24px] font-bold">!</span>
            ) : (
              <>
                <span className={`text-[20px] font-bold tabular-nums ${isDark ? "text-white" : "text-[#111]"}`}>
                  {fmtTime(remaining)}
                </span>
                <span className={`text-[9px] font-medium mt-[1px] ${isDark ? "text-[#555]" : "text-[#BBB]"}`}>
                  remaining
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Amount + chain row */}
        {(amount || destChain) && (
          <motion.div
            className={`w-full flex items-center justify-between py-[10px] px-[14px] rounded-[12px] ${
              isDark ? "bg-[#121212]" : "bg-[#F9F9F9]"
            }`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          >
            {amount && asset && (
              <span className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`}>
                {amount} {asset}
              </span>
            )}
            <div className="flex items-center gap-[6px]">
              {sourceChain && (iconPaths[sourceChain] || iconPaths[sourceChain.toUpperCase()]) && (
                <Image
                  src={iconPaths[sourceChain] || iconPaths[sourceChain.toUpperCase()]}
                  alt={sourceChain} width={18} height={18} className="rounded-full"
                />
              )}
              <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                <path d="M1 4H15M15 4L12 1M15 4L12 7"
                  stroke={isRunning ? "#703AE6" : status === "success" ? "#10B981" : isDark ? "#444" : "#CCC"}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
              {destChain && (iconPaths[destChain] || iconPaths[destChain.toUpperCase()]) && (
                <Image
                  src={iconPaths[destChain] || iconPaths[destChain.toUpperCase()]}
                  alt={destChain} width={18} height={18} className="rounded-full"
                />
              )}
              {destChain && (
                <span className={`text-[12px] font-medium ${isDark ? "text-[#999]" : "text-[#777]"}`}>
                  {destChain}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Steps */}
        <div className="w-full flex flex-col gap-[2px]">
          {PHASES.map((label, idx) => {
            const isDone = idx < completed;
            const isActive = idx === completed && isRunning;
            return (
              <motion.div
                key={idx}
                className={`flex items-center gap-[12px] py-[9px] px-[10px] rounded-[10px] ${
                  isActive ? (isDark ? "bg-[#121212]" : "bg-[#F9F9F9]") : ""
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 + idx * 0.04 }}
              >
                <div className="flex-shrink-0">
                  {isDone ? (
                    <motion.div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #FC5457 10%, #703AE6 90%)" }}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  ) : isActive ? (
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                      style={{
                        border: "2px solid transparent",
                        backgroundImage: `linear-gradient(${isDark ? "#121212" : "#F9F9F9"}, ${isDark ? "#121212" : "#F9F9F9"}), linear-gradient(135deg, #FC5457, #703AE6)`,
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <SpinnerIcon width={10} height={10} stroke={isDark ? "#999" : "#703AE6"} />
                      </motion.div>
                    </div>
                  ) : (
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${isDark ? "bg-[#1A1A1A]" : "bg-[#F0F0F0]"}`}>
                      <div className={`w-[5px] h-[5px] rounded-full ${isDark ? "bg-[#333]" : "bg-[#DDD]"}`} />
                    </div>
                  )}
                </div>
                <span className={`text-[13px] font-medium ${
                  isDone ? (isDark ? "text-[#666]" : "text-[#AAA]")
                  : isActive ? (isDark ? "text-white" : "text-[#111]")
                  : (isDark ? "text-[#333]" : "text-[#CCC]")
                }`}>
                  {label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="w-full flex flex-col items-center gap-[10px]">
          <div className={`flex items-center gap-[5px] ${isDark ? "text-[#444]" : "text-[#BBB]"}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="url(#sG2)" opacity="0.7"/>
              <defs><linearGradient id="sG2" x1="4" y1="2" x2="20" y2="20"><stop offset="0%" stopColor="#FC5457"/><stop offset="100%" stopColor="#703AE6"/></linearGradient></defs>
            </svg>
            <span className="text-[10px] font-medium">Powered by Avail Nexus</span>
          </div>

          {explorerUrl && status === "success" && (
            <motion.a
              href={explorerUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-[10px] rounded-[12px] text-[12px] font-semibold text-center text-[#703AE6] hover:bg-[#F2EBFE] transition-colors cursor-pointer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            >
              View on Explorer
            </motion.a>
          )}

          {(status === "success" || status === "error") && (
            <motion.button
              type="button" onClick={onClose}
              className={`w-full py-[12px] rounded-[12px] text-[13px] font-semibold text-center cursor-pointer transition-colors ${
                status === "success" ? "bg-gradient text-white" : isDark ? "bg-[#1A1A1A] text-white hover:bg-[#222]" : "bg-[#F4F4F4] text-[#111] hover:bg-[#EEE]"
              }`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.98 }}
            >
              {status === "success" ? "Done" : "Close"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
