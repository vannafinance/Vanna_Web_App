"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Radio } from "../ui/radio-button";
import { QuantityUnit } from "@/lib/types";

type FuturesOrderType = "quantity" | "cost";

interface FuturesUnitSettingsModalProps {
  defaultOrderType?: FuturesOrderType;
  defaultQuantityUnit?: QuantityUnit;
  onConfirm: (orderType: FuturesOrderType, quantityUnit: QuantityUnit) => void;
  onClose: () => void;
}

export const FuturesUnitSettingsModal = ({
  defaultOrderType = "quantity",
  defaultQuantityUnit = "USDT",
  onConfirm,
  onClose,
}: FuturesUnitSettingsModalProps) => {
  const [orderType, setOrderType] =
    useState<FuturesOrderType>(defaultOrderType);
  const [quantityUnit, setQuantityUnit] =
    useState<QuantityUnit>(defaultQuantityUnit);

  const unitOptions: QuantityUnit[] = ["BTC", "USDT", "Cont"];

  return (
    <div className="w-[400px] rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
        Futures Unit Settings
      </h3>

      {/* Radio Options */}
      <div className="flex flex-col gap-4">
        {/* Order by Quantity */}
        <div
          className="flex gap-2 cursor-pointer"
          onClick={() => setOrderType("quantity")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="orderType"
              value="quantity"
              checked={orderType === "quantity"}
              onChange={() => setOrderType("quantity")}
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Order by Quantity
            </span>

            {/* Unit Selector Buttons */}
            <div className="flex gap-2   overflow-hidden">
              {unitOptions.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantityUnit(unit);
                    setOrderType("quantity");
                  }}
                  className={`flex-1 py-3 px-4 text-[14px] rounded-lg font-semibold transition-colors cursor-pointer ${
                    quantityUnit === unit && orderType === "quantity"
                      ? "bg-[#7C35F8] text-white"
                      : "bg-white text-[#111111] hover:bg-[#F1EBFD]"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>

            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Enter the order value, and you can adjust leverage to modify the
              required margin for the order. The global unit will switch to
              USDT.
            </span>
          </div>
        </div>

        {/* Order by Cost */}
        <div
          className="flex gap-2 cursor-pointer"
          onClick={() => setOrderType("cost")}
        >
          <div className="shrink-0 mt-0.5">
            <Radio
              name="orderType"
              value="cost"
              checked={orderType === "cost"}
              onChange={() => setOrderType("cost")}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
              Order by Cost (USDT)
            </span>
            <span className="text-[12px] leading-[18px] font-medium text-[#5C5B5B]">
              Enter the order cost. The cost is not affected by leverage. The
              global unit will switch to USDT.
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Button
            text="Cancel"
            size="small"
            type="ghost"
            disabled={false}
            onClick={onClose}
          />
        </div>
        <div className="flex-1">
          <Button
            text="Confirm"
            size="small"
            type="solid"
            disabled={false}
            onClick={() => {
              onConfirm(orderType, quantityUnit);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
