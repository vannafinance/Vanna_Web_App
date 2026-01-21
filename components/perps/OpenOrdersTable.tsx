import Image from "next/image";
import { Column } from "../ui/Table";
import { Table } from "../ui/Table";

export type OpenOrderType = {
  id: string;
  dateTime: string;
  direction: {
    side: "Open long" | "Open short";
    mode: "Cross" | "Isolated";
  };
  pair: string;
  marginCoin: string;
  timeInForce: string;
  orderType: string;
  orderQty: string;
  filledQty: string;
  price: string;
  takeProfit?: string;
  stopLoss?: string;
  status: string;
  reduceOnly: "Yes" | "No";
};

const openOrdersColumns: Column<OpenOrderType>[] = [
  {
    id: "dateTime",
    header: "Time",
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
    id: "direction",
    header: "Direction",
    render: (row) => (
      <div className="flex flex-col text-[#16A3A3]">
        <span>{row.direction.side}</span>
        <span className="text-[11px]">{row.direction.mode}</span>
      </div>
    ),
  },

  {
    id: "pair",
    header: "Futures | Coin",
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.pair}</span>
        <span className="text-[#16A3A3] text-[11px]">{row.marginCoin}</span>
      </div>
    ),
  },

  {
    id: "orderType",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Time in force |</span>
        <span>Order type</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.timeInForce}</span>
        <span className="text-[11px]">{row.orderType}</span>
      </div>
    ),
  },

  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Order quantity |</span>
        <span>Filled quantity</span>
      </div>
    ),

    render: (row) => (
      <div className="flex gap-2.5">
        <div className="flex flex-col">
          <span>{row.orderQty}</span>
          <span>{row.filledQty}</span>
        </div>
        <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
      </div>
    ),
  },

  {
    id: "price",
    header: "Price",
    render: (row) => (
      <div className="flex gap-2.5">
        <span>{row.price}</span>
        <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
      </div>
    ),
  },

  {
    id: "tpSl",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Take profit | </span>
        <span>Stop loss</span>
      </div>
    ),

    render: (row) => (
      <div className="flex gap-2.5">
        <span>{row.takeProfit ?? "--"}</span>
        <span>/</span>
        <span className="text-[12px]">{row.stopLoss ?? "--"}</span>
        <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
      </div>
    ),
  },

  {
    id: "status",
    header: "Status",
    accessorKey: "status",
  },

  {
    id: "reduceOnly",
    header: "Reduce Only",
    accessorKey: "reduceOnly",
  },

  {
    id: "actions",
    header: "",
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Chase
        </button>
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Close
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[140px]",
  },
];

const openOrdersData: OpenOrderType[] = Array.from({ length: 10 }, (_, i) => ({
  id: `order-${i + 1}`,
  dateTime: "2025-10-23 14:25:46",
  direction: {
    side: "Open long",
    mode: "Cross",
  },
  pair: "SBTCSUSDT",
  marginCoin: "SUSDT",
  timeInForce: "GTC",
  orderType: "BBO queue 1",
  orderQty: "0.050",
  filledQty: "0.000 SBTC",
  price: "105,081.2",
  takeProfit: "--",
  stopLoss: "--",
  status: "Unexecuted",
  reduceOnly: "No",
}));

export default function OpenOrdersTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={openOrdersColumns}
        data={openOrdersData}
        getRowKey={(row) => row.id}
        emptyText="No open orders"
      />
    </div>
  );
}
