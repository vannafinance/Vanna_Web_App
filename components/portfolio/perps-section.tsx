"use client";

import { useState } from "react";
import { Chart } from "@/components/earn/chart";
import { Table, Column } from "@/components/ui/Table";
import { useTheme } from "@/contexts/theme-context";
import { ChevronUp, ChevronDown as ChevronDownIcon, Pencil } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERPS_INFO_STATS = [
  { label: "Perps Margin Allocated(USD)",  value: "$123,122" },
  { label: "Perps Margin Allocated(%)",    value: "$150,712" },
  { label: "Perp Margin Ratio(%)",         value: "-29.06%"  },
  { label: "Perp Maintenance Margin(USD)", value: "-$8.31"   },
  { label: "Unrealised P&L(USD)",          value: "$72.02"   },
  { label: "Realised P&L(USD)",            value: "$2.20"    },
  { label: "Perps Trading Volume(USD)",    value: "$2.20"    },
] as const;

const CHART_FILTER_TABS = [
  "Total Equity",
  "Cumulative PnL",
  "PnL",
  "Return Percentage",
] as const;

// Main positions tabs
const POSITIONS_MAIN_TABS = [
  { id: "position",           label: "Position (1)"        },
  { id: "openOrders",         label: "Open Orders (1)"     },
  { id: "orderHistory",       label: "Order History"       },
  { id: "positionHistory",    label: "Position history"    },
  { id: "orderDetails",       label: "Order details"       },
  { id: "transactionHistory", label: "Transaction History" },
  { id: "assets",             label: "Assets"              },
] as const;

// Inner order-type filter tabs (shown inside Open Orders tab)
const ORDER_TYPE_TABS = [
  { id: "limitMarket",   label: "Limit | Market(4)"  },
  { id: "trailingStop",  label: "Trailing stop (2)"  },
  { id: "tpsl",          label: "TP/SL(0)"           },
  { id: "trigger",       label: "Trigger(0)"         },
  { id: "iceberg",       label: "Iceberg(0)"         },
  { id: "twap",          label: "TWAP(0)"            },
] as const;

// ─── Mock data ────────────────────────────────────────────────────────────────

export type PerpsOrder = {
  id: string;
  time: string;
  direction: string;
  directionSub: string;
  futures: string;
  coin: string;
  coinColor: string;
  timeInForce: string;
  orderType: string;
  orderQty: string;
  filledQty: string;
  price: string;
  takeProfit: string;
  stopLoss: string;
  status: string;
  reduceOnly: string;
};

const MOCK_ORDERS: PerpsOrder[] = [
  {
    id: "1",
    time: "2025-10-23\n14:25:46",
    direction: "Open long",
    directionSub: "Cross",
    futures: "SBTCSUSDT",
    coin: "SUSDT",
    coinColor: "#24a0a9",
    timeInForce: "GTC",
    orderType: "BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,081.2",
    takeProfit: "--",
    stopLoss: "--",
    status: "Unexecuted",
    reduceOnly: "No",
  },
  {
    id: "2",
    time: "2025-10-23\n14:25:46",
    direction: "Open long",
    directionSub: "Cross",
    futures: "SBTCSUSDT",
    coin: "SUSDT",
    coinColor: "#24a0a9",
    timeInForce: "GTC",
    orderType: "BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,081.2",
    takeProfit: "--",
    stopLoss: "--",
    status: "Unexecuted",
    reduceOnly: "No",
  },
  {
    id: "3",
    time: "2025-10-23\n14:25:46",
    direction: "Open long",
    directionSub: "Cross",
    futures: "SBTCSUSDT",
    coin: "SUSDT",
    coinColor: "#24a0a9",
    timeInForce: "GTC",
    orderType: "BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,081.2",
    takeProfit: "--",
    stopLoss: "--",
    status: "Unexecuted",
    reduceOnly: "No",
  },
  {
    id: "4",
    time: "2025-10-23\n14:25:46",
    direction: "Open long",
    directionSub: "Cross",
    futures: "SBTCSUSDT",
    coin: "SUSDT",
    coinColor: "#24a0a9",
    timeInForce: "GTC",
    orderType: "BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,081.2",
    takeProfit: "--",
    stopLoss: "--",
    status: "Unexecuted",
    reduceOnly: "No",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChevronSortIcon = ({ isDark }: { isDark: boolean }) => (
  <span className="inline-flex flex-col ml-[2px] leading-none">
    <ChevronUp size={8} className={isDark ? "text-[#919191]" : "text-[#919191]"} />
    <ChevronDownIcon size={8} className={isDark ? "text-[#919191]" : "text-[#919191]"} />
  </span>
);

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

// ─── Main component ───────────────────────────────────────────────────────────

export const PerpsSection = () => {
  const { isDark } = useTheme();
  const [activeChartFilter, setActiveChartFilter] = useState("Total Equity");
  const [activeMainTab, setActiveMainTab] = useState("openOrders");
  const [activeOrderTypeTab, setActiveOrderTypeTab] = useState("limitMarket");
  const [showContent, setShowContent] = useState(false);

  // ── Table columns ────────────────────────────────────────────────────────
  const PERPS_TABLE_COLUMNS: Column<PerpsOrder>[] = [
    {
      id: "time",
      header: (
        <span className="flex items-center gap-[2px]">
          Time <ChevronSortIcon isDark={isDark} />
        </span>
      ),
      className: "min-w-[110px]",
      render: (row) => (
        <span className="whitespace-pre-line">{row.time}</span>
      ),
    },
    {
      id: "direction",
      header: "Direction",
      className: "min-w-[110px]",
      render: (row) => (
        <span className="flex flex-col text-[12px] font-medium leading-[18px]">
          <span style={{ color: "#24a0a9" }}>{row.direction}</span>
          <span className={isDark ? "text-[#919191]" : "text-[#5c5b5b]"}>{row.directionSub}</span>
        </span>
      ),
    },
    {
      id: "futures",
      header: (
        <span className="flex flex-col leading-[18px] whitespace-pre">
          <span>Futures |</span>
          <span>Coin</span>
        </span>
      ),
      className: "min-w-[120px]",
      render: (row) => (
        <span className="flex flex-col gap-[2px]">
          <span className="text-[12px] font-medium">{row.futures}</span>
          <span className="flex items-center gap-[4px]">
            <span
              className="inline-flex items-center justify-center rounded-full w-[16px] h-[16px] text-[10px] font-normal text-white flex-shrink-0"
              style={{ backgroundColor: row.coinColor }}
            >
              T
            </span>
            <span className="text-[12px] font-normal">{row.coin}</span>
          </span>
        </span>
      ),
    },
    {
      id: "timeInForce",
      header: (
        <span className="flex flex-col leading-[18px] whitespace-pre">
          <span>Time in force |</span>
          <span>Order type</span>
        </span>
      ),
      className: "min-w-[130px]",
      render: (row) => (
        <span className="flex flex-col leading-[18px]">
          <span>{row.timeInForce}</span>
          <span>{row.orderType}</span>
        </span>
      ),
    },
    {
      id: "qty",
      header: (
        <span className="flex flex-col leading-[18px]">
          <span>Order quantity |</span>
          <span>Filled quantity</span>
        </span>
      ),
      className: "min-w-[140px]",
      render: (row) => (
        <span className="flex items-center gap-[4px]">
          <span className="flex flex-col leading-[18px]">
            <span>{row.orderQty}</span>
            <span>{row.filledQty}</span>
          </span>
          <button type="button" className="p-[2px]">
            <Pencil size={12} className={isDark ? "text-[#919191]" : "text-[#5c5b5b]"} />
          </button>
        </span>
      ),
    },
    {
      id: "price",
      header: "Price",
      className: "min-w-[110px]",
      render: (row) => (
        <span className="flex items-center gap-[4px]">
          {row.price}
          <button type="button" className="p-[2px]">
            <Pencil size={12} className={isDark ? "text-[#919191]" : "text-[#5c5b5b]"} />
          </button>
        </span>
      ),
    },
    {
      id: "tpsl",
      header: (
        <span className="flex flex-col leading-[18px] whitespace-pre">
          <span>Take profit |</span>
          <span>Stop loss</span>
        </span>
      ),
      className: "min-w-[120px]",
      render: (row) => (
        <span className="flex items-center gap-[4px]">
          <span>{row.takeProfit}/{row.stopLoss}</span>
          <button type="button" className="p-[2px]">
            <Pencil size={12} className={isDark ? "text-[#919191]" : "text-[#5c5b5b]"} />
          </button>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      className: "min-w-[110px]",
    },
    {
      id: "reduceOnly",
      header: "Reduce Only",
      accessorKey: "reduceOnly",
      className: "min-w-[100px]",
    },
    {
      id: "actions",
      header: "",
      align: "right",
      sticky: true,
      className: "min-w-[120px] w-[120px]",
      render: () => (
        <span className="flex items-center justify-end gap-[6px] py-1">
          <button
            type="button"
            className={`px-[10px] py-[4px] rounded-[6px] text-[11px] font-semibold border-[1px] transition ${
              isDark
                ? "border-[#333] text-white hover:bg-[#222]"
                : "border-[#e2e2e2] text-[#111] bg-white hover:bg-[#f7f7f7]"
            }`}
          >
            Chase
          </button>
          <button
            type="button"
            className={`px-[10px] py-[4px] rounded-[6px] text-[11px] font-semibold border-[1px] transition ${
              isDark
                ? "border-[#FC5457] text-[#FC5457] hover:bg-[#2a1111]"
                : "border-[#FC5457] text-[#FC5457] hover:bg-[#fff5f5]"
            }`}
          >
            Close
          </button>
        </span>
      ),
    },
  ];

  // ── Tab helpers ──────────────────────────────────────────────────────────
  const mainTabBase =
    "px-[8px] py-[8px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap";
  const mainTabActive = "bg-[#f1ebfd] text-[#703ae6]";
  const mainTabInactive = isDark
    ? "text-white hover:bg-[#333]"
    : "text-[#111] hover:bg-[#f7f7f7]";

  const orderTypeTabBase =
    "px-[12px] py-[12px] rounded-[8px] text-[12px] font-semibold cursor-pointer transition whitespace-nowrap";
  const orderTypeTabActive = "bg-[#f1ebfd] text-[#703ae6]";
  const orderTypeTabInactive = isDark
    ? "text-white hover:bg-[#333]"
    : "text-[#111] hover:bg-[#f7f7f7]";

  return (
    <div className="w-full flex flex-col gap-[20px]">

      {/* ── Top row: Perps Info + Chart ── */}
      <div className="w-full flex gap-[20px] h-[475px]">

        {/* Perps Info panel */}
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
            Perps Info
          </h3>

          <div className="flex flex-col gap-[20px] overflow-y-auto">
            {PERPS_INFO_STATS.map(({ label, value }) => (
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
          className={`w-full rounded-[12px] flex flex-col overflow-hidden ${
            isDark ? "bg-[#222222]" : "bg-[#f7f7f7]"
          }`}
        >
          {/* ── Row 1: Main position tabs + Show Content / More / Cancel All ── */}
          <div className="flex items-center justify-between gap-[4px] px-[2px] py-[2px]">
            <div className="flex items-center gap-[4px] flex-wrap">
              {POSITIONS_MAIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`${mainTabBase} ${
                    activeMainTab === tab.id ? mainTabActive : mainTabInactive
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-[12px] flex-shrink-0 pr-[8px]">
              {/* Show Content checkbox */}
              <label className="flex items-center gap-[6px] cursor-pointer">
                <button
                  type="button"
                  onClick={() => setShowContent((v) => !v)}
                  className={`w-[16px] h-[16px] rounded-[2px] border-2 flex items-center justify-center flex-shrink-0 transition ${
                    showContent
                      ? "bg-[#703ae6] border-[#703ae6]"
                      : isDark
                      ? "border-[#919191] bg-transparent"
                      : "border-[#7d7d82] bg-transparent"
                  }`}
                  aria-checked={showContent}
                  role="checkbox"
                >
                  {showContent && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-[12px] font-semibold whitespace-nowrap ${
                    isDark ? "text-white" : "text-[#111]"
                  }`}
                >
                  Show Content
                </span>
              </label>

              {/* More */}
              <button
                type="button"
                className="px-[8px] py-[12px] text-[12px] font-semibold text-[#703ae6] cursor-pointer transition hover:opacity-80"
              >
                More
              </button>
            </div>
          </div>

          {/* ── Row 2: Order type filter tabs + Filter dropdown + Cancel All ── */}
          {activeMainTab === "openOrders" && (
            <div className="flex items-center justify-between px-[8px] pb-[4px]">
              {/* Inner order-type tabs */}
              <div
                className={`flex items-center gap-[0px] rounded-[8px] border-[1px] overflow-hidden ${
                  isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-[#e2e2e2]"
                }`}
              >
                {ORDER_TYPE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveOrderTypeTab(tab.id)}
                    className={`${orderTypeTabBase} ${
                      activeOrderTypeTab === tab.id
                        ? orderTypeTabActive
                        : orderTypeTabInactive
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                {/* Filter: All dropdown */}
                <button
                  type="button"
                  className={`flex items-center gap-[4px] px-[12px] py-[12px] text-[12px] font-semibold cursor-pointer transition ${
                    isDark ? "text-white hover:bg-[#333]" : "text-[#111] hover:bg-[#f7f7f7]"
                  }`}
                >
                  Filter: All
                  <ChevronDown />
                </button>
              </div>

              {/* Cancel All */}
              <button
                type="button"
                className={`px-[10px] py-[6px] rounded-[6px] text-[12px] font-semibold border-[1px] transition ${
                  isDark
                    ? "border-[#FC5457] text-[#FC5457] hover:bg-[#2a1111]"
                    : "border-[#FC5457] text-[#FC5457] hover:bg-[#fff5f5]"
                }`}
              >
                Cancel All
              </button>
            </div>
          )}

          {/* ── Table ── */}
          <div
            className={`border-[1px] rounded-[8px] mx-[8px] mb-[8px] overflow-hidden ${
              isDark
                ? "bg-[#222222] border-[#333]"
                : "bg-[#f7f7f7] border-[#e2e2e2]"
            }`}
          >
            <Table<PerpsOrder>
              columns={PERPS_TABLE_COLUMNS}
              data={activeMainTab === "openOrders" ? MOCK_ORDERS : []}
              getRowKey={(row) => row.id}
              emptyText={`No ${
                activeMainTab === "position"
                  ? "positions"
                  : activeMainTab === "openOrders"
                  ? "open orders"
                  : activeMainTab === "orderHistory"
                  ? "order history"
                  : activeMainTab === "positionHistory"
                  ? "position history"
                  : activeMainTab === "orderDetails"
                  ? "order details"
                  : activeMainTab === "transactionHistory"
                  ? "transaction history"
                  : "assets"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
