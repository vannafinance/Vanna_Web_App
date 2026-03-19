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
  gridCols?: string;
  gridRows?: string;
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
    <>
      {/* Mobile: horizontal scroll cards */}
      <div className="sm:hidden w-full overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-3 w-max py-1">
          {items.map((item, idx) => {
            const displayValue = values[item.id] ?? "-";
            return (
              <motion.article
                key={item.id}
                className={`flex-shrink-0 w-[160px] rounded-[16px] p-4 border-[1px] ${
                  isDark ? `bg-[${darkBackgroundColor}]` : `bg-[${backgroundColor}]`
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <div className={`w-[32px] h-[32px] flex items-center justify-center rounded-full mb-3 ${
                  isDark ? "bg-black" : "bg-white"
                }`}>
                  <Image width={18} height={18} alt={item.id} src={item.icon} />
                </div>
                <p className={`text-[11px] font-medium mb-1 ${
                  isDark ? "text-[#919191]" : "text-[#919191]"
                }`}>
                  {item.name}
                </p>
                <p className={`text-[20px] font-bold leading-tight ${
                  isDark ? "text-white" : "text-neutral-800"
                }`}>
                  {displayValue}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet: grid layout */}
      <div className={`hidden sm:grid border-[1px] rounded-[24px] w-full h-auto ${gridCols} ${calculatedGridRows} gap-x-[20px] gap-y-0 place-items-center ${
        isDark
          ? `bg-[${darkBackgroundColor}]`
          : `bg-[${backgroundColor}]`
      }`}>
        {items.map((item, idx) => {
          const displayValue = values[item.id] ?? "-";
          return (
            <motion.article
              className="px-[20px] flex flex-col justify-center w-full h-[160.5px] rounded-[10px] col-span-1 row-span-1"
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
            >
              <div className="w-full h-fit flex flex-row items-center gap-[16px]">
                <motion.div
                  className={`w-[52px] h-[52px] flex flex-col justify-center items-center p-[2.89px] rounded-full flex-shrink-0 ${
                    isDark ? "bg-black" : "bg-white"
                  }`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                >
                  <Image width={23.11} height={23.11} alt={item.id} src={item.icon} />
                </motion.div>
                <div className="flex flex-col gap-[32px] w-full">
                  <div className={`w-full text-[20px] font-medium ${isDark ? "text-white" : ""}`}>
                    {item.name}
                  </div>
                  <motion.div
                    className={`text-[32px] font-bold ${isDark ? "text-white" : "text-neutral-600"}`}
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
    </>
  );
};
