import { Position } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { AnimatedTabs } from "../ui/animated-tabs";
import { useState, useMemo, useRef, useEffect } from "react";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { TABLE_ROW_HEADINGS, COIN_ICONS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";
import { InfoCircleIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

interface PositionstableProps {
  onRepayClick?: () => void;
  onOpenPositionClick?: () => void;
}

const ITEMS_PER_PAGE = 3;

export const Positionstable = ({ onRepayClick, onOpenPositionClick }: PositionstableProps) => {
  const { isDark } = useTheme();
  const positions = useCollateralBorrowStore((state) => state.position);
  const [activeTab, setActiveTab] = useState<string>("currentPositions");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter positions based on active tab
  const filteredPositions = useMemo(() => {
    if (activeTab === "currentPositions") {
      return positions.filter((pos: Position) => pos.isOpen === true);
    } else {
      return positions.filter((pos: Position) => pos.isOpen === false);
    }
  }, [positions, activeTab]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPositions: Position[] = filteredPositions.slice(startIndex, endIndex);

  // Reset to page 1 when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, activeTab]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };


  return (
    <section className="w-full flex flex-col gap-[16px]">
      {/* Table title */}
      <motion.h2
        className={`text-[24px] font-bold ${isDark ? "text-white" : ""}`}
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        Positions
      </motion.h2>

      <nav className="w-fit h-fit">
        <AnimatedTabs type="solid" tabs={[{id:"currentPositions",label:"Current Positions"},{id:"positionsHistory",label:"Positions History"}]} activeTab={activeTab} onTabChange={handleTabChange}/>
      </nav>

      {hasMarginAccount && filteredPositions.length > 0 ? <section className="rounded-[12px] w-full ">
        {/* Table headers */}
        <ul className="flex " role="row">
          {TABLE_ROW_HEADINGS.map((item, idx) => {
            return (
              <motion.li
                className={`w-full pt-[11.25px] px-[12px] pb-[12px] font-medium text-[14px] ${
                  isDark ? "text-[#999999]" : "text-[#464545]"
                }`}
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
        <section 
          ref={scrollContainerRef}
          className="flex flex-col gap-[10px] max-h-[400px] overflow-y-auto pr-[4px] thin-scrollbar"
        >
          {paginatedPositions.map((item, idx) => {
            return (
              <motion.article
                key={item.positionId}
                className={`flex border-[1px] rounded-[12px] w-full ${
                  isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
                }`}
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
                        COIN_ICONS[
                          item.collateral.asset as keyof typeof COIN_ICONS
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
                    <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                      ${item.collateral.amount}{" "}
                      {item.collateral.asset.split("0x")}
                    </div>
                    <div className={`text-[12px] font-medium ${isDark ? "text-white" : ""}`}>
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
                              COIN_ICONS[
                                borrowedItem.assetData
                                  .asset as keyof typeof COIN_ICONS
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
                          <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                            ${borrowedItem.assetData.amount}{" "}
                            {borrowedItem.assetData.asset.split("0x")}
                          </div>
                          <div className={`text-[12px] font-medium ${isDark ? "text-white" : ""}`}>
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
                  className={`flex flex-col justify-center w-full py-[20px] px-[12px] text-[14px] font-medium ${
                    isDark ? "text-white" : ""
                  }`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.4 }}
                >
                  {item.leverage}x
                </motion.div>

                {/* Interest accrued column */}
                <motion.div
                  className={`w-full flex gap-[4px] items-center text-[14px] font-medium py-[20px] px-[12px] ${
                    isDark ? "text-white" : ""
                  }`}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.1 + 0.45 }}
                >
                  {/* Info icon (if position is open) */}
                  {item.isOpen && (
                    <InfoCircleIcon 
                      width={14} 
                      height={14} 
                      fill={isDark ? "#FFFFFF" : "black"} 
                      className="flex-shrink-0"
                    />
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
              </motion.article>
            );
          })}
        </section>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-[16px] py-[16px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-[40px] h-[40px] transition-colors ${
                currentPage === 1
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer hover:opacity-70"
              } ${isDark ? "text-white" : "text-[#111111]"}`}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>

            <span className="px-[24px] py-[8px] rounded-full bg-[#F1EBFD] text-[#703AE6] text-[14px] font-semibold">
              {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-[40px] h-[40px] transition-colors ${
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-30"
                  : "cursor-pointer hover:opacity-70"
              } ${isDark ? "text-white" : "text-[#111111]"}`}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
          </motion.div>
        )}
      </section>:<section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center ${
        isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
      }`}>
        <div className="w-fit h-fit">
          {activeTab === "currentPositions" ? (
            <Button size="small" type="ghost" text="Open Position" onClick={onOpenPositionClick} disabled={false}/>
          ) : (
            <p className={`text-[14px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>No positions history available</p>
          )}
        </div>
        
        </section>}
    </section>
  );
};
