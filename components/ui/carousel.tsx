"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EducationIcon } from "@/components/icons";

interface Carousel {
  items: {
    icon: string;
    title: string;
    description: string;
  }[];
  autoplayInterval?: number; // in milliseconds, default 5000
}

export const Carousel = (props: Carousel) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayInterval = props.autoplayInterval || 3000;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified autoplay logic
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === props.items.length - 1 ? 0 : prev + 1));
  }, [props.items.length]);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    intervalRef.current = setInterval(nextSlide, autoplayInterval);
  }, [nextSlide, autoplayInterval]);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  const currentItem = props.items[currentIndex];

  return (
    <div 
      className="flex flex-col justify-center items-center shadow-md relative w-full h-auto min-h-[200px] sm:h-[240px] rounded-[24px] bg-[#7B44E1D1] overflow-hidden py-6 sm:py-[24px] px-5 sm:px-[40px]"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      <Image
        width={1280}
        height={240}
        alt="Collateral Loan"
        src={"/assets/background.jpg"}
        className="absolute inset-0 w-full h-full opacity-18 object-cover"
      />
      <div
        className="relative z-10 w-full h-fit flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
        role="region"
        aria-label="Carousel"
        aria-live="polite"
      >
        <div className="w-full sm:w-fit h-fit flex items-center gap-4 sm:gap-[24px]">
          <div className="w-[56px] h-[56px] sm:w-[84px] sm:h-[84px] p-2 sm:p-[12px] bg-[#F4F4F4] rounded-full flex flex-col justify-center items-center flex-shrink-0">
            <EducationIcon />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="text-white font-bold text-[22px] sm:text-[28px] w-full sm:w-[204px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {currentItem.title}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden sm:block h-[84px] border-[1px] rotate-[-90]" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="text-[14px] sm:text-[20px] text-white/90 sm:text-white font-medium sm:font-semibold w-full sm:w-[728px] pb-2 sm:pb-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {currentItem.description}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Carousel indicators */}
      <div
        className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2"
        role="tablist"
        aria-label="Carousel navigation"
      >
        {props.items.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}: ${item.title}`}
            aria-selected={index === currentIndex}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
};
