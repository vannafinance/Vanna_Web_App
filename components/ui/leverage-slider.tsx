"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { LightningIcon } from "@/components/icons";

interface LeverageSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  markers?: number[];
}

export const LeverageSlider = ({
  min = 0,
  max = 10,
  step = 0.1,
  value,
  onChange,
  markers = [0,  2, 4, 6, 8, 10],
}: LeverageSliderProps) => {
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  // Generate all dividers from min to max (all integers)
  const allDividers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const newPercentage = Math.max(
      0,
      Math.min(100, (offsetX / rect.width) * 100)
    );
    const newValue = (newPercentage / 100) * (max - min) + min;
    const steppedValue = Math.round(newValue / step) * step;

    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <motion.div
      className="w-full py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Slider Track Container */}
      <div className="relative pt-2 z-0" ref={sliderRef}>
        {/* Tooltip */}
        

        {/* Track Background */}
        <motion.div
          className={`relative h-1 rounded-full cursor-pointer overflow-visible ${
            isDark ? "bg-[#333333]" : "bg-[#F4F4F4]"
          }`}
          onMouseDown={handleMouseDown}
        >
          {/* Progress Fill */}
          <motion.div
            className="absolute h-full bg-gradient rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: isDragging ? 0 : 0.3, ease: "easeOut" }}
            style={{
              boxShadow: isDragging
                ? "0 0 20px rgba(112, 58, 230, 0.5)"
                : "0 0 10px rgba(112, 58, 230, 0.3)",
            }}
          />

          {/* Dividers on track - all integers from min to max */}
          {allDividers.map((divider, index) => {
            const dividerPercentage = ((divider - min) / (max - min)) * 100;
            const isPassed = percentage >= dividerPercentage;
            return (
              <motion.div
                key={divider}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full"
                style={{
                  left: `${dividerPercentage}%`,
                  width: isPassed ? "3px" : "2px",
                  height: isPassed ? "12px" : "8px",
                  backgroundColor: isPassed
                    ? "rgba(255, 255, 255, 0.95)"
                    : isDark ? "#333333" : "rgba(196, 181, 253, 0.4)",
                  border: isPassed
                    ? "none"
                    : isDark ? "none" : "1px solid rgba(196, 181, 253, 0.6)",
                  boxShadow: isPassed
                    ? "0 0 4px rgba(255, 255, 255, 0.5)"
                    : "0 1px 2px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
              />
            );
          })}

          {/* Slider Thumb with Lightning Icon */}
          <div
            className="absolute cursor-grab active:cursor-grabbing z-10"
            style={{
              left: `${percentage}%`,
              top: "50%",
              transform: "translateX(-50%) translateY(calc(-50% + 0.5px))",
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              whileTap={{ scale: 0.95 }}
              style={{
                filter: isDragging
                  ? "drop-shadow(0 0 15px rgba(112, 58, 230, 0.8))"
                  : "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))",
              }}
            >
              <LightningIcon />
            </motion.div>
          </div>
        </motion.div>

        {/* Marker Labels */}
        <div className="relative mt-6">
          {markers.map((marker, index) => {
            const markerPercentage = ((marker - min) / (max - min)) * 100;
            const isActive = Math.abs(value - marker) < 0.5;
            const isFirst = index === 0;
            const isLast = index === markers.length - 1;
            
            return (
              <motion.div
                key={marker}
                className={`absolute text-xs font-medium ${
                  isFirst ? "left-0" : isLast ? "right-0" : "transform -translate-x-1/2"
                }`}
                style={
                  isFirst || isLast
                    ? {}
                    : { left: `${markerPercentage}%` }
                }
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isActive ? 1.2 : 1,
                  color: isActive ? "#703AE6" : isDark ? "#FFFFFF" : "#6B7280",
                  fontWeight: isActive ? 600 : 500,
                }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              >
                {marker}X
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
