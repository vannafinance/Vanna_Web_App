import Image from "next/image";
import cn from "classnames";
import { Column, Table } from "../ui/Table";

export type ActivePositionRow = {
  id: string;
  dateTime: string;
  pair: string;
  type: "Limit" | "Market";
  side: "Buy" | "Sell";
  qty: string;
  estFilledPrice: string;
  takeProfit?: {
    label: string;
    value: number;
  }[];
  slTriggerPrice?: number;
  slLimit?: number;
  stopLimit?: number;
  trailPctOrUsd?: string;
  loop?: string;
  currentPnlUsd?: string;
  currentPnlPct?: string;
  status: "Active" | "Closed";
};

export const activePositionsColumns: Column<ActivePositionRow>[] = [
  {
    id: "view",
    header: "View",
    className: "w-[60px]",
    render: () => (
      <div className="flex justify-center">
        <button className="inline-flex items-center justify-center">
          <Image src="/icons/eye.svg" alt="view" width={18} height={18} />
        </button>
      </div>
    ),
  },

  {
    id: "dateTime",
    header: "Date/Time",
    render: (row) => {
      const [date, time] = row.dateTime.split(" ");
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span>{time}</span>
        </div>
      );
    },
  },

  {
    id: "pair",
    header: "Pairs",
    accessorKey: "pair",
  },

  {
    id: "type",
    header: "Type",
    accessorKey: "type",
  },

  {
    id: "side",
    header: "Side",
    accessorKey: "side",
  },

  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
  },

  {
    id: "estFilledPrice",
    header: "Est. Filled Price",
    accessorKey: "estFilledPrice",
  },

  {
    id: "takeProfit",
    header: "Take Profit",
    render: (row) =>
      row.takeProfit ? (
        <div className="flex flex-col">
          {row.takeProfit.map((tp) => (
            <span key={tp.label} className="pr-2 py-1">
              {tp.label}= {tp.value.toLocaleString()}
            </span>
          ))}
        </div>
      ) : (
        "-"
      ),
  },

  {
    id: "slTriggerPrice",
    header: "SL Trigger Price",
    accessorKey: "slTriggerPrice",
  },

  {
    id: "slLimit",
    header: "SL Limit",
    accessorKey: "slLimit",
  },

  {
    id: "stopLimit",
    header: "Stop Limit",
    accessorKey: "stopLimit",
  },

  {
    id: "trailPctOrUsd",
    header: "Trail(% or usd)",
    accessorKey: "trailPctOrUsd",
  },

  {
    id: "loop",
    header: "Loop",
    accessorKey: "loop",
  },

  {
    id: "currentPnl",
    header: "Current PnL(% or usd)",
    render: (row) => (
      <span
        className={cn(
          "font-medium",
          row.currentPnlUsd?.startsWith("+") ? "text-green-600" : "text-red-600"
        )}
      >
        {row.currentPnlUsd} ({row.currentPnlPct})
      </span>
    ),
  },

  {
    id: "status",
    header: "Status",
    accessorKey: "status",
  },

  {
    id: "actions",
    header: "Action Button",
    render: () => (
      <div className="flex items-center justify-center gap-2">
        <button className="inline-flex items-center justify-center rounded-md border border-[#E2E2E2] p-2 bg-white">
          <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-[#E2E2E2] p-2 bg-white">
          <Image src="/icons/delete.svg" alt="delete" width={16} height={16} />
        </button>
      </div>
    ),
  },
];

export const activePositionsData: ActivePositionRow[] = [
  {
    id: "pos-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    estFilledPrice: "1.25 BTC",
    takeProfit: [
      { label: "Tp1", value: 200 },
      { label: "Tp2", value: 100 },
      { label: "Tp3", value: 100 },
    ],
    slTriggerPrice: 63700,
    slLimit: 63700,
    stopLimit: 200,
    trailPctOrUsd: "$61,500",
    loop: "2/10",
    currentPnlUsd: "+1,875",
    currentPnlPct: "+2.5%",
    status: "Active",
  },

  {
    id: "pos-2",
    dateTime: "2025-10-23 13:40:12",
    pair: "ETH/USDT",
    type: "Market",
    side: "Buy",
    qty: "3.5 ETH",
    estFilledPrice: "3.5 ETH",
    takeProfit: [
      { label: "Tp1", value: 120 },
      { label: "Tp2", value: 80 },
    ],
    slTriggerPrice: 3200,
    slLimit: 3180,
    stopLimit: 150,
    trailPctOrUsd: "$3,450",
    loop: "1/5",
    currentPnlUsd: "+420",
    currentPnlPct: "+1.8%",
    status: "Active",
  },

  {
    id: "pos-3",
    dateTime: "2025-10-23 12:55:30",
    pair: "SOL/USDT",
    type: "Limit",
    side: "Sell",
    qty: "120 SOL",
    estFilledPrice: "120 SOL",
    takeProfit: [{ label: "Tp1", value: 60 }],
    slTriggerPrice: 98,
    slLimit: 95,
    stopLimit: 50,
    trailPctOrUsd: "$12,000",
    loop: "4/10",
    currentPnlUsd: "-210",
    currentPnlPct: "-0.9%",
    status: "Active",
  },

  {
    id: "pos-4",
    dateTime: "2025-10-23 11:20:10",
    pair: "BNB/USDT",
    type: "Market",
    side: "Buy",
    qty: "15 BNB",
    estFilledPrice: "15 BNB",
    takeProfit: [
      { label: "Tp1", value: 90 },
      { label: "Tp2", value: 120 },
    ],
    slTriggerPrice: 580,
    slLimit: 570,
    stopLimit: 70,
    trailPctOrUsd: "$8,600",
    loop: "3/6",
    currentPnlUsd: "+315",
    currentPnlPct: "+1.2%",
    status: "Active",
  },

  {
    id: "pos-5",
    dateTime: "2025-10-23 10:05:44",
    pair: "XRP/USDT",
    type: "Limit",
    side: "Buy",
    qty: "5000 XRP",
    estFilledPrice: "5000 XRP",
    takeProfit: [{ label: "Tp1", value: 40 }],
    slTriggerPrice: 0.52,
    slLimit: 0.5,
    stopLimit: 30,
    trailPctOrUsd: "$2,750",
    loop: "5/10",
    currentPnlUsd: "+95",
    currentPnlPct: "+0.6%",
    status: "Active",
  },

  {
    id: "pos-6",
    dateTime: "2025-10-23 09:40:18",
    pair: "ADA/USDT",
    type: "Market",
    side: "Sell",
    qty: "8000 ADA",
    estFilledPrice: "8000 ADA",
    takeProfit: [
      { label: "Tp1", value: 55 },
      { label: "Tp2", value: 75 },
    ],
    slTriggerPrice: 0.48,
    slLimit: 0.5,
    stopLimit: 45,
    trailPctOrUsd: "$3,900",
    loop: "2/8",
    currentPnlUsd: "-130",
    currentPnlPct: "-0.7%",
    status: "Active",
  },

  {
    id: "pos-7",
    dateTime: "2025-10-23 08:15:02",
    pair: "DOGE/USDT",
    type: "Limit",
    side: "Buy",
    qty: "20000 DOGE",
    estFilledPrice: "20000 DOGE",
    takeProfit: [{ label: "Tp1", value: 25 }],
    slTriggerPrice: 0.072,
    slLimit: 0.07,
    stopLimit: 20,
    trailPctOrUsd: "$1,450",
    loop: "6/10",
    currentPnlUsd: "+60",
    currentPnlPct: "+0.4%",
    status: "Active",
  },

  {
    id: "pos-8",
    dateTime: "2025-10-23 07:50:39",
    pair: "AVAX/USDT",
    type: "Market",
    side: "Buy",
    qty: "90 AVAX",
    estFilledPrice: "90 AVAX",
    takeProfit: [
      { label: "Tp1", value: 140 },
      { label: "Tp2", value: 180 },
    ],
    slTriggerPrice: 34,
    slLimit: 32,
    stopLimit: 120,
    trailPctOrUsd: "$4,800",
    loop: "1/4",
    currentPnlUsd: "+275",
    currentPnlPct: "+1.1%",
    status: "Active",
  },

  {
    id: "pos-9",
    dateTime: "2025-10-23 06:30:55",
    pair: "MATIC/USDT",
    type: "Limit",
    side: "Sell",
    qty: "6000 MATIC",
    estFilledPrice: "6000 MATIC",
    takeProfit: [{ label: "Tp1", value: 35 }],
    slTriggerPrice: 0.82,
    slLimit: 0.85,
    stopLimit: 28,
    trailPctOrUsd: "$5,100",
    loop: "7/10",
    currentPnlUsd: "-85",
    currentPnlPct: "-0.3%",
    status: "Active",
  },

  {
    id: "pos-10",
    dateTime: "2025-10-23 05:10:21",
    pair: "DOT/USDT",
    type: "Market",
    side: "Buy",
    qty: "400 DOT",
    estFilledPrice: "400 DOT",
    takeProfit: [
      { label: "Tp1", value: 70 },
      { label: "Tp2", value: 95 },
    ],
    slTriggerPrice: 6.2,
    slLimit: 6.0,
    stopLimit: 60,
    trailPctOrUsd: "$2,300",
    loop: "3/7",
    currentPnlUsd: "+110",
    currentPnlPct: "+0.8%",
    status: "Active",
  },

  {
    id: "pos-11",
    dateTime: "2025-10-23 04:00:00",
    pair: "LINK/USDT",
    type: "Limit",
    side: "Buy",
    qty: "350 LINK",
    estFilledPrice: "350 LINK",
    takeProfit: [{ label: "Tp1", value: 85 }],
    slTriggerPrice: 14.5,
    slLimit: 14.0,
    stopLimit: 65,
    trailPctOrUsd: "$4,200",
    loop: "2/5",
    currentPnlUsd: "+190",
    currentPnlPct: "+1.0%",
    status: "Active",
  },
];

export default function ActivePositionsTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={activePositionsColumns}
        data={activePositionsData}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
