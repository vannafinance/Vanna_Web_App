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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full max-w-[907px] rounded-[24px] border-[1px] flex flex-col overflow-hidden ${
          isDark ? "bg-[#111111] border-[#333]" : "bg-white border-[#e2e2e2]"
        }`}
        style={{
          boxShadow:
            "0px 7px 15px rgba(0,0,0,0.08), 0px 28px 28px rgba(0,0,0,0.07), 0px 63px 38px rgba(0,0,0,0.04), 0px 113px 45px rgba(0,0,0,0.01)",
        }}
      >
        {/* ── Header ── */}
        <div className="px-[28px] pt-[24px] pb-[20px] flex-shrink-0">
          <h2
            className={`text-[20px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}
          >
            Transaction History
          </h2>
        </div>

        {/* ── Tab row ── */}
        <div className="px-[28px] pb-[16px] flex-shrink-0">
          <div
            className={`flex items-center rounded-[8px] border-[1px] p-[4px] gap-[4px] w-fit ${
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
                className={`h-[31px] px-[12px] rounded-[6px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap ${
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
        <div className="flex-1 overflow-y-auto max-h-[400px] px-[28px]">
          {/* Column headers */}
          <div className="grid grid-cols-4 px-[20px] py-[12px]">
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

          {/* Body rows - each row is a separate card */}
          <div className="flex flex-col gap-[12px]">
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
                <div
                  key={i}
                  className={`grid grid-cols-4 rounded-[12px] border-[1px] px-[20px] py-[16px] transition ${
                    isDark
                      ? "border-[#333] hover:bg-[#1a1a1a]"
                      : "border-[#e2e2e2] hover:bg-[#fafafa]"
                  }`}
                >
                  {/* Date/Time */}
                  <div
                    className={`text-[13px] font-medium ${
                      isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                    }`}
                  >
                    <div>{tx.dateTime.split(" ")[0]}</div>
                    <div>{tx.dateTime.split(" ")[1]}</div>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-[4px]">
                    <span
                      className={`text-[13px] font-semibold ${isDark ? "text-white" : "text-[#111]"}`}
                    >
                      {tx.amount}
                    </span>
                    <span className="text-[11px] font-semibold text-white bg-[#703ae6] rounded-[4px] px-[6px] py-[2px] w-fit">
                      {tx.amountUsd}
                    </span>
                  </div>

                  {/* From Account */}
                  <div
                    className={`text-[13px] font-medium flex items-center ${
                      isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                    }`}
                  >
                    {tx.fromAccount}
                  </div>

                  {/* To Account */}
                  <div
                    className={`text-[13px] font-medium flex items-center ${
                      isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                    }`}
                  >
                    {tx.toAccount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Close button ── */}
        <div className="pb-[24px] pt-[16px] flex-shrink-0 flex justify-center">
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
