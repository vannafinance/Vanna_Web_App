"use client";

import { motion } from "framer-motion";
import React from "react";

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  size?: "small" | "medium" | "large";
  type?: "solid" | "gradient" | "ghost";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
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
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel || text}
        className={`w-full h-fit transition font-semibold disabled:cursor-not-allowed cursor-pointer
          ${
            size === "medium"
              ? "py-[16px] px-[12px] text-[16px] rounded-[12px]"
              : size === "large"
              ? "py-[20px] px-[16px] text-[20px] rounded-[16px]"
              : "py-[12px] px-[24px] text-[12px] rounded-[8px]"
          }
          ${
            type === "solid"
              ? "bg-[#703AE6] text-white hover:bg-[#6635D1] active:bg-[#6635D1] disabled:bg-[#A7A7A7]"
              : type === "gradient"
              ? disabled
                ? "bg-[#A7A7A7] text-white"
                : "bg-gradient text-white"
              : "text-black hover:bg-[#F1EBFD] hover:text-[#703AE6] active:bg-[#F1EBFD]"
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
