import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

type OrderHistoryTabType =
  | "limitMarket"
  | "trailingStop"
  | "tpSl"
  | "trigger"
  | "iceberg"
  | "twap";

// Base type for common fields
type BaseHistoryType = {
  id: string;
  dateTime: string;
  direction: {
    side: "Open long" | "Open short" | "Close long" | "Close short";
  };
  pair: string;
  marginCoin: string;
};

// Limit/Market history type
export type LimitMarketHistoryType = BaseHistoryType & {
  timeInForce: string;
  orderType: string;
  orderQty: string;
  filledQty: string;
  price: string;
  avgFilledPrice: string;
  reduceOnly: "Yes" | "No";
  fee: string;
  status: "Executed" | "Canceled" | "Partially filled";
};

// Trailing Stop history type
export type TrailingStopHistoryType = BaseHistoryType & {
  type: string;
  orderQty: string;
  executeAmount: string;
  triggerPrice: string;
  executionPrice: string;
  callbackRate: string;
  reduceOnly: "Yes" | "No";
  status: "Executed" | "Canceled" | "Expired";
  notes: string;
};

// TP/SL history type
export type TpSlHistoryType = BaseHistoryType & {
  type: string;
  orderQty: string;
  executeAmount: string;
  triggerRequirements: string;
  executionPrice: string;
  callbackRate: string;
  status: "Executed" | "Canceled" | "Expired";
  notes: string;
};

// Trigger history type
export type TriggerHistoryType = BaseHistoryType & {
  type: string;
  orderQty: string;
  executeAmount: string;
  triggerPrice: string;
  executionPrice: string;
  reduceOnly: "Yes" | "No";
  status: "Executed" | "Canceled" | "Expired";
  notes: string;
};

// Iceberg history type
export type IcebergHistoryType = BaseHistoryType & {
  orderType: string;
  orderQty: string;
  filledQty: string;
  avgFilledPrice: string;
  orderPreferences: string;
  reduceOnly: "Yes" | "No";
  terminationTime: string;
  status: "Completed" | "Canceled" | "Expired";
};

// TWAP history type
export type TwapHistoryType = BaseHistoryType & {
  orderType: string;
  orderQty: string;
  filledQty: string;
  avgFilledPrice: string;
  frequency: string;
  totalRunningTime: string;
  reduceOnly: "Yes" | "No";
  terminationTime: string;
  status: "Completed" | "Canceled" | "Expired";
};

// Column definitions for Limit/Market History
const limitMarketHistoryColumns: Column<LimitMarketHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
        <span className="text-[11px]">{row.avgFilledPrice}</span>
      </div>
    ),
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
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
          row.status === "Executed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
    align: "right",
  },
];

// Column definitions for Trailing Stop History
const trailingStopHistoryColumns: Column<TrailingStopHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Order quantity |</span>
        <span>Execute amount</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.orderQty}</span>
        <span className="text-[11px]">{row.executeAmount}</span>
      </div>
    ),
  },
  {
    id: "triggerPrice",
    header: "Trigger price",
    accessorKey: "triggerPrice",
  },
  {
    id: "executionPrice",
    header: "Execution price",
    accessorKey: "executionPrice",
  },
  {
    id: "callbackRate",
    header: "Callback rate",
    accessorKey: "callbackRate",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Executed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "notes",
    header: "Notes",
    accessorKey: "notes",
    align: "right",
  },
];

// Column definitions for TP/SL History
const tpSlHistoryColumns: Column<TpSlHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Order quantity |</span>
        <span>Execute amount</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.orderQty}</span>
        <span className="text-[11px]">{row.executeAmount}</span>
      </div>
    ),
  },
  {
    id: "triggerRequirements",
    header: "Trigger requirements",
    accessorKey: "triggerRequirements",
  },
  {
    id: "executionPrice",
    header: "Execution price",
    accessorKey: "executionPrice",
  },
  {
    id: "callbackRate",
    header: "Callback rate",
    accessorKey: "callbackRate",
  },
  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Executed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "notes",
    header: "Notes",
    accessorKey: "notes",
    align: "right",
  },
];

// Column definitions for Trigger History
const triggerHistoryColumns: Column<TriggerHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Order quantity |</span>
        <span>Execute amount</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.orderQty}</span>
        <span className="text-[11px]">{row.executeAmount}</span>
      </div>
    ),
  },
  {
    id: "triggerPrice",
    header: "Trigger price",
    accessorKey: "triggerPrice",
  },
  {
    id: "executionPrice",
    header: "Execution price",
    accessorKey: "executionPrice",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Executed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "notes",
    header: "Notes",
    accessorKey: "notes",
    align: "right",
  },
];

// Column definitions for Iceberg History
const icebergHistoryColumns: Column<IcebergHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
    header: "Order type",
    accessorKey: "orderType",
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
    id: "avgFilledPrice",
    header: "Avg. filled price",
    accessorKey: "avgFilledPrice",
  },
  {
    id: "orderPreferences",
    header: "Order preferences",
    accessorKey: "orderPreferences",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "terminationTime",
    header: "Termination time",
    accessorKey: "terminationTime",
  },
  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Completed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "action",
    header: "Action",
    render: () => (
      <button className="cursor-pointer text-[12px] text-[#703AE6] hover:underline">
        Details
      </button>
    ),
    align: "right",
  },
];

// Column definitions for TWAP History
const twapHistoryColumns: Column<TwapHistoryType>[] = [
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
      <span
        className={
          row.direction.side.includes("long")
            ? "text-[#16A3A3]"
            : "text-[#FC5457]"
        }
      >
        {row.direction.side}
      </span>
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
    header: "Order type",
    accessorKey: "orderType",
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
    id: "avgFilledPrice",
    header: "Avg. filled price",
    accessorKey: "avgFilledPrice",
  },
  {
    id: "frequency",
    header: "Frequency",
    accessorKey: "frequency",
  },
  {
    id: "totalRunningTime",
    header: "Total running time",
    accessorKey: "totalRunningTime",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "terminationTime",
    header: "Termination time",
    accessorKey: "terminationTime",
  },
  {
    id: "status",
    header: "Status",
    render: (row) => (
      <span
        className={
          row.status === "Completed" ? "text-[#16A3A3]" : "text-[#FC5457]"
        }
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "action",
    header: "Action",
    render: () => (
      <button className="cursor-pointer text-[12px] text-[#703AE6] hover:underline">
        Details
      </button>
    ),
    align: "right",
  },
];

// Mock data for Limit/Market history
const limitMarketHistoryData: LimitMarketHistoryType[] = [
  {
    id: "lm-history-1",
    dateTime: "2026-02-03 15:05:25",
    direction: { side: "Open long" },
    pair: "SBTCSUSDT",
    marginCoin: "SUSDT",
    timeInForce: "GTC",
    orderType: "Market",
    orderQty: "0.1249",
    filledQty: "0.1249 SBTC",
    price: "Market",
    avgFilledPrice: "78,214.9",
    reduceOnly: "No",
    fee: "5.86142460 SUSDT",
    status: "Executed",
  },
  {
    id: "lm-history-2",
    dateTime: "2026-02-03 14:25:46",
    direction: { side: "Open long" },
    pair: "SBTCSUSDT",
    marginCoin: "SUSDT",
    timeInForce: "GTC",
    orderType: "Limit",
    orderQty: "0.050",
    filledQty: "0.050 SBTC",
    price: "105,126.4",
    avgFilledPrice: "105,126.4",
    reduceOnly: "No",
    fee: "1.05126400 SUSDT",
    status: "Executed",
  },
  {
    id: "lm-history-3",
    dateTime: "2026-02-03 14:20:12",
    direction: { side: "Close long" },
    pair: "ETHUSDT",
    marginCoin: "USDT",
    timeInForce: "FOK",
    orderType: "Market",
    orderQty: "0.200",
    filledQty: "0.200 ETH",
    price: "Market",
    avgFilledPrice: "3,450.50",
    reduceOnly: "Yes",
    fee: "0.83000000 USDT",
    status: "Executed",
  },
];

// Mock data for Trailing Stop history
const trailingStopHistoryData: TrailingStopHistoryType[] = [];

// Mock data for TP/SL history
const tpSlHistoryData: TpSlHistoryType[] = [];

// Mock data for Trigger history
const triggerHistoryData: TriggerHistoryType[] = [];

// Mock data for Iceberg history
const icebergHistoryData: IcebergHistoryType[] = [];

// Mock data for TWAP history
const twapHistoryData: TwapHistoryType[] = [];

interface OrderHistoryTableProps {
  activeTab?: OrderHistoryTabType;
}

export default function OrderHistoryTable({
  activeTab = "limitMarket",
}: OrderHistoryTableProps) {
  const renderTable = () => {
    switch (activeTab) {
      case "limitMarket":
        return (
          <Table
            columns={limitMarketHistoryColumns}
            data={limitMarketHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No limit/market order history"
          />
        );
      case "trailingStop":
        return (
          <Table
            columns={trailingStopHistoryColumns}
            data={trailingStopHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No trailing stop order history"
          />
        );
      case "tpSl":
        return (
          <Table
            columns={tpSlHistoryColumns}
            data={tpSlHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No TP/SL order history"
          />
        );
      case "trigger":
        return (
          <Table
            columns={triggerHistoryColumns}
            data={triggerHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No trigger order history"
          />
        );
      case "iceberg":
        return (
          <Table
            columns={icebergHistoryColumns}
            data={icebergHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No iceberg order history"
          />
        );
      case "twap":
        return (
          <Table
            columns={twapHistoryColumns}
            data={twapHistoryData}
            getRowKey={(row) => row.id}
            emptyText="No TWAP order history"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      {renderTable()}
    </div>
  );
}