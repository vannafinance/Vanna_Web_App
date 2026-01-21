"use client";

export type OrderEventType = "OPEN" | "CLOSE" | "LIQ" | "SL";

export interface NonOrderBookRowType {
  type: OrderEventType;
  price: number;
  size: number;
  timestamp: number;
}

const orderEventsMock: NonOrderBookRowType[] = [
  { type: "CLOSE", price: 102615.4, size: 663024.0, timestamp: 420 },
  { type: "CLOSE", price: 102615.5, size: 592014.1, timestamp: 540 },
  { type: "CLOSE", price: 102615.6, size: 570772.7, timestamp: 660 },
  { type: "CLOSE", price: 102615.4, size: 102615.4, timestamp: 720 },

  { type: "OPEN", price: 102615.3, size: 102615.4, timestamp: 780 },
  { type: "OPEN", price: 102615.5, size: 102615.4, timestamp: 960 },

  { type: "OPEN", price: 102600.3, size: 170625.3, timestamp: 1200 },
  { type: "OPEN", price: 102600.4, size: 170625.3, timestamp: 1440 },

  { type: "CLOSE", price: 102600.5, size: 170625.3, timestamp: 1560 },
  { type: "CLOSE", price: 102600.4, size: 170625.3, timestamp: 1680 },

  { type: "OPEN", price: 102600.3, size: 170625.3, timestamp: 1800 },
  { type: "OPEN", price: 102600.2, size: 170625.3, timestamp: 1860 },

  { type: "OPEN", price: 102615.1, size: 663024.0, timestamp: 2100 },
  { type: "CLOSE", price: 102615.5, size: 592014.1, timestamp: 2280 },
  { type: "CLOSE", price: 102615.6, size: 570772.7, timestamp: 2400 },
  { type: "CLOSE", price: 102615.4, size: 102615.4, timestamp: 2520 },

  { type: "OPEN", price: 102615.3, size: 102615.4, timestamp: 2580 },
  { type: "OPEN", price: 102615.5, size: 102615.4, timestamp: 2640 },
];

// format function

function formatTime(seconds: number) {
  if (seconds >= 3600) return "1 hour";
  return `${Math.floor(seconds / 60)} mins`;
}

function formatSize(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function NonOrderBook() {
  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="grid grid-cols-4 text-[10px] leading-[15px] text-[#5C5B5B] font-medium">
        <span className="py-1 pl-1">Type</span>
        <span className="py-1">Price</span>
        <span className="py-1 text-center ">Size(USDC)</span>
        <span className="text-right  py-1 pl-1">Time</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col  gap-1">
        {orderEventsMock.map((row, i) => {
          const prev = orderEventsMock[i - 1];
          const priceColor =
            prev && row.price > prev.price
              ? "text-[#1C7C83]"
              : "text-[#FC5457]";

          return (
            <div
              key={i}
              className="grid grid-cols-4 text-[10px] leading-[15px] font-medium"
            >
              {/* Type */}
              <span className="py-1 pl-1 text-[#111111]">{row.type}</span>

              {/* Price */}
              <span className={`py-1 ${priceColor}`}>
                {row.price.toLocaleString()}
              </span>

              {/* Size */}
              <span className=" py-1 pl-1 text-center text-[#111111]">
                {formatSize(row.size)}
              </span>

              {/* Time */}
              <span className="text-right  py-1 pl-1 text-[#5C5B5B]">
                {formatTime(row.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
