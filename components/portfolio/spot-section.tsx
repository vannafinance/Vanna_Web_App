"use client";

import { useState } from "react";
import { Chart } from "@/components/earn/chart";
import { Table, Column } from "@/components/ui/Table";
import { useTheme } from "@/contexts/theme-context";
import { Eye, Pencil, Trash2 } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const SPOT_INFO_STATS = [
  { label: "Total Holdings",                   value: "$123,122" },
  { label: "Unrealised Spot P&L",              value: "$150,712" },
  { label: "Spot Trading Volume",              value: "-29.06%"  },
  { label: "Spot Fees Paid",                   value: "-$8.31"   },
  { label: "Spot Rebates Earned",              value: "$72.02"   },
  { label: "Percentage of allocated to Spot",  value: "$2.20"    },
] as const;

const CHART_FILTER_TABS = [
  "Total Equity",
  "Cumulative PnL",
  "PnL",
  "Return Percentage",
] as const;

const POSITIONS_SUB_TABS = [
  { id: "openOrders",       label: "Open Orders(10)"   },
  { id: "orderHistory",     label: "Order History"     },
  { id: "tradeHistory",     label: "Trade History"     },
  { id: "activePositions",  label: "Active Positions(0)" },
] as const;

// ─── Mock data ────────────────────────────────────────────────────────────────

export type SpotOrder = {
  id: string;
  dateTime: string;
  pair: string;
  type: string;
  side: "Buy" | "Sell";
  qty: string;
  price: string;
  takeProfit: string;
  slTriggerPrice: string;
  slLimit: string;
  trail: string;
  loop: string;
  triggerConditions: string;
  total: string;
};

const MOCK_ORDERS: SpotOrder[] = [
  {
    id: "1",
    dateTime: "2025-10-23\n14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: "Tp1= 66,300\nTp2= 66,500\nTp3= 66,600\nTp4= 66,800",
    slTriggerPrice: "200",
    slLimit: "63,700",
    trail: "0.5%",
    loop: "0/10",
    triggerConditions: "Spot Price\n>= $110K",
    total: "Spot Price\n>= $110K",
  },
  {
    id: "2",
    dateTime: "2025-10-23\n14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: "Tp1= 66,300",
    slTriggerPrice: "200",
    slLimit: "63,700",
    trail: "0.5%",
    loop: "0/10",
    triggerConditions: "Spot Price\n>= $110K",
    total: "Spot Price\n>= $110K",
  },
  {
    id: "3",
    dateTime: "2025-10-23\n14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: "Tp1= 66,300",
    slTriggerPrice: "200",
    slLimit: "63,700",
    trail: "0.5%",
    loop: "0/10",
    triggerConditions: "Spot Price\n>= $110K",
    total: "Spot Price\n>= $110K",
  },
  {
    id: "4",
    dateTime: "2025-10-23\n14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: "Tp1= 66,300",
    slTriggerPrice: "200",
    slLimit: "63,700",
    trail: "0.5%",
    loop: "0/10",
    triggerConditions: "Spot Price\n>= $110K",
    total: "Spot Price\n>= $110K",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InfoIcon = ({ isDark }: { isDark: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <path
      d="M6 3.33333H7.33333V4.66667H6V3.33333ZM6 6H7.33333V10H6V6ZM6.66667 0C2.98667 0 0 2.98667 0 6.66667C0 10.3467 2.98667 13.3333 6.66667 13.3333C10.3467 13.3333 13.3333 10.3467 13.3333 6.66667C13.3333 2.98667 10.3467 0 6.66667 0ZM6.66667 12C3.72667 12 1.33333 9.60667 1.33333 6.66667C1.33333 3.72667 3.72667 1.33333 6.66667 1.33333C9.60667 1.33333 12 3.72667 12 6.66667C12 9.60667 9.60667 12 6.66667 12Z"
      fill={isDark ? "#919191" : "#5c5b5b"}
    />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const SpotSection = () => {
  const { isDark } = useTheme();
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [positionsTab, setPositionsTab] = useState("openOrders");

  // ── Positions table columns ──────────────────────────────────────────────
  const SPOT_TABLE_COLUMNS: Column<SpotOrder>[] = [
    {
      id: "view",
      header: "View",
      className: "min-w-[60px] w-[60px]",
      render: () => (
        <div className="flex items-center justify-center py-1">
          <Eye size={18} className={isDark ? "text-[#919191]" : "text-[#5c5b5b]"} />
        </div>
      ),
    },
    {
      id: "dateTime",
      header: "Date/Time",
      className: "min-w-[120px]",
      render: (row) => (
        <span className="whitespace-pre-line">{row.dateTime}</span>
      ),
    },
    {
      id: "pair",
      header: "Pair",
      accessorKey: "pair",
      className: "min-w-[100px]",
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
      className: "min-w-[80px]",
    },
    {
      id: "side",
      header: "Side",
      accessorKey: "side",
      className: "min-w-[60px]",
    },
    {
      id: "qty",
      header: "Qty",
      accessorKey: "qty",
      className: "min-w-[90px]",
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      className: "min-w-[80px]",
    },
    {
      id: "takeProfit",
      header: "Take Profit",
      className: "min-w-[130px]",
      render: (row) => (
        <span className="whitespace-pre-line">{row.takeProfit}</span>
      ),
    },
    {
      id: "slTriggerPrice",
      header: "SL Trigger Price",
      accessorKey: "slTriggerPrice",
      className: "min-w-[130px]",
    },
    {
      id: "slLimit",
      header: "SL Limit",
      accessorKey: "slLimit",
      className: "min-w-[90px]",
    },
    {
      id: "trail",
      header: "Trail(% or usd)",
      accessorKey: "trail",
      className: "min-w-[120px]",
    },
    {
      id: "loop",
      header: "Loop",
      accessorKey: "loop",
      className: "min-w-[70px]",
    },
    {
      id: "triggerConditions",
      header: "Trigger Conditions",
      className: "min-w-[140px]",
      render: (row) => (
        <span className="whitespace-pre-line">{row.triggerConditions}</span>
      ),
    },
    {
      id: "total",
      header: "Total",
      className: "min-w-[130px]",
      render: (row) => (
        <span className="whitespace-pre-line">{row.total}</span>
      ),
    },
    {
      id: "action",
      header: "Action Button",
      align: "right",
      sticky: true,
      className: "min-w-[100px] w-[100px]",
      render: () => (
        <div className="flex items-center justify-end gap-[8px] py-1">
          <button
            type="button"
            className={`p-[8px] rounded-[6px] border-[0.75px] ${
              isDark
                ? "bg-[#1a1a1a] border-[#333] hover:bg-[#222]"
                : "bg-white border-[#e2e2e2] hover:bg-[#f7f7f7]"
            }`}
          >
            <Pencil size={14} className={isDark ? "text-white" : "text-[#111]"} />
          </button>
          <button
            type="button"
            className={`p-[8px] rounded-[6px] border-[0.75px] ${
              isDark
                ? "bg-[#1a1a1a] border-[#333] hover:bg-[#222]"
                : "bg-[#e2e2e2] border-[#e2e2e2] hover:bg-[#d5d5d5]"
            }`}
          >
            <Trash2 size={14} className={isDark ? "text-white" : "text-[#111]"} />
          </button>
        </div>
      ),
    },
  ];

  // ── Tab styling helpers ──────────────────────────────────────────────────
  const posTabBase = `px-[8px] py-[8px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap`;
  const posTabActive = "bg-[#f1ebfd] text-[#703ae6]";
  const posTabInactive = isDark ? "text-white hover:bg-[#333]" : "text-[#111] hover:bg-[#f7f7f7]";

  return (
    <div className="w-full flex flex-col gap-[20px]">

      {/* ── Top row: Spot Info + Chart ── */}
      <div className="w-full flex gap-[20px] h-[475px]">

        {/* Spot Info panel */}
        <div
          className={`w-[422px] flex-shrink-0 flex flex-col gap-[20px] rounded-[16px] border-[1px] p-[20px] ${
            isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
          }`}
        >
          <h3
            className={`text-[24px] font-bold flex-shrink-0 leading-[36px] ${
              isDark ? "text-white" : "text-[#111]"
            }`}
          >
            Spot Info
          </h3>

          <div className="flex flex-col gap-[20px] overflow-y-auto">
            {SPOT_INFO_STATS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span
                  className={`text-[16px] font-medium ${
                    isDark ? "text-[#919191]" : "text-[#5c5b5b]"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`text-[16px] font-semibold ${
                    isDark ? "text-white" : "text-[#111]"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart panel */}
        <div
          className={`flex-1 flex flex-col rounded-[20px] border-[1px] p-[20px] min-w-0 ${
            isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
          }`}
        >
          <div
            className={`flex-1 min-h-0 rounded-[20px] flex flex-col gap-[16px] p-[20px] ${
              isDark ? "bg-[#111111]" : "bg-white"
            }`}
          >
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

      {/* ── Positions Table ── */}
      <div className="w-full flex flex-col gap-[12px]">
        <h3
          className={`text-[16px] font-semibold leading-[24px] ${
            isDark ? "text-white" : "text-[#111]"
          }`}
        >
          Positions Table
        </h3>

        <div
          className={`w-full rounded-[8px] flex flex-col gap-[8px] overflow-hidden ${
            isDark ? "bg-[#222222]" : "bg-[#f7f7f7]"
          }`}
        >
          {/* Sub-tabs row */}
          <div className="flex items-center gap-[4px] p-[6px]">
            {POSITIONS_SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPositionsTab(tab.id)}
                className={`${posTabBase} ${
                  positionsTab === tab.id ? posTabActive : posTabInactive
                } ${tab.id === "activePositions" ? "flex items-center gap-[4px]" : ""}`}
              >
                {tab.label}
                {tab.id === "activePositions" && (
                  <InfoIcon isDark={isDark} />
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            className={`border-[1px] rounded-[8px] mx-[8px] mb-[8px] overflow-hidden ${
              isDark ? "bg-[#222222] border-[#333]" : "bg-[#f7f7f7] border-[#e2e2e2]"
            }`}
          >
            <Table<SpotOrder>
              columns={SPOT_TABLE_COLUMNS}
              data={positionsTab === "openOrders" ? MOCK_ORDERS : []}
              getRowKey={(row) => row.id}
              emptyText={`No ${
                positionsTab === "openOrders"
                  ? "open orders"
                  : positionsTab === "orderHistory"
                  ? "order history"
                  : positionsTab === "tradeHistory"
                  ? "trade history"
                  : "active positions"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
