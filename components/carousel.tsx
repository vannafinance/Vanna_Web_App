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
    <div className="shadow-md relative w-full h-[240px] rounded-[24px] bg-[#7B44E1D1] overflow-hidden py-[24px] px-[40px]">
      <Image
        width={1280}
        height={240}
        alt="Collateral Loan"
        src={"/assets/background.jpg"}
        className="absolute inset-0 w-full h-full opacity-18 object-cover"
      />
      <div className="relative z-10 h-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex justify-between"
          >
            <div className="flex gap-[24px]">
              <Image
                width={84}
                height={84}
                src={currentItem.icon}
                alt="Vanna"
              />
              <div className="text-white font-bold text-[28px] w-[204px] h-[70px]">
                {currentItem.title}
              </div>
            </div>

            <div className="w-px h-[84px] bg-[#E2E2E2]" />
            <div className="text-[20px] text-white font-semibold w-[800px]">
              {currentItem.description}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Carousel indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {props.items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
