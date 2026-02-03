import Image from "next/image";
import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

type OrderTabType =
  | "limitMarket"
  | "trailingStop"
  | "tpSl"
  | "trigger"
  | "iceberg"
  | "twap";

// Base type for common fields
type BaseOrderType = {
  id: string;
  dateTime: string;
  direction: {
    side: "Open long" | "Open short" | "Close long" | "Close short";
    mode: "Cross" | "Isolated";
  };
  pair: string;
  marginCoin: string;
};

// Limit/Market order type
export type LimitMarketOrderType = BaseOrderType & {
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

// Trailing Stop order type
export type TrailingStopOrderType = BaseOrderType & {
  type: string;
  orderQty: string;
  triggerPrice: string;
  callbackRate: string;
  takeProfit?: string;
  stopLoss?: string;
  executionPrice: string;
  reduceOnly: "Yes" | "No";
};

// TP/SL order type
export type TpSlOrderType = BaseOrderType & {
  type: string;
  orderQty: string;
  trigger: string;
  callbackRate: string;
  takeProfit?: string;
  stopLoss?: string;
  executionPrice: string;
  status: string;
};

// Trigger order type
export type TriggerOrderType = BaseOrderType & {
  type: string;
  orderQty: string;
  triggerPrice: string;
  executionPrice: string;
  takeProfit?: string;
  stopLoss?: string;
  reduceOnly: "Yes" | "No";
  status: string;
};

// Iceberg order type
export type IcebergOrderType = BaseOrderType & {
  orderType: string;
  totalQty: string;
  filledQty: string;
  avgFilledPrice: string;
  priceLimit: string;
  orderPreferences: string;
  reduceOnly: "Yes" | "No";
  status: string;
};

// TWAP order type
export type TwapOrderType = BaseOrderType & {
  orderType: string;
  totalQty: string;
  filledQty: string;
  avgFilledPrice: string;
  frequency: string;
  totalRunningTime: string;
  runningTime: string;
  reduceOnly: "Yes" | "No";
};

// Column definitions for Limit/Market
const limitMarketColumns: Column<LimitMarketOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
        <span>Order Type</span>
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
        <span>Order Quantity |</span>
        <span>Filled Quantity</span>
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
        <span>Take Profit |</span>
        <span>Stop Loss</span>
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
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "actions",
    header: (
      <button
        type="button"
        className="cursor-pointer px-3 py-2 rounded-lg text-[12px] leading-[18px] text-[#111111] hover:bg-[#F1EBFD] hover:text-[#703AE6]"
      >
        Cancel all
      </button>
    ),
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Chase
        </button>
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[140px]",
  },
];

// Column definitions for Trailing Stop
const trailingStopColumns: Column<TrailingStopOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "orderQty",
    header: "Order Quantity",
    accessorKey: "orderQty",
  },
  {
    id: "triggerPrice",
    header: "Trigger price",
    accessorKey: "triggerPrice",
  },
  {
    id: "callbackRate",
    header: "Callback rate",
    accessorKey: "callbackRate",
  },
  {
    id: "tpSl",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Take Profit |</span>
        <span>Stop Loss</span>
      </div>
    ),
    render: (row) => (
      <div className="flex gap-2.5">
        <span>{row.takeProfit ?? "--"}</span>
        <span>/</span>
        <span className="text-[12px]">{row.stopLoss ?? "--"}</span>
      </div>
    ),
  },
  {
    id: "executionPrice",
    header: "Execution Price",
    accessorKey: "executionPrice",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "actions",
    header: (
      <button
        type="button"
        className="cursor-pointer px-3 py-2 rounded-lg text-[12px] leading-[18px] text-[#111111] hover:bg-[#F1EBFD] hover:text-[#703AE6]"
      >
        Cancel all
      </button>
    ),
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[100px]",
  },
];

// Column definitions for TP/SL
const tpSlColumns: Column<TpSlOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "orderQty",
    header: "Order Quantity",
    accessorKey: "orderQty",
  },
  {
    id: "trigger",
    header: "Trigger",
    accessorKey: "trigger",
  },
  {
    id: "callbackRate",
    header: "Callback rate",
    accessorKey: "callbackRate",
  },
  {
    id: "tpSl",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Take Profit |</span>
        <span>Stop Loss</span>
      </div>
    ),
    render: (row) => (
      <div className="flex gap-2.5">
        <span>{row.takeProfit ?? "--"}</span>
        <span>/</span>
        <span className="text-[12px]">{row.stopLoss ?? "--"}</span>
      </div>
    ),
  },
  {
    id: "executionPrice",
    header: "Execution Price",
    accessorKey: "executionPrice",
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
  },
  {
    id: "actions",
    header: (
      <button
        type="button"
        className="cursor-pointer px-3 py-2 rounded-lg text-[12px] leading-[18px] text-[#111111] hover:bg-[#F1EBFD] hover:text-[#703AE6]"
      >
        Cancel all
      </button>
    ),
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[100px]",
  },
];

// Column definitions for Trigger
const triggerColumns: Column<TriggerOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
    id: "type",
    header: "Type",
    accessorKey: "type",
  },
  {
    id: "orderQty",
    header: "Order Quantity",
    accessorKey: "orderQty",
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
    id: "tpSl",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Take profit |</span>
        <span>Stop Loss</span>
      </div>
    ),
    render: (row) => (
      <div className="flex gap-2.5">
        <span>{row.takeProfit ?? "--"}</span>
        <span>/</span>
        <span className="text-[12px]">{row.stopLoss ?? "--"}</span>
      </div>
    ),
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
  },
  {
    id: "actions",
    header: (
      <button
        type="button"
        className="cursor-pointer px-3 py-2 rounded-lg text-[12px] leading-[18px] text-[#111111] hover:bg-[#F1EBFD] hover:text-[#703AE6]"
      >
        Cancel all
      </button>
    ),
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[100px]",
  },
];

// Column definitions for Iceberg
const icebergColumns: Column<IcebergOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
    header: "Order Type",
    accessorKey: "orderType",
  },
  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Total Quantity |</span>
        <span>Filled Quantity</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.totalQty}</span>
        <span>{row.filledQty}</span>
      </div>
    ),
  },
  {
    id: "avgFilledPrice",
    header: "Avg. filled price",
    accessorKey: "avgFilledPrice",
  },
  {
    id: "priceLimit",
    header: "Price Limit",
    accessorKey: "priceLimit",
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
    id: "status",
    header: "Status",
    accessorKey: "status",
  },
  {
    id: "actions",
    header: (
      <button
        type="button"
        className="cursor-pointer px-3 py-2 rounded-lg text-[12px] leading-[18px] text-[#111111] hover:bg-[#F1EBFD] hover:text-[#703AE6]"
      >
        Cancel all
      </button>
    ),
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[100px]",
  },
];

// Column definitions for TWAP
const twapColumns: Column<TwapOrderType>[] = [
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
      <div
        className={`flex flex-col ${row.direction.side.includes("long") ? "text-[#16A3A3]" : "text-[#FC5457]"}`}
      >
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
    header: "Order Type",
    accessorKey: "orderType",
  },
  {
    id: "quantity",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Total Quantity |</span>
        <span>Filled Quantity</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.totalQty}</span>
        <span>{row.filledQty}</span>
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
    header: "Total Running Time",
    accessorKey: "totalRunningTime",
  },
  {
    id: "runningTime",
    header: "Running Time",
    accessorKey: "runningTime",
  },
  {
    id: "reduceOnly",
    header: "Reduce-only",
    accessorKey: "reduceOnly",
  },
  {
    id: "actions",
    header: "Action",
    sticky: true,
    render: () => (
      <div className="flex gap-2 justify-end">
        <button className="cursor-pointer px-3 py-2 border-[0.75px] border-[#E2E2E2] bg-[#FFFFFF] rounded-md text-[12px] leading-[18px] text-[#111111]">
          Cancel
        </button>
      </div>
    ),
    align: "right",
    className: "min-w-[100px]",
  },
];

// Mock data for Limit/Market orders
const limitMarketData: LimitMarketOrderType[] = Array.from(
  { length: 5 },
  (_, i) => ({
    id: `limit-${i + 1}`,
    dateTime: "2025-10-23 14:25:46",
    direction: {
      side: i % 2 === 0 ? "Open long" : "Open short",
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
  })
);

// Mock data for Trailing Stop orders
const trailingStopData: TrailingStopOrderType[] = Array.from(
  { length: 3 },
  (_, i) => ({
    id: `trailing-${i + 1}`,
    dateTime: "2025-10-23 15:30:22",
    direction: {
      side: i % 2 === 0 ? "Close long" : "Close short",
      mode: "Isolated",
    },
    pair: "ETHSUSDT",
    marginCoin: "SUSDT",
    type: "Trailing Stop",
    orderQty: "1.25 ETH",
    triggerPrice: "3,450.50",
    callbackRate: "2.5%",
    takeProfit: "3,600.00",
    stopLoss: "3,200.00",
    executionPrice: "Market",
    reduceOnly: "Yes",
  })
);

// Mock data for TP/SL orders
const tpSlData: TpSlOrderType[] = [];

// Mock data for Trigger orders
const triggerData: TriggerOrderType[] = Array.from({ length: 2 }, (_, i) => ({
  id: `trigger-${i + 1}`,
  dateTime: "2025-10-23 16:45:10",
  direction: {
    side: i % 2 === 0 ? "Open long" : "Open short",
    mode: "Cross",
  },
  pair: "BTCSUSDT",
  marginCoin: "SUSDT",
  type: "Stop Market",
  orderQty: "0.1 BTC",
  triggerPrice: "102,500.00",
  executionPrice: "Market",
  takeProfit: "110,000.00",
  stopLoss: "95,000.00",
  reduceOnly: "No",
  status: "Pending",
}));

// Mock data for Iceberg orders
const icebergData: IcebergOrderType[] = [];

// Mock data for TWAP orders
const twapData: TwapOrderType[] = [];

interface OpenOrdersTableProps {
  activeTab?: OrderTabType;
}

export default function OpenOrdersTable({
  activeTab = "limitMarket",
}: OpenOrdersTableProps) {
  const renderTable = () => {
    switch (activeTab) {
      case "limitMarket":
        return (
          <Table
            columns={limitMarketColumns}
            data={limitMarketData}
            getRowKey={(row) => row.id}
            emptyText="No limit/market orders"
          />
        );
      case "trailingStop":
        return (
          <Table
            columns={trailingStopColumns}
            data={trailingStopData}
            getRowKey={(row) => row.id}
            emptyText="No trailing stop orders"
          />
        );
      case "tpSl":
        return (
          <Table
            columns={tpSlColumns}
            data={tpSlData}
            getRowKey={(row) => row.id}
            emptyText="No TP/SL orders"
          />
        );
      case "trigger":
        return (
          <Table
            columns={triggerColumns}
            data={triggerData}
            getRowKey={(row) => row.id}
            emptyText="No trigger orders"
          />
        );
      case "iceberg":
        return (
          <Table
            columns={icebergColumns}
            data={icebergData}
            getRowKey={(row) => row.id}
            emptyText="No iceberg orders"
          />
        );
      case "twap":
        return (
          <Table
            columns={twapColumns}
            data={twapData}
            getRowKey={(row) => row.id}
            emptyText="No TWAP orders"
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
