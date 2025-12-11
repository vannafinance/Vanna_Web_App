// app/components/OpenOrdersTable.tsx
import React from "react";

type OrderSide = "Buy" | "Sell";
type OrderType = "Limit" | "Market";

type Order = {
  id: string;
  date: string; // "2025-10-23"
  time: string; // "14:25:46"
  pair: string; // "BTC/USDT"
  type: OrderType;
  side: OrderSide;
  qty: string; // "1.25 BTC"
  price: string; // "60,000"
  takeProfit: string[]; // ["Tp1= 66,300", "Tp2= 66,500", ...]
  slTriggerPrice: string; // "200" / "Tp1= 200"
};

const orders: Order[] = [
  {
    id: "1",
    date: "2025–10–23",
    time: "14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: ["Tp1= 66,300", "Tp2= 66,500", "Tp3= 66,600", "Tp4= 66,800"],
    slTriggerPrice: "200",
  },
  {
    id: "2",
    date: "2025–10–23",
    time: "14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: ["Tp1= 66,300"],
    slTriggerPrice: "Tp1= 200",
  },
  {
    id: "3",
    date: "2025–10–23",
    time: "14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: ["Tp1= 66,300"],
    slTriggerPrice: "Tp1= 200",
  },
  {
    id: "4",
    date: "2025–10–23",
    time: "14:25:46",
    pair: "BTC/USDT",
    type: "Limit",
    side: "Buy",
    qty: "1.25 BTC",
    price: "60,000",
    takeProfit: ["Tp1= 66,300"],
    slTriggerPrice: "Tp1= 200",
  },
];

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M12 5C7 5 3.1 8 1.5 12c1.6 4 5.5 7 10.5 7s8.9-3 10.5-7C20.9 8 17 5 12 5Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
      fill="currentColor"
    />
  </svg>
);

export const OpenOrdersTable: React.FC = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E2E2E2] bg-white">
      <table className="w-full table-fixed border-collapse text-[11px]">
        <thead className="border-b border-[#EDEDED] bg-[#FAFAFA]">
          <tr className="text-left text-[#8B8B8B]">
            <th className="py-3 pl-6 font-normal">View</th>
            <th className="py-3 font-normal">Date/Time</th>
            <th className="py-3 font-normal">Pair</th>
            <th className="py-3 font-normal">Type</th>
            <th className="py-3 font-normal">Side</th>
            <th className="py-3 font-normal">Qty</th>
            <th className="py-3 font-normal">Price</th>
            <th className="py-3 font-normal">Take Profit</th>
            <th className="py-3 pr-6 font-normal">SL Trigger Price</th>
          </tr>
        </thead>

        <tbody className="text-[12px] text-[#252525]">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="align-top border-b border-[#F3F3F3] last:border-b-0"
            >
              {/* View */}
              <td className="py-4 pl-6">
                <button className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D4D4D4] text-[#555]">
                  <EyeIcon className="h-3.5 w-3.5" />
                </button>
              </td>

              {/* Date / Time */}
              <td className="py-4">
                <div className="flex flex-col leading-[1.15]">
                  <span className="text-[12px] text-[#3F3F3F]">
                    {order.date}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#9B9B9B]">
                    {order.time}
                  </span>
                </div>
              </td>

              {/* Pair */}
              <td className="py-4">
                <span className="text-[12px] text-[#3F3F3F]">{order.pair}</span>
              </td>

              {/* Type */}
              <td className="py-4">
                <span className="text-[12px] text-[#3F3F3F]">{order.type}</span>
              </td>

              {/* Side */}
              <td className="py-4">
                <span className="text-[12px] text-[#3F3F3F]">{order.side}</span>
              </td>

              {/* Qty */}
              <td className="py-4">
                <span className="text-[12px] text-[#3F3F3F]">{order.qty}</span>
              </td>

              {/* Price */}
              <td className="py-4">
                <span className="text-[12px] text-[#3F3F3F]">
                  {order.price}
                </span>
              </td>

              {/* Take Profit */}
              <td className="py-4">
                <div className="flex flex-col gap-1 text-[11px] text-[#3F3F3F]">
                  {order.takeProfit.map((tp, idx) => (
                    <span key={idx}>{tp}</span>
                  ))}
                </div>
              </td>

              {/* SL Trigger Price */}
              <td className="py-4 pr-6">
                <span className="text-[11px] text-[#3F3F3F]">
                  {order.slTriggerPrice}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
