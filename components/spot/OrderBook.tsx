"use client";

import { useState } from "react";

type Side = "buy" | "sell";

type OrderRow = {
  price: number;
  amount: number;
  total: number;
  side: "buy" | "sell";
  depth: number;
};

const sellOrders: OrderRow[] = [
  {
    price: 2615.8,
    amount: 89012.3,
    total: 701204.6,
    side: "sell",
    depth: 0.92,
  },
  {
    price: 2615.7,
    amount: 71009.9,
    total: 663024.0,
    side: "sell",
    depth: 0.85,
  },
  {
    price: 2615.5,
    amount: 43211.6,
    total: 621553.4,
    side: "sell",
    depth: 0.72,
  },
  {
    price: 2615.3,
    amount: 21241.4,
    total: 592014.0,
    side: "sell",
    depth: 0.62,
  },
  {
    price: 2615.2,
    amount: 15430.2,
    total: 585201.3,
    side: "sell",
    depth: 0.55,
  },
  { price: 2615.1, amount: 102.7, total: 570772.3, side: "sell", depth: 0.42 },
  { price: 2615.0, amount: 12519.1, total: 569843.1, side: "sell", depth: 0.5 },
  { price: 2614.9, amount: 8421.8, total: 559120.4, side: "sell", depth: 0.38 },
];

const buyOrders: OrderRow[] = [
  {
    price: 2601.1,
    amount: 182540.3,
    total: 182540.3,
    side: "buy",
    depth: 0.95,
  },
  {
    price: 2600.9,
    amount: 170625.3,
    total: 170625.0,
    side: "buy",
    depth: 0.88,
  },
  { price: 2600.4, amount: 143250.7, total: 143250.7, side: "buy", depth: 0.8 },
  { price: 2599.8, amount: 112035.6, total: 112035.6, side: "buy", depth: 0.7 },
  { price: 2599.2, amount: 96410.4, total: 96410.4, side: "buy", depth: 0.62 },
  { price: 2598.7, amount: 70122.9, total: 70122.9, side: "buy", depth: 0.55 },
  { price: 2598.1, amount: 45892.6, total: 45892.6, side: "buy", depth: 0.42 },
  { price: 2597.6, amount: 29760.2, total: 29760.2, side: "buy", depth: 0.3 },
];

export default function Orderbook() {
  const [activeTab, setActiveTab] = useState<"orderbook" | "trades">(
    "orderbook"
  );

  return (
    <div className="h-full flex flex-col   bg-white text-[12px]">
      <div className="flex items-center gap-4 p-1 bg-white">
        {/* Orderbook tab */}
        <button
          onClick={() => setActiveTab("orderbook")}
          className={`flex flex-1 items-center justify-center rounded-lg py-3 px-2
      ${activeTab === "orderbook" ? "bg-[#F1EBFD]" : "bg-transparent"}`}
        >
          <div className="flex items-center justify-center px-2 gap-[0.625rem]">
            <span
              className={`text-[0.75rem] font-semibold text-center
          ${activeTab === "orderbook" ? "text-[#703AE6]" : "text-black"}`}
            >
              Orderbook
            </span>
          </div>
        </button>

        {/* Market Trades tab */}
        <button
          onClick={() => setActiveTab("trades")}
          className={`flex flex-1 items-center justify-center rounded-lg py-3 px-2
      ${activeTab === "trades" ? "bg-[#F1EBFD]" : "bg-transparent"}`}
        >
          <div className="flex items-center justify-center px-2 gap-[0.625rem]">
            <span
              className={`text-[0.75rem] font-semibold text-center
          ${activeTab === "trades" ? "text-[#703AE6]" : "text-black"}`}
            >
              Market Trades
            </span>
          </div>
        </button>
      </div>

      {/* Parent div : buy/sell orders */}
      <div className="flex flex-col pb-4 gap-3 self-stretch bg-[#F7F7F7]">
        {/* Top Bar */}
        <div className="flex flex-col flex-1 self-stretch items-start gap-2 p-4">
          {/* Top Bar nested div */}
          <div className="flex flex-col self-stretch items-start ">
            {/* Top sell bar with header row */}
            <div className="flex flex-col self-stretch items-start gap-3">
              {/* Header Row */}
              <div className="flex self-stretch px-4">
                <div className="w-full grid grid-cols-[1.1fr_1fr_1.1fr] border-b border-slate-100 text-[12px] font-medium text-slate-500 pb-2">
                  <span>Price(USDT)</span>
                  <span className="text-center">Amount(BTC)</span>
                  <span className="text-right">Total(in USDT)</span>
                </div>
              </div>

              {/* sell div */}
              <div className="flex flex-col self-stretch items-start">
                {sellOrders.map((row, i) => (
                  <OrderbookRow key={i} row={row} />
                ))}
              </div>
            </div>

            {/* MID price */}
            <div className="px-4  border-y border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[#FC5457] text-base leading-6 font-semibold">
                  102,600.9
                </span>
                {/* Arrow */}
                <span className="w-4 h-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    className="w-4 h-4"
                  >
                    <path
                      d="M11.3335 9.69691L7.00016 14.5003M7.00016 14.5003L2.66683 9.69691M7.00016 14.5003L7.00016 1.16699"
                      stroke="#FC5457"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[#5C5B5B] text-[0.75rem] leading-[1.125rem] font-medium">
                  102,610.1
                </span>
              </div>
            </div>

            {/* Bottom Buy bar */}
            <div className="flex flex-col self-stretch items-start">
              {buyOrders.map((row, i) => (
                <OrderbookRow key={i} row={row} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar – B/S % */}
        <div className="flex items-center self-stretch px-5 gap-[0.1875rem]">
          <span className="text-[11px] font-medium text-emerald-600">
            B 78%
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-slate-200 to-rose-400" />
          <span className="text-[11px] font-medium text-rose-500">22% S</span>
        </div>
      </div>
    </div>
  );
}

function OrderbookRow({ row }: { row: OrderRow }) {
  const isSell = row.side === "sell";

  const priceColor = isSell ? "text-[#FC5457]" : "text-[#0F7E79]";
  const heatColor = isSell ? "bg-[#FAD1D1]" : "bg-[#CDEDE6]";

  return (
    <>
      {/* SELL ROW */}
      <div className="flex h-6 px-4 py-0.5 gap-2 items-start self-stretch">
        {/* child 1 → Price */}
        <div className="flex items-center w-[55px] h-[18px]">
          <span className="text-[#FC5457] text-xs font-medium leading-[18px]">
            {row.price.toLocaleString()}
          </span>
        </div>

        {/* child 2 → Amount + heat */}
        <div className="relative flex-1 flex items-center h-[18px] justify-center">
          <div
            className="absolute right-0 inset-y-0 rounded-l bg-[#F3D1C8]"
            style={{ width: `${row.depth * 100}%` }}
          />
          <span className="relative text-xs font-medium text-black leading-[18px]">
            {row.amount.toLocaleString()}
          </span>
        </div>

        {/* child 3 → Total */}
        <div className="flex items-center h-[18px] justify-end w-[80px]">
          <span className="text-xs font-medium leading-[18px] text-black">
            {row.total.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
}
