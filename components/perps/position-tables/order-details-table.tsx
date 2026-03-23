import { useTheme } from "@/contexts/theme-context";
import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

export type OrderDetailsType = {
  id: string;
  dateTime: string;
  direction: "Open long" | "Open short" | "Close long" | "Close short";
  pair: string;
  filledQty: string;
  filledPrice: string;
  role: "Taker" | "Maker";
  fee: string;
};

const orderDetailsColumns: Column<OrderDetailsType>[] = [
  {
    id: "dateTime",
    header: "Time",
    render: (row) => {
      const [date, time] = row.dateTime.split(" ");
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
      <span
        className={
          row.direction.includes("long") ? "text-[#16A3A3]" : "text-[#E5533D]"
        }
      >
        {row.direction}
      </span>
    ),
  },

  {
    id: "pair",
    header: "Futures | Coin",
    render: (row) => <span className="font-medium">{row.pair}</span>,
  },

  {
    id: "filledQty",
    header: "Filled quantity",
    accessorKey: "filledQty",
  },

  {
    id: "filledPrice",
    header: "Filled price",
    accessorKey: "filledPrice",
  },

  {
    id: "role",
    header: "Taker/Maker",
    accessorKey: "role",
  },

  {
    id: "fee",
    header: "Fee",
    render: (row) => <span>{row.fee}</span>,
    align: "right",
  },
];

const orderDetailsData: OrderDetailsType[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `detail-${i + 1}`,
    dateTime: "2025-10-23 14:25:46",
    direction: i % 2 === 0 ? "Open long" : "Close short",
    pair: "SBTCSUSDT",
    filledQty: "0.050 SBTC",
    filledPrice: "105,081.2",
    role: i % 2 === 0 ? "Maker" : "Taker",
    fee: "0.00012 USDT",
  }),
);

export default function OrderDetailsTable() {
  const { isDark } = useTheme();
  
  return (
    <div className={`p-2 rounded-lg border ${isDark ? "border-[#333333] bg-[#222222]" : "border-[#E2E2E2] bg-[#F7F7F7]"}`}>
      <Table
        columns={orderDetailsColumns}
        data={orderDetailsData}
        getRowKey={(row) => row.id}
        emptyText="No order details"
      />
    </div>
  );
}
