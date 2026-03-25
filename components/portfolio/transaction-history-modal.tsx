"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = "Deposit" | "Withdraw" | "Transfer";

interface Transaction {
  dateTime: string;
  amount: string;
  amountUsd: string;
  type: TxType;
  fromAccount: string;
  toAccount: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TRANSACTIONS: Transaction[] = [
  {
    dateTime: "2025-10-23 14:25:46",
    amount: "0.0109 wbtc",
    amountUsd: "$1000",
    type: "Deposit",
    fromAccount: "Wallet Balance",
    toAccount: "Margin Balance",
  },
  {
    dateTime: "2025-10-22 09:14:30",
    amount: "500 USDC",
    amountUsd: "$500",
    type: "Withdraw",
    fromAccount: "Margin Balance",
    toAccount: "Wallet Balance",
  },
  {
    dateTime: "2025-10-21 18:03:12",
    amount: "0.5 ETH",
    amountUsd: "$1800",
    type: "Transfer",
    fromAccount: "Spot Balance",
    toAccount: "Perps Balance",
  },
  {
    dateTime: "2025-10-20 11:55:00",
    amount: "200 USDT",
    amountUsd: "$200",
    type: "Deposit",
    fromAccount: "Wallet Balance",
    toAccount: "Margin Balance",
  },
  {
    dateTime: "2025-10-19 16:40:22",
    amount: "0.022 ETH",
    amountUsd: "$79",
    type: "Withdraw",
    fromAccount: "Margin Balance",
    toAccount: "Wallet Balance",
  },
  {
    dateTime: "2025-10-18 08:12:55",
    amount: "1000 USDC",
    amountUsd: "$1000",
    type: "Transfer",
    fromAccount: "Margin Balance",
    toAccount: "Farm Balance",
  },
];

const TABS = ["All", "Deposit", "Withdraw", "Transfer"] as const;
type Tab = (typeof TABS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal = ({ isOpen, onClose }: Props) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("All");

  if (!isOpen) return null;

  const filteredRows =
    activeTab === "All"
      ? TRANSACTIONS
      : TRANSACTIONS.filter((tx) => tx.type === activeTab);

  const labelClass = `text-[12px] sm:text-[13px] font-medium ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`;
  const valueClass = `text-[12px] sm:text-[13px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-[16px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full sm:max-w-[907px] rounded-t-[20px] sm:rounded-[24px] border-[1px] flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] ${
          isDark ? "bg-[#111111] border-[#333]" : "bg-white border-[#e2e2e2]"
        }`}
        style={{
          boxShadow:
            "0px 7px 15px rgba(0,0,0,0.08), 0px 28px 28px rgba(0,0,0,0.07), 0px 63px 38px rgba(0,0,0,0.04), 0px 113px 45px rgba(0,0,0,0.01)",
        }}
      >
        {/* ── Drag handle (mobile only) ── */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className={`w-10 h-1 rounded-full ${isDark ? "bg-[#444]" : "bg-[#ccc]"}`} />
        </div>

        {/* ── Header ── */}
        <div className="px-4 sm:px-[28px] pt-3 sm:pt-[24px] pb-3 sm:pb-[20px] flex-shrink-0 flex items-center justify-between">
          <h2
            className={`text-[18px] sm:text-[20px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}
          >
            Transaction History
          </h2>
          {/* Close X button (mobile) */}
          <button
            type="button"
            onClick={onClose}
            className={`sm:hidden p-1 rounded-lg ${isDark ? "hover:bg-[#333]" : "hover:bg-[#e2e2e2]"}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke={isDark ? "#fff" : "#111"} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Tab row ── */}
        <div className="px-4 sm:px-[28px] pb-3 sm:pb-[16px] flex-shrink-0">
          <div
            className={`flex items-center rounded-[8px] border-[1px] p-[4px] gap-[4px] w-full sm:w-fit overflow-x-auto ${
              isDark
                ? "bg-[#1a1a1a] border-[#333]"
                : "bg-[#f7f7f7] border-[#e2e2e2]"
            }`}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-[31px] flex-1 sm:flex-none px-[12px] rounded-[6px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#f1ebfd] text-[#703ae6]"
                    : isDark
                      ? "text-white hover:bg-[#333]"
                      : "text-[#111] hover:bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-[28px]">

          {/* Desktop: Column headers (hidden on mobile) */}
          <div className="hidden sm:grid grid-cols-4 px-[20px] py-[12px]">
            {["Date/Time", "Amount", "From Account", "To Account"].map(
              (col) => (
                <div
                  key={col}
                  className={`text-[13px] font-semibold ${
                    isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                  }`}
                >
                  {col}
                </div>
              ),
            )}
          </div>

          {/* Body rows */}
          <div className="flex flex-col gap-[10px] sm:gap-[12px] pb-4">
            {filteredRows.length === 0 ? (
              <div
                className={`py-[32px] text-center text-[13px] font-medium ${
                  isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                }`}
              >
                No transactions found
              </div>
            ) : (
              filteredRows.map((tx, i) => (
                <div key={i}>
                  {/* ── Desktop row (grid) ── */}
                  <div
                    className={`hidden sm:grid grid-cols-4 rounded-[12px] border-[1px] px-[20px] py-[16px] transition ${
                      isDark
                        ? "border-[#333] hover:bg-[#1a1a1a]"
                        : "border-[#e2e2e2] hover:bg-[#fafafa]"
                    }`}
                  >
                    <div className={labelClass}>
                      <div>{tx.dateTime.split(" ")[0]}</div>
                      <div>{tx.dateTime.split(" ")[1]}</div>
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      <span className={valueClass}>{tx.amount}</span>
                      <span className="text-[11px] font-semibold text-white bg-[#703ae6] rounded-[4px] px-[6px] py-[2px] w-fit">
                        {tx.amountUsd}
                      </span>
                    </div>
                    <div className={`${labelClass} flex items-center`}>
                      {tx.fromAccount}
                    </div>
                    <div className={`${labelClass} flex items-center`}>
                      {tx.toAccount}
                    </div>
                  </div>

                  {/* ── Mobile card ── */}
                  <div
                    className={`sm:hidden rounded-[12px] border-[1px] p-3 flex flex-col gap-2.5 ${
                      isDark ? "border-[#333]" : "border-[#e2e2e2]"
                    }`}
                  >
                    {/* Top: date + type badge */}
                    <div className="flex items-center justify-between">
                      <span className={labelClass}>
                        {tx.dateTime.split(" ")[0]} &middot; {tx.dateTime.split(" ")[1]}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        tx.type === "Deposit"
                          ? "bg-[#E6F9F0] text-[#0D9B52]"
                          : tx.type === "Withdraw"
                          ? "bg-[#FFF0F0] text-[#E53E3E]"
                          : "bg-[#F0EBFD] text-[#703AE6]"
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <span className={valueClass}>{tx.amount}</span>
                      <span className="text-[10px] font-semibold text-white bg-[#703ae6] rounded px-1.5 py-0.5">
                        {tx.amountUsd}
                      </span>
                    </div>
                    {/* From → To */}
                    <div className="flex items-center gap-1.5">
                      <span className={labelClass}>{tx.fromAccount}</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke={isDark ? "#919191" : "#5c5b5b"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className={labelClass}>{tx.toAccount}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Close button ── */}
        <div className="pb-4 sm:pb-[24px] pt-2 sm:pt-[16px] flex-shrink-0 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className={`text-[14px] font-bold cursor-pointer transition hover:opacity-70 ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
