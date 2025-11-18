"use client";

import { DropdownOptionsType } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface Dropdown {
  items: {
    id: string;
    name: string;
    icon: string;
  }[];
  setSelectedOption: React.Dispatch<React.SetStateAction<DropdownOptionsType>>;
  selectedOption: DropdownOptionsType;
}

export const Dropdown = (props: Dropdown) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block "
    >
      <div className="rounded-[8px]   font-medium text-[15.5px] cursor-pointer flex gap-2 justify-center items-center">
        <Image
          src={props.selectedOption.icon}
          width={20}
          height={20}
          alt={props.selectedOption.id}
        />{" "}
        {props.selectedOption.name}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
          animate={{ rotate: isHover ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </motion.svg>
      </div>
      <AnimatePresence>
        {isHover && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 bg-white  p-2 top-8 -left-4  shadow-lg rounded-[6px]"
          >
            {props.items.map((item, idx) => {
              return (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex gap-[10px] font-medium rounded-[6px]  text-sm cursor-pointer py-2 px-8  hover:bg-[#F2EBFE]"
                  key={idx}
                  onClick={() => {
                    props.setSelectedOption(item);
                  }}
                >
                  <Image
                    src={item.icon}
                    width={20}
                    height={20}
                    alt={item.name}
                  />
                  {item.name}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
