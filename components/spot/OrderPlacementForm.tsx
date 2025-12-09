"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  OrderPlacementFormValues,
  useOrderPlacementStore,
} from "@/store/order-placement-store";
import ToggleButton from "../ui/toggle";
import Image from "next/image";
import TabGroup from "../ui/TabButton";
import BuySellToggle from "../ui/BuySellToggle";

const tabClasses = (active: boolean) =>
  `flex-1 text-center py-2 text-sm font-medium rounded-full border ${
    active
      ? "bg-purple-600 text-white border-purple-600"
      : "bg-white text-gray-600 border-gray-300"
  }`;

const percentBtnClasses = "px-3 py-2 text-xs rounded-md border text-gray-600";

const tabs = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "trigger", label: "Trigger" },
];

export default function OrderPlacementForm() {
  const form = useOrderPlacementStore((state) => state.form);
  const set = useOrderPlacementStore((state) => state.set);

  const [activeTab, setActiveTab] = useState("limit");
  const [ordersType, setOrdersType] = useState("buy");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<OrderPlacementFormValues>({
    defaultValues: form,
  });

  // sync when store changes (e.g. reset from somewhere else)
  useEffect(() => {
    reset(form);
  }, [form, reset]);

  const onSubmit = (values: OrderPlacementFormValues) => {
    set({ form: values });
    // yaha API call / mutation wagaira karo
    console.log("ORDER SUBMIT =>", values);
  };

  const side = watch("side");
  const orderType = watch("orderType");
  const loopEnabled = watch("loopEnabled");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm rounded-2xl border border-[#E2E2E2]  bg-[#F7F7F7] p-4 flex flex-col gap-5 text-xs"
    >
      {/* Top Tabs: Limit / Market / Trigger */}
      {/* <div className="flex gap-4 border-b pb-2 mb-4">
        {(["limit", "market", "trigger"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setValue("orderType", type)}
            className={`pb-1 text-sm font-semibold ${
              orderType === type
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500"
            }`}
          >
            {type[0].toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div> */}

      {/* Buy / Sell gradient pill toggle (new design) */}
      {/* <div className="mb-4">
        <div className="rounded-full p-0.5 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500">
          <div className="rounded-full bg-white p-1">
            <div className="flex items-center rounded-full bg-white">
              <button
                type="button"
                onClick={() => setValue("side", "buy")}
                className={`flex-1 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                  side === "buy"
                    ? "bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 text-white shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                aria-pressed={side === "buy"}
              >
                Buy
              </button>

              <button
                type="button"
                onClick={() => setValue("side", "sell")}
                className={`flex-1 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-150 ${
                  side === "sell"
                    ? "bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 text-white shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                aria-pressed={side === "sell"}
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div> */}

      <div className=" overflow-hidden">
        <TabGroup
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="flex items-center ">
        <BuySellToggle
          className="bg-[#FFFFFF]"
          onChange={(type) => setOrdersType(type)}
        />
      </div>

      {/* Loop toggle row */}
      <div>
        <div className="mb-3 flex items-center gap-2 justify-end">
          <span className="text-xs text-[#111111] font-medium">Loop</span>

          <ToggleButton
            defaultChecked={loopEnabled}
            size="small"
            onToggle={(checked) => {
              setValue("loopEnabled", checked, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        </div>

        {/* No of Loops */}
        <div className="mb-3">
          <label className="mb-1 block text-[10px] font-medium text-[#111111]">
            No of Loops
          </label>
          <div className="flex gap-2 ">
            <input
              type="number"
              placeholder="Enter Amount"
              className="h-9 flex-1 rounded-md border  border-[#E2E2E2] bg-white px-[10px] text-xs font-medium text-[#C6C6C6] outline-none"
              {...register("noOfLoops", {
                min: { value: 1, message: "Min 1 loop" },
              })}
            />
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValue("noOfLoops", n)}
                className="flex h-9 w-10 font-medium items-center justify-center rounded-lg  border-[##E2E2E2] bg-[#FFFFFF] text-xs text-[#111111]"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="flex h-9 w-10 items-center justify-center rounded-lg  border-[##E2E2E2] bg-[#FFFFFF] text-lg"
            >
              ∞
            </button>
          </div>
          {errors.noOfLoops && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.noOfLoops.message}
            </p>
          )}
        </div>
      </div>

      {/* Entry Price + Total Units */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] text-[#111111] font-medium">
            Entry Price
          </label>

          <div className="flex h-9 items-center relative rounded-md border border-[#E2E2E2] bg-white px-2.5">
            <input
              type="number"
              placeholder="Enter Amount"
              className="
        flex-1 bg-transparent
        text-[12px] leading-[18px] font-medium text-[#111111]
        outline-none
        placeholder:text-[#C6C6C6]
        [appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:appearance-none
      "
              {...register("entryPrice", {
                required: "Required",
                min: { value: 0, message: "Must be positive" },
              })}
            />
            <span className="ml-2 text-[8px] absolute right-3 top-3 leading-3 font-medium text-black">
              USDT
            </span>
          </div>
          {errors.entryPrice && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.entryPrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-[#111111] font-medium">
            Total Units
          </label>

          <div className="flex h-9 items-center relative rounded-md border border-[#E2E2E2] bg-white px-2.5">
            <input
              type="number"
              placeholder="Enter Unit"
              className="
        flex-1 bg-transparent
        text-[12px] leading-[18px] font-medium text-[#111111]
        outline-none
        placeholder:text-[#C6C6C6]
        [appearance:textfield]
        [&::-webkit-outer-spin-button]:appearance-none
        [&::-webkit-inner-spin-button]:appearance-none
      "
              {...register("entryPrice", {
                required: "Required",
                min: { value: 0, message: "Must be positive" },
              })}
            />
            <span className="ml-2 text-[8px] absolute right-3 top-3 leading-3 font-medium text-black">
              BTC
            </span>
          </div>
          {errors.totalUnits && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.totalUnits.message}
            </p>
          )}
        </div>
      </div>

      {/* Total Amount + % buttons */}
      <div className="mb-3">
        {/* Top row: label + MB text */}
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Total Amount
          </label>

          <span className="flex items-center gap-1 text-[10px] leading-[12px] font-medium text-[#919191]">
            <Image
              className="object-cover"
              width={14}
              height={14}
              alt="icons"
              src="/icons/info.svg"
            />
            MB: 2000.00 USDT
          </span>
        </div>

        {/* Input + % buttons row */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          {/* Input */}
          <div className="flex h-9 items-center relative rounded-md border border-[#E2E2E2] bg-white px-2.5">
            <input
              type="number"
              placeholder="Enter Amount"
              className="flex-1 bg-transparent text-[12px] leading-[18px] font-medium text-[#C6C6C6] outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
              {...register("totalAmount", {
                required: "Required",
                min: { value: 0, message: "Must be positive" },
              })}
            />
            <span className="ml-2 text-[8px] absolute right-3 top-3 leading-[12px] font-medium text-[#111111]">
              USDT
            </span>
          </div>

          {/* % buttons group */}
          <div className="flex h-full w-[168px] items-center justify-between gap-2">
            {[10, 25, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                className="flex h-full flex-1 items-center justify-center
                     rounded-[8px] border border-[#E2E2E2] bg-[#FFFFFF]
                     text-[10px] leading-[15px] font-medium text-[#111111]"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {errors.totalAmount && (
          <p className="mt-1 text-[10px] text-red-500">
            {errors.totalAmount.message}
          </p>
        )}
      </div>

      {/* Checkboxes */}

      <div>
        <label className="flex items-center gap-2 text-xs text-[#111111]">
          <input
            type="checkbox"
            className="h-3 w-3 rounded border-gray-300"
            {...register("takeProfit")}
          />
          <span>Take Profit</span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-[#111111]">
          <input
            type="checkbox"
            className="h-3 w-3 rounded border-gray-300"
            {...register("stopLoss")}
          />
          <span>Stop Loss</span>
        </label>
      </div>

      {/* Risk / Gain display (dummy values for now) */}
      <div className="mb-3 flex justify-between text-[11px] text-[#111111]">
        <div>
          <div>Risk: 00.00 USDT</div>
          <div>Gain: 00.00 USDT</div>
        </div>
        <div className="text-right">
          <div>Risk (in %): 00.00</div>
          <div>Gain (in %): 00.00</div>
        </div>
      </div>

      {/* Time in Force */}
      <div className="mb-4 flex items-center justify-between text-xs text-[#111111]">
        <span>Time in Force</span>
        <div className="relative">
          <select
            className="h-8 rounded-lg border border-gray-300 bg-white px-3 pr-6 text-xs outline-none"
            {...register("timeInForce")}
          >
            <option value="GTC">GTC</option>
            <option value="IOC">IOC</option>
            <option value="FOK">FOK</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">
            ▾
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="mt-2 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white"
      >
        Place Order
      </button>
    </form>
  );
}
