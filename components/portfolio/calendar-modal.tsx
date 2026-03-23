"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Deterministic mock P&L value per day
function getMockPnL(day: number, month: number, year: number): number {
  const seed = (day * 7 + month * 31 + year) % 13;
  return seed % 3 === 0 ? -2 : 2;
}

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal = ({ isOpen, onClose }: CalendarModalProps) => {
  const { isDark } = useTheme();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [activeView, setActiveView] = useState<"month" | "year">("month");

  if (!isOpen) return null;

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  // Convert to Mon=0 … Sun=6
  const rawDow = new Date(selectedYear, selectedMonth, 1).getDay();
  const startDow = rawDow === 0 ? 6 : rawDow - 1;

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Derive stats from mock data
  let totalProfit = 0, totalLoss = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const pnl = getMockPnL(d, selectedMonth, selectedYear);
    if (pnl > 0) totalProfit += pnl; else totalLoss += Math.abs(pnl);
  }
  const netProfit = totalProfit - totalLoss;

  const dropdownClass = `h-[40px] pl-[16px] pr-[8px] flex items-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-medium cursor-pointer transition ${
    isDark ? "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]" : "bg-white border-[#e2e2e2] text-[#111] hover:bg-[#f7f7f7]"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal card */}
      <div
        className={`relative z-10 w-full max-w-[960px] max-h-[90vh] overflow-y-auto rounded-[24px] border-[1px] p-[32px] flex flex-col gap-[20px] ${
          isDark ? "bg-[#111111] border-[#333]" : "bg-white border-[#e2e2e2]"
        }`}
        style={{
          boxShadow:
            "0px 7px 15px rgba(0,0,0,0.08), 0px 28px 28px rgba(0,0,0,0.07), 0px 63px 38px rgba(0,0,0,0.04), 0px 113px 45px rgba(0,0,0,0.01)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className={`text-[24px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}>
            Calendar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="w-[36px] h-[36px] rounded-full bg-[#e2e2e2] flex items-center justify-center cursor-pointer hover:bg-[#d0d0d0] transition flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="flex gap-[80px] flex-shrink-0">
          {[
            { label: "Total Profit", value: `$${totalProfit}` },
            { label: "Net Profit",   value: `$${netProfit}`   },
            { label: "Total Loss",   value: `$${totalLoss}`   },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-[12px]">
              <span className="text-[12px] font-semibold text-[#919191]">{label}</span>
              <span className={`text-[28px] font-bold ${isDark ? "text-white" : "text-[#111]"}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-[20px] flex-shrink-0">
          {/* Month / Year tab toggle */}
          <div
            className={`flex items-center rounded-[8px] border-[1px] p-[4px] ${
              isDark ? "border-[#333] bg-[#1a1a1a]" : "border-[#e2e2e2] bg-white"
            }`}
          >
            {(["month", "year"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`w-[80px] h-[30px] rounded-[6px] text-[12px] font-semibold cursor-pointer capitalize transition ${
                  activeView === view
                    ? "bg-[#f1ebfd] text-[#703ae6]"
                    : isDark
                    ? "text-white hover:bg-[#333]"
                    : "text-[#111] hover:bg-[#f7f7f7]"
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>

          {/* Month + Year dropdowns */}
          <div className="flex items-center gap-[8px]">
            <button type="button" className={dropdownClass}>
              {MONTHS[selectedMonth]}
              <ChevronDown />
            </button>

            <button type="button" className={dropdownClass}>
              {selectedYear}
              <ChevronDown />
            </button>
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div className="grid grid-cols-7 gap-[8px]">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;

            const pnl = getMockPnL(day, selectedMonth, selectedYear);
            const isProfit = pnl > 0;

            return (
              <div
                key={day}
                className={`flex flex-col gap-[5px] p-[16px] rounded-[8px] ${
                  isProfit
                    ? isDark ? "bg-[#0a3a3c]" : "bg-[#ebfcfd]"
                    : isDark ? "bg-[#3c0a0a]" : "bg-[#ffeeee]"
                }`}
              >
                <span className="text-[10px] font-medium text-[#919191]">{day}</span>
                <span
                  className={`text-[10px] font-semibold ${
                    isProfit ? "text-[#32e2ee]" : "text-[#fc5457]"
                  }`}
                >
                  {isProfit ? `+$${Math.abs(pnl)}` : `-$${Math.abs(pnl)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
