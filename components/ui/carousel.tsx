"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const autoplayInterval = props.autoplayInterval || 5000;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === props.items.length - 1 ? 0 : prevIndex + 1
      );
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [props.items.length, autoplayInterval]);

  const currentItem = props.items[currentIndex];

  return (
    <div className="flex flex-col justify-center items-center shadow-md relative w-full h-[240px] rounded-[24px] bg-[#7B44E1D1] overflow-hidden py-[24px] px-[40px]">
      <Image
        width={1280}
        height={240}
        alt="Collateral Loan"
        src={"/assets/background.jpg"}
        className="absolute inset-0 w-full h-full opacity-18 object-cover"
      />
      <div
        className="relative z-10 w-full  h-fit  flex  justify-between items-center"
        role="region"
        aria-label="Carousel"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <div className="w-fit h-fit flex gap-[24px]">
            <div className="w-[84px] h-[84px] p-[12px] bg-[#F4F4F4] rounded-full flex flex-col justify-center items-center">
              <svg
                width="44"
                height="37"
                viewBox="0 0 44 37"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 0L0 12.3333L8 16.8144V29.1478L22 37L36 29.1478V16.8144L40 14.5739V28.7778H44V12.3333L22 0ZM35.64 12.3333L22 19.98L8.36 12.3333L22 4.68667L35.64 12.3333ZM32 26.7222L22 32.3133L12 26.7222V19.055L22 24.6667L32 19.055V26.7222Z"
                  fill="#E63ABB"
                />
              </svg>
            </div>

            <div className="text-white font-bold text-[28px] w-[204px] h-[70px]">
              {currentItem.title}
            </div>
          </div>

          <div className="h-[84px] border-[1px]  border-[#E2E2E2] rotate-[-90]" />
          <div className="text-[20px] text-white font-semibold w-[728px]">
            {currentItem.description}
          </div>
        </AnimatePresence>
      </div>
      {/* Carousel indicators */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2"
        role="tablist"
        aria-label="Carousel navigation"
      >
        {props.items.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
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
