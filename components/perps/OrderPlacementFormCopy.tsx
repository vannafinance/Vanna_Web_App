"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { useUserStore } from "@/store/user";

import {
  PerpsOrderPlacementFormValues,
  PerpsOrderAction,
  PerpsOrderType,
  QuantityUnit,
  TakeProfitType,
  StopLossType,
  TimeInForce,
} from "@/lib/types";

import { AnimatedTabs } from "../ui/animated-tabs";
import ToggleButton from "../ui/toggle";
import { InputWithoutUnit } from "../ui/InputWithoutUnit";
import { InputWithUnit, SuffixOption } from "../ui/InputWithUnit";
import { Checkbox } from "../ui/Checkbox";
import { Dropdown } from "../ui/dropdown";
import { Button } from "../ui/button";
import PerpsOrderTypeTabs from "../ui/PerpsOrderTypeTabs";

/* ------------------ CONSTANTS ------------------ */

const QUANTITY_SUFFIX_OPTIONS: SuffixOption<QuantityUnit>[] = [
  { label: "USDT", value: "USDT" },
  { label: "BTC", value: "BTC" },
];

const TP_SUFFIX_OPTIONS: SuffixOption<TakeProfitType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

const SL_SUFFIX_OPTIONS: SuffixOption<StopLossType>[] = [
  { label: "Price (USDT)", value: "price" },
  { label: "ROI (%)", value: "roi" },
  { label: "PnL (USDT)", value: "pnl" },
  { label: "Change (%)", value: "change" },
];

const TIME_IN_FORCE_OPTIONS: TimeInForce[] = ["GTC", "Post-Only", "FOK", "IOC"];

/* ------------------ FORM ------------------ */

export default function PerpsOrderPlacementFormCopy() {
  const userAddress = useUserStore((s) => s.address);

  const { register, watch, setValue } = useForm<PerpsOrderPlacementFormValues>({
    defaultValues: {
      perpsOrderAction: "open",
      perpsOrderType: "limit",
      quantityUnit: "USDT",
      takeProfitType: "price",
      stopLossType: "price",
      timeInForce: "GTC",
    },
  });

  const type = watch("perpsOrderType");
  const quantityUnit = watch("quantityUnit");
  const takeProfitEnabled = watch("takeProfitEnabled");
  const stopLossEnabled = watch("stopLossEnabled");
  const takeProfitType = watch("takeProfitType");
  const stopLossType = watch("stopLossType");
  const timeInForce = watch("timeInForce");

  return (
    <form className="w-[316px] bg-[#F7F7F7] border border-[#E2E2E2] rounded-2xl p-4 flex flex-col gap-5 text-[10px] font-medium">
      {/* TOP CONTROLS */}
      <div className="flex gap-2">
        {["Cross", "10x", "S", "Hedge Mode"].map((t) => (
          <button
            key={t}
            type="button"
            className="h-[39px] px-4 rounded-lg bg-[#E2E2E2] text-[12px] font-semibold"
          >
            {t}
          </button>
        ))}
      </div>

      {/* OPEN / CLOSE */}
      <AnimatedTabs
        type="segment"
        tabs={[
          { id: "open", label: "Open" },
          { id: "close", label: "Close" },
        ]}
        activeTab={watch("perpsOrderAction")}
        onTabChange={(v) => setValue("perpsOrderAction", v as PerpsOrderAction)}
      />

      {/* ORDER TYPE */}
      <PerpsOrderTypeTabs
        value={type}
        onChange={(v) => setValue("perpsOrderType", v)}
      />

      {/* AVAILABLE MB */}
      <div className="flex justify-end items-center gap-1 text-[12px]">
        <Image src="/icons/info.svg" width={16} height={16} alt="" />
        MB Available : 00.00 USDT
        <Image src="/icons/swap.svg" width={16} height={16} alt="" />
      </div>

      {/* ================= ORDER TYPE SPECIFIC ================= */}

      {/* LIMIT */}
      {type === "limit" && (
        <>
          <InputWithoutUnit
            label="Price"
            placeholder="Enter Price"
            name="price"
            register={register}
          />
        </>
      )}

      {/* MARKET */}
      {type === "market" && (
        <div>
          <label className="text-[10px]">Price</label>
          <div className="h-9 flex items-center px-3 rounded-lg bg-[#EFEFEF] text-[12px]">
            Fill at market price
            <span className="ml-auto">USDT</span>
          </div>
        </div>
      )}

      {/* TRIGGER */}
      {type === "trigger" && (
        <>
          <InputWithUnit
            label="Trigger Price"
            placeholder="Enter Trigger Price"
            name="triggerPrice"
            register={register}
            suffixMode="dropdown"
            suffixOptions={[
              { label: "Mark Price", value: "mark" },
              { label: "Last Price", value: "last" },
            ]}
            selectedSuffix="mark"
          />

          <InputWithUnit
            label="Execution Price"
            placeholder="Enter Execution Price"
            name="executionPrice"
            register={register}
            suffixMode="dropdown"
            suffixOptions={[
              { label: "Limit Price", value: "limit" },
              { label: "Market", value: "market" },
            ]}
            selectedSuffix="limit"
          />
        </>
      )}

      {/* TRAILING ENTRY */}
      {type === "trailing-entry" && (
        <>
          <Checkbox label="Trigger Price (Optional)" />
          <InputWithUnit
            label="Trail Variance"
            placeholder="Enter Value"
            name="trailVariance"
            register={register}
            suffixMode="dropdown"
            suffixOptions={[
              { label: "%", value: "%" },
              { label: "Ratio", value: "ratio" },
            ]}
            selectedSuffix="%"
          />
        </>
      )}

      {/* SCALED ORDER */}
      {type === "scaled-order" && (
        <>
          <div className="flex gap-2">
            <InputWithUnit
              label="Lowest Price"
              placeholder="Enter"
              name="lowestPrice"
              register={register}
              selectedSuffix="USDT"
            />
            <InputWithUnit
              label="Highest Price"
              placeholder="Enter"
              name="highestPrice"
              register={register}
              selectedSuffix="USDT"
            />
          </div>
          <InputWithoutUnit
            label="Order Quantity"
            placeholder="2 - 20"
            name="orderQty"
            register={register}
          />
        </>
      )}

      {/* ICEBERG */}
      {type === "iceberg" && (
        <>
          <InputWithoutUnit
            label="Quantity Per Order"
            placeholder="2 - 20"
            name="qtyPerOrder"
            register={register}
          />
          <InputWithoutUnit
            label="Faster Execution"
            placeholder="2 - 20"
            name="fasterExecution"
            register={register}
          />
        </>
      )}

      {/* TWAP */}
      {type === "twap" && (
        <>
          <div className="flex gap-2">
            <InputWithoutUnit
              label="Total Time (H)"
              placeholder="4"
              name="totalHours"
              register={register}
            />
            <InputWithoutUnit
              label="Total Time (M)"
              placeholder="0"
              name="totalMinutes"
              register={register}
            />
          </div>
          <Dropdown
            items={["10s", "30s", "1m"]}
            selectedOption="10s"
            setSelectedOption={() => {}}
            classname="text-[12px]"
            dropdownClassname="text-[12px]"
          />
        </>
      )}

      {/* ================= SHARED ================= */}

      <InputWithUnit<QuantityUnit>
        label="Quantity"
        placeholder="Enter Amount"
        name="quantity"
        register={register}
        suffixMode="dropdown"
        suffixOptions={QUANTITY_SUFFIX_OPTIONS}
        selectedSuffix={quantityUnit}
        onSuffixChange={(v) => setValue("quantityUnit", v)}
      />

      {/* scaled order */}
      {perpsOrderType === "scaled-order" && (
        <>
          {/* Size Distribution + Preview */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-[12px] font-medium">
              <Image src="/icons/info.svg" width={14} height={14} alt="" />
              Size Distribution
            </div>

            <button
              type="button"
              className="flex items-center gap-1 text-[12px] font-medium"
            >
              <Image src="/icons/eye.svg" width={16} height={16} alt="" />
              Preview
            </button>
          </div>

          {/* Radio Options */}

          <div className="flex flex-wrap gap-4 mt-1">
            {["Equal", "Increasing", "Descending", "Random"].map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-[12px] cursor-pointer"
              >
                <input
                  type="radio"
                  value={opt.toLowerCase()}
                  {...register("sizeDistribution")}
                  className="accent-[#703AE6]"
                />
                {opt}
              </label>
            ))}
          </div>

          {/* Average Price */}
          <div className="mt-2">
            <label className="text-[10px] leading-[15px] text-[#111111] font-medium">
              Average Price
            </label>
            <div className="h-9 flex items-center px-3 rounded-lg bg-[#F4F4F4] border border-[#E2E2E2] text-[12px]">
              --
              <span className="ml-auto text-[#111111]">USDT</span>
            </div>
          </div>
        </>
      )}

      <Checkbox label="Take Profit" {...register("takeProfitEnabled")} />
      {takeProfitEnabled && (
        <InputWithUnit<TakeProfitType>
          placeholder="Enter"
          name="takeProfitValue"
          register={register}
          suffixMode="dropdown"
          suffixOptions={TP_SUFFIX_OPTIONS}
          selectedSuffix={takeProfitType}
          onSuffixChange={(v) => setValue("takeProfitType", v)}
        />
      )}

      <Checkbox label="Stop Loss" {...register("stopLossEnabled")} />
      {stopLossEnabled && (
        <InputWithUnit<StopLossType>
          placeholder="Enter"
          name="stopLossValue"
          register={register}
          suffixMode="dropdown"
          suffixOptions={SL_SUFFIX_OPTIONS}
          selectedSuffix={stopLossType}
          onSuffixChange={(v) => setValue("stopLossType", v)}
        />
      )}

      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#6F6F6F]">Time in Force</span>
        <Dropdown
          items={TIME_IN_FORCE_OPTIONS}
          selectedOption={timeInForce ?? "GTC"}
          setSelectedOption={(v) => setValue("timeInForce", v as TimeInForce)}
          classname="text-[12px]"
          dropdownClassname="text-[12px]"
        />
      </div>

      {/* SUBMIT */}
      {/* open long & open short */}
      {!userAddress ? (
        <Button
          text="Connect Wallet To Trade"
          size="small"
          type="solid"
          disabled={true}
        />
      ) : (
        <div className="flex gap-2 ">
          <div className=" flex flex-col gap-2 w-full">
            <Button
              text="Open Long"
              size="small"
              type="solid"
              disabled={false}
              customBgColor="#24A0A9"
            />

            {/* long side stats */}
            <div className="flex flex-col px-3">
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">
                  Liq Price:{" "}
                </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Cost: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Max: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Fees: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
            </div>
          </div>
          <div className=" flex flex-col gap-2 w-full">
            <Button
              text="Open Short"
              size="small"
              type="solid"
              disabled={false}
              customBgColor="#FC5457"
            />
            {/* short side stats */}
            <div className="flex flex-col px-3 items-end">
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">
                  Liq Price:{" "}
                </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Cost: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Max: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
              <p className="flex gap-0.5">
                <span className="text-[#8E8E92] font-semibold">Fees: </span>
                <span className="text-[#000000]">-- USDT</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
