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
import { Button } from "../ui/button";

import { Dropdown } from "../ui/dropdown";
import { DropdownOptionsType } from "@/lib/types";
import { Checkbox } from "../ui/Checkbox";

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

const TIME_IN_FORCE_OPTIONS: DropdownOptionsType[] = [
  { id: "GTC", name: "GTC" },
  { id: "IOC", name: "IOC" },
  { id: "FOK", name: "FOK" },
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

  const side = watch("side");
  const orderType = watch("orderType");
  const loopEnabled = watch("loopEnabled");
  const timeInForce = watch("timeInForce") || "GTC";

  const selectedTimeInForce =
    TIME_IN_FORCE_OPTIONS.find((o) => o.id === timeInForce) ??
    TIME_IN_FORCE_OPTIONS[0];

  // sync when store changes (e.g. reset from somewhere else)
  useEffect(() => {
    reset(form);
  }, [form, reset]);

  const onSubmit = (values: OrderPlacementFormValues) => {
    set({ form: values });
    // yaha API call / mutation wagaira karo
    console.log("ORDER SUBMIT =>", values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-[380px] rounded-2xl border border-[#E2E2E2]  bg-[#F7F7F7] p-4 flex flex-col gap-5 text-xs"
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
        <div className="flex items-center gap-2 justify-end">
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
        <div className="flex flex-col gap-2">
          <label className=" text-[10px]  text-[#111111] leading-[15px] font-medium">
            No of Loops
          </label>
          <div className="flex gap-2 ">
            <div className="flex h-9 w-[170px] items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
              <div className="rounded-md py-1 flex gap-2.5 items-center">
                <input
                  type="number"
                  placeholder="Enter Amount"
                  className=" w-[134px] h-[18px] text-[12px] leading-[18px] font-medium outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                  {...register("noOfLoops", {
                    min: { value: 1, message: "Min 1 loop" },
                  })}
                />
              </div>
            </div>

            <div className="flex gap-2 items-center justify-between">
              {[5, 10, 15].map((n) => (
                <div
                  key={n}
                  className="flex gap-2.5 px-[14.25] py-[9px] rounded-lg bg-[#FFFFFF]"
                >
                  <button
                    type="button"
                    onClick={() => setValue("noOfLoops", n)}
                    className="text-[12px] text-[#111111] leading-[18px] font-medium"
                  >
                    {n}
                  </button>
                </div>
              ))}
              <div className="flex gap-2.5 px-[9.25] py-[9.5px] rounded-lg bg-[#FFFFFF]">
                <button
                  type="button"
                  className="text-[20px] text-[#111111] leading-[18px] font-medium"
                >
                  &infin;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Price + Total Units */}
      <div className=" flex gap-3">
        <div className="flex flex-col w-[168px] gap-1">
          <label className="text-[10px] text-[#111111] font-medium leading-[15px]">
            Entry Price
          </label>

          <div className="flex h-9  items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
            <div className="rounded-md py-1 flex gap-2.5 items-center">
              <input
                type="number"
                placeholder="Enter Amount"
                className=" w-[121px] h-[18] text-[12px] leading-[18px] font-medium outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("entryPrice", {
                  required: "Required",
                  min: { value: 0, message: "Must be positive" },
                })}
              />
              <div className="text-[8px]  leading-3 font-medium text-[#111111]">
                USDT
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className=" text-[10px] text-[#111111] font-medium leading-[15px]">
            Total Units
          </label>
          <div className="flex h-9 w-[168px] items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
            <div className="rounded-md py-1 flex gap-2.5 items-center">
              <input
                type="number"
                placeholder="Enter Unit"
                className=" w-[121px] h-[18] text-[12px] leading-[18px] font-medium outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("totalUnits", {
                  required: "Required",
                  min: { value: 0, message: "Must be positive" },
                })}
              />
              <div className="text-[8px]  leading-3 font-medium text-[#111111]">
                BTC
              </div>
            </div>
          </div>

          {errors.totalUnits && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.totalUnits.message}
            </p>
          )}
        </div>
      </div>

      {/* Total Amount + % buttons */}
      <div className="flex flex-col gap-2">
        {/* Top row: label + MB text */}
        <div className="flex items-center justify-between ">
          <label className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Total Amount
          </label>

          <span className="flex items-center gap-1 text-[10px] leading-[15px] font-medium text-[#919191]">
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
        <div className=" grid grid-cols-2 gap-3">
          {/* Input */}
          <div className="flex h-9 w-[168px] items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
            <div className="rounded-md py-1 flex gap-2.5 items-center">
              <input
                type="number"
                placeholder="Enter Amount"
                className=" w-[121px] h-[18] text-[12px] leading-[18px] font-medium outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("totalAmount", {
                  required: "Required",
                  min: { value: 0, message: "Must be positive" },
                })}
              />
              <div className="text-[8px]  leading-3 font-medium text-[#111111]">
                USDT
              </div>
            </div>
          </div>

          {/* % buttons group */}
          <div className="flex h-full w-[168px] items-center justify-between gap-2">
            {[10, 25, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                className="flex h-full flex-1 items-center justify-center
                     rounded-lg  bg-[#FFFFFF]
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
        <Checkbox label="Take Profit" {...register("takeProfit")} />
      </div>
      <div>
        <Checkbox label="Stop Loss" {...register("stopLoss")} />
      </div>

      {/* Risk / Gain display*/}
      <div className="flex flex-col gap-1 pt-2 text-[11px] text-[#111111]">
        <div className="flex gap-16">
          <div className="flex gap-1 w-[138px]">
            <div className="text-[#111111] text-[10px] font-semibold leading-[15px]">
              Risk:
            </div>
            <div className="text-[#464545] text-[10px] font-medium leading-[15px]">
              00.00 USDT
            </div>
          </div>
          <div className="flex gap-1 w-[138px]">
            <div className="text-[#111111] text-[10px] font-semibold leading-[15px]">
              Risk (in %):
            </div>
            <div className="text-[#464545] text-[10px] font-medium leading-[15px]">
              00.00 USDT
            </div>
          </div>
        </div>
        <div className="flex gap-16">
          <div className="flex gap-1 w-[138px]">
            <div className="text-[#111111] text-[10px] font-semibold leading-[15px]">
              Gain:
            </div>
            <div className="text-[#464545] text-[10px] font-medium leading-[15px]">
              00.00 USDT
            </div>
          </div>
          <div className="flex gap-1 w-[138px]">
            <div className="text-[#111111] text-[10px] font-semibold leading-[15px]">
              Gain (in %):
            </div>
            <div className="text-[#464545] text-[10px] font-medium leading-[15px]">
              00.00 USDT
            </div>
          </div>
        </div>
      </div>

      {/* Time in Force */}
      <div className="flex items-center gap-2.5  ">
        <span className="text-[#6F6F6F] text-[12px] font-medium leading-[18px] ">
          Time in Force
        </span>
        <Dropdown
          items={TIME_IN_FORCE_OPTIONS}
          selectedOption={selectedTimeInForce}
          setSelectedOption={(item) => {
            setValue(
              "timeInForce",
              item.id as OrderPlacementFormValues["timeInForce"],
              {
                shouldDirty: true,
                shouldValidate: true,
              }
            );
          }}
        />
      </div>

      {/* Submit */}
      <Button text="Place Order" size="small" type="solid" disabled={false} />
    </form>
  );
}
