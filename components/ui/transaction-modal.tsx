import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "./button";

type TransactionStatus = "pending" | "success" | "error";
type TokenSymbol = "ETH" | "USDC" | "USDT";

interface TransactionModalProps {
  isOpen: boolean;
  status: TransactionStatus;
  title?: string;
  message?: string;
  txHash?: string;
  tokenSymbol?: TokenSymbol;
  onClose?: () => void;
  onRetry?: () => void;
  showFloatingTokens?: boolean;
}

/* ---------------- Token Icons ---------------- */

const TOKEN_ICONS: Record<TokenSymbol, string> = {
  ETH: "/icons/ethereum-eth-logo.svg",
  USDC: "/icons/usdc-icon.svg",
  USDT: "/icons/usdt-icon.svg",
};

const TOKEN_BG: Record<TokenSymbol, string> = {
  ETH: "bg-indigo-500/20 border-indigo-400/60",
  USDC: "bg-sky-500/20 border-sky-400/60",
  USDT: "bg-emerald-500/20 border-emerald-400/60",
};

const TokenIcon = ({ symbol }: { symbol?: TokenSymbol }) => {
  if (!symbol) return null;

  return (
    <img
      src={TOKEN_ICONS[symbol]}
      className="w-8 h-8 object-contain pointer-events-none select-none"
      alt={symbol}
      draggable={false}
    />
  );
};

export const TransactionModal = ({
  isOpen,
  status,
  title,
  message,
  txHash,
  tokenSymbol,
  onClose,
  onRetry,
  showFloatingTokens = false,
}: TransactionModalProps) => {
  const { isDark } = useTheme();

  const config = useMemo(() => {
    switch (status) {
      case "pending":
        return {
          title: title || "Transaction Pending",
          bgColor: isDark ? "bg-[#111111]" : "bg-[#F7F7F7]",
          iconColor: "#703AE6",
          showSpinner: true,
        };
      case "success":
        return {
          title: title || "Transaction Successful",
          bgColor: isDark ? "bg-[#111111]" : "bg-[#F7F7F7]",
          iconColor: "#10B981",
          showSpinner: false,
        };
      case "error":
        return {
          title: title || "Transaction Failed",
          bgColor: isDark ? "bg-[#111111]" : "bg-[#F7F7F7]",
          iconColor: "#EF4444",
          showSpinner: false,
        };
    }
  }, [status, title, isDark]);

  const floatingTokens = useMemo(
    () =>
      [...Array(20)].map(() => ({
        left: Math.random() * 100,
        drift: (Math.random() - 0.5) * 120,
        duration: 3 + Math.random() * 2,
        rotate: (Math.random() - 0.5) * 20,
      })),
    []
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#45454566] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={status !== "pending" ? onClose : undefined}
      >
        <motion.div
          className={`${config.bgColor} shadow-2xl rounded-[20px] p-[36px] max-w-[480px] w-full mx-4 relative overflow-hidden`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Floating Tokens (CRISP SVG animation) */}
          {showFloatingTokens && status === "success" && tokenSymbol && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]">
              {floatingTokens.map((t, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ left: `${t.left}%`, bottom: "-10%" }}
                  initial={{ opacity: 0, y: 0, rotate: -t.rotate }}
                  animate={{
                    opacity: [0, 0.9, 0],
                    y: [-20, -300],
                    x: [0, t.drift],
                    rotate: [-t.rotate, t.rotate, -t.rotate / 2],
                  }}
                  transition={{
                    duration: t.duration,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-xl
  ${TOKEN_BG[tokenSymbol]}`}
                  >
                    <TokenIcon symbol={tokenSymbol} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {config.showSpinner ? (
              <motion.div
                className="relative w-20 h-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke={isDark ? "#333" : "#E5E5E5"}
                    strokeWidth="8"
                    fill="transparent"   // 👈 add this
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke={config.iconColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="160 160"
                    strokeDashoffset="40"
                    fill="transparent"   // 👈 add this
                  />
                </svg>
              </motion.div>
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${config.iconColor}20` }}
              >
                {status === "success" ? "✅" : "❌"}
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold text-center mb-4 ${isDark ? "text-white" : "text-[#333]"}`}>
            {config.title}
          </h2>

          {/* Message */}
          {message && (
            <p className={`text-center mb-6 ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
              {message}
            </p>
          )}

          {/* Tx Hash */}
          {txHash && status === "success" && (
            <div className={`mb-6 p-4 rounded-lg ${isDark ? "bg-[#1A1A1A]" : "bg-[#EEEEEE]"}`}>
              <p className="text-xs mb-2 opacity-70">Transaction Hash</p>
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-purple-500 break-all"
              >
                {txHash}
              </a>
            </div>
          )}

          {/* Buttons */}
          {status !== "pending" && (
            <div className="flex flex-col gap-3">
              {status === "error" && onRetry && (
                <Button type="solid" size="medium" text="Try Again" onClick={onRetry} />
              )}
              <Button
                type={status === "error" ? "ghost" : "solid"}
                size="medium"
                text="Close"
                onClick={onClose}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
