/**
 * Positions Table - Shows REAL onchain position data (SPLIT by borrow asset)
 *
 * DATA FLOW:
 * 1. usePositionsData() calls Registry.accountsOwnedBy(userAddress)
 * 2. For each account: Account.getAssets() + ERC20.balanceOf() -> collateral
 * 3. For each account: Account.getBorrows() + VToken.getBorrowBalance() -> borrows
 * 4. RiskEngine.isAccountHealthy() + getBalance() + getBorrows() -> health data
 * 5. Prices from /api/prices -> USD values
 * 6. Each borrow asset = its own row (not aggregated)
 *
 * TABS:
 * - "Current Positions" = positions where isOpen === true
 * - "Positions History" = event log of Borrow/Repay transactions
 */

import { Position } from "@/lib/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";
import { usePositionsData } from "@/lib/hooks/usePositionsData";
import { usePositionHistory, PositionHistoryItem } from "@/lib/hooks/usePositionHistory";
import { useVaultActivityData } from "@/lib/hooks/useVaultActivityData";
import { AnimatedTabs } from "../ui/animated-tabs";
import { useState, useMemo, useRef, useEffect } from "react";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { TABLE_ROW_HEADINGS, HISTORY_TABLE_HEADINGS, COIN_ICONS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";
import { useChainId } from "wagmi";

const EXPLORER_URL: Record<number, string> = {
  8453: "https://basescan.org",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
};

interface PositionstableProps {
  onRepayClick?: () => void;
  onOpenPositionClick?: () => void;
}

const ITEMS_PER_PAGE = 5;

const getTokenIcon = (symbol: string): string => {
  return COIN_ICONS[symbol] || COIN_ICONS[symbol.replace("0x", "")] || "/icons/eth-icon.png";
};

const formatTokenName = (symbol: string): string => {
  if (symbol === "WETH") return "ETH";
  if (symbol.startsWith("0x")) return symbol.split("0x")[1] || symbol;
  return symbol;
};

const getEventTypeStyle = (type: string, isDark: boolean): string => {
  switch (type) {
    case "Borrow":
      return "bg-[#FFF0F0] text-[#E53935]";
    case "Repay":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    case "Account Opened":
      return "bg-[#E3F2FD] text-[#1565C0]";
    case "Vault Deposit":
      return "bg-[#F3E5F5] text-[#7B1FA2]";
    case "Vault Withdraw":
      return "bg-[#FFF3E0] text-[#E65100]";
    default:
      return isDark ? "bg-[#333333] text-[#CCCCCC]" : "bg-[#F0F0F0] text-[#666666]";
  }
};

// Health factor badge color
const getHealthStyle = (hf: number, isHealthy: boolean, isDark: boolean): string => {
  if (!isHealthy) return "bg-[#FFF0F0] text-[#E53935]";
  if (hf >= 2) return "bg-[#E8F5E9] text-[#2E7D32]";
  if (hf >= 1.5) return "bg-[#FFF8E1] text-[#F57F17]";
  if (hf >= 1.1) return "bg-[#FFF3E0] text-[#E65100]";
  return "bg-[#FFF0F0] text-[#E53935]";
};

export const Positionstable = ({ onRepayClick, onOpenPositionClick }: PositionstableProps) => {
  const { isDark } = useTheme();
  const connectedChainId = useChainId();

  const { positions, isLoading, error, refetch } = usePositionsData();
  const { history, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = usePositionHistory();
  const { transactions: vaultTxs } = useVaultActivityData("ETH");

  const [activeTab, setActiveTab] = useState<string>("currentPositions");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredPositions = useMemo(() => {
    if (activeTab === "currentPositions") {
      return positions.filter((pos: Position) => pos.isOpen === true);
    } else {
      return positions.filter((pos: Position) => pos.isOpen === false);
    }
  }, [positions, activeTab]);

  const combinedHistory = useMemo(() => {
    if (history.length > 0) return history;
    if (vaultTxs.length > 0) {
      return vaultTxs.map((tx): PositionHistoryItem => ({
        date: tx.date,
        time: tx.time,
        type: tx.type as any,
        token: "",
        tokenSymbol: tx.asset,
        amount: tx.amount,
        amountUsd: tx.amountUsd,
        account: tx.fullAddress || tx.userAddress,
        owner: tx.fullAddress || tx.userAddress,
        txHash: tx.txHash,
        blockNumber: BigInt(tx.blockNumber || "0"),
      }));
    }
    return [];
  }, [history, vaultTxs]);

  const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPositions: Position[] = filteredPositions.slice(startIndex, endIndex);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, activeTab]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Truncate address for display
  const truncateAddress = (addr: string): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // ── LOADING STATE ──
  const renderLoading = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[12px] ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <div className="w-[24px] h-[24px] border-2 border-[#703AE6] border-t-transparent rounded-full animate-spin" />
      <p className={`text-[14px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
        Loading positions from chain...
      </p>
    </section>
  );

  // ── ERROR STATE ──
  const renderError = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[12px] ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <p className="text-[14px] font-medium text-red-500">Failed to load positions</p>
      <p className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>{error}</p>
      <Button size="small" type="ghost" text="Retry" onClick={refetch} disabled={false}/>
    </section>
  );

  // ── EMPTY STATE ──
  const renderEmpty = () => (
    <section className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center ${
      isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
    }`}>
      <div className="w-fit h-fit">
        {activeTab === "currentPositions" ? (
          <Button size="small" type="ghost" text="Open Position" onClick={onOpenPositionClick} disabled={false}/>
        ) : (
          <p className={`text-[14px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
            No positions history available
          </p>
        )}
      </div>
    </section>
  );

  // ── POSITION CARD (split per borrow) ──
  const renderPositionCard = (item: Position, idx: number) => {
    const borrowItem = item.borrowed[0]; // Each split position has exactly 0 or 1 borrow
    const hasBorrow = item.borrowed.length > 0;
    const explorerBase = EXPLORER_URL[connectedChainId] || "https://basescan.org";

    return (
      <motion.article
        key={`${item.positionId}-${item.accountAddress}`}
        className={`flex border-[1px] rounded-[12px] w-full ${
          isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
        }`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: idx * 0.08, ease: "easeOut" }}
      >
        {/* Collateral column */}
        <div className="w-full flex flex-col gap-[6px] py-[16px] px-[12px]">
          {/* Account address badge */}
          {item.accountAddress && (
            <a
              href={`${explorerBase}/address/${item.accountAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-[10px] font-mono px-[6px] py-[2px] rounded-[4px] w-fit mb-[4px] hover:underline ${
                isDark ? "bg-[#333333] text-[#999999]" : "bg-[#EBEBEB] text-[#888888]"
              }`}
            >
              {truncateAddress(item.accountAddress)}
            </a>
          )}
          {(item.collaterals && item.collaterals.length > 0
            ? item.collaterals
            : [{ assetData: item.collateral, usdValue: item.collateralUsdValue }]
          ).map((coll, collIdx) => (
            <motion.div
              key={collIdx}
              className="flex gap-[8px] items-center"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 + collIdx * 0.05 + 0.1 }}
            >
              <Image
                src={getTokenIcon(coll.assetData.asset)}
                alt={coll.assetData.asset}
                width={20}
                height={20}
                className="rounded-[10px] flex-shrink-0"
              />
              <div className="flex flex-col gap-[1px]">
                <div className={`text-[13px] font-medium leading-tight ${isDark ? "text-white" : ""}`}>
                  {coll.assetData.amount} {formatTokenName(coll.assetData.asset)}
                </div>
                <div className={`text-[11px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
                  ${coll.usdValue}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Borrowed asset column (single borrow per row) */}
        <div className="w-full flex flex-col justify-center gap-[6px] py-[16px] px-[12px]">
          {hasBorrow && borrowItem ? (
            <motion.div
              className="flex gap-[8px] items-center"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.08 + 0.15 }}
            >
              <Image
                src={getTokenIcon(borrowItem.assetData.asset)}
                alt={borrowItem.assetData.asset}
                width={20}
                height={20}
                className="rounded-[10px] flex-shrink-0"
              />
              <div className="flex flex-col gap-[1px]">
                <div className={`text-[13px] font-medium leading-tight ${isDark ? "text-white" : ""}`}>
                  {borrowItem.assetData.amount} {formatTokenName(borrowItem.assetData.asset)}
                </div>
                <div className={`text-[11px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
                  ${borrowItem.usdValue}
                </div>
              </div>
              {borrowItem.percentage > 0 && (
                <div className="h-fit bg-[#F1EBFD] rounded-[4px] py-[1px] px-[6px] text-[10px] font-medium text-[#703AE6]">
                  {borrowItem.percentage}%
                </div>
              )}
            </motion.div>
          ) : (
            <div className={`text-[12px] italic ${isDark ? "text-[#666666]" : "text-[#A0A0A0]"}`}>
              No active borrows
            </div>
          )}
        </div>

        {/* Leverage column */}
        <motion.div
          className={`flex flex-col justify-center w-full py-[16px] px-[12px] text-[14px] font-semibold ${
            isDark ? "text-white" : ""
          }`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: idx * 0.08 + 0.2 }}
        >
          {item.leverage > 0 ? (
            <span className={item.leverage >= 5 ? "text-[#E53935]" : item.leverage >= 3 ? "text-[#F57F17]" : "text-[#2E7D32]"}>
              {item.leverage}x
            </span>
          ) : (
            <span className={isDark ? "text-[#666666]" : "text-[#A0A0A0]"}>-</span>
          )}
        </motion.div>

        {/* Health column */}
        <motion.div
          className="flex flex-col justify-center w-full py-[16px] px-[12px]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: idx * 0.08 + 0.25 }}
        >
          {hasBorrow && item.healthFactor !== undefined && item.healthFactor > 0 ? (
            <div className="flex flex-col gap-[4px]">
              <span className={`inline-flex items-center gap-[4px] px-[8px] py-[3px] rounded-[6px] text-[12px] font-semibold w-fit ${
                getHealthStyle(item.healthFactor, item.isHealthy ?? true, isDark)
              }`}>
                {item.isHealthy ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="currentColor" opacity="0.3"/><circle cx="5" cy="5" r="2" fill="currentColor"/></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L9 9H1L5 1Z" fill="currentColor"/></svg>
                )}
                {item.healthFactor.toFixed(2)}
              </span>
              <span className={`text-[10px] ${isDark ? "text-[#666666]" : "text-[#A0A0A0]"}`}>
                {item.isHealthy ? "Healthy" : "At Risk"}
              </span>
            </div>
          ) : (
            <span className={`text-[12px] ${isDark ? "text-[#666666]" : "text-[#A0A0A0]"}`}>-</span>
          )}
        </motion.div>

        {/* Interest accrued column */}
        <motion.div
          className={`w-full flex items-center gap-[4px] text-[13px] font-medium py-[16px] px-[12px] ${
            isDark ? "text-white" : ""
          }`}
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: idx * 0.08 + 0.3 }}
        >
          {item.interestAccrued > 0 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M6 3.33333H7.33333V4.66667H6V3.33333ZM6 6H7.33333V10H6V6ZM6.66667 0C2.98667 0 0 2.98667 0 6.66667C0 10.3467 2.98667 13.3333 6.66667 13.3333C10.3467 13.3333 13.3333 10.3467 13.3333 6.66667C13.3333 2.98667 10.3467 0 6.66667 0ZM6.66667 12C3.72667 12 1.33333 9.60667 1.33333 6.66667C1.33333 3.72667 3.72667 1.33333 6.66667 1.33333C9.60667 1.33333 12 3.72667 12 6.66667C12 9.60667 9.60667 12 6.66667 12Z" fill={isDark ? "#FFFFFF" : "black"} />
              </svg>
              ${item.interestAccrued}
            </>
          ) : (
            <span className={isDark ? "text-[#666666]" : "text-[#A0A0A0]"}>$0</span>
          )}
        </motion.div>

        {/* Action column */}
        <motion.div
          className="flex flex-col justify-center w-full py-[16px] px-[12px]"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: idx * 0.08 + 0.35 }}
        >
          <div className="w-fit">
            <Button
              size="small"
              type="gradient"
              disabled={!hasBorrow}
              text={hasBorrow ? "Repay" : "No Debt"}
              onClick={hasBorrow && onRepayClick ? onRepayClick : undefined}
            />
          </div>
        </motion.div>
      </motion.article>
    );
  };

  return (
    <section className="w-full flex flex-col gap-[16px]">
      {/* Title with position count */}
      <motion.div
        className="flex items-center gap-[12px]"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h2 className={`text-[24px] font-bold ${isDark ? "text-white" : ""}`}>
          Positions
        </h2>
        {filteredPositions.length > 0 && (
          <span className="px-[10px] py-[3px] rounded-full bg-[#F1EBFD] text-[#703AE6] text-[13px] font-semibold">
            {filteredPositions.length}
          </span>
        )}
      </motion.div>

      <nav className="w-full sm:w-fit h-fit">
        <AnimatedTabs
          type="solid"
          tabs={[
            { id: "currentPositions", label: "Current Positions" },
            { id: "positionsHistory", label: "Positions History" },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </nav>

      {/* ── HISTORY TAB ── */}
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
        combinedHistory.length > 0 ? (
          <section className="rounded-[12px] w-full">
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

            <section className="flex flex-col gap-[10px] max-h-[400px] overflow-y-auto pr-[4px] thin-scrollbar">
              {combinedHistory.map((item, idx) => (
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
                  <div className={`w-full flex flex-col justify-center py-[16px] px-[12px] ${isDark ? "text-white" : ""}`}>
                    <div className="text-[14px] font-medium">{item.date || "-"}</div>
                    <div className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>{item.time || ""}</div>
                  </div>

                  <div className="w-full flex items-center py-[16px] px-[12px]">
                    <span className={`px-[10px] py-[4px] rounded-[6px] text-[13px] font-medium ${getEventTypeStyle(item.type, isDark)}`}>
                      {item.type}
                    </span>
                  </div>

                  <div className="w-full flex gap-[8px] items-center py-[16px] px-[12px]">
                    {item.tokenSymbol && item.tokenSymbol !== "-" && (
                      <Image
                        src={getTokenIcon(item.tokenSymbol)}
                        alt={item.tokenSymbol}
                        width={20}
                        height={20}
                        className="rounded-[10px] flex-shrink-0"
                      />
                    )}
                    <span className={`text-[14px] font-medium ${isDark ? "text-white" : ""}`}>
                      {item.tokenSymbol === "WETH" ? "ETH" : (item.tokenSymbol || "-")}
                    </span>
                  </div>

                  <div className={`w-full flex flex-col justify-center py-[16px] px-[12px] ${isDark ? "text-white" : ""}`}>
                    <div className="text-[14px] font-medium">{item.amount || "-"}</div>
                    <div className={`text-[12px] ${isDark ? "text-[#919191]" : "text-[#76737B]"}`}>
                      {item.amountUsd ? `$${item.amountUsd}` : ""}
                    </div>
                  </div>

                  <div className="w-full flex items-center py-[16px] px-[12px]">
                    <a
                      href={`${EXPLORER_URL[connectedChainId] || "https://basescan.org"}/tx/${item.txHash}`}
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
              No transaction history found
            </p>
            <p className={`text-[12px] mt-[4px] ${isDark ? "text-[#666666]" : "text-[#A0A0A0]"}`}>
              Borrow, repay, or deposit to see activity here
            </p>
          </section>
        )
      ) :
      /* ── CURRENT POSITIONS TAB ── */
      isLoading ? renderLoading() :
      error ? renderError() :
      hasMarginAccount && filteredPositions.length > 0 ? (
        <div className="w-full overflow-x-auto no-scrollbar">
          <section className="rounded-[12px] min-w-[800px]">
            {/* Table headers */}
            <ul className="flex" role="row">
              {TABLE_ROW_HEADINGS.map((item, idx) => (
                <motion.li
                  className={`w-full pt-[11.25px] px-[12px] pb-[12px] font-medium text-[12px] sm:text-[13px] ${
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

            {/* Position rows (each borrow = its own row) */}
            <section
              ref={scrollContainerRef}
              className="flex flex-col gap-[8px] max-h-[520px] overflow-y-auto pr-[4px] thin-scrollbar"
            >
              {paginatedPositions.map((item, idx) => renderPositionCard(item, idx))}
            </section>

            {/* Pagination */}
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 9L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 9L7.5 6L4.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </motion.div>
            )}
          </section>
        </div>
      ) : renderEmpty()}
    </section>
  );
};
