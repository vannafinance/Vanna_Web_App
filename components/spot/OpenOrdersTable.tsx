import Image from "next/image";
import { Column, Table } from "../ui/Table";

export type OpenOrderRow = {
  id: string;
  dateTime: string;
  pair: string;
  type: "Limit" | "Market" | "Trigger";
  side: "Buy" | "Sell";
  qty: string;
  price: number;
  takeProfit: {
    label: string;
    value: number;
  }[];
  slTriggerPrice: number;
  slLimit: number;
  trail: string;
  loop: string;
  triggerCondition: string;
  total: string;
};

export const openOrderColumns: Column<OpenOrderRow>[] = [
  {
    id: "view",
    header: "View",
    className: "w-[60px]",
    render: () => (
      <div className="flex justify-center">
        <button className="inline-flex  items-center justify-center ">
          <Image
            className="object-cover"
            width={20}
            height={20}
            alt="icons"
            src="/icons/eye.svg"
          />
        </button>
      </div>
    ),
  },

  /* Date / Time */
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

  /* Pair */
  {
    id: "pair",
    header: "Pair",
    accessorKey: "pair",
  },

  /* Type */
  {
    id: "type",
    header: "Type",
    accessorKey: "type",
  },

  /* Side */
  {
    id: "side",
    header: "Side",
    accessorKey: "side",
  },

  /* Qty */
  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
  },

  /* Price */
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    render: (row) => row.price.toLocaleString(),
  },

  /*  Take Profit */
  {
    id: "takeProfit",
    header: "Take Profit",
    render: (row) => (
      <div className="flex  flex-col ">
        {row.takeProfit.map((tp) => (
          <span key={tp.label} className="pr-2 py-1 ">
            {tp.label}= {tp.value.toLocaleString()}
          </span>
        ))}
      </div>
    ),
  },

  /* SL Trigger Price */
  {
    id: "slTriggerPrice",
    header: "SL Trigger Price",
    accessorKey: "slTriggerPrice",
  },

  /* SL Limit */
  {
    id: "slLimit",
    header: "SL Limit",
    accessorKey: "slLimit",
  },

  /* Trail */
  {
    id: "trail",
    header: "Trail (% or usd)",
    accessorKey: "trail",
  },

  /* Loop */
  {
    id: "loop",
    header: "Loop",
    accessorKey: "loop",
  },

  /* Trigger Conditions */
  {
    id: "triggerCondition",
    header: "Trigger Conditions",
    accessorKey: "triggerCondition",
  },

  /* Total */
  {
    id: "total",
    header: "Total",
    accessorKey: "total",
  },

  /* Actions */
  {
    id: "actions",
    header: "Action Button",
    render: () => (
      <div className="flex items-center justify-center gap-2">
        <button className="inline-flex items-center justify-center rounded-md border-[0.75px] border-[#E2E2E2] p-2 bg-white">
          <Image
            className="object-cover"
            width={16}
            height={16}
            alt="icons"
            src="/icons/edit.svg"
          />
        </button>
        <button className="inline-flex items-center justify-center rounded-md border-[0.75px] border-[#E2E2E2] p-2 bg-white">
          <Image
            className="object-cover"
            width={16}
            height={16}
            alt="icons"
            src="/icons/delete.svg"
          />
        </button>
      </div>
    ),
  },
];

export const openOrdersData: OpenOrderRow[] = [
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [
      { label: "Tp1", value: 66300 },
      { label: "Tp2", value: 66500 },
      { label: "Tp3", value: 66600 },
    ],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [{ label: "Tp1", value: 66300 }],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [{ label: "Tp1", value: 66300 }],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [{ label: "Tp1", value: 66300 }],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [{ label: "Tp1", value: 66300 }],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [
      { label: "Tp1", value: 66300 },
      { label: "Tp2", value: 66500 },
      { label: "Tp3", value: 66600 },
    ],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
  {
    id: "ord-1",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [
      { label: "Tp1", value: 66300 },
      { label: "Tp2", value: 66500 },
      { label: "Tp3", value: 66600 },
    ],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },

  {
    id: "ord-2",
    dateTime: "2025-10-23 14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: 60000,
    takeProfit: [
      { label: "Tp1", value: 66300 },
      { label: "Tp2", value: 66500 },
      { label: "Tp3", value: 66600 },
    ],
    slTriggerPrice: 200,
    slLimit: 63700,
    trail: "0.5%",
    loop: "0/10",
    triggerCondition: "Spot Price >= $110K",
    total: "Spot Price >= $110K",
  },
];

export default function OpenOrdersTable() {
  return (
    <div className="p-2 rounded-lg   border border-[#E2E2E2]  bg-[#F7F7F7]">
      <Table
        columns={openOrderColumns}
        data={openOrdersData}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
