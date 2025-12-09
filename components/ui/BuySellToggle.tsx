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
      className={`inline-flex w-full rounded-lg border-1 border-[#E2E2E2] p-1 ${className}`}
    >
      <button
        onClick={() => handleSelect("buy")}
        className={`flex-1 rounded-md px-6 py-2 text-sm font-medium transition-colors duration-200 ${
          selected === "buy"
            ? "bg-white text-black border-2 border-purple-500"
            : "bg-transparent text-gray-700 hover:bg-purple-50"
        }`}
      >
        Buy
      </button>
      <button
        onClick={() => handleSelect("sell")}
        className={`flex-1 rounded-md px-6 py-2 text-sm font-medium transition-colors duration-200 ${
          selected === "sell"
            ? "bg-white text-black border-2 border-red-500"
            : "bg-transparent text-gray-700 hover:bg-red-50"
        }`}
      >
        Sell
      </button>
    </div>
  );
}
