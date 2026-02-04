import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "./button";

type TransactionStatus = "pending" | "success" | "error";

interface TransactionModalProps {
  isOpen: boolean;
  status: TransactionStatus;
  title?: string;
  message?: string;
  txHash?: string;
  onClose?: () => void;
  onRetry?: () => void;
}

export const TransactionModal = ({
  isOpen,
  status,
  title,
  message,
  txHash,
  onClose,
  onRetry,
}: TransactionModalProps) => {
  const { isDark } = useTheme();

  const getStatusConfig = () => {
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
  };

  const config = getStatusConfig();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={status !== "pending" ? onClose : undefined}
      >
        <motion.div
          className={`${config.bgColor} shadow-2xl rounded-[20px] p-[36px] max-w-[480px] w-full mx-4`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            {config.showSpinner ? (
              // Pending Spinner
              <motion.div
                className="relative w-20 h-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <svg
                  className="w-20 h-20"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke={isDark ? "#333333" : "#E5E5E5"}
                    strokeWidth="8"
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
                  />
                </svg>
              </motion.div>
            ) : status === "success" ? (
              // Success Checkmark
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.iconColor}20` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <motion.svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke={config.iconColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.div>
            ) : (
              // Error X
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${config.iconColor}20` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <motion.svg
                  className="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke={config.iconColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </motion.div>
            )}
          </motion.div>

          {/* Title */}
          <motion.h2
            className={`text-[24px] font-bold text-center mb-4 ${
              isDark ? "text-white" : "text-[#333333]"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {config.title}
          </motion.h2>

          {/* Message */}
          {message && (
            <motion.p
              className={`text-[16px] font-medium text-center mb-6 ${
                isDark ? "text-[#919191]" : "text-[#76737B]"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {message}
            </motion.p>
          )}

          {/* Transaction Hash */}
          {txHash && status === "success" && (
            <motion.div
              className={`mb-6 p-4 rounded-[12px] ${
                isDark ? "bg-[#1A1A1A]" : "bg-[#EEEEEE]"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <p
                className={`text-[12px] font-medium mb-2 ${
                  isDark ? "text-[#919191]" : "text-[#76737B]"
                }`}
              >
                Transaction Hash:
              </p>
              <a
                href={`https://arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-mono text-[#703AE6] hover:text-[#5a2eb8] break-all transition-colors"
              >
                {txHash}
              </a>
            </motion.div>
          )}

          {/* Action Buttons */}
          {status !== "pending" && (
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              {status === "error" && onRetry && (
                <Button
                  type="solid"
                  size="medium"
                  text="Try Again"
                  onClick={onRetry}
                />
              )}
              <Button
                type={status === "error" ? "ghost" : "solid"}
                size="medium"
                text="Close"
                onClick={onClose}
              />
            </motion.div>
          )}

          {/* Pending State - No close button */}
          {status === "pending" && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <p
                className={`text-[14px] font-medium ${
                  isDark ? "text-[#919191]" : "text-[#76737B]"
                }`}
              >
                Please wait...
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
