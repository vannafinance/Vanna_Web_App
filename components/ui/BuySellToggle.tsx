"use client";

import React, { useState } from "react";

type OrderType = "buy" | "sell";

interface BuySellToggleProps {
  defaultValue?: OrderType;
  onChange?: (value: OrderType) => void;
  className?: string;
}

export default function BuySellToggle({
  defaultValue = "buy",
  onChange,
  className = "",
}: BuySellToggleProps) {
  const [selected, setSelected] = useState<OrderType>(defaultValue);

  const handleSelect = (type: OrderType) => {
    setSelected(type);
    onChange?.(type);
  };

  return (
    <div
      className={`flex gap-4  rounded-xl border border-[#E2E2E2] p-1.5 bg-[#FFFFFF] ${className}`}
    >
      <button
        onClick={() => handleSelect("buy")}
        className={`flex-1  rounded-lg text-[12px] font-semibold transition-colors duration-200 p-0.5 text-black  ${
          selected === "buy"
            ? "bg-linear-to-r from-[#FC5457] to-[#703AE6]  "
            : "bg-transparent "
        }`}
      >
        <div className="bg-white rounded-lg p-3">Buy</div>
      </button>
      <button
        onClick={() => handleSelect("sell")}
        className={`flex-1  rounded-lg text-[12px] font-semibold transition-colors duration-200 p-0.5 text-black ${
          selected === "sell"
            ? "bg-linear-to-r from-[#FC5457] to-[#703AE6] "
            : "bg-transparent"
        }`}
      >
        <div className="bg-white rounded-lg p-3">Sell</div>
      </button>
    </div>
  );
}
