import { Column } from "../ui/Table";
import { Table } from "../ui/Table";

export type TransactionHistoryType = {
  id: string;
  dateTime: string;
  direction: "Open long" | "Open short" | "Close long" | "Close short";
  pair: string;
  filledQty: string;
  filledPrice: string;
  role: "Taker" | "Maker";
  fee: string;
};

const transactionHistoryColumns: Column<TransactionHistoryType>[] = [
  {
    id: "dateTime",
    header: "Time",
    render: (row) => {
      const [date, time] = row.dateTime.split(" ");
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-[12px] leading-[18px] font-medium text-[#919191]">
            {time}
          </span>
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
    render: (row) => <span className="text-[#8E8E92]">{row.fee}</span>,
    align: "right",
  },
];

const transactionHistoryData: TransactionHistoryType[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: `tx-${i + 1}`,
    dateTime: "2025-10-23 14:25:46",
    direction: i % 2 === 0 ? "Open long" : "Close short",
    pair: "SBTCSUSDT",
    filledQty: "0.050 SBTC",
    filledPrice: "105,081.2",
    role: i % 2 === 0 ? "Maker" : "Taker",
    fee: "0.00012 USDT",
  })
);

export default function TransactionHistoryTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={transactionHistoryColumns}
        data={transactionHistoryData}
        getRowKey={(row) => row.id}
        emptyText="No transaction history"
      />
    </div>
  );
}
