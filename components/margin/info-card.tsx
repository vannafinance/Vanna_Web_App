"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FIELD_FORMAT_MAP, LARGE_FORMAT_FIELDS } from "@/lib/constants/margin";
import { formatValue, FormatType } from "@/lib/utils/format-value";
import { useTheme } from "@/contexts/theme-context";
import { ArrowDownIcon } from "@/components/icons";

interface InfoItem {
  id: string;
  name: string;
}

interface ExpandableSection {
  title: string;
  headingBold?: boolean;
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

// Format value using the format helper - defined outside component
const formatFieldValue = (
  id: string,
  value: number | null | undefined
): string => {
  const formatType = FIELD_FORMAT_MAP[id] as FormatType | undefined;
  
  if (!formatType) {
    // Fallback to default number formatting
    return formatValue(value, { type: "number" });
  }

  // Determine if large format should be used
  const useLargeFormat = LARGE_FORMAT_FIELDS.includes(id as any);

  return formatValue(value, {
    type: formatType,
    useLargeFormat,
  });
};

export const InfoCard = ({
  data,
  items,
  expandableSections = [],
  showExpandable = false,
}: InfoProps) => {
  const { isDark } = useTheme();
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
      className={`flex justify-between ${isDark ? "text-white" : ""}`}
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
      <div className="text-[13px] sm:text-[14px] font-medium">{item.name}</div>
      <div className="text-[13px] sm:text-[14px] font-medium flex-shrink-0">
        {formatFieldValue(item.id, data[item.id])}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Main info items */}
      {items && items.length > 0 && (
        <motion.article
          className={`flex flex-col gap-4 sm:gap-[24px] w-full h-full p-3 sm:p-[24px] border-[1px] rounded-[16px] ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {items.map((item, idx) => renderItem(item, idx))}
        </motion.article>
      )}

      {/* Expandable sections */}
      {showExpandable &&
        expandableSections.map((section, sectionIdx) => (
          <motion.article
            key={section.title}
            className={`flex flex-col gap-4 sm:gap-[24px] w-full h-full p-3 sm:p-[24px] border-[1px] rounded-[16px] ${
              isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
            }`}
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
              className={`items-center cursor-pointer flex justify-between text-[16px] ${section.headingBold ? "font-bold" : "font-medium"} w-full ${
                isDark ? "text-white" : ""
              }`}
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
              <motion.div
                animate={{ rotate: expandedStates[section.title] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowDownIcon fill={isDark ? "#FFFFFF" : "black"} />
              </motion.div>
            </motion.button>

            {/* Expandable content */}
            <AnimatePresence>
              {expandedStates[section.title] && (
                <motion.section
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
                </motion.section>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
    </>
  );
};
