"use client";

import { useState } from "react";
import Image from "next/image";
import { Column } from "../../ui/Table";
import { Table } from "../../ui/Table";
import { Modal } from "../../ui/modal";
import { ClosePositionModal } from "../modals/close-position-modal";
import { TpSlModal, TpSlMode } from "../modals/tp-sl-modal";
import { ColumnPreferenceItem } from "@/lib/types";
import { SharePositionModal } from "../modals/share-position-modal";

export type ActivePositionType = {
  id: string;
  futures: {
    pair: string;
    leverage: string;
    mode: "Cross" | "Isolated";
    side: "Long" | "Short";
  };
  positionSize: {
    size: string;
  };
  positionValue: string;
  entryPrice: string;
  markPrice: string;
  estLiquidationPrice: string;
  margin: {
    amount: string;
    usdValue: string;
  };
  tieredMaintenanceMarginRate: string;
  unrealizedPnl: {
    amount: string;
    percentage: string;
    usdValue: string;
  };
  realizedPnl: {
    amount: string;
    percentage: string;
    usdValue: string;
  };
  funding: string;
  marginStatus: "Yes" | "No";
  mmr: "Yes" | "No";
  entireTpSl: string | null;
  partialTpSl: string | null;
  trailingTpSl: string | null;
  mmrSl: string | null;
};

const getActivePositionsColumns = (
  onOpenModal: (position: ActivePositionType, type: "market" | "limit") => void,
  onOpenTpSlModal: (position: ActivePositionType, mode: TpSlMode) => void,
  onOpenShareCard: (position: ActivePositionType) => void,
): Column<ActivePositionType>[] => [
  {
    id: "futures",
    header: "Futures",
    render: (row) => (
      <div className="flex  gap-2.5 justify-between  w-[140px]">
        <div className="flex flex-col items-start">
          <span>{row.futures.pair}</span>
          <span
            className={
              row.futures.side === "Long" ? "text-[#24A0A9]" : "text-[#FC5457]"
            }
          >
            {row.futures.side} {row.futures.leverage} {row.futures.mode}
          </span>
        </div>
        <button type="button" className="cursor-pointer">
          <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
        </button>
      </div>
    ),
  },
  {
    id: "positionSize",
    header: "Position Size",
    render: (row) => <span>{row.positionSize.size}</span>,
  },
  {
    id: "positionValue",
    header: "Position Value",
    render: (row) => (
      <div className="w-[140px]">
        <span>{row.positionValue}</span>
      </div>
    ),
  },
  {
    id: "entryMarkPrice",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Entry Price</span>
        <span>Mark Price</span>
      </div>
    ),
    render: (row) => (
      <div className="flex flex-col w-[140px]">
        <span>{row.entryPrice}</span>
        <span>{row.markPrice}</span>
      </div>
    ),
  },
  {
    id: "estLiquidation",
    header: (
      <div className="flex flex-col leading-tight w-[120px]">
        <span>Est. liquidation</span>
        <span>price</span>
      </div>
    ),
    render: (row) => <span>{row.estLiquidationPrice}</span>,
  },
  {
    id: "margin",
    header: "Margin",
    render: (row) => (
      <div className="flex  justify-between w-[140px]">
        <div className="flex flex-col ">
          <span>{row.margin.amount}</span>
          <span>{row.margin.usdValue}</span>
        </div>
        <button type="button" className="cursor-pointer">
          <Image src="/icons/edit.svg" alt="edit" width={16} height={16} />
        </button>
      </div>
    ),
  },
  {
    id: "tieredMaintenanceMarginRate",
    header: (
      <div className="flex flex-col leading-tight">
        <span>Tiered maintenance</span>
        <span>margin rate</span>
      </div>
    ),
    render: (row) => <span>{row.tieredMaintenanceMarginRate}</span>,
  },
  {
    id: "unrealizedPnl",
    header: "Unrealized PNL (ROE)",
    render: (row) => {
      const isProfit = !row.unrealizedPnl.amount.startsWith("-");
      const colorClass = isProfit ? "text-[#24A0A9]" : "text-[#FC5457]";
      return (
        <div className="flex  justify-between w-[160px]">
          <div className="flex flex-col ">
            <span className={colorClass}>{row.unrealizedPnl.amount}</span>
            <span className={colorClass}>
              ({row.unrealizedPnl.percentage}) ≈{row.unrealizedPnl.usdValue}
            </span>
          </div>
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => onOpenShareCard(row)}
          >
            <Image
              src="/icons/share-icon.svg"
              alt="share"
              width={16}
              height={16}
            />
          </button>
        </div>
      );
    },
  },
  {
    id: "realizedPnl",
    header: "Realized PnL",
    render: (row) => {
      const isProfit = !row.realizedPnl.amount.startsWith("-");
      const colorClass = isProfit ? "text-[#24A0A9]" : "text-[#FC5457]";
      return (
        <div className="flex flex-col w-[160px]">
          <span className={colorClass}>{row.realizedPnl.amount}</span>
          <span className={colorClass}>
            ({row.realizedPnl.percentage}) ≈{row.realizedPnl.usdValue}
          </span>
        </div>
      );
    },
  },
  {
    id: "funding",
    header: "Funding",
    render: (row) => (
      <span
        className={
          row.funding.startsWith("+") ? "text-[#24A0A9]" : "text-[#FC5457] "
        }
      >
        {row.funding}
      </span>
    ),
  },
  {
    id: "mmr",
    header: "MMR",
    render: (row) => <span>{row.mmr}</span>,
  },
  {
    id: "entireTpSl",
    header: "Entire TP/SL",
    render: (row) => (
      <button
        type="button"
        onClick={() => onOpenTpSlModal(row, "entire_position")}
        className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 pl-1 pr-3 gap-1 text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
      >
        <Image src="/icons/add-icon.svg" alt="add" width={16} height={16} />
        <span>Add</span>
      </button>
    ),
  },
  {
    id: "partialTpSl",
    header: "Partial TP/SL",
    render: (row) => (
      <button
        type="button"
        onClick={() => onOpenTpSlModal(row, "partial_position")}
        className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 pl-1 pr-3 gap-1 text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
      >
        <Image src="/icons/add-icon.svg" alt="add" width={16} height={16} />
        <span>Add</span>
      </button>
    ),
  },
  {
    id: "trailingTpSl",
    header: "Trailing TP/SL",
    render: (row) => (
      <button
        type="button"
        onClick={() => onOpenTpSlModal(row, "trailing")}
        className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 pl-1 pr-3 gap-1 text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
      >
        <Image src="/icons/add-icon.svg" alt="add" width={16} height={16} />
        <span>Add</span>
      </button>
    ),
  },
  {
    id: "mmrSl",
    header: "MMR SL",
    render: (row) => (
      <button
        type="button"
        onClick={() => onOpenTpSlModal(row, "mmr_sl")}
        className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 pl-1 pr-3 gap-1 text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
      >
        <Image src="/icons/add-icon.svg" alt="add" width={16} height={16} />
        <span>Add</span>
      </button>
    ),
  },
  {
    id: "close",
    header: "Close",
    align: "left",
    sticky: true,
    render: (row) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenModal(row, "market")}
          className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 px-3  text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => onOpenModal(row, "limit")}
          className="cursor-pointer flex items-center bg-[#FFFFFF] border-[0.75px] border-[#E2E2E2] rounded-md py-2 px-3  text-[12px] leading-[18px] font-medium text-[#111111] hover:text-[#703AE6]"
        >
          Limit
        </button>
      </div>
    ),
  },
];

// Sample data
const activePositionsData: ActivePositionType[] = [
  {
    id: "pos-1",
    futures: { pair: "BTCUSDT", leverage: "11x", mode: "Isolated", side: "Long" },
    positionSize: { size: "0.020" },
    positionValue: "1,900.60 USDT",
    entryPrice: "91,421.3",
    markPrice: "95,030.1",
    estLiquidationPrice: "81,045.2",
    margin: { amount: "214.97 USDT", usdValue: "≈214.88 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "71.98 USDT",
      percentage: "41.66%",
      usdValue: "71.95 USD",
    },
    realizedPnl: {
      amount: "12.40 USDT",
      percentage: "7.20%",
      usdValue: "12.38 USD",
    },
    funding: "+13.16",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-2",
    futures: { pair: "ETHUSDT", leverage: "8x", mode: "Cross", side: "Short" },
    positionSize: { size: "0.50" },
    positionValue: "1,620.40 USDT",
    entryPrice: "3,010.5",
    markPrice: "2,880.8",
    estLiquidationPrice: "2,410.0",
    margin: { amount: "202.55 USDT", usdValue: "≈202.55 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "-115.20 USDT",
      percentage: "-35.90%",
      usdValue: "-115.20 USD",
    },
    realizedPnl: {
      amount: "-18.10 USDT",
      percentage: "-5.60%",
      usdValue: "-18.10 USD",
    },
    funding: "-4.21",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-3",
    futures: { pair: "SOLUSDT", leverage: "15x", mode: "Isolated", side: "Long" },
    positionSize: { size: "6.00" },
    positionValue: "780.12 USDT",
    entryPrice: "118.2",
    markPrice: "130.0",
    estLiquidationPrice: "92.6",
    margin: { amount: "52.01 USDT", usdValue: "≈52.01 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "70.80 USDT",
      percentage: "13.90%",
      usdValue: "70.80 USD",
    },
    realizedPnl: {
      amount: "0.00 USDT",
      percentage: "0.00%",
      usdValue: "0.00 USD",
    },
    funding: "+1.82",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-4",
    futures: { pair: "BNBUSDT", leverage: "5x", mode: "Cross", side: "Short" },
    positionSize: { size: "1.20" },
    positionValue: "690.60 USDT",
    entryPrice: "540.5",
    markPrice: "515.2",
    estLiquidationPrice: "410.0",
    margin: { amount: "138.12 USDT", usdValue: "≈138.12 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "-42.00 USDT",
      percentage: "-6.48%",
      usdValue: "-42.00 USD",
    },
    realizedPnl: {
      amount: "18.70 USDT",
      percentage: "2.90%",
      usdValue: "18.70 USD",
    },
    funding: "-0.95",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-5",
    futures: { pair: "AVAXUSDT", leverage: "20x", mode: "Isolated", side: "Long" },
    positionSize: { size: "15.0" },
    positionValue: "525.30 USDT",
    entryPrice: "32.5",
    markPrice: "35.02",
    estLiquidationPrice: "27.8",
    margin: { amount: "26.26 USDT", usdValue: "≈26.26 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "37.80 USDT",
      percentage: "6.72%",
      usdValue: "37.80 USD",
    },
    realizedPnl: {
      amount: "0.00 USDT",
      percentage: "0.00%",
      usdValue: "0.00 USD",
    },
    funding: "+0.62",
    marginStatus: "Yes",
    mmr: "Yes",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-6",
    futures: { pair: "XRPUSDT", leverage: "10x", mode: "Cross", side: "Short" },
    positionSize: { size: "2000" },
    positionValue: "980.00 USDT",
    entryPrice: "0.49",
    markPrice: "0.46",
    estLiquidationPrice: "0.39",
    margin: { amount: "98.00 USDT", usdValue: "≈98.00 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "-60.00 USDT",
      percentage: "-6.12%",
      usdValue: "-60.00 USD",
    },
    realizedPnl: {
      amount: "10.20 USDT",
      percentage: "1.04%",
      usdValue: "10.20 USD",
    },
    funding: "-0.42",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-7",
    futures: { pair: "ADAUSDT", leverage: "12x", mode: "Isolated", side: "Long" },
    positionSize: { size: "3000" },
    positionValue: "1,050.00 USDT",
    entryPrice: "0.32",
    markPrice: "0.35",
    estLiquidationPrice: "0.26",
    margin: { amount: "87.50 USDT", usdValue: "≈87.50 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "90.00 USDT",
      percentage: "8.57%",
      usdValue: "90.00 USD",
    },
    realizedPnl: {
      amount: "0.00 USDT",
      percentage: "0.00%",
      usdValue: "0.00 USD",
    },
    funding: "+0.88",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-8",
    futures: { pair: "DOGEUSDT", leverage: "25x", mode: "Isolated", side: "Short" },
    positionSize: { size: "8000" },
    positionValue: "640.00 USDT",
    entryPrice: "0.082",
    markPrice: "0.075",
    estLiquidationPrice: "0.068",
    margin: { amount: "25.60 USDT", usdValue: "≈25.60 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "-56.00 USDT",
      percentage: "-8.75%",
      usdValue: "-56.00 USD",
    },
    realizedPnl: {
      amount: "0.00 USDT",
      percentage: "0.00%",
      usdValue: "0.00 USD",
    },
    funding: "-0.31",
    marginStatus: "Yes",
    mmr: "Yes",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-9",
    futures: { pair: "MATICUSDT", leverage: "7x", mode: "Cross", side: "Long" },
    positionSize: { size: "1500" },
    positionValue: "885.00 USDT",
    entryPrice: "0.55",
    markPrice: "0.60",
    estLiquidationPrice: "0.44",
    margin: { amount: "126.42 USDT", usdValue: "≈126.42 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "75.00 USDT",
      percentage: "8.47%",
      usdValue: "75.00 USD",
    },
    realizedPnl: {
      amount: "22.10 USDT",
      percentage: "2.50%",
      usdValue: "22.10 USD",
    },
    funding: "+0.55",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },

  {
    id: "pos-10",
    futures: { pair: "LINKUSDT", leverage: "9x", mode: "Isolated", side: "Short" },
    positionSize: { size: "80" },
    positionValue: "1,120.00 USDT",
    entryPrice: "13.2",
    markPrice: "12.4",
    estLiquidationPrice: "10.8",
    margin: { amount: "124.44 USDT", usdValue: "≈124.44 USD" },
    tieredMaintenanceMarginRate: "1.00%",
    unrealizedPnl: {
      amount: "-64.00 USDT",
      percentage: "-5.71%",
      usdValue: "-64.00 USD",
    },
    realizedPnl: {
      amount: "5.60 USDT",
      percentage: "0.50%",
      usdValue: "5.60 USD",
    },
    funding: "-1.12",
    marginStatus: "No",
    mmr: "No",
    entireTpSl: null,
    partialTpSl: null,
    trailingTpSl: null,
    mmrSl: null,
  },
];

export default function ActivePositionsTable({
  filter = "All",
  sort = "default",
  visibleColumns = [],
  columnItems = [],
  columnOrder = [],
}: {
  filter?: string;
  sort?: string;
  visibleColumns?: string[];
  columnItems?: ColumnPreferenceItem[];
  columnOrder?: string[];
}) {
  const [closeModal, setCloseModal] = useState<{
    isOpen: boolean;
    position: ActivePositionType | null;
    type: "market" | "limit";
  }>({
    isOpen: false,
    position: null,
    type: "market",
  });

  const [tpslModal, setTpslModal] = useState<{
    isOpen: boolean;
    position: ActivePositionType | null;
    mode: TpSlMode;
  }>({
    isOpen: false,
    position: null,
    mode: "entire_position",
  });

  const [shareCard, setShareCard] = useState<{
    isOpen: boolean;
    position: ActivePositionType | null;
  }>({
    isOpen: false,
    position: null,
  });

  const handleOpenModal = (
    position: ActivePositionType,
    type: "market" | "limit",
  ) => {
    setCloseModal({
      isOpen: true,
      position,
      type,
    });
  };

  const handleCloseModal = () => {
    setCloseModal({
      isOpen: false,
      position: null,
      type: "market",
    });
  };

  const handleOpenTpSlModal = (position: ActivePositionType, mode: TpSlMode) => {
    setTpslModal({
      isOpen: true,
      position,
      mode,
    });
  };

  const handleCloseTpSlModal = () => {
    setTpslModal({
      isOpen: false,
      position: null,
      mode: "entire_position",
    });
  };

  const handleConfirm = (data: {
    type: "market" | "limit";
    price?: number;
    quantity: number;
    percentage: number;
  }) => {
    console.log("Close position confirmed:", data);
    // Handle the close position logic here
    handleCloseModal();
  };

  const handleOpenShareCard = (position: ActivePositionType) => {
    setShareCard({
      isOpen: true,
      position,
    });
  };

  const handleCloseShareCard = () => {
    setShareCard({
      isOpen: false,
      position: null,
    });
  };

  const allColumns = getActivePositionsColumns(
    handleOpenModal,
    handleOpenTpSlModal,
    handleOpenShareCard,
  );

  // Filter columns based on visibility preferences
  // Columns with hasToggle: false should always be visible
  // Columns with hasToggle: true should only be visible if in visibleColumns
  const filteredColumns = allColumns.filter((col) => {
    const columnPref = columnItems.find((item) => item.id === col.id);
    if (!columnPref) {
      // If column is not in preferences, show it by default
      return true;
    }
    if (!columnPref.hasToggle) {
      // Columns with hasToggle: false are always visible
      return true;
    }
    // Columns with hasToggle: true are only visible if in visibleColumns
    return visibleColumns.includes(col.id);
  });

  // Sort columns based on columnOrder
  const activePositionsColumns = filteredColumns.sort((a, b) => {
    const indexA = columnOrder.indexOf(a.id);
    const indexB = columnOrder.indexOf(b.id);
    // If not in order, maintain original position (put at end)
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Helper function to parse numeric value from string (e.g., "1,900.60 USDT" -> 1900.60)
  const parseNumericValue = (value: string): number => {
    const numericString = value.replace(/[^\d.-]/g, "").replace(/,/g, "");
    return parseFloat(numericString) || 0;
  };

  // Filter data based on selected filter
  let filteredData =
    filter === "All"
      ? activePositionsData
      : activePositionsData.filter(
          (position) => position.futures.pair === filter,
        );

  // Sort data based on selected sort option
  if (sort !== "default") {
    filteredData = [...filteredData].sort((a, b) => {
      switch (sort) {
        case "coin_asc":
          // Coin initial (from A to Z)
          return a.futures.pair.localeCompare(b.futures.pair);

        case "position_value":
          // Position Value (from high to low)
          const valueA = parseNumericValue(a.positionValue);
          const valueB = parseNumericValue(b.positionValue);
          return valueB - valueA;

        case "margin":
          // Margin (from high to low)
          const marginA = parseNumericValue(a.margin.amount);
          const marginB = parseNumericValue(b.margin.amount);
          return marginB - marginA;

        case "unrealized_pnl":
          // Unrealized PnL (from high to low)
          const pnlA = parseNumericValue(a.unrealizedPnl.amount);
          const pnlB = parseNumericValue(b.unrealizedPnl.amount);
          return pnlB - pnlA;

        case "roi":
          // ROI (from high to low) - using unrealized PnL percentage
          const roiA = parseNumericValue(a.unrealizedPnl.percentage);
          const roiB = parseNumericValue(b.unrealizedPnl.percentage);
          return roiB - roiA;

        default:
          return 0;
      }
    });
  }

  return (
    <>
      <div className="p-2 rounded-lg border border-[#E2E2E2] bg-[#F7F7F7]">
        <Table
          columns={activePositionsColumns}
          data={filteredData}
          getRowKey={(row) => row.id}
          emptyText="No positions"
        />
      </div>

      {/* Close Position Modal */}
      <Modal open={closeModal.isOpen} onClose={handleCloseModal}>
        {closeModal.position && (
          <ClosePositionModal
            position={closeModal.position}
            defaultType={closeModal.type}
            onClose={handleCloseModal}
            onConfirm={handleConfirm}
          />
        )}
      </Modal>

      {/* TP/SL Modal */}
      <Modal open={tpslModal.isOpen} onClose={handleCloseTpSlModal}>
        {tpslModal.position && (
          <TpSlModal
            defaultMode={tpslModal.mode}
            position={{
              pair: tpslModal.position.futures.pair,
              leverage: tpslModal.position.futures.leverage,
              mode: tpslModal.position.futures.mode,
              lastPrice: tpslModal.position.markPrice,
              entryPrice: tpslModal.position.entryPrice,
              markPrice: tpslModal.position.markPrice,
              estLiquidationPrice: tpslModal.position.estLiquidationPrice,
            }}
            onClose={handleCloseTpSlModal}
            onConfirm={(data) => {
              console.log("TP/SL confirmed:", data);
              handleCloseTpSlModal();
            }}
          />
        )}
      </Modal>

      {/* Share PnL Card Modal */}
      {shareCard.position && (
        <SharePositionModal
          open={shareCard.isOpen}
          onClose={handleCloseShareCard}
          card={{
            pair: shareCard.position.futures.pair,
            marketType: "Perpetual",
            side:
              shareCard.position.futures.side === "Short" ? "short" : "long",
            leverage: shareCard.position.futures.leverage,
            pnlAmount: parseNumericValue(shareCard.position.unrealizedPnl.amount),
            pnlPercentage: parseNumericValue(
              shareCard.position.unrealizedPnl.percentage,
            ),
            entryPrice: parseNumericValue(shareCard.position.entryPrice),
            currentPrice: parseNumericValue(shareCard.position.markPrice),
          }}
        />
      )}
    </>
  );
}
