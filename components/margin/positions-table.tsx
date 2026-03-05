/**
 * Positions Table - Shows REAL onchain position data
 *
 * WHAT CHANGED (from hardcoded -> live data):
 * - OLD: useCollateralBorrowStore((state) => state.position) -> hardcoded POSITION constant
 * - NEW: usePositionsData() hook -> reads from blockchain via RPC
 *
 * DATA FLOW:
 * 1. usePositionsData() calls Registry.accountsOwnedBy(userAddress)
 * 2. For each account: Account.getAssets() + ERC20.balanceOf() -> collateral
 * 3. For each account: Account.getBorrows() + VToken.getBorrowBalance() -> borrows
 * 4. Prices from /api/prices -> USD values
 * 5. Leverage + interest calculated from the above
 *
 * TABS:
 * - "Current Positions" = positions where isOpen === true (has borrows)
 * - "Positions History" = positions where isOpen === false (no borrows / fully repaid)
 *   NOTE: History tab currently only shows positions with collateral still deposited.
 *         Full history requires The Graph indexer (Phase 2).
 */

import { Position } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";
import { usePositionsData } from "@/lib/hooks/usePositionsData";
import { usePositionHistory } from "@/lib/hooks/usePositionHistory";
import { AnimatedTabs } from "../ui/animated-tabs";
import { useState, useMemo, useRef, useEffect } from "react";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { TABLE_ROW_HEADINGS, HISTORY_TABLE_HEADINGS, COIN_ICONS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";

interface PositionstableProps {
  onRepayClick?: () => void;
  onOpenPositionClick?: () => void;
}

const ITEMS_PER_PAGE = 3;

// Helper: get icon for a token symbol, with fallback
const getTokenIcon = (symbol: string): string => {
  return COIN_ICONS[symbol] || COIN_ICONS[symbol.replace("0x", "")] || "/icons/eth-icon.png";
};

// Helper: format token display name (strip "0x" prefix if present, show WETH as ETH)
const formatTokenName = (symbol: string): string => {
  if (symbol === "WETH") return "ETH";
  if (symbol.startsWith("0x")) return symbol.split("0x")[1] || symbol;
  return symbol;
};

export const Positionstable = ({ onRepayClick, onOpenPositionClick }: PositionstableProps) => {
  const { isDark } = useTheme();

  // =====================================================
  // KEY CHANGE: Using real blockchain data instead of store
  // OLD: const positions = useCollateralBorrowStore((state) => state.position);
  // NEW: usePositionsData() fetches from chain
  // =====================================================
  const { positions, isLoading, error, refetch } = usePositionsData();
  const { history, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = usePositionHistory();

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

  // =====================================================
  // LOADING STATE - shown while fetching from blockchain
  // =====================================================
  const renderLoading = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[12px] ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <div className="w-[24px] h-[24px] border-2 border-[#703AE6] border-t-transparent rounded-full animate-spin" />
      <p className={`text-[14px] font-medium ${
        isDark ? "text-[#919191]" : "text-[#76737B]"
      }`}>Loading positions from chain...</p>
    </section>
  );

  // =====================================================
  // ERROR STATE - shown if RPC calls fail
  // =====================================================
  const renderError = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[12px] ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <p className={`text-[14px] font-medium text-red-500`}>
        Failed to load positions
      </p>
      <p className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
        {error}
      </p>
      <Button size="small" type="ghost" text="Retry" onClick={refetch} disabled={false}/>
    </section>
  );

  // =====================================================
  // EMPTY STATE - no positions found
  // =====================================================
  const renderEmpty = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center ${
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
    </section>
  );

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

      {/* Show history tab */}
      {activeTab === "positionsHistory" ? (
        historyLoading ? renderLoading() :
        historyError ? (
          <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[12px] ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}>
            <p className="text-[14px] font-medium text-red-500">Failed to load history</p>
            <p className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>{historyError}</p>
            <Button size="small" type="ghost" text="Retry" onClick={refetchHistory} disabled={false}/>
          </section>
        ) :
        history.length > 0 ? (
          <section className="rounded-[12px] w-full">
            {/* History table headers */}
            <ul className="flex" role="row">
              {HISTORY_TABLE_HEADINGS.map((item, idx) => (
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
              ))}
            </ul>

            {/* History table rows */}
            <section className="flex flex-col gap-[10px] max-h-[400px] overflow-y-auto pr-[4px] thin-scrollbar">
              {history.map((item, idx) => (
                <motion.article
                  key={`${item.txHash}-${idx}`}
                  className={`flex border-[1px] rounded-[12px] w-full ${
                    isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                >
                  {/* Date */}
                  <div className={`w-full flex flex-col justify-center py-[16px] px-[12px] ${isDark ? "text-white" : ""}`}>
                    <div className="text-[14px] font-medium">{item.date}</div>
                    <div className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>{item.time}</div>
                  </div>

                  {/* Type */}
                  <div className="w-full flex items-center py-[16px] px-[12px]">
                    <span className={`px-[10px] py-[4px] rounded-[6px] text-[13px] font-medium ${
                      item.type === "Borrow"
                        ? "bg-[#FFF0F0] text-[#E53935]"
                        : "bg-[#E8F5E9] text-[#2E7D32]"
                    }`}>
                      {item.type}
                    </span>
                  </div>

                  {/* Token */}
                  <div className="w-full flex gap-[8px] items-center py-[16px] px-[12px]">
                    <Image
                      src={getTokenIcon(item.tokenSymbol)}
                      alt={item.tokenSymbol}
                      width={20}
                      height={20}
                      className="rounded-[10px] flex-shrink-0"
                    />
                    <span className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                      {item.tokenSymbol === "WETH" ? "ETH" : item.tokenSymbol}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className={`w-full flex flex-col justify-center py-[16px] px-[12px] ${isDark ? "text-white" : ""}`}>
                    <div className="text-[14px] font-medium">{item.amount}</div>
                    <div className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>${item.amountUsd}</div>
                  </div>

                  {/* Tx Hash */}
                  <div className="w-full flex items-center py-[16px] px-[12px]">
                    <a
                      href={`https://basescan.org/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-medium text-[#703AE6] hover:underline"
                    >
                      {item.txHash.slice(0, 6)}...{item.txHash.slice(-4)}
                    </a>
                  </div>
                </motion.article>
              ))}
            </section>
          </section>
        ) : (
          <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}>
            <p className={`text-[14px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
              No borrow/repay history found
            </p>
          </section>
        )
      ) :
      /* Show loading spinner while fetching */
      isLoading ? renderLoading() :
       /* Show error with retry */
       error ? renderError() :
       /* Show positions table or empty state */
       hasMarginAccount && filteredPositions.length > 0 ? (
        <section className="rounded-[12px] w-full ">
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
                        src={getTokenIcon(item.collateral.asset)}
                        alt={item.collateral.asset}
                        width={20}
                        height={20}
                        className="rounded-[10px] flex-shrink-0"
                      />
                    </motion.div>

                    <motion.div
                      className="flex flex-col gap-[2px]"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.1 + 0.15 }}
                    >
                      <div className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                        {item.collateral.amount}{" "}
                        {formatTokenName(item.collateral.asset)}
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
                              src={getTokenIcon(borrowedItem.assetData.asset)}
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
                              {borrowedItem.assetData.amount}{" "}
                              {formatTokenName(borrowedItem.assetData.asset)}
                            </div>
                            <div className={`text-[12px] font-medium ${isDark ? "text-white" : ""}`}>
                              ${borrowedItem.usdValue}
                            </div>
                          </motion.div>
                          {borrowedItem.percentage > 0 && (
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
                    {/* Show "No borrows" for positions with no borrowed assets */}
                    {item.borrowed.length === 0 && (
                      <div className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
                        No active borrows
                      </div>
                    )}
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
                    {item.leverage > 0 ? `${item.leverage}x` : "-"}
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
                          fill={isDark ? "#FFFFFF" : "black"}
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
                        disabled={item.borrowed.length === 0}
                        text={item.borrowed.length > 0 ? "Repay" : "No Borrows"}
                        onClick={item.borrowed.length > 0 && onRepayClick ? onRepayClick : undefined}
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 9L4.5 6L7.5 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 9L7.5 6L4.5 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </motion.div>
          )}
        </section>
      ) : renderEmpty()}
    </section>
  );
};
