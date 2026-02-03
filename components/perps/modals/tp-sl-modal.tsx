"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Dropdown } from "../../ui/dropdown";
import { QuantitySlider } from "../../ui/quantity-slider";
import { Checkbox } from "../../ui/Checkbox";
import { BaseModalContent } from "../../ui/base-modal-content";

export type TpSlMode =
  | "entire_position"
  | "partial_position"
  | "trailing"
  | "mmr_sl";
type TriggerPriceType = "Last" | "Mark" | "Index";
type ValueType = "ROI(%)" | "Change(%)" | "PnL(USDC)";
type OrderType = "Limit" | "BBO";
type BBOType = "Counterparty 1" | "Counterparty 5" | "Queue 1" | "Queue 5";

const PRICE_TYPE_OPTIONS: TriggerPriceType[] = ["Last", "Mark", "Index"];
const VALUE_TYPE_OPTIONS: ValueType[] = ["ROI(%)", "Change(%)", "PnL(USDC)"];
const ORDER_TYPE_OPTIONS: OrderType[] = ["Limit", "BBO"];
const BBO_OPTIONS: BBOType[] = [
  "Counterparty 1",
  "Counterparty 5",
  "Queue 1",
  "Queue 5",
];

export interface TpSlPositionData {
  pair: string;
  leverage: string;
  mode: "Cross" | "Isolated";
  lastPrice: string;
  entryPrice: string;
  markPrice: string;
  estLiquidationPrice: string;
}

interface TpSlModalProps {
  defaultMode?: TpSlMode;
  position?: TpSlPositionData;
  onClose: () => void;
  onConfirm?: (data: { mode: TpSlMode }) => void;
}

export const TpSlModal = ({
  defaultMode = "entire_position",
  position,
  onClose,
  onConfirm,
}: TpSlModalProps) => {
  const [selectedMode, setSelectedMode] = useState<TpSlMode>(defaultMode);

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  const [entireTpPrice, setEntireTpPrice] = useState("");
  const [entireTpPriceType, setEntireTpPriceType] =
    useState<TriggerPriceType>("Last");
  const [entireTpValue, setEntireTpValue] = useState<number | null>(null);
  const [entireTpValueType, setEntireTpValueType] =
    useState<ValueType>("ROI(%)");

  const [entireSlPrice, setEntireSlPrice] = useState("");
  const [entireSlPriceType, setEntireSlPriceType] =
    useState<TriggerPriceType>("Last");
  const [entireSlValue, setEntireSlValue] = useState<number | null>(null);
  const [entireSlValueType, setEntireSlValueType] =
    useState<ValueType>("ROI(%)");

  const [trailingTriggerPrice, setTrailingTriggerPrice] = useState("");
  const [trailingTriggerType, setTrailingTriggerType] =
    useState<TriggerPriceType>("Last");
  const [trailingCallbackRate, setTrailingCallbackRate] = useState("");
  const [trailingQuantity, setTrailingQuantity] = useState("");

  const [triggerMmr, setTriggerMmr] = useState<number | null>(null);

  // Partial Position - Take Profit states
  const [partialTpLimitOrder, setPartialTpLimitOrder] = useState(false);
  const [partialTpTriggerPrice, setPartialTpTriggerPrice] = useState("");
  const [partialTpTriggerType, setPartialTpTriggerType] =
    useState<TriggerPriceType>("Last");
  const [partialTpRoi, setPartialTpRoi] = useState<number | null>(null);
  const [partialTpRoiType, setPartialTpRoiType] = useState<ValueType>("ROI(%)");
  const [partialTpOrderType, setPartialTpOrderType] =
    useState<OrderType>("Limit");
  const [partialTpPrice, setPartialTpPrice] = useState("");
  const [partialTpBboType, setPartialTpBboType] =
    useState<BBOType>("Counterparty 1");
  const [partialTpQuantity, setPartialTpQuantity] = useState<number | null>(
    null,
  );

  // Partial Position - Stop Loss states
  const [partialSlLimitOrder, setPartialSlLimitOrder] = useState(false);
  const [partialSlTriggerPrice, setPartialSlTriggerPrice] = useState("");
  const [partialSlTriggerType, setPartialSlTriggerType] =
    useState<TriggerPriceType>("Last");
  const [partialSlRoi, setPartialSlRoi] = useState<number | null>(null);
  const [partialSlRoiType, setPartialSlRoiType] = useState<ValueType>("ROI(%)");
  const [partialSlOrderType, setPartialSlOrderType] =
    useState<OrderType>("Limit");
  const [partialSlPrice, setPartialSlPrice] = useState("");
  const [partialSlBboType, setPartialSlBboType] =
    useState<BBOType>("Counterparty 1");
  const [partialSlQuantity, setPartialSlQuantity] = useState<number | null>(
    null,
  );

  return (
    <BaseModalContent
      title="TP/SL"
      width="524px"
      gap="gap-5"
      onClose={onClose}
      onConfirm={() => {
        onConfirm?.({ mode: selectedMode });
        onClose();
      }}
    >
      {/* header icon info */}
      <div className="flex gap-1 -mt-4 mb-2">
        <Image src="/icons/info.svg" alt="info" width={20} height={20} />
      </div>

      {/* position info: pair & leverage */}
      <div className="flex gap-1">
        <div className="text-[12px] leading-[18px] font-semibold text-[#111111]">
          {position?.pair || "SBTCUSDT"}. {position?.mode || "Cross"}
        </div>
        <div className="rounded-[5px] bg-[#EBFCFD] py-1 px-2 text-[10px] leading-[15px] font-semibold text-[#32E2EE]">
          Open long {position?.leverage || "10x"}
        </div>
      </div>

      {/* price grid */}
      <div className="grid grid-cols-3 gap-x-5 gap-y-5">
        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Last Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.lastPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Entry price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Limit order
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.entryPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Mark Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.markPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Last Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.lastPrice || "102,964"} USDT
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="flex text-[10px] leading-[15px] font-medium text-[#919191]">
            Est. Liquidation Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {position?.estLiquidationPrice || "102,964"} USDT
          </span>
        </div>
      </div>

      {/* tabs */}
      <div className="bg-white flex gap-1 p-1 rounded-lg ">
        <button
          type="button"
          onClick={() => setSelectedMode("entire_position")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "entire_position"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Entire Position
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("partial_position")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "partial_position"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Partial Position
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("trailing")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "trailing"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          Trailing TP/SL
        </button>
        <button
          type="button"
          onClick={() => setSelectedMode("mmr_sl")}
          className={`cursor-pointer flex-1 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
            selectedMode === "mmr_sl"
              ? "bg-[#F1EBFD] text-[#703AE6]"
              : "bg-transparent text-[#111111]"
          }`}
        >
          MMR SL
        </button>
      </div>

      {/* fields based on selected mode */}
      {selectedMode === "entire_position" && (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
                  Take-Profit
                </label>
                <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                  <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                    Trigger Price
                  </span>
                  <input
                    type="number"
                    value={entireTpPrice}
                    onChange={(e) => setEntireTpPrice(e.target.value)}
                    className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                  />
                  <div className="shrink-0 flex items-center">
                    <Dropdown
                      items={PRICE_TYPE_OPTIONS}
                      selectedOption={entireTpPriceType}
                      setSelectedOption={(val) => {
                        setEntireTpPriceType(val as TriggerPriceType);
                      }}
                      classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </div>
              <div className="w-[180px] shrink-0 flex flex-col">
                <div className="h-[19px]" />
                <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                  <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                    ROI
                  </span>
                  <input
                    type="number"
                    value={entireTpValue ?? ""}
                    onChange={(e) =>
                      setEntireTpValue(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                  />
                  <div className=" flex items-center">
                    <Dropdown
                      items={VALUE_TYPE_OPTIONS}
                      selectedOption={entireTpValueType}
                      setSelectedOption={(val) => {
                        setEntireTpValueType(val as ValueType);
                      }}
                      classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={entireTpValue ?? 0}
              onChange={setEntireTpValue}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
                  Stop-loss
                </label>
                <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                  <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                    Trigger Price
                  </span>
                  <input
                    type="number"
                    value={entireSlPrice}
                    onChange={(e) => setEntireSlPrice(e.target.value)}
                    className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                  />
                  <div className="shrink-0 flex items-center">
                    <Dropdown
                      items={PRICE_TYPE_OPTIONS}
                      selectedOption={entireSlPriceType}
                      setSelectedOption={(val) => {
                        setEntireSlPriceType(val as TriggerPriceType);
                      }}
                      classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </div>
              <div className="w-[180px] shrink-0 flex flex-col">
                <div className="h-[19px]" />
                <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                  <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                    ROI
                  </span>
                  <input
                    type="number"
                    value={entireSlValue ?? ""}
                    onChange={(e) =>
                      setEntireSlValue(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                  />
                  <div className="flex items-center">
                    <Dropdown
                      items={VALUE_TYPE_OPTIONS}
                      selectedOption={entireSlValueType}
                      setSelectedOption={(val) => {
                        setEntireSlValueType(val as ValueType);
                      }}
                      classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={entireSlValue ?? 0}
              onChange={setEntireSlValue}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>
        </>
      )}

      {selectedMode === "partial_position" && (
        <div className="flex flex-col gap-5 max-h-[400px] overflow-y-auto scrollbar-thin px-1">
          {/* Take-Profit Section */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
                Take-Profit
              </label>
              <div className="text-[10px] leading-[15px] font-semibold">
                <Checkbox
                  checked={partialTpLimitOrder}
                  onChange={(e) => setPartialTpLimitOrder(e.target.checked)}
                  label="Limit-Order"
                  className="w-4! h-4!"
                />
              </div>
            </div>
            {/* Trigger Price + ROI row */}
            <div className="flex gap-1">
              <div className="flex-1 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                  Trigger Price
                </span>
                <input
                  type="number"
                  value={partialTpTriggerPrice}
                  onChange={(e) => setPartialTpTriggerPrice(e.target.value)}
                  className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                />
                <div className="shrink-0 flex items-center">
                  <Dropdown
                    items={PRICE_TYPE_OPTIONS}
                    selectedOption={partialTpTriggerType}
                    setSelectedOption={(val) =>
                      setPartialTpTriggerType(val as TriggerPriceType)
                    }
                    classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                </div>
              </div>
              <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                  ROI
                </span>
                <input
                  type="number"
                  value={partialTpRoi ?? ""}
                  onChange={(e) =>
                    setPartialTpRoi(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                />
                <div className="flex items-center">
                  <Dropdown
                    items={VALUE_TYPE_OPTIONS}
                    selectedOption={partialTpRoiType}
                    setSelectedOption={(val) =>
                      setPartialTpRoiType(val as ValueType)
                    }
                    classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                </div>
              </div>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={partialTpRoi ?? 0}
              onChange={setPartialTpRoi}
              markers={[0, 25, 50, 75, 100]}
            />
            {/* Price + ROI row (shown when Limit-Order is checked) */}
            {partialTpLimitOrder && (
              <>
                <div className="flex gap-1">
                  <div className="flex-1 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                    {partialTpOrderType === "Limit" ? (
                      <>
                        <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                          Price
                        </span>
                        <input
                          type="number"
                          value={partialTpPrice}
                          onChange={(e) => setPartialTpPrice(e.target.value)}
                          className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                        />
                        <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                          SUSDT
                        </span>
                      </>
                    ) : (
                      <Dropdown
                        items={BBO_OPTIONS}
                        selectedOption={partialTpBboType}
                        setSelectedOption={(val) =>
                          setPartialTpBboType(val as BBOType)
                        }
                        classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                        dropdownClassname="text-[12px] font-semibold"
                      />
                    )}
                  </div>
                  <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                    <Dropdown
                      items={ORDER_TYPE_OPTIONS}
                      selectedOption={partialTpOrderType}
                      setSelectedOption={(val) =>
                        setPartialTpOrderType(val as OrderType)
                      }
                      classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </>
            )}
            {/* Quantity */}
            <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
              Quantity
            </label>
            <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                Quantity
              </span>
              <input
                type="number"
                value={partialTpQuantity ?? ""}
                onChange={(e) =>
                  setPartialTpQuantity(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
              />
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                SUSDT
              </span>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={partialTpQuantity ?? 0}
              onChange={setPartialTpQuantity}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>

          {/* Stop-Loss Section */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
                Stop-Loss
              </label>
              <div className="text-[10px] leading-[15px] font-semibold">
                <Checkbox
                  checked={partialSlLimitOrder}
                  onChange={(e) => setPartialSlLimitOrder(e.target.checked)}
                  label="Limit-Order"
                  className="w-4! h-4!"
                />
              </div>
            </div>
            {/* Trigger Price + ROI row */}
            <div className="flex gap-1">
              <div className="flex-1 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                  Trigger Price
                </span>
                <input
                  type="number"
                  value={partialSlTriggerPrice}
                  onChange={(e) => setPartialSlTriggerPrice(e.target.value)}
                  className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                />
                <div className="shrink-0 flex items-center">
                  <Dropdown
                    items={PRICE_TYPE_OPTIONS}
                    selectedOption={partialSlTriggerType}
                    setSelectedOption={(val) =>
                      setPartialSlTriggerType(val as TriggerPriceType)
                    }
                    classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                </div>
              </div>
              <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                  ROI
                </span>
                <input
                  type="number"
                  value={partialSlRoi ?? ""}
                  onChange={(e) =>
                    setPartialSlRoi(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                />
                <div className="flex items-center">
                  <Dropdown
                    items={VALUE_TYPE_OPTIONS}
                    selectedOption={partialSlRoiType}
                    setSelectedOption={(val) =>
                      setPartialSlRoiType(val as ValueType)
                    }
                    classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                </div>
              </div>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={partialSlRoi ?? 0}
              onChange={setPartialSlRoi}
              markers={[0, 25, 50, 75, 100]}
            />
            {/* Price + ROI row (shown when Limit-Order is checked) */}
            {partialSlLimitOrder && (
              <>
                <div className="flex gap-1">
                  <div className="flex-1 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                    {partialSlOrderType === "Limit" ? (
                      <>
                        <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                          Price
                        </span>
                        <input
                          type="number"
                          value={partialSlPrice}
                          onChange={(e) => setPartialSlPrice(e.target.value)}
                          className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                        />
                        <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                          SUSDT
                        </span>
                      </>
                    ) : (
                      <Dropdown
                        items={BBO_OPTIONS}
                        selectedOption={partialSlBboType}
                        setSelectedOption={(val) =>
                          setPartialSlBboType(val as BBOType)
                        }
                        classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                        dropdownClassname="text-[12px] font-semibold"
                      />
                    )}
                  </div>
                  <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                    <Dropdown
                      items={ORDER_TYPE_OPTIONS}
                      selectedOption={partialSlOrderType}
                      setSelectedOption={(val) =>
                        setPartialSlOrderType(val as OrderType)
                      }
                      classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                      dropdownClassname="text-[12px] font-semibold"
                    />
                  </div>
                </div>
              </>
            )}
            {/* Quantity */}
            <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
              Quantity
            </label>
            <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                Quantity
              </span>
              <input
                type="number"
                value={partialSlQuantity ?? ""}
                onChange={(e) =>
                  setPartialSlQuantity(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
              />
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                SUSDT
              </span>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={partialSlQuantity ?? 0}
              onChange={setPartialSlQuantity}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>

          {/* Position Size */}
          <div className="flex gap-1">
            <span className="text-[12px] leading-[18px] font-medium text-[#919191]">
              Positions Size:
            </span>
            <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
              0.003 SBTC
            </span>
          </div>
        </div>
      )}

      {selectedMode === "trailing" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
              Trigger Price
            </label>
            <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium ">
                Trigger Price
              </span>
              <input
                type="number"
                value={trailingTriggerPrice}
                onChange={(e) => setTrailingTriggerPrice(e.target.value)}
                className="flex-1 text-[12px] leading-[18px] font-medium outline-none"
              />
              <div className="ml-auto">
                <Dropdown
                  items={PRICE_TYPE_OPTIONS}
                  selectedOption={trailingTriggerType}
                  setSelectedOption={(val) => {
                    setTrailingTriggerType(val as TriggerPriceType);
                  }}
                  classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                  dropdownClassname="text-[12px] font-semibold"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
                Callback Rate
              </label>
              <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                  Callback Rate
                </span>
                <input
                  type="number"
                  value={trailingCallbackRate}
                  onChange={(e) => setTrailingCallbackRate(e.target.value)}
                  className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
                />
                <span className="text-[10px] leading-[15px] font-medium shrink-0">
                  %
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col">
              <div className="h-[19px]" />
              {/* preset button */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTrailingCallbackRate("5")}
                  className="h-9 cursor-pointer px-2 py-1 rounded-lg text-[12px] leading-[100%] font-medium text-[#703AE6] bg-[#F1EBFD] hover:bg-[#E5D9FA] transition-colors"
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => setTrailingCallbackRate("10")}
                  className="h-9 cursor-pointer px-2 py-1 rounded-lg text-[12px] leading-[100%] font-medium text-[#703AE6] bg-[#F1EBFD] hover:bg-[#E5D9FA] transition-colors"
                >
                  10%
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
              Quantity
            </label>
            <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
              <input
                type="number"
                value={trailingQuantity}
                onChange={(e) => setTrailingQuantity(e.target.value)}
                className="flex-1 text-[12px] leading-[18px] font-medium outline-none"
              />
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={Number(trailingQuantity) || 0}
              onChange={(val) => setTrailingQuantity(val.toString())}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>
          <div className="flex gap-1">
            <span className="text-[12px] leading-[18px] font-medium text-[#919191]">
              Remaining Quantity for TP/SL:
            </span>
          </div>
        </>
      )}
      {selectedMode === "mmr_sl" && (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
                Trigger MMR
              </span>
              <div className="flex items-center gap-1">
                <Image
                  src="/icons/settings-icon.svg"
                  alt="settings"
                  width={12}
                  height={12}
                />
                <span className="text-[10px] leading-[100%] font-medium text-[#703AE6]">
                  Preset order distance: 0%
                </span>
              </div>
            </div>
            <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                Trigger MMR
              </span>
              <input
                type="number"
                value={triggerMmr ?? ""}
                onChange={(e) =>
                  setTriggerMmr(e.target.value ? Number(e.target.value) : null)
                }
                className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
              />
              <span className="text-[10px] leading-[15px] font-medium shrink-0">
                %
              </span>
            </div>
            <QuantitySlider
              min={0}
              max={100}
              step={1}
              value={triggerMmr ?? 0}
              onChange={setTriggerMmr}
              markers={[0, 25, 50, 75, 100]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[12px] leading-[18px] font-medium text-[#919191]">
                Trigger Price:
              </span>
              <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
                -- USDT
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1EBFD] border border-[#703AE6]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="7" stroke="#703AE6" strokeWidth="1.5" />
                <path
                  d="M8 5V8.5"
                  stroke="#703AE6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11" r="0.75" fill="#703AE6" />
              </svg>
              <span className="text-[11px] leading-[16px] font-medium text-[#703AE6]">
                Position liquidation/reduction will be triggered based on MMR.
              </span>
            </div>
          </div>
        </>
      )}
    </BaseModalContent>
  );
};
