"use client";

import { iconPaths } from "@/lib/constants";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface InfoItem {
  id: string;
  name: string;
}

interface ExpandableSection {
  title: string;
  items: InfoItem[];
  defaultExpanded?: boolean;
  delay?: number;
}

interface InfoProps {
  data: {
    [key: string]: number | null | undefined;
  };
  items: InfoItem[];
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
  const [expandedStates, setExpandedStates] = useState<{
    [key: string]: boolean;
  }>(
    expandableSections.reduce((acc, section, idx) => {
      acc[section.title] = section.defaultExpanded || false;
      return acc;
    }, {} as { [key: string]: boolean })
  );

  const borrowedItems = useCollateralBorrowStore((state) => state.borrowItems);
  const collateralItems = useCollateralBorrowStore((state) => state.collaterals);
  // Toggle section expand/collapse
  const toggleExpanded = (title: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Format value with appropriate unit based on field ID
  const formatValue = (
    id: string,
    value: number | null | undefined
  ): string => {
    // Default to 0 if null/undefined
    const numValue = value === null || value === undefined ? 0 : value;

    // Format number with commas
    const formatNumber = (num: number, decimals: number = 2): string => {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    // Format large numbers (K for thousands, M for millions)
    const formatLargeNumber = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`;
      }
      return formatNumber(num);
    };

    // Format based on field type
    switch (id) {
      case "totalBorrowedValue":
      case "totalCollateralValue":
        return `${formatLargeNumber(numValue)} USD`;

      case "totalValue":
        return `${formatNumber(numValue, 0)} WBTC`;

      case "avgHealthFactor":
        return formatNumber(numValue, 1);

      case "timeToLiquidation":
        return `${numValue}m`;

      case "borrowRate":
      case "liquidationPremium":
      case "liquidationFee":
        return `${formatNumber(numValue, 2)}%`;

      case "debtLimit":
      case "minDebt":
      case "maxDebt":
        return `${formatLargeNumber(numValue)} USDC`;

      default:
        return formatNumber(numValue);
    }
  };

  return (
    <>
      {/* Main info items */}
      <motion.div
        className="bg-[#F7F7F7] flex flex-col gap-[24px] w-full h-full p-[24px] border-[1px] border-[#E2E2E2] rounded-[16px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Map through main items */}
        {items.map((item, idx) => {
          return (
            <motion.div
              key={item.id}
              className="flex justify-between"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <div className="text-[14px] font-medium">{item.name}</div>
              <div className="text-[14px] font-medium flex items-center gap-1">
                {formatValue(item.id, data[item.id])}
                {item.id === "totalBorrowedValue" && borrowedItems.length > 0 && (
                  <div className="w-full h-full flex items-center gap-1">
                    {borrowedItems.map((borrowedItem) => {
                      const assetName = borrowedItem.assetData.asset.split("0x")[1];
                      return (
                        <Image
                          key={borrowedItem.assetData.asset}
                          src={iconPaths[assetName as keyof typeof iconPaths]}
                          alt={`${assetName} icon`}
                          width={20}
                          height={20}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

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
              aria-label={`${expandedStates[section.title] ? 'Collapse' : 'Expand'} ${section.title} section`}
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
                  {/* Map through section items */}
                  {section.items.map((item, idx) => {
                    return (
                      <motion.div
                        key={item.id}
                        className="flex justify-between"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <div className="text-[14px] font-medium">
                          {item.name}
                        </div>
                        <div className="text-[14px] font-medium">
                            {formatValue(item.id, data[item.id])} 
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
    </>
  );
};
