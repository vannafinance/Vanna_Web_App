"use client";

import { networkOptions } from "@/lib/web3Constants";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export const NetworkDropdown = () => {
  // Dropdown visibility state
  const [isHover, setIsHover] = useState(false);

  // Selected network state
  const [selectedNetwork, setSelectedNetwork] = useState<typeof networkOptions[0] >(networkOptions[0])

  // Handler for mouse enter
  const handleMouseEnter = () => {
    setIsHover(true);
  };

  // Handler for mouse leave
  const handleMouseLeave = () => {
    setIsHover(false);
  };

  // Handler for network select
  const handleNetworkSelect = (item: typeof networkOptions[0]) => {
    return () => {
      setSelectedNetwork(item);
    };
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block "
    >
      {/* Dropdown trigger button */}
      <button
        type="button"
        className="bg-[#F5F5F5] rounded-[8px] py-[12px] pr-[12px] pl-[20px] font-semibold text-[14px] cursor-pointer flex gap-2 justify-center items-center"
        aria-label={`Selected network: ${selectedNetwork.name}. Click to change network`}
        aria-expanded={isHover}
        aria-haspopup="listbox"
      >
        Network <Image src={selectedNetwork.icon} alt={selectedNetwork.id} width={20} height={20}/>

        {/* Dropdown arrow icon */}
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

      {/* Dropdown menu */}
      <AnimatePresence>
        {isHover && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className=" absolute left-0 z-50 bg-white p-2 top-full mt-2 shadow-lg rounded-[6px]"
            style={{ width: 'max-content', minWidth: '100%' }}
            role="listbox"
            aria-label="Network selection"
          >
            {/* Map through network options */}
            {networkOptions.map((item, idx) => {
              return (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  className=" flex gap-[10px] items-center font-medium rounded-[6px] text-[14px] cursor-pointer p-[12px] hover:bg-[#F2EBFE] w-full text-left"
                  key={item.id}
                  role="option"
                  aria-selected={selectedNetwork.id === item.id}
                  onClick={handleNetworkSelect(item)}
                  aria-label={`Select ${item.name} network`}
                >
                  <Image src={item.icon} width={20} height={20} alt="" aria-hidden="true"/>
                  {item.name}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
