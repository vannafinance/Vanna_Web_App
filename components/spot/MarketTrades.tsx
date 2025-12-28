"use client";

export interface MarketTradeRow {
  price: number;
  amount: number;
  time: string;
  side: "buy" | "sell";
}

const mockTrades: MarketTradeRow[] = [
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102614.5, amount: 0.09, time: "12:01:05", side: "sell" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102614.5, amount: 0.09, time: "12:01:05", side: "sell" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102614.5, amount: 0.09, time: "12:01:05", side: "sell" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102614.5, amount: 0.09, time: "12:01:05", side: "sell" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.0, amount: 0.52, time: "12:01:08", side: "buy" },
  { price: 102614.5, amount: 0.09, time: "12:01:05", side: "sell" },
  { price: 102615.4, amount: 0.71, time: "12:01:02", side: "buy" },
  { price: 102615.2, amount: 0.34, time: "12:01:12", side: "buy" },
  { price: 102614.8, amount: 0.18, time: "12:01:10", side: "sell" },
];

export function MarketTrades() {
  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="grid grid-cols-3 text-[12px] leading-[18px] text-[#5C5B5B] font-medium">
        <span className="py-1 min-w-[84px]">Price(USDT)</span>
        <span className="py-1 min-w-[84px] text-right">Amount(BTC)</span>
        <span className="py-1 min-w-[84px] text-right">Time</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col max-h-[480px] overflow-y-auto scrollbar-hide gap-1">
        {mockTrades.map((trade, i) => (
          <div key={i} className="grid grid-cols-3 text-[12px] leading-[18px]">
            <span
              className={`font-medium min-w-[84px] ${
                trade.side === "buy" ? "text-[#1C7C83]" : "text-[#FC5457]"
              }`}
            >
              {trade.price.toLocaleString()}
            </span>

            <span className="text-right text-[#111111] min-w-[84px]">
              {trade.amount}
            </span>

            <span className="text-right text-[#111111] min-w-[84px]">
              {trade.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
