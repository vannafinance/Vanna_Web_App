"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import ToggleButton from "../ui/toggle";
import OrderTypeTabs from "../ui/OrderTypeTabs";
import BuySellToggle from "../ui/BuySellToggle";
import { Button } from "../ui/button";
import {
  OrderPlacementFormValues,
  OrderSide,
  OrderType,
  TimeInForce,
} from "@/lib/types";
import Image from "next/image";
import { Checkbox } from "../ui/Checkbox";
import { Dropdown } from "../ui/dropdown";
import MultipleTp from "./MultipleTp";
import { RiskRewardSelector } from "./Risk-Reward";
import { AnimatedTabs } from "../ui/animated-tabs";
import { resetOrderForm } from "@/lib/resetOrderForm";
import { useUserStore } from "@/store/user";
import { useSpotTradeStore } from "@/store/spot-trade-store";
import { mapOrderToActivePosition, mapOrderToOpenOrder } from "@/lib/helper";

type FormMode = "create" | "edit";

interface OrderPlacementFormProps {
  mode?: FormMode;
  initialValues?: OrderPlacementFormValues;
  onCancel?: () => void;
  onSave?: (values: OrderPlacementFormValues) => void;
}
const tabs = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "trigger", label: "Trigger" },
];

const TIME_IN_FORCE_OPTIONS: TimeInForce[] = ["GTC", "Post-Only", "FOK", "IOC"];

const buySellTabs: { id: OrderSide; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
];

// const MAX_TP_ROWS = 3;

const EMPTY_TP_ROW = {
  exitPricePercent: null,
  profitPercent: null,
  profitAmount: null,
  unitsPercent: null,
  units: null,
  marketPrice: false,
};

export default function OrderPlacementForm({
  mode = "create",
  initialValues,
  onCancel,
  onSave,
}: OrderPlacementFormProps) {
  const orderPlacementFormDefaultValues: OrderPlacementFormValues = {
    orderType: "limit",
    orderSide: "buy",

    loopEnabled: true,
    noOfLoops: null, // null = infinity

    triggerPrice: null,
    triggerMode: "limit",

    entryPrice: null,
    totalUnits: null,
    totalAmount: null,

    takeProfitEnabled: false,
    multipleTpEnabled: false,

    singleTakeProfit: {
      exitPrice: null,
      profitPercent: null,
      profitAmount: null,
    },

    multipleTakeProfits: [],

    stopLossEnabled: false,
    stopLoss: {
      triggerPrice: null,
      limitPrice: null,
      trailVariance: null,
      trailVarianceUnit: "USD",
      rrRatio: "NA",
      customRR: null,
    },

    timeInForce: "GTC",

    riskAmount: 0,
    riskPercent: 0,
    gainAmount: 0,
    gainPercent: 0,
  };
  const userAddress = useUserStore((state) => state.address);

  const setSpotTrade = useSpotTradeStore((s) => s.set);
  const getSpotTrade = useSpotTradeStore((s) => s.get);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<OrderPlacementFormValues>({
    defaultValues: orderPlacementFormDefaultValues,
  });

  const orderType: OrderType = watch("orderType");
  const orderSide: OrderSide = watch("orderSide");
  const isLoopOn = watch("loopEnabled");
  const triggerMode = watch("triggerMode");
  const takeProfitEnabled = watch("takeProfitEnabled");
  const multiTpEnabled = watch("multipleTpEnabled");
  const stopLossEnabled = watch("stopLossEnabled");
  const rrRatio = watch("stopLoss.rrRatio");
  const customRR = watch("stopLoss.customRR");
  const timeInForce = watch("timeInForce");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "multipleTakeProfits",
  });

  // ✅ MAX 3 ROWS GUARD
  const handleAddTp = () => {
    // if (fields.length >= MAX_TP_ROWS) return;
    append(EMPTY_TP_ROW);
  };

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      reset(initialValues);
    }
  }, [mode, initialValues, reset]);

  // as soon as multiTP is enabled, add a row if none exist
  useEffect(() => {
    if (multiTpEnabled && fields.length === 0) {
      append(EMPTY_TP_ROW);
    }

    if (!multiTpEnabled && fields.length > 0) {
      remove(); //
    }
  }, [multiTpEnabled]);

  const handleOrderTypeChange = (val: string) => {
    if (val === "limit" || val === "market" || val === "trigger") {
      setValue("orderType", val);
    }
  };

  const handleTabChange = (tabId: string) => {
    setValue("orderSide", tabId as OrderSide);
  };

  const handleModeToggle = () => {
    setValue("triggerMode", triggerMode === "limit" ? "market" : "limit");
  };

  // sync when store changes (e.g. reset from somewhere else)
  // useEffect(() => {
  //   reset(form);
  // }, [form, reset]);

  const onSubmit = (values: OrderPlacementFormValues) => {
    if (values.orderType === "market") {
      const currentPrice = 66500;
      const position = mapOrderToActivePosition(values, currentPrice);
      const prevPositions = getSpotTrade((s) => s.activePositions);
      setSpotTrade({ activePositions: [position, ...prevPositions] });
    }
    if (values.orderType === "limit") {
      const openOrders = mapOrderToOpenOrder(values);
      const prevOpenOrders = getSpotTrade((s) => s.openOrders);
      setSpotTrade({ openOrders: [openOrders, ...prevOpenOrders] });
    }

    console.log("ORDER SUBMIT =>", values);

    resetOrderForm(setValue, () => remove());
  };

  useEffect(() => {
    if (!takeProfitEnabled) {
      setValue("multipleTpEnabled", false);
      remove(); // saari multi TP rows clear
    }
  }, [remove, setValue, takeProfitEnabled]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`max-w-[380px] rounded-2xl ${
        mode === "create" ? "border border-[#E2E2E2]" : ""
      } bg-[#F7F7F7] p-4 flex flex-col gap-5 `}
    >
      {/* <OrderTypeTabs
        tabs={tabs}
        activeTab={orderType}
        onTabChange={handleOrderTypeChange}
      /> */}

      {mode === "create" && (
        <AnimatedTabs
          tabs={tabs}
          activeTab={orderType}
          onTabChange={handleOrderTypeChange}
          type="underline"
        />
      )}

      {mode === "create" && (
        <BuySellToggle
          value={orderSide}
          onChange={(val) => setValue("orderSide", val)}
        />
      )}

      {/* <AnimatedTabs
        tabs={buySellTabs}
        activeTab={orderSide}
        onTabChange={handleTabChange}
      /> */}

      {/* Loop toggle row */}
      {orderType === "limit" && (
        <div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
              Loop
            </span>
            <ToggleButton
              size="small"
              defaultChecked={isLoopOn}
              onToggle={(val) => setValue("loopEnabled", val)}
            />
          </div>

          {/* No of Loops */}
          {isLoopOn && (
            <div className="flex flex-col gap-2">
              <label className=" text-[10px]  text-[#111111] leading-[15px] font-medium">
                No of Loops
              </label>
              <div className="flex gap-2 ">
                <div className="flex h-9 w-[170px] items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
                  <div className="rounded-md py-1 flex gap-2.5 items-center">
                    <input
                      placeholder="Enter No of Loops"
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
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue("noOfLoops", n)}
                      className="cursor-pointer p-2.5 rounded-lg w-[36.5px] h-[36px] text-[12px] bg-[#FFFFFF] text-[#111111] leading-[18px] font-medium"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setValue("noOfLoops", "Infinite")}
                    className="cursor-pointer p-2.5 rounded-lg w-[36.5px] h-[36px] text-[12px] bg-[#FFFFFF] text-[#111111] text-[20px] leading-[18px] font-medium"
                  >
                    &infin;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {orderType === "trigger" && (
        <div className="flex flex-col gap-1">
          <label className=" text-[10px] text-[#111111] font-medium leading-[15px]">
            Trigger Price
          </label>
          <div className="flex h-9  items-center  rounded-lg border border-[#E2E2E2] bg-white p-2">
            <div className="rounded-md py-1 flex flex-1 gap-2.5 items-center justify-between">
              <input
                type="number"
                placeholder="Trigger Price"
                className=" flex-1 h-[18] text-[12px] leading-[18px] font-medium outline-none
                   placeholder:text-[#C6C6C6]
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("triggerPrice", {
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
      )}

      <div className=" flex flex-col gap-3">
        {/* Limit market toggle */}
        {orderType === "trigger" && (
          <div className="flex items-center gap-1 justify-end">
            <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
              Limit
            </span>
            <ToggleButton size="small" onToggle={handleModeToggle} />
            <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
              Market
            </span>
          </div>
        )}

        <div className=" flex gap-3">
          {orderType !== "market" && (
            <div className="flex flex-col w-[168px] gap-1">
              <label className="text-[10px] text-[#111111] font-medium leading-[15px]">
                Entry Price
              </label>

              <div
                className={`flex h-9  items-center  rounded-lg border border-[#E2E2E2] 
                  bg-white p-2`}
              >
                <div className="rounded-md py-1 flex gap-2.5 items-center">
                  <input
                    type="number"
                    placeholder="Enter Price"
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
          )}

          {orderType === "market" && (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-[10px] leading-[15px] text-[#111111]">
                Market Price
              </span>
              <div className="h-9 rounded-md border border-[#E2E2E2] flex  items-center  justify-center gap-2.5 p-2">
                <span className="text-[12px] w-[117px] leading-[18px] font-medium">
                  66500
                </span>
                <span className="text-[8px] leading-3 font-medium text-[#111111]">
                  USDT
                </span>
              </div>
            </div>
          )}

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
          </div>
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
                className="cursor-pointer flex h-full flex-1 items-center justify-center
                           rounded-lg  bg-[#FFFFFF]
                           text-[10px] leading-[15px] font-medium text-[#111111]"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={` ${
          takeProfitEnabled
            ? "flex flex-col gap-3 $ border-b border-[#E2E2E2] pb-4"
            : ""
        }`}
      >
        <div className="flex justify-between">
          <Checkbox label="Take Profit" {...register("takeProfitEnabled")} />

          {takeProfitEnabled && (
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
                Multiple TP
              </span>
              <ToggleButton
                size="small"
                onToggle={(val) => setValue("multipleTpEnabled", val)}
              />
            </div>
          )}
        </div>

        {takeProfitEnabled && !multiTpEnabled && (
          <div className="flex justify-between w-full h-auto gap-1 bg-white border rounded-lg border-[#E2E2E2] p-2">
            <div className="flex-1 flex flex-col gap-2.5 h-auto justify-between items-start self-stretch">
              <label className="text-[8px] font-medium leading-3 text-[#C6C6C6]">
                Exit Price (USD)
              </label>
              <input
                type="number"
                placeholder="00.00"
                className="w-[59px] h-[18] text-[12px]  font-medium  leading-[18px] text-[#000000] outline-none      [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("singleTakeProfit.exitPrice", { min: 0 })}
              />
            </div>

            <div className="flex-1 flex flex-col gap-2.5  items-center self-stretch">
              <label className="text-[8px] font-medium leading-3 text-[#C6C6C6]">
                Profit (%)
              </label>
              <input
                type="number"
                placeholder="00.00"
                className="w-[59px] h-[18] text-[12px] font-medium text-center  flex-1 leading-[18px] text-[#000000] outline-none      [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("singleTakeProfit.profitPercent", { min: 0 })}
              />
            </div>

            <div className="flex-1 flex flex-col gap-2.5 items-end self-stretch">
              <label className="text-[8px] font-medium leading-3 text-[#C6C6C6]">
                Profit (USD)
              </label>
              <input
                type="number"
                placeholder="00.00"
                className="w-[59px] h-[18] text-[12px] font-medium text-right flex-1 leading-[18px] text-[#000000] outline-none      [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
                {...register("singleTakeProfit.profitAmount", { min: 0 })}
              />
            </div>
          </div>
        )}
        {takeProfitEnabled && multiTpEnabled && (
          <MultipleTp
            fields={fields}
            register={register}
            onAdd={handleAddTp}
            onRemove={remove}
            // maxReached={fields.length >= MAX_TP_ROWS}
          />
        )}
      </div>

      <div
        className={` ${
          stopLossEnabled
            ? "flex flex-col gap-3 $ border-b border-[#E2E2E2] pb-4"
            : ""
        }`}
      >
        <Checkbox label="Stop Loss" {...register("stopLossEnabled")} />

        {stopLossEnabled && (
          <>
            <div className="flex gap-1 w-full justify-around items-center overflow-hidden">
              <div className="flex flex-1  flex-col justify-start items-start gap-1">
                <label className="text-[10px] leading-[15px] font-medium flex gap-0.5 items-center">
                  SL Trigger Price
                  <span>
                    <Image
                      src="/icons/info-black.svg"
                      alt="info-icon"
                      width={12}
                      height={12}
                      className="object-cover"
                    />
                  </span>
                </label>
                <div className="relative flex w-[113px] rounded-md border border-[#E2E2E2] bg-[#FFFFFF] py-2.5 px-1">
                  <input
                    type="number"
                    placeholder="00.00"
                    className="text-[10px] font-medium leading-[15px] text-[#111111]
                      outline-none
                      [appearance:textfield]
                         [&::-webkit-inner-spin-button]:appearance-none
                         [&::-webkit-outer-spin-button]:appearance-none"
                    {...register("stopLoss.triggerPrice", { min: 0 })}
                  />
                  <span className="absolute right-1 text-[8px] leading-3 font-medium">
                    USDT
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-start items-start gap-1">
                <label className="text-[10px] leading-[15px] font-medium flex gap-0.5 items-center">
                  SL Limit(optional){" "}
                  <span>
                    <Image
                      src="/icons/info-black.svg"
                      alt="info-icon"
                      width={12}
                      height={12}
                      className="object-cover"
                    />
                  </span>
                </label>
                <div className="relative flex w-[113px] rounded-md border border-[#E2E2E2] bg-[#FFFFFF] py-2.5 px-1">
                  <input
                    type="number"
                    placeholder="00.00"
                    className="[appearance:textfield] outline-none text-[10px] font-medium leading-[15px] text-[#111111]
                         [&::-webkit-inner-spin-button]:appearance-none
                         [&::-webkit-outer-spin-button]:appearance-none"
                    {...register("stopLoss.limitPrice", { min: 0 })}
                  />
                  <span className="absolute right-1 text-[8px] leading-3 font-medium">
                    USDT
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-start items-start gap-1">
                <label className="text-[10px] leading-[15px] font-medium flex gap-0.5 items-center">
                  Trail Variance
                  <span>
                    <Image
                      src="/icons/info-black.svg"
                      alt="info-icon"
                      width={12}
                      height={12}
                      className="object-cover"
                    />
                  </span>
                </label>
                <div className="relative flex rounded-md w-[113px] border border-[#E2E2E2] bg-[#FFFFFF] py-2.5 px-1">
                  <input
                    type="number"
                    placeholder="00.00"
                    className="[appearance:textfield] outline-none text-[10px] font-medium leading-[15px] text-[#111111]
                         [&::-webkit-inner-spin-button]:appearance-none
                         [&::-webkit-outer-spin-button]:appearance-none"
                    {...register("stopLoss.trailVariance", { min: 0 })}
                  />
                  <span className="absolute right-1 text-[8px] leading-3 font-medium">
                    USDT
                  </span>
                </div>
              </div>
            </div>

            {/*Risk Reward */}
            <RiskRewardSelector
              value={rrRatio}
              customValue={customRR}
              onChange={(v) => setValue("stopLoss.rrRatio", v)}
              onCustomChange={(v) => setValue("stopLoss.customRR", v)}
            />
          </>
        )}
      </div>

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

      {/* Time in Force Dropdown */}
      {orderType === "limit" && (
        <div className="flex items-center gap-2 ">
          <div className="text-[#6F6F6F] text-[12px]  font-medium leading-[18px] whitespace-nowrap ">
            Time in Force
          </div>
          <Dropdown
            items={TIME_IN_FORCE_OPTIONS}
            selectedOption={timeInForce}
            setSelectedOption={(val) =>
              setValue("timeInForce", val as TimeInForce)
            }
            classname="gap-0.5"
            dropdownClassname="text-[12px] font-semibold"
          />
        </div>
      )}

      {/* Submit */}
      {/* {userAddress ? (
        <Button text="Place Order" size="small" type="solid" disabled={false} />
      ) : (
        <Button
          text="Connect Wallet to Trade"
          size="small"
          type="solid"
          disabled={true}
        />
      )} */}

      {!userAddress ? (
        <Button
          text="Connect Wallet to Trade"
          size="small"
          type="solid"
          disabled={true}
        />
      ) : mode === "edit" ? (
        <div className="flex gap-3">
          <Button
            text="Cancel"
            size="small"
            type="ghost"
            onClick={onCancel}
            disabled={false}
          />

          <Button
            text="Save As"
            size="small"
            type="solid"
            onClick={handleSubmit(onSave!)}
            disabled={false}
          />
        </div>
      ) : (
        <Button text="Place Order" size="small" type="solid" disabled={false} />
      )}
    </form>
  );
}
