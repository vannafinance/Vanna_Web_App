"use client";

import { networkOptions } from "@/lib/web3Constants";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export const NetworkDropdown = () => {
  const [isHover, setIsHover] = useState(false);
  const [selectedNetwork,setSelectedNetwork] = useState<typeof networkOptions[0] >(networkOptions[0])
  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className="relative inline-block "
    >
      <div className="bg-[#F5F5F5] rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-semibold text-[14px] cursor-pointer flex gap-2 justify-center items-center">
        Network <Image src={selectedNetwork.icon} alt={selectedNetwork.id} width={20} height={20}/>

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
            className="absolute left-0 z-50 bg-white p-2 top-full mt-2 shadow-lg rounded-[6px] w-full"
          >
            {networkOptions.map((item, idx) => {
              return (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex gap-[10px] items-center font-medium rounded-[6px] text-[14px] cursor-pointer py-2 px-4 hover:bg-[#F2EBFE]"
                  key={idx}    
                  onClick={() => {
                    setSelectedNetwork(item)
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
