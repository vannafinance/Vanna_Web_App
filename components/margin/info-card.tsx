"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface InfoItem {
  id: string;
  name: string;
}

interface ExpandableSection {
  title: string;
  items?: InfoItem[];
  defaultExpanded?: boolean;
  delay?: number;
}

interface InfoProps {
  data: {
    [key: string]: number | null | undefined;
  };
  items?: InfoItem[];
  expandableSections?: ExpandableSection[];
  showExpandable?: boolean;
}

export const InfoCard = ({
  data,
  items,
  expandableSections = [],
  showExpandable = false,
}: InfoProps) => {
  // Track expanded state for each section
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    expandableSections.reduce(
      (acc, section) => ({
        ...acc,
        [section.title]: section.defaultExpanded ?? false,
      }),
      {}
    )
  );

  const toggleExpanded = (title: string) => {
    setExpandedStates((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Render a single info item
  const renderItem = (item: InfoItem, idx: number, useAnimate = false) => (
    <motion.div
      key={item.id}
      className="flex justify-between"
      initial={{ opacity: 0, x: -10 }}
      {...(useAnimate
        ? {
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.3, delay: idx * 0.05 },
          }
        : {
            whileInView: { opacity: 1, x: 0 },
            viewport: { once: true },
            transition: { duration: 0.3, delay: idx * 0.05 },
          })}
    >
      <div className="text-[14px] font-medium">{item.name}</div>
      <div className="text-[14px] font-medium">
        {formatValue(item.id, data[item.id])}
      </div>
    </motion.div>
  );

  // Format value with appropriate unit based on field ID
  const formatValue = (
    id: string,
    value: number | null | undefined
  ): string => {
    const numValue = value ?? 0;

    // Helper: Format number with decimals
    const formatNumber = (num: number, decimals = 2) =>
      num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    // Helper: Format large numbers (K/M)
    const formatLarge = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
      return formatNumber(num);
    };

    // Format config: [decimals, suffix, useLargeFormat]
    const formatConfig: Record<string, [number, string, boolean]> = {
      totalBorrowedValue: [2, " USD", true],
      totalCollateralValue: [2, " USD", true],
      totalValue: [0, " WBTC", false],
      avgHealthFactor: [1, "", false],
      timeToLiquidation: [0, "m", false],
      borrowRate: [2, "%", false],
      liquidationPremium: [2, "%", false],
      liquidationFee: [2, "%", false],
      debtLimit: [2, " USDC", true],
      minDebt: [2, " USDC", true],
      maxDebt: [2, " USDC", true],
      platformPoints: [1, "x", false],
      leverage: [1, "x", false],
      depositAmount: [2, "", false],
      fees: [2, "", false],
      totalDeposit: [2, "", false],
      updatedCollateral: [2, "", false],
      netHealthFactor: [2, "", false],
    };

    const config = formatConfig[id];
    if (!config) return formatNumber(numValue);

    const [decimals, suffix, useLarge] = config;
    const formatted = useLarge
      ? formatLarge(numValue)
      : formatNumber(numValue, decimals);

    return `${formatted}${suffix}`;
  };

  return (
    <>
      {/* Main info items */}
      {items && items.length > 0 && (
        <motion.div
          className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {items.map((item, idx) => renderItem(item, idx))}
        </motion.div>
      )}

      {/* Expandable sections */}
      {showExpandable &&
        expandableSections.map((section, sectionIdx) => (
          <motion.div
            key={section.title}
            className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              delay: section.delay || (sectionIdx + 1) * 0.1,
              ease: "easeOut",
            }}
          >
            {/* Section header with toggle */}
            <motion.button
              type="button"
              onClick={() => {
                toggleExpanded(section.title);
              }}
              className="items-center cursor-pointer flex justify-between text-[16px] font-bold w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-expanded={expandedStates[section.title]}
              aria-controls={`section-${section.title}`}
              aria-label={`${
                expandedStates[section.title] ? "Collapse" : "Expand"
              } ${section.title} section`}
            >
              {section.title}
              {/* Expand/collapse arrow */}
              <motion.svg
                width="13"
                height="8"
                viewBox="0 0 13 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                animate={{ rotate: expandedStates[section.title] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d="M11.91 8.38201e-05L12.97 1.06108L7.193 6.84008C7.10043 6.93324 6.99036 7.00717 6.8691 7.05761C6.74785 7.10806 6.61783 7.13403 6.4865 7.13403C6.35517 7.13403 6.22514 7.10806 6.10389 7.05761C5.98264 7.00717 5.87257 6.93324 5.78 6.84008L0 1.06108L1.06 0.00108375L6.485 5.42508L11.91 8.38201e-05Z"
                  fill="black"
                />
              </motion.svg>
            </motion.button>

            {/* Expandable content */}
            <AnimatePresence>
              {expandedStates[section.title] && (
                <motion.div
                  id={`section-${section.title}`}
                  className="flex flex-col gap-[24px]"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  role="region"
                  aria-labelledby={`section-header-${section.title}`}
                >
                  {section.items?.map((item, idx) => renderItem(item, idx, true))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
    </>
  );
};
