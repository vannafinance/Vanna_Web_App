import Image from "next/image";
import { Column } from "../ui/Table";
import { Table } from "../ui/Table";

export type ActivePositionType = {
  id: string;
  time: string;
  direction: {
    side: "Open Long" | "Open Short";
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

const activePositionsColumns: Column<ActivePositionType>[] = [
  {
    id: "actions",
    header: "Actions",
    render: () => (
      <div className="flex gap-2">
        <button type="button" className="cursor-pointer">
          <Image src="/icons/edit.svg" alt="edit" width={20} height={20} />
        </button>
        <button type="button" className="cursor-pointer">
          <Image
            src="/icons/share-icon.svg"
            alt="share"
            width={20}
            height={20}
          />
        </button>
      </div>
    ),
  },

  {
    id: "time",
    header: "Time",
    render: (row) => {
      const [date, time] = row.time.split(" ");
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-[11px] text-[#8E8E92]">{time}</span>
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
        <span className="text-[11px] text-[#16A3A3]">{row.marginCoin}</span>
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
        <span className="text-[11px] text-[#8E8E92]">{row.orderType}</span>
      </div>
    ),
  },

  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Order Quantity |</span>
        <span>Filled Quantity</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.orderQty}</span>
        <span className="text-[11px] text-[#8E8E92] flex items-center gap-1">
          {row.filledQty}
          <Image src="/icons/edit.svg" alt="edit" width={14} height={14} />
        </span>
      </div>
    ),
  },

  {
    id: "price",
    header: "Price",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span>{row.price}</span>
        <Image src="/icons/edit.svg" alt="edit" width={14} height={14} />
      </div>
    ),
  },

  {
    id: "tpSl",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Take Profit |</span>
        <span>Stop loss</span>
      </div>
    ),
    render: (row) => (
      <div className="flex items-center gap-1">
        <span>{row.takeProfit ?? "--"}</span>
        <span>/</span>
        <span>{row.stopLoss ?? "--"}</span>
        <Image src="/icons/edit.svg" alt="edit" width={14} height={14} />
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
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
];

const activePositionsData: ActivePositionType[] = [
  {
    id: "pos-1",
    time: "2025-11-11 12:56:55",
    direction: {
      side: "Open Long",
      mode: "Cross",
    },
    pair: "SBTCSUSDT",
    marginCoin: "SBTCSUSDT",
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

export default function ActivePositionsTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={activePositionsColumns}
        data={activePositionsData}
        getRowKey={(row) => row.id}
        emptyText="No positions"
      />
    </div>
  );
}
