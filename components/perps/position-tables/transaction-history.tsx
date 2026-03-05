import { useTheme } from "@/contexts/theme-context";
import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

export type TransactionHistoryType = {
  id: string;
  dateTime: string;
  coin: string;
  marginMode: "Cross" | "Isolated";
  futures: string;
  type: string;
  amount: string;
  fee: string;
  walletBalance: string;
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
    id: "coin",
    header: "Coin",
    accessorKey: "coin",
  },

  {
    id: "marginMode",
    header: "Margin mode",
    accessorKey: "marginMode",
  },

  {
    id: "futures",
    header: "Futures",
    accessorKey: "futures",
  },

  {
    id: "type",
    header: "Type",
    accessorKey: "type",
  },

  {
    id: "amount",
    header: "Amount",
    render: (row) => (
      <span
        className={
          row.amount.startsWith("-") ? "text-[#E5533D]" : "text-[#16A3A3]"
        }
      >
        {row.amount}
      </span>
    ),
  },

  {
    id: "fee",
    header: "Fee",
    accessorKey: "fee",
  },

  {
    id: "walletBalance",
    header: "Wallet Balance",
    accessorKey: "walletBalance",
    align: "right",
  },
];

const transactionHistoryData: TransactionHistoryType[] = [
  {
    id: "tx-1",
    dateTime: "2025-10-23 14:25:46",
    coin: "SUSDT",
    marginMode: "Cross",
    futures: "SBTCSUSDT",
    type: "Transfer In",
    amount: "+100.00 SUSDT",
    fee: "0.00 SUSDT",
    walletBalance: "1,250.50 SUSDT",
  },
  {
    id: "tx-2",
    dateTime: "2025-10-23 13:15:22",
    coin: "SUSDT",
    marginMode: "Cross",
    futures: "SETHSUSDT",
    type: "Realized PnL",
    amount: "+25.50 SUSDT",
    fee: "0.00 SUSDT",
    walletBalance: "1,150.50 SUSDT",
  },
  {
    id: "tx-3",
    dateTime: "2025-10-23 12:30:10",
    coin: "SUSDT",
    marginMode: "Isolated",
    futures: "SBTCSUSDT",
    type: "Trading Fee",
    amount: "-1.25 SUSDT",
    fee: "1.25 SUSDT",
    walletBalance: "1,125.00 SUSDT",
  },
  {
    id: "tx-4",
    dateTime: "2025-10-22 18:45:33",
    coin: "SUSDT",
    marginMode: "Cross",
    futures: "SXPRSUSDT",
    type: "Funding Fee",
    amount: "-0.85 SUSDT",
    fee: "0.85 SUSDT",
    walletBalance: "1,126.25 SUSDT",
  },
  {
    id: "tx-5",
    dateTime: "2025-10-22 16:20:15",
    coin: "USDT",
    marginMode: "Isolated",
    futures: "ETHUSDT",
    type: "Transfer Out",
    amount: "-50.00 USDT",
    fee: "0.00 USDT",
    walletBalance: "1,127.10 USDT",
  },
];

export default function TransactionHistoryTable() {
  const { isDark } = useTheme();
  
  return (
    <div className={`p-2 rounded-lg border ${isDark ? "border-[#333333] bg-[#222222]" : "border-[#E2E2E2] bg-[#F7F7F7]"}`}>
      <Table
        columns={transactionHistoryColumns}
        data={transactionHistoryData}
        getRowKey={(row) => row.id}
        emptyText="No transaction history"
      />
    </div>
  );
}
