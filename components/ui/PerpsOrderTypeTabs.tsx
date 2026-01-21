"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import classNames from "classnames";
import { PerpsOrderType } from "@/lib/types";

const BASE_TABS = [
  { label: "Limit", value: "limit" },
  { label: "Market", value: "market" },
] as const;

const ADVANCED_TABS = [
  { label: "Trigger", value: "trigger" },
  { label: "Trailing entry", value: "trailing-entry" },
  { label: "Scaled order", value: "scaled-order" },
  { label: "Iceberg", value: "iceberg" },
  { label: "TWAP", value: "twap" },
] as const;

type Props = {
  value: PerpsOrderType;
  onChange: (v: PerpsOrderType) => void;
};

export default function PerpsOrderTypeTabs({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const [lastAdvanced, setLastAdvanced] = useState<
    (typeof ADVANCED_TABS)[number]
  >(ADVANCED_TABS[0]);

  const isBaseTab = BASE_TABS.some((t) => t.value === value);

  // Update dropdown position when open
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Helper to get text color (matching animated-tabs underline type)
  const getTextColor = (isActive: boolean, isHovered: boolean) => {
    if (isActive) return "#703AE6";
    if (isHovered) return "#000000";
    return "#A7A7A7";
  };

  // Handle mouse enter on dropdown trigger (arrow)
  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  // Handle mouse leave on dropdown trigger (arrow)
  const handleMouseLeave = () => {
    // Delay closing to allow mouse to move to dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  // Handle mouse enter on dropdown menu
  const handleDropdownMouseEnter = () => {
    // Clear timeout when mouse enters dropdown
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Handle mouse leave on dropdown menu
  const handleDropdownMouseLeave = () => {
    setOpen(false);
  };

  return (
    <div
      className="relative w-full flex items-center border-b border-[#E2E2E2]"
      onMouseLeave={() => setHoveredTab(null)}
    >
      {/* Limit / Market */}
      {BASE_TABS.map((tab) => {
        const isActive = value === tab.value;
        const isHovered = hoveredTab === tab.value;
        return (
          <motion.div
            key={tab.value}
            onClick={() => onChange(tab.value)}
            onMouseEnter={() => setHoveredTab(tab.value)}
            className="flex-1 h-full py-2.5 text-[14px] font-semibold flex items-center justify-center cursor-pointer relative"
            animate={{
              color: getTextColor(isActive, isHovered),
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#703AE6] translate-y-[1px]" />
            )}
          </motion.div>
        );
      })}

      {/* 3rd Dynamic Tab */}
      <motion.div
        className="flex-1 py-2 text-[14px] font-semibold flex items-center justify-center cursor-pointer relative"
        onMouseEnter={() => setHoveredTab("advanced")}
        animate={{
          color: getTextColor(!isBaseTab, hoveredTab === "advanced"),
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {!isBaseTab && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#703AE6] translate-y-px" />
        )}
        <div className="flex items-center gap-1 relative">
          {/* Tab label */}
          <div
            className="whitespace-nowrap"
            onClick={() => onChange(lastAdvanced.value)}
          >
            {lastAdvanced.label}
          </div>

          {/* Arrow */}
          <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5 cursor-pointer"
              animate={{
                rotate: open ? 180 : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </motion.svg>
          </div>

          {open &&
            createPortal(
              <div
                className="fixed rounded-lg bg-white border border-[#E2E2E2] shadow-lg w-auto"
                style={{
                  top: dropdownPos.top,
                  right: dropdownPos.right,
                  zIndex: 9999,
                }}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                {ADVANCED_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setLastAdvanced(tab);
                      onChange(tab.value);
                      setOpen(false);
                    }}
                    className={classNames(
                      "block px-4 py-2 text-left text-[12px] text-[#111111] hover:bg-[#F6F6F6] whitespace-nowrap cursor-pointer w-full",
                      lastAdvanced.value === tab.value && "font-medium",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>
      </motion.div>
    </div>
  );
}
