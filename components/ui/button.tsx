"use client";

import { motion } from "framer-motion";

interface Button {
  text: string;
  size: "small" | "medium" | "large";
  type: "solid" | "gradient" | "ghost";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  icon?: Element;
  ariaLabel?: string;
  customBgColor?: string; // Optional custom background color for solid type
}

export const Button = (props: Button) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={props.ariaLabel || props.text}
      className={`w-full h-fit ${
        props.size == "medium"
          ? "py-[16px] px-[12px] text-[16px] rounded-[12px]"
          : props.size == "large"
          ? "rounded-[16px] text-[20px] py-[20px] px-[16px]"
          : "text-[12px] py-[12px] px-[24px]"
      } disabled:cursor-not-allowed transition cursor-pointer rounded-[8px] font-semibold ${
        props.type == "solid"
          ? props.customBgColor
            ? `bg-[${props.customBgColor}] disabled:bg-[#A7A7A7] text-white`
            : "bg-[#703AE6] disabled:bg-[#A7A7A7] hover:bg-[#6635D1] active:bg-[#6635D1] text-white"
          : props.type == "gradient"
          ? props.disabled
            ? "bg-[#A7A7A7] text-white"
            : "bg-gradient text-white hover:bg-gradient active:bg-gradient"
          : " disabled:text-[#A7A7A7] text-black hover:bg-[#F1EBFD] hover:text-[#703AE6] active:bg-[#F1EBFD] active:text-[#703AE6] focus:text-[#703AE6]"
      }`}
    >
      {props.text}
    </motion.button>
  );
};
