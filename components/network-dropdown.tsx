"use client";

import { networkOptions } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export const NetworkDropdown = () => {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block "
    >
      <div className="bg-[#F5F5F5] rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-medium text-lg cursor-pointer flex gap-2 justify-center items-center">
        Network: 

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
            className="absolute p-2 top-15  shadow-lg rounded-[6px]"
          >
            {networkOptions.map((item, idx) => {
              return (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex gap-[10px] font-medium rounded-[6px]  text-sm cursor-pointer py-2 px-8  hover:bg-[#F2EBFE]"
                  key={idx}
                  onClick={() => {
                  }}
                >
                  <Image src={item.icon} width={20} height={20} alt={item.name}/>
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
