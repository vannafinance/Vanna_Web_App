"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Logarithmic scale helpers
  // Ensure we don't take log of <= 0. For leverage, min is usually 1.
  const safeMin = Math.max(min, 1);

  const toPercentage = (val: number) => {
    if (max <= safeMin) return 0;
    const minLog = Math.log(safeMin);
    const maxLog = Math.log(max);
    const valLog = Math.log(Math.max(val, safeMin));
    return ((valLog - minLog) / (maxLog - minLog)) * 100;
  };

  const toValue = (percent: number) => {
    if (max <= safeMin) return safeMin;
    const minLog = Math.log(safeMin);
    const maxLog = Math.log(max);
    const valLog = (percent / 100) * (maxLog - minLog) + minLog;
    return Math.exp(valLog);
  };

  const percentage = toPercentage(value);

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
    const newValue = toValue(newPercentage);
    
    let steppedValue = Math.round(newValue / step) * step;
    
    // Fix floating point precision
    if (step < 1) {
      const decimals = step.toString().split(".")[1]?.length || 0;
      steppedValue = Number(steppedValue.toFixed(decimals));
    }

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
            const dividerPercentage = toPercentage(divider);
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
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="36" height="36" rx="18" fill="#703AE6" />
                <path
                  d="M18.0876 8.35186C18.6637 7.98242 19.4059 7.9975 19.9665 8.39004L20.3014 8.62456C20.862 9.0171 21.13 9.70936 20.9799 10.3771L19.8387 15.4529L19.8394 15.4534L17.7314 24.8289L25.8204 19.6414L27.665 20.9329C27.8289 21.0477 27.8239 21.292 27.6555 21.4001L17.9124 27.6483C17.3363 28.0177 16.5941 28.0026 16.0335 27.6101L15.6986 27.3756C15.138 26.983 14.8699 26.2908 15.0201 25.6231L16.1613 20.5473L16.1606 20.5468L18.2686 11.1713L10.1795 16.3587L8.33501 15.0672C8.17111 14.9524 8.17608 14.7081 8.3445 14.6001L18.0876 8.35186Z"
                  fill="white"
                />
                <path
                  d="M10.1795 16.3587L12.2013 17.7744L11.5204 20.8028L14.1389 19.1311L16.1606 20.5468L11.7813 23.3552C11.2052 23.7247 10.463 23.7096 9.90239 23.317L9.72144 23.1903C9.16135 22.7981 8.89326 22.1067 9.04258 21.4395L10.1795 16.3587Z"
                  fill="white"
                />
                <path
                  d="M25.8204 19.6414L23.7987 18.2257L24.4796 15.1973L21.8611 16.869L19.8394 15.4534L24.2187 12.6449C24.7948 12.2755 25.537 12.2905 26.0976 12.6831L26.2785 12.8098C26.8386 13.202 27.1067 13.8934 26.9574 14.5606L25.8204 19.6414Z"
                  fill="white"
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Marker Labels */}
        <div className="relative mt-6">
          {markers.map((marker, index) => {
            const markerPercentage = toPercentage(marker);
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
