import { iconPaths } from "@/lib/constants";
import Image from "next/image";
import { Button } from "./button";
import { motion } from "framer-motion";

interface AmountBreakdownDialogueProps {
  heading: string;
  asset: string;
  totalDeposit: number;
  breakdown: {
    name: string;
    value: number;
  }[];
  onClose?: () => void;
}

export const AmountBreakdownDialogue = (
  props: AmountBreakdownDialogueProps
) => {
  return (
    <motion.div
      className="flex flex-col gap-[16px] w-[448px] bg-white rounded-[24px] p-[24px] relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="text-[20px] font-semibold text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {props.heading}
      </motion.div>

      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <motion.div
          className="text-[15.5px] font-medium flex gap-[4px] items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Image
            src={iconPaths[props.asset]}
            alt={props.asset}
            width={20}
            height={20}
          />
          {props.asset}
        </motion.div>
        <motion.div
          className="text-[16px] font-medium"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {props.totalDeposit} {props.asset}
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-[4px]">
        <motion.div
          className="rounded-[12px] bg-[#F6F6F6] py-[12px] px-[12px] text-[14px] font-medium text-[#131313A1]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          Across {props.breakdown.length} Chains
        </motion.div>
        {props.breakdown.map((item, idx) => {
          return (
            <motion.div
              key={item.name}
              className="flex justify-between items-center py-[20px] px-[12px] bg-[#FBFBFB] rounded-[12px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: "#F0F0F0" }}
            >
              <motion.div
                className="w-full flex gap-[4px] items-center text-[12px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + idx * 0.05 }}
              >
                <Image
                  className="rounded-full"
                  src={iconPaths[item.name.toUpperCase()]}
                  alt={item.name}
                  width={24}
                  height={24}
                />
                {item.name}
              </motion.div>
              <motion.div
                className="w-full text-[12px] font-medium flex flex-col justify-center items-start"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
              >
                {item.value} {props.asset}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.4 + props.breakdown.length * 0.05,
        }}
      >
        <Button
          type="ghost"
          text="Close"
          size="large"
          onClick={props.onClose || (() => {})}
          disabled={false}
        />
      </motion.div>
    </motion.div>
  );
};
