"use client";

import { useState } from "react";
import { BaseModalContent } from "../../ui/base-modal-content";
import { ModalRadioOption } from "../../ui/modal-radio-option";
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
    <BaseModalContent
      title="Futures Unit Settings"
      onClose={onClose}
      onConfirm={() => {
        onConfirm(orderType, quantityUnit);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Order by Quantity */}
        <ModalRadioOption
          name="orderType"
          value="quantity"
          checked={orderType === "quantity"}
          onChange={() => setOrderType("quantity")}
          title="Order by Quantity"
          description=""
        >
          <div className="flex flex-col gap-3">
            {/* Unit Selector Buttons */}
            <div className="flex gap-2 overflow-hidden">
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
        </ModalRadioOption>

        {/* Order by Cost */}
        <ModalRadioOption
          name="orderType"
          value="cost"
          checked={orderType === "cost"}
          onChange={() => setOrderType("cost")}
          title="Order by Cost (USDT)"
          description="Enter the order cost. The cost is not affected by leverage. The global unit will switch to USDT."
        />
      </div>
    </BaseModalContent>
  );
};
