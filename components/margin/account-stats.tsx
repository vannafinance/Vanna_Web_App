"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface AccountStatItem {
  id: string;
  name: string;
  icon: string;
}

interface AccountStatsProps {
  items: readonly AccountStatItem[];
  values: Record<string, string | number | null | undefined>;
}

export const AccountStats = ({
  items,
  values,
}: AccountStatsProps) => {
  // Use grid-rows-1 if 3 or fewer items, otherwise grid-rows-2
  const gridRows = items.length <= 3 ? "grid-rows-1" : "grid-rows-2";
  
  return (
    <div className={`border-[1px] border-[#E2E2E2] bg-[#F7F7F7] rounded-[24px] w-full h-full grid grid-cols-3 ${gridRows} gap-x-[20px] gap-y-[0] place-items-center`}>
      {/* Map through account stats items */}
      {items.map((item, idx) => {
        const displayValue = values[item.id] ?? "-";
        
        return (
          <motion.article
            className="px-[20px]  flex flex-col justify-center   w-full h-[160.5px] rounded-[10px]  col-span-1 row-span-1 "
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
            <div className="w-full h-fit flex items-start gap-[16px] ">
              <motion.div
                className=" w-[52px] h-[52px] flex flex-col justify-center items-center p-[2.89px] bg-white rounded-[69.33px] flex-shrink-0"
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
              <div className=" flex flex-col gap-[32px] w-full ">
                <div className="flex flex-col justify-center  w-[289.33px]  text-[20px]  font-semibold">
                  {item.name}
                </div>
                <motion.div
                  className="text-[32px] font-bold text-neutral-600"
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
