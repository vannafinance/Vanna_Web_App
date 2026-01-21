"use client";

import { useState } from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/Checkbox";
import { QuantitySlider } from "../ui/quantity-slider";
import { Dropdown } from "../ui/dropdown";
import Image from "next/image";

type TpSlTabType =
  | "entire-position"
  | "partial-position"
  | "trailing-tpsl"
  | "mmr-si";

type TriggerPriceType = "Last" | "Mark" | "Index";
type RoiType = "ROI" | "PnL" | "Change";

interface AdvanceTpSlModalProps {
  pair?: string;
  marginMode?: "Cross" | "Isolated";
  positionType?: "Open long" | "Open short";
  leverage?: number;
  lastPrice?: number;
  entryPrice?: number;
  limitOrder?: number;
  markPrice?: number;
  estLiquidationPrice?: number | null;
  positionSize?: number;
  onClose: () => void;
  onConfirm: (data: TpSlData) => void;
}

interface TpSlData {
  tabType: TpSlTabType;
  takeProfit?: {
    triggerPrice?: number;
    triggerPriceType?: TriggerPriceType;
    roiValue?: number;
    roiType?: RoiType;
    limitOrderEnabled?: boolean;
    limitPrice?: number;
    quantity?: number;
  };
  stopLoss?: {
    triggerPrice?: number;
    triggerPriceType?: TriggerPriceType;
    roiValue?: number;
    roiType?: RoiType;
    limitOrderEnabled?: boolean;
    limitPrice?: number;
    quantity?: number;
  };
  trailing?: {
    triggerPrice?: number;
    triggerPriceType?: TriggerPriceType;
    callbackRate?: number;
    quantity?: number;
  };
  mmr?: {
    triggerMmr?: number;
  };
}

const TABS = [
  { id: "entire-position", label: "Entire Position" },
  { id: "partial-position", label: "Partial Position" },
  { id: "trailing-tpsl", label: "Trailing TP/SL" },
  { id: "mmr-si", label: "MMR SI" },
];

const TRIGGER_PRICE_OPTIONS: TriggerPriceType[] = ["Last", "Mark", "Index"];
const ROI_OPTIONS: RoiType[] = ["ROI", "PnL", "Change"];

export const AdvanceTpSlModal = ({
  pair = "SBTCUSDT",
  marginMode = "Cross",
  positionType = "Open long",
  leverage = 10,
  lastPrice = 102964,
  entryPrice = 104908,
  limitOrder = 104908,
  markPrice = 102949,
  estLiquidationPrice = null,
  positionSize = 0.003,
  onClose,
  onConfirm,
}: AdvanceTpSlModalProps) => {
  const [activeTab, setActiveTab] = useState<TpSlTabType>("entire-position");

  // Take Profit state
  const [tpTriggerPriceType, setTpTriggerPriceType] =
    useState<TriggerPriceType>("Last");
  const [tpRoiType, setTpRoiType] = useState<RoiType>("ROI");
  const [tpSliderValue, setTpSliderValue] = useState(75);
  const [tpLimitOrderEnabled, setTpLimitOrderEnabled] = useState(true);
  const [tpQuantitySliderValue, setTpQuantitySliderValue] = useState(75);

  // Stop Loss state
  const [slTriggerPriceType, setSlTriggerPriceType] =
    useState<TriggerPriceType>("Last");
  const [slRoiType, setSlRoiType] = useState<RoiType>("ROI");
  const [slSliderValue, setSlSliderValue] = useState(75);
  const [slLimitOrderEnabled, setSlLimitOrderEnabled] = useState(true);
  const [slQuantitySliderValue, setSlQuantitySliderValue] = useState(75);

  // Trailing state
  const [trailingTriggerPriceType, setTrailingTriggerPriceType] =
    useState<TriggerPriceType>("Last");
  const [callbackRate, setCallbackRate] = useState<number | undefined>();
  const [trailingQuantitySliderValue, setTrailingQuantitySliderValue] =
    useState(75);

  // MMR SI state
  const [triggerMmr, setTriggerMmr] = useState<number>(70);
  const [mmrSliderValue, setMmrSliderValue] = useState(75);

  const handleConfirm = () => {
    const data: TpSlData = {
      tabType: activeTab,
    };
    onConfirm(data);
    onClose();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  return (
    <div className="w-[400px] max-h-[90vh] overflow-y-auto rounded-[20px] bg-[#F7F7F7] p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-[16px] leading-[24px] font-semibold text-[#111111]">
          TP/SL
        </h3>
        <Image src="/icons/info.svg" alt="info" width={16} height={16} />
      </div>

      {/* Pair Info */}
      <div className="flex items-center gap-2">
        <span className="text-[14px] leading-[21px] font-semibold text-[#111111]">
          {pair}. {marginMode}
        </span>
        <span className="text-[12px] leading-[18px] font-medium text-[#24A0A9] bg-transparent">
          {positionType} {leverage}×
        </span>
      </div>

      {/* Price Info Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
            Last Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {formatPrice(lastPrice)} SUSDT
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
            Entry price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {formatPrice(entryPrice)} SUSDT
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
            Limit order
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {formatPrice(limitOrder)} SUSDT
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
            Mark Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {formatPrice(markPrice)} SUSDT
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] leading-[15px] font-medium text-[#A7A7A7]">
            Est. Liquidation Price
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            {estLiquidationPrice ? formatPrice(estLiquidationPrice) : "--"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#E2E2E2] p-1.5 bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TpSlTabType)}
              className={`cursor-pointer flex-1 rounded-lg py-2 px-1 text-[10px] leading-[15px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#F1EBFD] text-[#703AE6]"
                  : "bg-transparent text-[#111111]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "entire-position" && (
        <EntirePositionContent
          tpTriggerPriceType={tpTriggerPriceType}
          setTpTriggerPriceType={setTpTriggerPriceType}
          tpRoiType={tpRoiType}
          setTpRoiType={setTpRoiType}
          tpSliderValue={tpSliderValue}
          setTpSliderValue={setTpSliderValue}
          slTriggerPriceType={slTriggerPriceType}
          setSlTriggerPriceType={setSlTriggerPriceType}
          slRoiType={slRoiType}
          setSlRoiType={setSlRoiType}
          slSliderValue={slSliderValue}
          setSlSliderValue={setSlSliderValue}
        />
      )}

      {activeTab === "partial-position" && (
        <PartialPositionContent
          tpTriggerPriceType={tpTriggerPriceType}
          setTpTriggerPriceType={setTpTriggerPriceType}
          tpRoiType={tpRoiType}
          setTpRoiType={setTpRoiType}
          tpSliderValue={tpSliderValue}
          setTpSliderValue={setTpSliderValue}
          tpLimitOrderEnabled={tpLimitOrderEnabled}
          setTpLimitOrderEnabled={setTpLimitOrderEnabled}
          tpQuantitySliderValue={tpQuantitySliderValue}
          setTpQuantitySliderValue={setTpQuantitySliderValue}
          slTriggerPriceType={slTriggerPriceType}
          setSlTriggerPriceType={setSlTriggerPriceType}
          slRoiType={slRoiType}
          setSlRoiType={setSlRoiType}
          slSliderValue={slSliderValue}
          setSlSliderValue={setSlSliderValue}
          slLimitOrderEnabled={slLimitOrderEnabled}
          setSlLimitOrderEnabled={setSlLimitOrderEnabled}
          slQuantitySliderValue={slQuantitySliderValue}
          setSlQuantitySliderValue={setSlQuantitySliderValue}
          positionSize={positionSize}
          pair={pair}
        />
      )}

      {activeTab === "trailing-tpsl" && (
        <TrailingTpSlContent
          triggerPriceType={trailingTriggerPriceType}
          setTriggerPriceType={setTrailingTriggerPriceType}
          callbackRate={callbackRate}
          setCallbackRate={setCallbackRate}
          quantitySliderValue={trailingQuantitySliderValue}
          setQuantitySliderValue={setTrailingQuantitySliderValue}
          positionSize={positionSize}
          pair={pair}
        />
      )}

      {activeTab === "mmr-si" && (
        <MmrSiContent
          triggerMmr={triggerMmr}
          setTriggerMmr={setTriggerMmr}
          mmrSliderValue={mmrSliderValue}
          setMmrSliderValue={setMmrSliderValue}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          text="Cancel"
          size="small"
          type="ghost"
          disabled={false}
          onClick={onClose}
        />
        <Button
          text="Confirm"
          size="small"
          type="solid"
          disabled={false}
          onClick={handleConfirm}
        />
      </div>

      {/* Close Text */}
      <button
        type="button"
        onClick={onClose}
        className="text-[12px] leading-[18px] font-medium text-[#111111] cursor-pointer text-center"
      >
        Close
      </button>
    </div>
  );
};

// Entire Position Tab Content
interface EntirePositionContentProps {
  tpTriggerPriceType: TriggerPriceType;
  setTpTriggerPriceType: (val: TriggerPriceType) => void;
  tpRoiType: RoiType;
  setTpRoiType: (val: RoiType) => void;
  tpSliderValue: number;
  setTpSliderValue: (val: number) => void;
  slTriggerPriceType: TriggerPriceType;
  setSlTriggerPriceType: (val: TriggerPriceType) => void;
  slRoiType: RoiType;
  setSlRoiType: (val: RoiType) => void;
  slSliderValue: number;
  setSlSliderValue: (val: number) => void;
}

const EntirePositionContent = ({
  tpTriggerPriceType,
  setTpTriggerPriceType,
  tpRoiType,
  setTpRoiType,
  tpSliderValue,
  setTpSliderValue,
  slTriggerPriceType,
  setSlTriggerPriceType,
  slRoiType,
  setSlRoiType,
  slSliderValue,
  setSlSliderValue,
}: EntirePositionContentProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Take Profit Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
          Take-Profit
        </span>

        <div className="flex gap-2">
          {/* Trigger Price Input */}
          <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Trigger Price"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={tpTriggerPriceType}
              setSelectedOption={(val) =>
                setTpTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>

          {/* ROI Input */}
          <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="ROI"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={["ROI", "%"]}
              selectedOption="%"
              setSelectedOption={() => {}}
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>
        </div>

        {/* Slider */}
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={tpSliderValue}
          onChange={setTpSliderValue}
          markers={[0, 25, 50, 75, 100]}
        />
      </div>

      {/* Stop Loss Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
          Stop-Loss
        </span>

        <div className="flex gap-2">
          {/* Trigger Price Input */}
          <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Trigger Price"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={slTriggerPriceType}
              setSelectedOption={(val) =>
                setSlTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>

          {/* ROI Input */}
          <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="ROI"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={["ROI", "%"]}
              selectedOption="%"
              setSelectedOption={() => {}}
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>
        </div>

        {/* Slider */}
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={slSliderValue}
          onChange={setSlSliderValue}
          markers={[0, 25, 50, 75, 100]}
        />
      </div>
    </div>
  );
};

// Partial Position Tab Content
interface PartialPositionContentProps {
  tpTriggerPriceType: TriggerPriceType;
  setTpTriggerPriceType: (val: TriggerPriceType) => void;
  tpRoiType: RoiType;
  setTpRoiType: (val: RoiType) => void;
  tpSliderValue: number;
  setTpSliderValue: (val: number) => void;
  tpLimitOrderEnabled: boolean;
  setTpLimitOrderEnabled: (val: boolean) => void;
  tpQuantitySliderValue: number;
  setTpQuantitySliderValue: (val: number) => void;
  slTriggerPriceType: TriggerPriceType;
  setSlTriggerPriceType: (val: TriggerPriceType) => void;
  slRoiType: RoiType;
  setSlRoiType: (val: RoiType) => void;
  slSliderValue: number;
  setSlSliderValue: (val: number) => void;
  slLimitOrderEnabled: boolean;
  setSlLimitOrderEnabled: (val: boolean) => void;
  slQuantitySliderValue: number;
  setSlQuantitySliderValue: (val: number) => void;
  positionSize: number;
  pair: string;
}

const PartialPositionContent = ({
  tpTriggerPriceType,
  setTpTriggerPriceType,
  tpRoiType,
  setTpRoiType,
  tpSliderValue,
  setTpSliderValue,
  tpLimitOrderEnabled,
  setTpLimitOrderEnabled,
  tpQuantitySliderValue,
  setTpQuantitySliderValue,
  slTriggerPriceType,
  setSlTriggerPriceType,
  slRoiType,
  setSlRoiType,
  slSliderValue,
  setSlSliderValue,
  slLimitOrderEnabled,
  setSlLimitOrderEnabled,
  slQuantitySliderValue,
  setSlQuantitySliderValue,
  positionSize,
  pair,
}: PartialPositionContentProps) => {
  const coinSymbol = pair.replace("USDT", "").replace("S", "S");

  return (
    <div className="flex flex-col gap-4">
      {/* Take Profit Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Take-Profit
          </span>
          <Checkbox
            label="Limit-Order"
            checked={tpLimitOrderEnabled}
            onChange={(e) => setTpLimitOrderEnabled(e.target.checked)}
            className="!w-4 !h-4"
          />
        </div>

        <div className="flex gap-2">
          {/* Trigger Price Input */}
          <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Trigger Price"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={tpTriggerPriceType}
              setSelectedOption={(val) =>
                setTpTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>

          {/* ROI Input */}
          <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="ROI"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={tpTriggerPriceType}
              setSelectedOption={(val) =>
                setTpTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>
        </div>

        {/* Slider */}
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={tpSliderValue}
          onChange={setTpSliderValue}
          markers={[0, 25, 50, 75, 100]}
        />

        {/* Limit Price Row (shown when limit order enabled) */}
        {tpLimitOrderEnabled && (
          <div className="flex gap-2">
            <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
              <input
                type="text"
                placeholder="Price"
                className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
              />
              <span className="text-[8px] leading-3 font-medium text-[#111111]">
                SUSDT
              </span>
            </div>

            <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
              <input
                type="text"
                placeholder="ROI"
                className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
              />
              <Dropdown
                items={TRIGGER_PRICE_OPTIONS}
                selectedOption={tpTriggerPriceType}
                setSelectedOption={(val) =>
                  setTpTriggerPriceType(val as TriggerPriceType)
                }
                classname="text-[12px] font-medium leading-[18px] gap-1"
                dropdownClassname="text-[12px] font-medium"
              />
            </div>
          </div>
        )}

        {/* Quantity Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Quantity
          </span>
          <div className="h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Quantity"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <span className="text-[8px] leading-3 font-medium text-[#111111]">
              SUSDT
            </span>
          </div>
          <QuantitySlider
            min={0}
            max={100}
            step={1}
            value={tpQuantitySliderValue}
            onChange={setTpQuantitySliderValue}
            markers={[0, 25, 50, 75, 100]}
          />
        </div>
      </div>

      {/* Stop Loss Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Stop-Loss
          </span>
          <Checkbox
            label="Limit-Order"
            checked={slLimitOrderEnabled}
            onChange={(e) => setSlLimitOrderEnabled(e.target.checked)}
            className="!w-4 !h-4"
          />
        </div>

        <div className="flex gap-2">
          {/* Trigger Price Input */}
          <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Trigger Price"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={slTriggerPriceType}
              setSelectedOption={(val) =>
                setSlTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>

          {/* ROI Input */}
          <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="ROI"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <Dropdown
              items={TRIGGER_PRICE_OPTIONS}
              selectedOption={slTriggerPriceType}
              setSelectedOption={(val) =>
                setSlTriggerPriceType(val as TriggerPriceType)
              }
              classname="text-[12px] font-medium leading-[18px] gap-1"
              dropdownClassname="text-[12px] font-medium"
            />
          </div>
        </div>

        {/* Slider */}
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={slSliderValue}
          onChange={setSlSliderValue}
          markers={[0, 25, 50, 75, 100]}
        />

        {/* Limit Price Row (shown when limit order enabled) */}
        {slLimitOrderEnabled && (
          <div className="flex gap-2">
            <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
              <input
                type="text"
                placeholder="Price"
                className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
              />
              <span className="text-[8px] leading-3 font-medium text-[#111111]">
                SUSDT
              </span>
            </div>

            <div className="w-[120px] h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
              <input
                type="text"
                placeholder="ROI"
                className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
              />
              <Dropdown
                items={TRIGGER_PRICE_OPTIONS}
                selectedOption={slTriggerPriceType}
                setSelectedOption={(val) =>
                  setSlTriggerPriceType(val as TriggerPriceType)
                }
                classname="text-[12px] font-medium leading-[18px] gap-1"
                dropdownClassname="text-[12px] font-medium"
              />
            </div>
          </div>
        )}

        {/* Quantity Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Quantity
          </span>
          <div className="h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Quantity"
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <span className="text-[8px] leading-3 font-medium text-[#111111]">
              SUSDT
            </span>
          </div>
          <QuantitySlider
            min={0}
            max={100}
            step={1}
            value={slQuantitySliderValue}
            onChange={setSlQuantitySliderValue}
            markers={[0, 25, 50, 75, 100]}
          />
        </div>
      </div>

      {/* Position Size */}
      <div className="text-[10px] leading-[15px] font-medium text-[#111111]">
        Positions Size: <span className="font-semibold">{positionSize} {coinSymbol}</span>
      </div>
    </div>
  );
};

// Trailing TP/SL Tab Content
interface TrailingTpSlContentProps {
  triggerPriceType: TriggerPriceType;
  setTriggerPriceType: (val: TriggerPriceType) => void;
  callbackRate: number | undefined;
  setCallbackRate: (val: number | undefined) => void;
  quantitySliderValue: number;
  setQuantitySliderValue: (val: number) => void;
  positionSize: number;
  pair: string;
}

const TrailingTpSlContent = ({
  triggerPriceType,
  setTriggerPriceType,
  callbackRate,
  setCallbackRate,
  quantitySliderValue,
  setQuantitySliderValue,
  positionSize,
  pair,
}: TrailingTpSlContentProps) => {
  const coinSymbol = pair.replace("USDT", "").replace("S", "S");

  return (
    <div className="flex flex-col gap-4">
      {/* Take Profit Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
          Take-Profit
        </span>

        {/* Trigger Price Input */}
        <div className="h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
          <input
            type="text"
            placeholder="Trigger Price"
            className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
          />
          <Dropdown
            items={TRIGGER_PRICE_OPTIONS}
            selectedOption={triggerPriceType}
            setSelectedOption={(val) =>
              setTriggerPriceType(val as TriggerPriceType)
            }
            classname="text-[12px] font-medium leading-[18px] gap-1"
            dropdownClassname="text-[12px] font-medium"
          />
        </div>
      </div>

      {/* Callback Rate Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] leading-[15px] font-medium text-[#111111] underline">
          Callback Rate
        </span>

        <div className="flex gap-2">
          <div className="flex-1 h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
            <input
              type="text"
              placeholder="Callback rate"
              value={callbackRate ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setCallbackRate(undefined);
                } else {
                  const num = parseFloat(val);
                  if (!isNaN(num)) setCallbackRate(num);
                }
              }}
              className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
            />
            <span className="text-[8px] leading-3 font-medium text-[#111111]">
              SUSDT
            </span>
          </div>

          {/* Preset Buttons */}
          <button
            type="button"
            onClick={() => setCallbackRate(5)}
            className={`h-9 px-4 rounded-lg text-[12px] font-medium transition-colors ${
              callbackRate === 5
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-white text-[#111111] border border-[#E2E2E2]"
            }`}
          >
            5%
          </button>
          <button
            type="button"
            onClick={() => setCallbackRate(10)}
            className={`h-9 px-4 rounded-lg text-[12px] font-medium transition-colors ${
              callbackRate === 10
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-white text-[#111111] border border-[#E2E2E2]"
            }`}
          >
            10%
          </button>
        </div>
      </div>

      {/* Quantity Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
          Quantity
        </span>
        <div className="h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
          <input
            type="text"
            placeholder="Quantity"
            className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none placeholder:text-[#C6C6C6]"
          />
          <span className="text-[8px] leading-3 font-medium text-[#111111]">
            SUSDT
          </span>
        </div>
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={quantitySliderValue}
          onChange={setQuantitySliderValue}
          markers={[0, 25, 50, 75, 100]}
        />
      </div>

      {/* Remaining Quantity */}
      <div className="text-[10px] leading-[15px] font-medium text-[#111111]">
        Remaining Quantity for TP/SL:{" "}
        <span className="font-semibold">{positionSize} {coinSymbol}</span>
      </div>
    </div>
  );
};

// MMR SI Tab Content
interface MmrSiContentProps {
  triggerMmr: number;
  setTriggerMmr: (val: number) => void;
  mmrSliderValue: number;
  setMmrSliderValue: (val: number) => void;
}

const MmrSiContent = ({
  triggerMmr,
  setTriggerMmr,
  mmrSliderValue,
  setMmrSliderValue,
}: MmrSiContentProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Trigger MMR Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Trigger MMR
          </span>
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Current MMR: <span className="font-semibold">0.15%</span>
          </span>
        </div>

        {/* MMR Input */}
        <div className="h-9 flex items-center gap-2 px-3 rounded-lg border border-[#E2E2E2] bg-white">
          <input
            type="text"
            value={triggerMmr}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") return;
              const num = parseFloat(val);
              if (!isNaN(num)) setTriggerMmr(Math.min(100, Math.max(0, num)));
            }}
            className="flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none"
          />
          <span className="text-[8px] leading-3 font-medium text-[#111111]">
            %
          </span>
        </div>

        {/* Slider */}
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={mmrSliderValue}
          onChange={(val) => {
            setMmrSliderValue(val);
            setTriggerMmr(val);
          }}
          markers={[0, 25, 50, 75, 100]}
        />
      </div>

      {/* Info Text */}
      <p className="text-[10px] leading-[15px] font-medium text-[#5C5B5B]">
        When MMR≥0%, the position will be closed at the market price. The higher
        the MMR, the higher the risk. Position liquidation/reduction will be
        triggered when the MMR reaches 100%.
      </p>
    </div>
  );
};
