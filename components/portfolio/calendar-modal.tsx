"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/contexts/theme-context";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getMockPnL(day: number, month: number, year: number): number {
  const seed = (day * 7 + month * 31 + year) % 13;
  return seed % 3 === 0 ? -2 : 2;
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const rawDow = new Date(selectedYear, selectedMonth, 1).getDay();
  const startDow = rawDow === 0 ? 6 : rawDow - 1;

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  let totalProfit = 0, totalLoss = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const pnl = getMockPnL(d, selectedMonth, selectedYear);
    if (pnl > 0) totalProfit += pnl; else totalLoss += Math.abs(pnl);
  }
  const netProfit = totalProfit - totalLoss;

  const chevron = (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const modal = (
    <div
      className="fixed inset-0 z-[1000] overflow-hidden"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Centering container */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center pointer-events-none">
        <div
          className={`pointer-events-auto w-full sm:w-[92vw] sm:max-w-[860px] max-h-[92dvh] sm:max-h-[85dvh] overflow-y-auto overflow-x-hidden rounded-t-[20px] sm:rounded-[20px] border ${
            isDark ? "bg-[#111111] border-[#333]" : "bg-white border-[#e2e2e2]"
          }`}
          style={{
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }}
        >
          {/* Inner content with padding */}
          <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-5">

            {/* Drag handle — mobile */}
            <div className="sm:hidden flex justify-center -mt-1 mb--1">
              <div className={`w-10 h-1 rounded-full ${isDark ? "bg-[#444]" : "bg-[#ccc]"}`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className={`text-lg sm:text-2xl font-bold ${isDark ? "text-white" : "text-[#111]"}`}>
                Calendar
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition flex-shrink-0 ${
                  isDark ? "bg-[#333] hover:bg-[#444]" : "bg-[#e2e2e2] hover:bg-[#d0d0d0]"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke={isDark ? "#fff" : "#111"} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="flex justify-between sm:justify-start sm:gap-16">
              {[
                { label: "Total Profit", val: `$${totalProfit}` },
                { label: "Net Profit",   val: `$${netProfit}`   },
                { label: "Total Loss",   val: `$${totalLoss}`   },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-[#919191]">{label}</span>
                  <span className={`text-base sm:text-2xl font-bold ${isDark ? "text-white" : "text-[#111]"}`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Month/Year toggle */}
              <div className={`inline-flex rounded-lg border p-[3px] ${isDark ? "border-[#333] bg-[#1a1a1a]" : "border-[#e2e2e2] bg-white"}`}>
                {(["month", "year"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActiveView(v)}
                    className={`px-3 h-7 rounded-md text-[11px] sm:text-xs font-semibold capitalize cursor-pointer transition ${
                      activeView === v
                        ? "bg-[#f1ebfd] text-[#703ae6]"
                        : isDark ? "text-white hover:bg-[#333]" : "text-[#111] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Month dropdown */}
              <button
                type="button"
                className={`h-8 sm:h-9 px-3 inline-flex items-center gap-1 rounded-lg border text-[11px] sm:text-xs font-medium cursor-pointer transition ${
                  isDark ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-white border-[#e2e2e2] text-[#111]"
                }`}
              >
                {MONTHS[selectedMonth]}
                {chevron}
              </button>

              {/* Year dropdown */}
              <button
                type="button"
                className={`h-8 sm:h-9 px-3 inline-flex items-center gap-1 rounded-lg border text-[11px] sm:text-xs font-medium cursor-pointer transition ${
                  isDark ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-white border-[#e2e2e2] text-[#111]"
                }`}
              >
                {selectedYear}
                {chevron}
              </button>
            </div>

            {/* Calendar */}
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="text-center text-[9px] sm:text-[11px] font-semibold text-[#919191]">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day grid — each cell is exactly 1fr, no min-width */}
              <div
                className="grid grid-cols-7"
                style={{ gap: "2px" }}
              >
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />;

                  const pnl = getMockPnL(day, selectedMonth, selectedYear);
                  const isProfit = pnl > 0;

                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center justify-center rounded sm:rounded-md py-1 sm:py-2 lg:py-3 ${
                        isProfit
                          ? isDark ? "bg-[#0a3a3c]" : "bg-[#ebfcfd]"
                          : isDark ? "bg-[#3c0a0a]" : "bg-[#ffeeee]"
                      }`}
                    >
                      <span className="text-[8px] sm:text-[10px] font-medium text-[#919191] leading-none">
                        {day}
                      </span>
                      <span
                        className={`text-[7px] sm:text-[9px] font-semibold leading-none mt-[1px] ${
                          isProfit ? "text-[#22c55e]" : "text-[#fc5457]"
                        }`}
                      >
                        {pnl > 0 ? "+" : "-"}${Math.abs(pnl)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
