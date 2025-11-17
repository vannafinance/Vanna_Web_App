"use client";

import { Carousel } from "@/components/carousel";
import { NetworkDropdown } from "@/components/network-dropdown";
import { Navbar } from "@/components/navbar";
import { carouselItems } from "@/lib/constants";
import { motion } from "framer-motion";
import { useState } from "react";

type Tabs = "Leverage your Assets" | "Repay Loan"

const Margin = () => {
  const [activeTab,setActiveTab] = useState<Tabs>("Leverage your Assets")
  const [hoveredTab, setHoveredTab] = useState<Tabs | null>(null)
  
  const displayTab = hoveredTab || activeTab
  
  return (
    <div>
      <motion.div
        className="pb-[48px] px-[80px] pt-[80px]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        <Carousel items={carouselItems} autoplayInterval={5000} />
      </motion.div>
      <div className="p-[80px]">
        <div className="flex gap-[20px]">
          <div className="text-[34px] font-semibold">
            Leverage Your Collateral
          </div>
          <div>
            <NetworkDropdown />
          </div>
        </div>
        <div className="rounded-[26px] bg-[#E2E2E2] py-[36px] px-[16px] w-[691px] h-[893px]">
            <div className="bg-white flex p-[6px] rounded-[16px] h-[79px] relative overflow-hidden">
              <motion.div
                className="absolute top-[6px] left-[6px] h-[67px] rounded-[16px] bg-gradient-to-r from-[#FC5457] to-[#703AE6] p-[2px]"
                style={{ width: "calc(50% - 6px)" }}
                initial={false}
                animate={{
                  x: displayTab === "Leverage your Assets" ? 0 : "100%"
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35
                }}
              >
                <div className="bg-white rounded-[14px] h-full w-full" />
              </motion.div>
              
              <motion.div 
                onClick={()=>{setActiveTab("Leverage your Assets")}}
                onMouseEnter={()=>{setHoveredTab("Leverage your Assets")}}
                onMouseLeave={()=>{setHoveredTab(null)}}
                className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Leverage your Assets
              </motion.div>
              
              <motion.div 
                onClick={()=>{setActiveTab("Repay Loan")}}
                onMouseEnter={()=>{setHoveredTab("Repay Loan")}}
                onMouseLeave={()=>{setHoveredTab(null)}}
                className="hover:cursor-pointer text-[20px] font-medium flex flex-col justify-center text-center h-[67px] rounded-[16px] flex-1 relative z-10"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                Repay Loan
              </motion.div>
            </div>
            <div>
              Deposit
            </div>
        </div>
      </div>
    </div>
  );
};

export default Margin;
