"use client";

import { iconPaths } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface Dropdown {
  items: string[];
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
  selectedOption: string;
}

export const Dropdown = (props: Dropdown) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block z-50"
    >
      <button
        type="button"
        className="rounded-[8px] font-medium text-[15.5px] cursor-pointer flex gap-2 justify-center items-center"
        aria-label={`Selected: ${props.selectedOption}. Click to change option`}
        aria-expanded={isHover}
        aria-haspopup="listbox"
      >
        {iconPaths[props.selectedOption] && (
          <Image
            src={iconPaths[props.selectedOption]}
            width={20}
            height={20}
            alt={props.selectedOption}
            aria-hidden="true"
          />
        )}{" "}
        {props.selectedOption}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
          aria-hidden="true"
          animate={{ rotate: isHover ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </motion.svg>
      </button>
      <AnimatePresence>
        {isHover && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute z-50 bg-white p-2 top-8 -left-4 shadow-lg rounded-[6px] ${
              props.items.length > 4 ? "max-h-48 overflow-y-auto" : ""
            }`}
            role="listbox"
            aria-label="Options"
          >
            {props.items.map((item, idx) => {
              return (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  className="flex gap-[10px] font-medium rounded-[6px]  text-sm cursor-pointer py-2 px-8  hover:bg-[#F2EBFE] w-full text-left"
                  key={item}
                  role="option"
                  aria-selected={props.selectedOption === item}
                  onClick={() => {
                    props.setSelectedOption(item);
                  }}
                  aria-label={`Select ${item}`}
                >
                  {iconPaths[item] && (
                    <Image
                      src={iconPaths[item]}
                      width={20}
                      height={20}
                      alt={item}
                      aria-hidden="true"
                    />
                  )}
                  {item}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
