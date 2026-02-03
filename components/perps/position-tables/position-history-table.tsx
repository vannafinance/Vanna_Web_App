import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";

export type PositionHistoryType = {
  id: string;
  futures: string;
  openTime: string;
  avgEntryPrice: string;
  avgExitPrice: string;
  closedQty: string;
  pnl: string;
  roi: string;
  closedTime: string;
};

const positionHistoryColumns: Column<PositionHistoryType>[] = [
  {
    id: "futures",
    header: "Futures",
    accessorKey: "futures",
  },

  {
    id: "openTime",
    header: "Open Time",
    render: (row) => {
      const [date, time] = row.openTime.split(" ");
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-[11px] text-[#8E8E92]">{time}</span>
        </div>
      );
    },
  },

  {
    id: "avgPrice",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Avg. entry price</span>
        <span>Avg. exit price</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col">
        <span>{row.avgEntryPrice}</span>
        <span className="text-[11px] text-[#8E8E92]">{row.avgExitPrice}</span>
      </div>
    ),
  },

  {
    id: "closedQty",
    header: "Closed Quantity",
    accessorKey: "closedQty",
  },

  {
    id: "pnl",
    header: "Position PnL",
    render: (row) => (
      <span
        className={
          row.pnl.startsWith("-") ? "text-[#E5533D]" : "text-[#16A3A3]"
        }
      >
        {row.pnl}
      </span>
    ),
  },

  {
    id: "roi",
    header: "Position ROI",
    render: (row) => (
      <span
        className={
          row.roi.startsWith("-") ? "text-[#E5533D]" : "text-[#16A3A3]"
        }
      >
        {row.roi}
      </span>
    ),
  },

  {
    id: "closedTime",
    header: "Closed Time",
    render: (row) => {
      const [date, time] = row.closedTime.split(" ");
      return (
        <div className="flex flex-col">
          <span>{date}</span>
          <span className="text-[11px] text-[#8E8E92]">{time}</span>
        </div>
      );
    },
  },

  {
    id: "action",
    header: "Action",
    render: () => <div>--</div>,
    align: "right",
    className: "min-w-[100px]",
  },
];

const positionHistoryData: PositionHistoryType[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `trade-${i + 1}`,
    futures: "SBTCSUSDT",
    openTime: "2025-10-23 12:10:30",
    avgEntryPrice: "104,120.5",
    avgExitPrice: "105,081.2",
    closedQty: "0.050 SBTC",
    pnl: i % 2 === 0 ? "+12.45 USDT" : "-6.30 USDT",
    roi: i % 2 === 0 ? "+1.26%" : "-0.64%",
    closedTime: "2025-10-23 14:25:46",
  }),
);

export default function PositionHistoryTable() {
  return (
    <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
      <Table
        columns={positionHistoryColumns}
        data={positionHistoryData}
        getRowKey={(row) => row.id}
        emptyText="No position history"
      />
    </div>
  );
}
