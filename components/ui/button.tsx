"use client"

import {motion} from "framer-motion"

interface Button {
  text: string;
  size: "small" | "medium" | "large";
  type: "solid" | "gradient" | "ghost";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled: boolean;
  icon?: Element;
}

export const Button = (props: Button) => {
  return (
    <motion.button
      whileTap={{ scale: 0.1 }}
      disabled={props.disabled}
      onClick={props.onClick}
      className={`w-full ${
        props.size == "medium"
          ? "text-md py-2 px-10"
          : props.size == "large"
          ? "rounded-[16px] text-[20px] py-[20px] px-[16px]"
          : "text-sm py-2 px-8"
      } disabled:cursor-not-allowed transition  cursor-pointer rounded-[8px] font-medium ${
        props.type == "solid"
          ? "bg-[#703AE6] disabled:bg-[#A7A7A7]  hover:bg-[#6635D1] active:bg-[#6635D1] text-white"
          : props.type == "gradient"
          ? " disabled:bg-[#A7A7A7] bg-gradient-to-r from-[#FC5457] to-[#703AE6]  text-white hover:bg-[#703AE6] active:bg-[#703AE6]"
          : " disabled:text-[#A7A7A7] text-black hover:text-[#703AE6] focus:text-[#703AE6]"
      }`}
    >
      {props.text}
    </motion.button>
  );
};
