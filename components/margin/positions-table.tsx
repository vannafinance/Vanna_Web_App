import { Position } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";

const tableRowHeadings = [
  "Collateral Deposited",
  "Borrowed Assets",
  "Leverage Taken",
  "Interest accrued till date",
  "Action",
];
const coinIcons = {
  "0xETH": "/icons/eth-icon.png",
  "0xUSDC": "/icons/usdc-icon.svg",
  "0xUSDT": "/icons/usdt-icon.svg",
};

interface PositionstableProps {
  onRepayClick?: () => void;
}

export const Positionstable = ({ onRepayClick }: PositionstableProps) => {
  const positions = useCollateralBorrowStore((state) => state.position);
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Table title */}
      <motion.div
        className="text-[24px] font-bold"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        Positions
      </motion.div>

      <div className="rounded-[12px] w-full">
        {/* Table headers */}
        <ul className="flex ">
          {tableRowHeadings.map((item, idx) => {
            return (
              <motion.li
                className="  w-full pt-[11.25px] px-[12px] pb-[12px] text-[#464545] font-medium text-[14px]"
                key={item}
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                {item}
              </motion.li>
            );
          })}
        </ul>

        {/* Table rows */}
        <div className="flex flex-col gap-[10px]">
          {positions.map((item, idx) => {
            return (
              <motion.div
                key={item.positionId}
                className="flex  border-[1px] border-[#E2E2E2] bg-[#F7F7F7] rounded-[12px] w-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.1,
                  ease: "easeOut",
                }}
              >
                {/* Collateral column */}
                <div className="w-full flex gap-[8px] py-[20px] px-[12px] items-center">
                  {/* Collateral icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.3,
                      delay: idx * 0.1 + 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Image
                      src={
                        coinIcons[
                          item.collateral.asset as keyof typeof coinIcons
                        ]
                      }
                      alt={item.collateral.asset}
                      width={20}
                      height={20}
                      className="rounded-[10px] flex-shrink-0"
                    />
                  </motion.div>

                  {/* Collateral amount and USD value */}
                  <motion.div
                    className="flex flex-col gap-[2px]"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.1 + 0.15 }}
                  >
                    <div className="text-[14px] font-medium">
                      ${item.collateral.amount}{" "}
                      {item.collateral.asset.split("0x")}
                    </div>
                    <div className="text-[12px] font-medium">
                      ${item.collateralUsdValue}
                    </div>
                  </motion.div>
                </div>

                {/* Borrowed assets column */}
                <div className="w-full flex flex-col gap-[15px] py-[20px] px-[12px]">
                  {item.borrowed.map((borrowedItem, borrowedIdx) => {
                    return (
                      <motion.div
                        key={borrowedIdx}
                        className="flex gap-[8px] items-center"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: idx * 0.1 + borrowedIdx * 0.05 + 0.2,
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.2,
                            delay: idx * 0.1 + borrowedIdx * 0.05 + 0.25,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <Image
                            src={
                              coinIcons[
                                borrowedItem.assetData
                                  .asset as keyof typeof coinIcons
                              ]
                            }
                            alt={borrowedItem.assetData.asset}
                            width={20}
                            height={20}
                            className="rounded-[10px] flex-shrink-0"
                          />
                        </motion.div>

                        <motion.div
                          className="flex flex-col gap-[2px]"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.3,
                            delay: idx * 0.1 + borrowedIdx * 0.05 + 0.3,
                          }}
                        >
                          <div className="text-[14px] font-medium">
                            ${borrowedItem.assetData.amount}{" "}
                            {borrowedItem.assetData.asset.split("0x")}
                          </div>
                          <div className="text-[12px] font-medium">
                            ${borrowedItem.usdValue}
                          </div>
                        </motion.div>
                        {borrowedItem.percentage && (
                          <motion.div
                            className="flex justify-end"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.3,
                              delay: idx * 0.1 + borrowedIdx * 0.05 + 0.35,
                            }}
                          >
                            <div className="w-full h-fit bg-[#F1EBFD] rounded-[4px] py-[2px] px-[8px] text-[10px] font-medium">
                              {borrowedItem.percentage}%
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Leverage column */}
                <motion.div
                  className="flex flex-col justify-center w-full py-[20px] px-[12px] text-[14px] font-medium"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.4 }}
                >
                  {item.leverage}x
                </motion.div>

                {/* Interest accrued column */}
                <motion.div
                  className="w-full  flex gap-[4px] items-center text-[14px] font-medium py-[20px] px-[12px] "
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.45 }}
                >
                  {/* Info icon (if position is open) */}
                  {item.isOpen && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                    >
                      <path
                        d="M6 3.33333H7.33333V4.66667H6V3.33333ZM6 6H7.33333V10H6V6ZM6.66667 0C2.98667 0 0 2.98667 0 6.66667C0 10.3467 2.98667 13.3333 6.66667 13.3333C10.3467 13.3333 13.3333 10.3467 13.3333 6.66667C13.3333 2.98667 10.3467 0 6.66667 0ZM6.66667 12C3.72667 12 1.33333 9.60667 1.33333 6.66667C1.33333 3.72667 3.72667 1.33333 6.66667 1.33333C9.60667 1.33333 12 3.72667 12 6.66667C12 9.60667 9.60667 12 6.66667 12Z"
                        fill="black"
                      />
                    </svg>
                  )}
                  {item.interestAccrued} USD
                </motion.div>

                {/* Action column */}
                <motion.div
                  className="flex flex-col justify-center w-full  py-[20px] px-[12px]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.5 }}
                >
                  <div className="w-fit">
                    <Button
                      size="small"
                      type="gradient"
                      disabled={item.isOpen ? false : true}
                      text={item.isOpen ? "Repay" : "Repaid"}
                      onClick={item.isOpen && onRepayClick ? onRepayClick : undefined}
                    />
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
