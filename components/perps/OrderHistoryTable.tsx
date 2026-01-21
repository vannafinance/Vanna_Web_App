import { Column } from "../ui/Table";
import { Table } from "../ui/Table";

export type OrderHistoryType = {
  id: string;
  dateTime: string;
  direction: {
    side: "Open long" | "Open short" | "Close long" | "Close short";
  };
  pair: string;
  marginCoin: string;
  timeInForce: string;
  orderType: string;
  orderQty: string;
  filledQty: string;
  price: string;
  avgFilledPrice?: string;
  reduceOnly: "Yes" | "No";
  fee: string;
  status: "Executed" | "Canceled";
};

export const orderHistoryColumns: Column<OrderHistoryType>[] = [
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
      <span className="text-[#24A0A9]">{row.direction.side}</span>
    ),
  },

  {
    id: "pair",
    header: "Futures | Coin",
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.pair}</span>
        <span className="text-[#24A0A9] text-[11px]">{row.marginCoin}</span>
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
      <div className="flex flex-col">
        <span>{row.orderQty}</span>
        <span className="text-[11px]">{row.filledQty}</span>
      </div>
    ),
  },

  {
    id: "price",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Price |</span>
        <span>Avg. filled price</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.price}</span>
        <span className="text-[11px]">{row.avgFilledPrice ?? "-"}</span>
      </div>
    ),
  },

  {
    id: "reduceOnly",
    header: "Reduce Only",
    accessorKey: "reduceOnly",
  },

  {
    id: "fee",
    header: "Fee",
    accessorKey: "fee",
  },

  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Executed" ? "text-[#24A0A9]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
    align: "right",
  },
];

export const orderHistoryData: OrderHistoryType[] = [
  {
    id: "history-1",
    dateTime: "2025-10-23 14:25:46",
    direction: { side: "Open long" },
    pair: "SBTCSUSDT",
    marginCoin: "SUSDT",
    timeInForce: "GTC",
    orderType: "Limit - BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,126.4",
    avgFilledPrice: "105,126.4",
    reduceOnly: "No",
    fee: "1.05126400 SUSDT",
    status: "Executed",
  },
  {
    id: "history-2",
    dateTime: "2025-10-23 14:25:46",
    direction: { side: "Open long" },
    pair: "SBTCSUSDT",
    marginCoin: "SUSDT",
    timeInForce: "GTC",
    orderType: "Limit - BBO queue 1",
    orderQty: "0.050",
    filledQty: "0.000 SBTC",
    price: "105,081.2",
    avgFilledPrice: "-",
    reduceOnly: "No",
    fee: "1.05126400 SUSDT",
    status: "Canceled",
  },
  {
    id: "history-3",
    dateTime: "2025-10-23 14:35:12",
    direction: { side: "Close long" },
    pair: "ETHUSDT",
    marginCoin: "USDT",
    timeInForce: "FOK",
    orderType: "Limit - BBO queue 1",
    orderQty: "0.200",
    filledQty: "0.000 ETH",
    price: "105,081.2",
    avgFilledPrice: "105,081.2",
    reduceOnly: "Yes",
    fee: "0.83000000 USDT",
    status: "Executed",
  },
];

export default function OrderHistoryTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={orderHistoryColumns}
        data={orderHistoryData}
        getRowKey={(row) => row.id}
        emptyText="No order history"
      />
    </div>
  );
}
