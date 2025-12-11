"use client";

import React, { useState } from "react";

const RATIOS = ["NA", "1:1", "1:2", "1:3", "2:1", "3:1"] as const;
export type Ratio = (typeof RATIOS)[number] | string;

interface RiskRewardSelectorProps {
  value?: Ratio;
  onChange?: (value: Ratio) => void;
  className?: string;
  label?: string;
}

export const RiskRewardSelector: React.FC<RiskRewardSelectorProps> = ({
  value,
  onChange,
  className = "",
  label = "RR Ratio",
}) => {
  const [internal, setInternal] = useState<Ratio>("1:1");
  const selected = value ?? internal;

  const handleSelect = (ratio: Ratio) => {
    if (!value) setInternal(ratio);
    onChange?.(ratio);
  };

  const isCustom = (v: Ratio) =>
    typeof v === "string" && !RATIOS.includes(v as any);

  return (
    <div className={`flex items-center   h-auto ${className}`}>
      {/* Left label */}
      <span className="text-[10px] leading-[15px] font-medium text-[#000000] mr-1">
        {label}
      </span>

      {/* NA */}
      {/* <span className="text-[10px] leading-[15px] font-medium text-[#919191] px-2 py-1">
        NA
      </span> */}

      {/* Pills */}
      <div className="flex flex-1 items-center justify-between gap-1 ">
        {RATIOS.map((ratio) => (
          <button
            key={ratio}
            type="button"
            onClick={() => handleSelect(ratio)}
            className={`
               rounded-sm text-[10px] leading-3 px-2 py-1  transition
              ${
                selected === ratio
                  ? "bg-[#FF007A] text-white border-[#FF007A] font-semibold"
                  : ratio === "1:3"
                  ? "bg-[#FFE6F2]  border-[#FFD1E3]"
                  : " text-[#919191] font-medium "
              }
            `}
          >
            {ratio}
          </button>
        ))}

        {/* OR */}
        <div className=" px-2 py-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            OR
          </span>
        </div>

        {/* Custom Input Field */}
        <input
          type="text"
          placeholder="4:1"
          inputMode="numeric"
          className={`
          w-12 h-9 rounded-md border border-[#E2E2E2] 
          text-sm px-2 bg-white placeholder:text-[#BFBFBF]
          focus:outline-none focus:ring-1 focus:ring-[#FFB3D1]
          
        `}
          value={isCustom(selected) ? (selected as string) : ""}
          onChange={(e) => handleSelect(e.target.value)}
        />
      </div>
    </div>
  );
};
