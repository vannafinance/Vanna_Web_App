"use client";

import { useState, useMemo } from "react";
import { Chart } from "@/components/earn/chart";
import { Table } from "@/components/earn/table";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { COIN_ICONS } from "@/lib/constants/margin";
import { useTheme } from "@/contexts/theme-context";
import { Position } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const TRADE_TABS = ["Margin", "Spot", "Perps", "Options", "Farm"] as const;
type TradeTab = (typeof TRADE_TABS)[number];

const MARGIN_STATS = [
  { id: "totalMarginBalance",              label: "Total Margin Balance",              value: "$1000"     },
  { id: "totalCollateralDeposited",        label: "Total Collateral Deposited",        value: "$100"      },
  { id: "totalLoanTaken",                  label: "Total Loan Taken",                  value: "$10"       },
  { id: "crossAccountLeverage",            label: "Cross Account Leverage",            value: "1.6x/10x"  },
  { id: "healthFactor",                    label: "Health Factor",                     value: "1.5",      special: "gauge" },
  { id: "crossMarginRatio",                label: "Cross Margin Ratio",                value: "10%"       },
  { id: "collateralLeftBeforeLiquidation", label: "Collateral Left Before Liquidation",value: "$10"       },
  { id: "marginBalanceAllocation",         label: "Margin Balance Allocation",         value: "",         special: "allocation" },
  { id: "netBorrowedInterestAccrued",      label: "Net Borrowed Interest Accrued",     value: "$10"       },
] as const;

const MARGIN_ALLOCATION = [
  { label: "SPOT",    pct: "20%" },
  { label: "Perps",   pct: "30%" },
  { label: "Options", pct: "20%" },
  { label: "Farm",    pct: "20%" },
  { label: "Unused",  pct: "10%" },
];

const MARGIN_INFO = [
  { label: "Unrealised P&L",            value: "+$123122",  positive: true  },
  { label: "Realised P&L",              value: "-$150712",  positive: false },
  { label: "Sharpe Ratio",              value: "-29.06%",   positive: false },
  { label: "Max Drawdown",              value: "-$8.31",    positive: false },
  { label: "Overall Trading Volume",    value: "$1M",       positive: null  },
  { label: "Win Rate",                  value: "$72.02",    positive: null  },
  { label: "Total Fees Paid",           value: "$2.20",     positive: null  },
  { label: "Total Fees Rebates Earned", value: "$69.83",    positive: null  },
];

const CHART_FILTER_TABS = ["Total Equity", "Cumulative PnL", "PnL", "Return Percentage"] as const;

const POSITIONS_TABLE_HEADINGS = [
  { label: "Collateral Deposited", id: "collateral" },
  { label: "Borrowed Assets", id: "borrowed" },
  { label: "Leverage Taken", id: "leverage" },
  { label: "Interest accrued till date", id: "interest" },
  { label: "Action", id: "action" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoIcon = ({ isDark }: { isDark: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <path
      d="M6 3.33333H7.33333V4.66667H6V3.33333ZM6 6H7.33333V10H6V6ZM6.66667 0C2.98667 0 0 2.98667 0 6.66667C0 10.3467 2.98667 13.3333 6.66667 13.3333C10.3467 13.3333 13.3333 10.3467 13.3333 6.66667C13.3333 2.98667 10.3467 0 6.66667 0ZM6.66667 12C3.72667 12 1.33333 9.60667 1.33333 6.66667C1.33333 3.72667 3.72667 1.33333 6.66667 1.33333C9.60667 1.33333 12 3.72667 12 6.66667C12 9.60667 9.60667 12 6.66667 12Z"
      fill={isDark ? "#919191" : "#5c5b5b"}
    />
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Margin stats grid ───────────────────────────────────────────────────────

const MarginStatsGrid = ({ isDark }: { isDark: boolean }) => {
  const labelClass = `text-[12px] font-normal text-[#5c5b5b] leading-normal`;
  const valueClass = `text-[28px] font-bold leading-[42px] ${isDark ? "text-white" : "text-[#111]"}`;

  const renderCell = (stat: (typeof MARGIN_STATS)[number] & { special?: string }) => {
    if (stat.special === "gauge") {
      return (
        <div className="flex flex-col gap-[8px]">
          <div className={`flex items-center gap-[4px] ${labelClass}`}>
            {stat.label}
            <InfoIcon isDark={isDark} />
          </div>
          {/* Semicircular gauge */}
          <div className="flex flex-col items-start">
            <svg width="100" height="60" viewBox="0 0 100 60">
              {/* Background arc */}
              <path
                d="M10 55 A40 40 0 0 1 90 55"
                fill="none"
                stroke={isDark ? "#333" : "#e2e2e2"}
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Red portion (left) */}
              <path
                d="M10 55 A40 40 0 0 1 50 15"
                fill="none"
                stroke="#fc5457"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Cyan portion (right) */}
              <path
                d="M50 15 A40 40 0 0 1 90 55"
                fill="none"
                stroke="#32e2ee"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Needle */}
              <line
                x1="50" y1="55" x2="50" y2="20"
                stroke={isDark ? "#fff" : "#111"}
                strokeWidth="2"
                strokeLinecap="round"
                transform="rotate(-45, 50, 55)"
              />
              {/* Center dot */}
              <circle cx="50" cy="55" r="3" fill={isDark ? "#fff" : "#111"} />
              {/* Value label */}
              <text x="50" y="12" textAnchor="middle" fontSize="11" fontWeight="600" fill={isDark ? "#fff" : "#111"}>
                {stat.value}
              </text>
            </svg>
            <div className={`flex w-[100px] justify-between text-[10px] font-semibold ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}>
              <span>1</span><span>2</span>
            </div>
          </div>
        </div>
      );
    }

    if (stat.special === "allocation") {
      return (
        <div className="flex flex-col gap-[8px]">
          <span className={labelClass}>{stat.label}</span>
          <div className="flex flex-wrap gap-x-[24px] gap-y-[4px]">
            {MARGIN_ALLOCATION.map(({ label, pct }) => (
              <div key={label} className="flex items-center gap-[4px] text-[12px]">
                <span className="text-[#5c5b5b] font-normal">{label}:</span>
                <span className={`font-bold ${isDark ? "text-white" : "text-[#111]"}`}>{pct}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[8px]">
        <span className={labelClass}>{stat.label}</span>
        <span className={valueClass}>{stat.value}</span>
      </div>
    );
  };

  return (
    <div className={`w-full rounded-[16px] border-[1px] p-[20px] grid grid-cols-4 gap-[20px] ${
      isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
    }`}>
      {MARGIN_STATS.map((stat) => (
        <div key={stat.id} className="flex flex-col justify-between">
          {renderCell(stat as any)}
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const TraderTab = () => {
  const { isDark } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<TradeTab>("Margin");
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [positionsTab, setPositionsTab] = useState("currentPositions");
  const positions = useCollateralBorrowStore((state) => state.position);

  const positionsTableBody = useMemo(() => {
    const filtered = positions.filter((pos: Position) =>
      positionsTab === "currentPositions" ? pos.isOpen : !pos.isOpen
    );
    return {
      rows: filtered.map((pos: Position) => ({
        cell: [
          {
            icon: COIN_ICONS[pos.collateral.asset as keyof typeof COIN_ICONS],
            title: `${pos.collateral.amount} ${pos.collateral.asset.replace("0x", "")}`,
            description: `$${pos.collateralUsdValue}`,
          },
          ...pos.borrowed.map((b) => ({
            icon: COIN_ICONS[b.assetData.asset as keyof typeof COIN_ICONS],
            title: `${b.assetData.amount} ${b.assetData.asset.replace("0x", "")}`,
            description: `$${b.usdValue}`,
            tag: b.percentage ? `${b.percentage}%` : undefined,
          })),
          { title: `${pos.leverage}x` },
          { title: `${pos.interestAccrued} USD` },
          { title: pos.isOpen ? "Repay" : "Repaid" },
        ],
      })),
    };
  }, [positions, positionsTab]);

  const subTabBase = `w-[101px] h-full rounded-[8px] px-[12px] py-[12px] text-[12px] font-semibold cursor-pointer transition`;
  const subTabActive = "bg-[#f1ebfd] text-[#703ae6]";
  const subTabInactive = isDark ? "text-white hover:bg-[#333]" : "text-[#111] hover:bg-[#f7f7f7]";

  return (
    <div className="w-full h-fit flex flex-col gap-[24px]">

      {/* ── Trade sub-tabs ── */}
      <div className={`flex items-center rounded-[8px] border-[1px] p-[4px] gap-[4px] w-fit h-[47px] ${
        isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-[#e2e2e2]"
      }`}>
        {TRADE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSubTab(tab)}
            className={`${subTabBase} ${activeSubTab === tab ? subTabActive : subTabInactive}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Margin content ── */}
      {activeSubTab === "Margin" ? (
        <div className="w-full flex flex-col gap-[20px]">

          {/* Margin stats 4×3 grid */}
          <MarginStatsGrid isDark={isDark} />

          {/* Margin Info + Chart row */}
          <div className="w-full flex gap-[20px] h-[475px]">

            {/* Margin Info panel */}
            <div className={`w-[422px] flex-shrink-0 flex flex-col gap-[20px] rounded-[16px] border-[1px] p-[20px] ${
              isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
            }`}>
              <h3 className={`text-[24px] font-bold flex-shrink-0 ${isDark ? "text-white" : "text-[#111]"}`}>
                Margin Info
              </h3>
              <div className="flex flex-col gap-[20px] overflow-y-auto">
                {MARGIN_INFO.map(({ label, value, positive }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className={`text-[16px] font-medium ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}>
                      {label}
                    </span>
                    <span className={`text-[16px] font-semibold ${
                      positive === true
                        ? "text-[#32e2ee]"
                        : positive === false
                        ? "text-[#fc5457]"
                        : isDark ? "text-white" : "text-[#111]"
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart panel */}
            <div className={`flex-1 flex flex-col rounded-[20px] border-[1px] p-[20px] ${
              isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
            }`}>
              <div className={`flex-1 min-h-0 rounded-[20px] flex flex-col gap-[16px] p-[20px] ${
                isDark ? "bg-[#111111]" : "bg-white"
              }`}>
                {/* Chart filter tabs + All Time dropdown */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-[4px]">
                    {CHART_FILTER_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveChartFilter(tab)}
                        className={`h-[40px] px-[12px] py-[8px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap ${
                          activeChartFilter === tab
                            ? "bg-[#fdebf8] text-[#e63abb]"
                            : isDark
                            ? "bg-transparent text-white hover:bg-[#333]"
                            : "bg-white text-[#111] hover:bg-[#f7f7f7]"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`h-[40px] pl-[8px] pr-[12px] flex items-center gap-[4px] rounded-[8px] border-[1px] text-[12px] font-semibold cursor-pointer transition ${
                      isDark
                        ? "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
                        : "bg-white border-[#e2e2e2] text-[#111] hover:bg-[#f7f7f7]"
                    }`}
                  >
                    All Time
                    <ChevronDown />
                  </button>
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-0">
                  <Chart
                    type="net-profit-loss"
                    containerHeight="h-full"
                    containerWidth="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Positions Table */}
          <Table
            heading={{
              heading: "Positions Table",
              tabsItems: [
                { id: "currentPositions", label: "Current Positions" },
                { id: "positionsHistory", label: "Positions History" },
              ],
              tabType: "solid",
            }}
            activeTab={positionsTab}
            onTabChange={setPositionsTab}
            tableHeadings={POSITIONS_TABLE_HEADINGS}
            tableBody={positionsTableBody}
          />
        </div>
      ) : (
        <div className={`w-full h-[300px] rounded-[16px] border-[1px] flex items-center justify-center ${
          isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
        }`}>
          <p className={`text-[14px] font-medium ${isDark ? "text-[#919191]" : "text-[#5c5b5b]"}`}>
            {activeSubTab} coming soon
          </p>
        </div>
      )}
    </div>
  );
};
