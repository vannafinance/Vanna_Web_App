"use client";

import { useState, useMemo } from "react";
import { useMarginStore } from "@/store/margin-account-state";
import { usePositionsData } from "@/lib/hooks/usePositionsData";
import { Positionstable } from "@/components/margin/positions-table";
import { Chart } from "@/components/earn/chart";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { useTheme } from "@/contexts/theme-context";
import { formatValue } from "@/lib/utils/format-value";

// ── SVG semi-circle health factor gauge ──────────────────────────────────────
const HealthFactorGauge = ({ hf }: { hf: number }) => {
  const isInf = !isFinite(hf) || hf >= 999;
  const pct = isInf ? 1 : Math.min(Math.max((hf - 1) / (2 - 1), 0), 1);

  const cx = 38, cy = 34, r = 28;
  const startX = cx - r, startY = cy;      // left tip  (180°)
  const endX   = cx + r, endY   = cy;      // right tip (0°)
  const needleAngle = Math.PI - pct * Math.PI;
  const nx = cx + (r - 4) * Math.cos(needleAngle);
  const ny = cy + (r - 4) * Math.sin(needleAngle);

  const color = isInf || hf >= 2 ? "#10B981" : hf >= 1.5 ? "#F59E0B" : "#EF4444";

  return (
    <svg width="76" height="40" viewBox="0 0 76 40">
      {/* track */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
        fill="none" stroke="#E5E7EB" strokeWidth="6" strokeLinecap="round"
      />
      {/* fill */}
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(needleAngle)} ${cy + r * Math.sin(needleAngle)}`}
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
      />
      {/* needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2" fill={color} />
    </svg>
  );
};

// ── Margin info rows ──────────────────────────────────────────────────────────
const MARGIN_INFO_ROWS = [
  { label: "Unrealised P&L",           value: "—" },
  { label: "Realised P&L",             value: "—" },
  { label: "Sharpe Ratio",             value: "—" },
  { label: "Max Drawdown",             value: "—" },
  { label: "Overall Trading Volume",   value: "—" },
  { label: "Win Rate",                 value: "—" },
  { label: "Total Fees Paid",          value: "—" },
  { label: "Total Fees Rebates Earned",value: "—" },
];

const EQUITY_TABS = [
  { id: "totalEquity",   label: "Total Equity" },
  { id: "cumPnl",        label: "Cumulative PnL" },
  { id: "pnl",           label: "PnL" },
  { id: "returnPct",     label: "Return Percentage" },
];

const ALLOC_ITEMS = [
  { label: "SPOT:",    pct: "20%", color: "#703AE6" },
  { label: "Perps:",   pct: "30%", color: "#E63ABB" },
  { label: "Options:", pct: "20%", color: "#3A9EE6" },
  { label: "Farm:",    pct: "20%", color: "#10B981" },
  { label: "Unused:",  pct: "10%", color: null },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const PortfolioSection = () => {
  const { isDark } = useTheme();
  const [equityTab, setEquityTab] = useState("totalEquity");

  const marginState  = useMarginStore((s) => s.marginState);
  const isLoading    = useMarginStore((s) => s.isLoading);
  const { positions } = usePositionsData();

  const collateral = marginState?.collateralUsd  ?? 0;
  const borrow     = marginState?.borrowUsd      ?? 0;
  const hf         = marginState?.hf             ?? 0;
  const leverage   = marginState?.leverage       ?? 0;

  const marginBal   = Math.max(0, collateral - borrow);
  const collLeft    = Math.max(0, collateral * 0.8 - borrow);
  const marginRatio = collateral > 0 ? (borrow / collateral) * 100 : 0;

  const totalInterest = useMemo(
    () => positions.reduce((s, p) => s + (Number(p.interestAccrued) || 0), 0),
    [positions]
  );

  const dash = isLoading && !marginState;
  const fmtUsd = (v: number) =>
    dash ? "—" : `$${formatValue(v, { type: "number", useLargeFormat: true })}`;

  // theme helpers
  const card    = `rounded-[16px] border p-[20px] ${isDark ? "bg-[#1A1A1A] border-[#333]" : "bg-[#F7F7F7] border-[#E2E2E2]"}`;
  const gray    = isDark ? "text-[#919191]" : "text-[#5C5B5B]";
  const black   = isDark ? "text-white"     : "text-[#111]";

  return (
    <div className="flex flex-col gap-[20px]">

      {/* ── Card 1 – 4-col × 3-row stats grid ──────────────────── */}
      <div className={`${card} grid grid-cols-4 gap-x-[20px] gap-y-[20px]`}>

        {/* ROW 1 — summary stats */}
        {[
          { label: "Total Margin Balance",      value: fmtUsd(marginBal) },
          { label: "Total Collateral Deposited", value: fmtUsd(collateral) },
          { label: "Total Loan Taken",           value: fmtUsd(borrow) },
          { label: "Cross Account Leverage",     value: dash ? "—" : `${leverage.toFixed(1)}x/10x` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col h-[84px] justify-between">
            <p className={`text-[12px] font-normal ${gray}`}>{s.label}</p>
            <p className={`text-[28px] font-bold leading-[42px] ${black}`}>{s.value}</p>
          </div>
        ))}

        {/* ROW 2 — detail stats */}

        {/* Col 1: Health Factor gauge */}
        <div className="flex flex-col h-[84px] justify-between">
          <div className="flex items-center gap-[4px]">
            <p className={`text-[12px] font-normal ${gray}`}>Health Factor</p>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.7 10.5H6.3V6.3h1.4v4.2zm0-5.6H6.3V3.5h1.4v1.4z" fill={isDark ? "#919191" : "#5C5B5B"} />
            </svg>
          </div>
          <div className="flex flex-col items-center">
            <p className={`text-[14px] font-semibold text-center ${black}`}>
              {isInf(hf) || hf >= 999 ? "∞" : hf === 0 ? "—" : hf.toFixed(2)}
            </p>
            <div className="flex items-end gap-[4px]">
              <span className={`text-[14px] font-semibold leading-[21px] ${black}`}>1</span>
              <HealthFactorGauge hf={hf} />
              <span className={`text-[14px] font-semibold leading-[21px] ${black}`}>2</span>
            </div>
          </div>
        </div>

        {/* Col 2: Cross Margin Ratio */}
        <div className="flex flex-col h-[84px] justify-between">
          <p className={`text-[12px] font-normal ${gray}`}>Cross Margin Ratio</p>
          <p className={`text-[28px] font-bold leading-[42px] ${black}`}>
            {dash ? "—" : `${marginRatio.toFixed(0)}%`}
          </p>
        </div>

        {/* Col 3: Collateral Left Before Liquidation */}
        <div className="flex flex-col h-[84px] justify-between">
          <p className={`text-[12px] font-normal ${gray}`}>Collateral Left Before Liquidation</p>
          <p className={`text-[28px] font-bold leading-[42px] ${black}`}>{fmtUsd(collLeft)}</p>
        </div>

        {/* Col 4: Margin Balance Allocation */}
        <div className="flex flex-col h-[84px] justify-between">
          <p className={`text-[12px] font-normal ${gray}`}>Margin Balance Allocation</p>
          <div className="flex flex-col gap-[4px] text-[10px] font-semibold p-[4px] rounded-[4px]">
            {/* row 1: SPOT + Perps + Options */}
            <div className="flex gap-[40px]">
              {ALLOC_ITEMS.slice(0, 3).map((a) => (
                <div key={a.label} className="flex gap-[4px] items-center">
                  <span className={gray}>{a.label}</span>
                  <span className={black}>{a.pct}</span>
                </div>
              ))}
            </div>
            {/* row 2: Farm + Unused */}
            <div className="flex gap-[40px]">
              {ALLOC_ITEMS.slice(3).map((a) => (
                <div key={a.label} className="flex gap-[4px] items-center">
                  <span className={gray}>{a.label}</span>
                  <span className={black}>{a.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3 — Net Borrowed Interest (col 1 only) */}
        <div className="flex flex-col h-[84px] justify-between col-start-1">
          <p className={`text-[12px] font-normal ${gray}`}>Net Borrowed Interest Accrued</p>
          <p className={`text-[28px] font-bold leading-[42px] ${black}`}>
            ${totalInterest.toFixed(2)}
          </p>
        </div>

      </div>

      {/* ── Row 2 – Margin Info + Equity chart ──────────────────── */}
      <div className="flex gap-[20px] h-[475px]">

        {/* Margin Info card */}
        <div className={`${card} flex flex-col gap-[20px] w-[422px] flex-shrink-0 h-[475px]`}>
          <p className={`text-[24px] font-bold leading-[36px] ${black}`}>Margin Info</p>
          <div className="flex flex-col gap-[20px] text-[16px]">
            {MARGIN_INFO_ROWS.map((row) => (
              <div key={row.label} className="flex justify-between items-center h-[15px]">
                <span className={`font-medium ${gray}`}>{row.label}</span>
                <span className={`font-semibold ${black}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equity chart */}
        <div className="flex-1 flex flex-col gap-[12px] min-w-0">
          <AnimatedTabs
            type="solid"
            tabs={EQUITY_TABS}
            activeTab={equityTab}
            onTabChange={setEquityTab}
          />
          <div className="flex-1 min-h-0">
            <Chart
              type="net-profit-loss"
              containerHeight="h-full"
              containerWidth="w-full"
            />
          </div>
        </div>

      </div>

      {/* ── Positions Table ──────────────────────────────────────── */}
      <div className="flex flex-col gap-[16px]">
        <h2 className={`text-[20px] font-bold ${black}`}>Positions Table</h2>
        <Positionstable />
      </div>

    </div>
  );
};

// Helper to check if a number is infinite
function isInf(n: number) {
  return !isFinite(n) || n >= 999;
}
