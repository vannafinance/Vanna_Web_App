"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/contexts/theme-context";

export interface AccountStatItem {
  id: string;
  name: string;
  icon: string;
}

interface AccountStatsProps {
  items: readonly AccountStatItem[];
  values: Record<string, string | number | null | undefined>;
  gridCols?: string; // e.g., "grid-cols-3", "grid-cols-2", etc.
  gridRows?: string; // e.g., "grid-rows-1", "grid-rows-2", "grid-rows-3", etc.
  backgroundColor?: string;
  darkBackgroundColor?: string;
}

export const AccountStats = ({
  items,
  values,
  gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  gridRows,
  backgroundColor = "#F7F7F7",
  darkBackgroundColor = "#222222",
}: AccountStatsProps) => {
  const { isDark } = useTheme();
  const calculatedGridRows = gridRows || "";
  
  return (
    <div className={`border-[1px] rounded-[16px] sm:rounded-[24px] w-full h-auto grid ${gridCols} ${calculatedGridRows} gap-x-[20px] gap-y-0 place-items-center p-3 sm:p-0 ${
      isDark
        ? darkBackgroundColor ? `bg-[${darkBackgroundColor}]` : "bg-[#222222]"
        : backgroundColor ? `bg-[${backgroundColor}]` : "bg-[#F7F7F7]"
    }`}>
      {items.map((item, idx) => {
        const displayValue = values[item.id] ?? "-";
        
        return (
          <motion.article
            className="px-3 sm:px-[20px] flex flex-col justify-start w-full h-auto py-4 sm:h-[160.5px] sm:py-0 sm:justify-center rounded-[10px] col-span-1 row-span-1"
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.4,
              delay: idx * 0.1,
              ease: "easeOut",
            }}
          >
            <div className="w-full h-fit flex flex-row items-center gap-3 sm:gap-[16px]">
              <motion.div
                className={`w-[40px] h-[40px] sm:w-[52px] sm:h-[52px] flex flex-col justify-center items-center p-[2.89px] rounded-full flex-shrink-0 ${
                  isDark ? "bg-black" : "bg-white"
                }`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.3,
                  delay: idx * 0.1 + 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <Image
                  width={23.11}
                  height={23.11}
                  alt={item.id}
                  src={item.icon}
                />
              </motion.div>
              <div className="flex flex-col gap-2 sm:gap-[32px] w-full">
                <div className={`w-full text-[16px] sm:text-[20px] font-medium ${
                  isDark ? "text-white" : ""
                }`}>
                  {item.name}
                </div>
                <motion.div
                  className={`text-[24px] sm:text-[32px] font-bold ${
                    isDark ? "text-white" : "text-neutral-600"
                  }`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 + 0.3 }}
                >
                  {displayValue}
                </motion.div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
};
