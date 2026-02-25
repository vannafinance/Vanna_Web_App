"use client";

import { motion } from "framer-motion";
import React from "react";
import { useTheme } from "@/contexts/theme-context";

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  size?: "small" | "medium" | "large";
  type?: "solid" | "gradient" | "ghost" | "navbar";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  width?: string; // Custom width class (e.g., "w-full", "w-[200px]", etc.)
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      text,
      size = "medium",
      type = "solid",
      onClick,
      disabled = false,
      icon,
      ariaLabel,
      width,
    },
    ref
  ) => {
    const { isDark } = useTheme();

    // Ghost button styling based on theme
    const ghostButtonStyle = disabled
      ? "disabled:text-[#A7A7A7]"
      : isDark
      ? "text-white hover:bg-[#333333] hover:text-white active:bg-[#333333] active:text-white focus:text-white"
      : "text-black hover:bg-[#F1EBFD] hover:text-[#703AE6] active:bg-[#F1EBFD] active:text-[#703AE6] focus:text-[#703AE6]";

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel || text}
        className={`${width || "w-full"} h-fit transition font-semibold disabled:cursor-not-allowed cursor-pointer rounded-[8px]
          ${
            size === "medium"
              ? "py-[16px] px-[12px] text-[16px] rounded-[12px]"
              : size === "large"
              ? "py-[20px] px-[16px] text-[20px] rounded-[16px]"
              : type === "navbar"
              ? "text-[12px] py-[12px] px-[24px]"
              : "text-[12px] p-[8px]"
          }
          ${
            type === "solid"
              ? "bg-[#703AE6] text-white hover:bg-[#6635D1] active:bg-[#6635D1] disabled:bg-[#A7A7A7]"
              : type === "gradient" || type === "navbar"
              ? disabled
                ? "bg-[#A7A7A7] text-white"
                : "bg-gradient text-white hover:bg-gradient active:bg-gradient"
              : ghostButtonStyle
          }
        `}
      >
        <span className="flex items-center justify-center gap-2">
          {icon}
          {children ?? text}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
