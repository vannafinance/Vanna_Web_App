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
}

export const Button = (props: Button) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={props.ariaLabel || props.text}
      className={`w-full ${
        props.size == "medium"
          ? "py-[16px] px-[12px] text-[16px] rounded-[12px]"
          : props.size == "large"
          ? "rounded-[16px] text-[20px] py-[20px] px-[16px]"
          : "text-[12px] py-[12px] px-[8px] rounded-[8px]"
      } disabled:cursor-not-allowed transition  cursor-pointer rounded-[8px] font-semibold ${
        props.type == "solid"
          ? "bg-[#703AE6] disabled:bg-[#A7A7A7]  hover:bg-[#6635D1] active:bg-[#6635D1] text-white"
          : props.type == "gradient"
          ? props.disabled
            ? "bg-[#A7A7A7] text-white"
            : "bg-gradient-to-r from-[#FC5457] to-[#703AE6] text-white hover:from-[#703AE6] hover:to-[#703AE6] active:from-[#703AE6] active:to-[#703AE6]"
          : " disabled:text-[#A7A7A7] text-black hover:text-[#703AE6] focus:text-[#703AE6]"
      }`}
    >
      {props.text}
    </motion.button>
  );
};
