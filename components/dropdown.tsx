"use client";

import { motion, AnimatePresence } from "framer-motion";
import { redirect } from "next/navigation";
import { useState } from "react";

interface Dropdown {
  heading: string;
  items: {
    title: string;
    link: string;
  }[];
}

export const Dropdown = (props: Dropdown) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block "
    >
      <div className="font-medium text-lg cursor-pointer flex gap-2 justify-center items-center">
        {props.heading}

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
            className="p-2 text-center shadow-lg rounded-[6px]"
          >
            {props.items.map((item, idx) => {
              return (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="font-medium rounded-[6px] text-sm cursor-pointer py-2 px-8  hover:bg-[#F2EBFE]"
                  key={idx}
                  onClick={() => {
                    redirect(item.link);
                  }}
                >
                  {item.title}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
