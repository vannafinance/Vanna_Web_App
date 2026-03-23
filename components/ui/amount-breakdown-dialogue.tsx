import { iconPaths } from "@/lib/constants";
import Image from "next/image";
import { Button } from "./button";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";

interface AmountBreakdownDialogueProps {
  heading: string;
  asset: string;
  totalDeposit: number;
  breakdown: {
    name: string;
    value: number;
  }[];
  onClose?: () => void;
}

// Format balance values cleanly — no scientific notation, sensible decimal places
function formatBalance(value: number, asset: string): string {
  if (value === 0) return "0";
  const isStable = asset === "USDC" || asset === "USDT" || asset === "DAI";
  if (isStable) {
    return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  }
  // For ETH and others: show up to 8 significant decimals
  if (Math.abs(value) < 0.000001) {
    return "< 0.000001";
  }
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export const AmountBreakdownDialogue = (
  props: AmountBreakdownDialogueProps
) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      className={`flex flex-col gap-[16px] w-[420px] rounded-[24px] p-[24px] relative ${
        isDark ? "bg-[#0A0A0A] border border-[#1E1E1E]" : "bg-white"
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        boxShadow: isDark
          ? "0 24px 80px rgba(112, 58, 230, 0.12), 0 8px 24px rgba(0,0,0,0.4)"
          : "0 24px 80px rgba(112, 58, 230, 0.08), 0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      <motion.div
        className={`text-[18px] font-semibold text-center ${
          isDark ? "text-white" : ""
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {props.heading}
      </motion.div>

      <motion.div
        className={`flex justify-between items-center px-[4px] ${
          isDark ? "text-white" : ""
        }`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="text-[14px] font-medium flex gap-[6px] items-center">
          {iconPaths[props.asset] && (
            <Image
              src={iconPaths[props.asset]}
              alt={props.asset}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          {props.asset}
        </div>
        <div className="text-[14px] font-semibold">
          {formatBalance(props.totalDeposit, props.asset)} {props.asset}
        </div>
      </motion.div>

      <div className="flex flex-col gap-[4px]">
        <motion.div
          className={`rounded-[10px] py-[10px] px-[12px] text-[12px] font-medium ${
            isDark
              ? "bg-[#111111] text-[#666]"
              : "bg-[#F6F6F6] text-[#999]"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Across {props.breakdown.length} chain{props.breakdown.length !== 1 ? "s" : ""}
        </motion.div>
        {props.breakdown.map((item, idx) => {
          return (
            <motion.div
              key={idx}
              className={`flex justify-between items-center py-[14px] px-[12px] rounded-[10px] ${
                isDark ? "bg-[#141414] text-white" : "bg-[#FBFBFB]"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
              whileHover={{
                backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0"
              }}
            >
              <div className="flex gap-[8px] items-center text-[13px] font-medium">
                {iconPaths[item.name.toUpperCase()] || iconPaths[item.name] ? (
                  <Image
                    className="rounded-full"
                    src={iconPaths[item.name.toUpperCase()] || iconPaths[item.name]}
                    alt={item.name}
                    width={22}
                    height={22}
                  />
                ) : (
                  <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isDark ? "bg-[#222] text-[#888]" : "bg-[#E5E5E5] text-[#666]"
                  }`}>
                    {item.name.charAt(0)}
                  </div>
                )}
                {item.name}
              </div>
              <div className={`text-[13px] font-medium ${
                isDark ? "text-[#AAA]" : "text-[#555]"
              }`}>
                {formatBalance(item.value, props.asset)} {props.asset}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.4 + props.breakdown.length * 0.05,
        }}
      >
        <Button
          type="ghost"
          text="Close"
          size="large"
          onClick={props.onClose || (() => {})}
          disabled={false}
        />
      </motion.div>
    </motion.div>
  );
};
