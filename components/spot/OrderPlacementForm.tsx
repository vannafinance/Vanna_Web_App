"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  OrderPlacementStateType,
  useOrderPlacementStore,
} from "@/store/order-placement-store";
import ToggleButton from "../ui/toggle";
import OrderTypeTabs from "../ui/OrderTypeTabs";
import BuySellToggle from "../ui/BuySellToggle";
import { Button } from "../ui/button";
import { OrderSide, OrderType } from "@/lib/types";
import Image from "next/image";
import { Checkbox } from "../ui/Checkbox";
import { Ratio, RiskRewardSelector } from "./Risk-Reward";
import { Dropdown } from "../ui/dropdown";
import MultipleTPInputs from "./MultipleTPInputs";

const tabs = [
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "trigger", label: "Trigger" },
];

type Modes = "Limit" | "Market";

export default function OrderPlacementForm() {
  // const form = useOrderPlacementStore((state) => state.form);
  // const set = useOrderPlacementStore((state) => state.set);

  const [orderType, setOrderType] = useState("limit");
  const [ordersSide, setOrdersSide] = useState<OrderSide>("buy");
  const [isloopOn, setIsLoopOn] = useState(true);
  const [mode, setMode] = useState<Modes>("Limit");
  const [multiTpEnabled, setMultiTpEnabled] = useState(false);
  const [ratio, setRatio] = useState<Ratio>("1:1");

  const handleModeToggle = () => {
    setMode((prev) => (prev === "Limit" ? "Market" : "Limit"));
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<OrderPlacementStateType>({});

  const takeProfitEnabled = watch("takeProfit");
  const stopLossEnabled = watch("stopLoss");

  // sync when store changes (e.g. reset from somewhere else)
  // useEffect(() => {
  //   reset(form);
  // }, [form, reset]);

  const onSubmit = (values: OrderPlacementStateType) => {
    // set({ form: values });

    console.log("ORDER SUBMIT =>", values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-[380px] rounded-2xl border border-[#E2E2E2]  bg-[#F7F7F7] p-4 flex flex-col gap-5 text-xs"
    >
      <OrderTypeTabs
        tabs={tabs}
        activeTab={orderType}
        onTabChange={setOrderType}
      />

      <BuySellToggle value={ordersSide} onChange={setOrdersSide} />

      {/* Loop toggle row */}
      {orderType === "limit" && (
        <div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
              Loop
            </span>
            <ToggleButton
              size="small"
              defaultChecked={isloopOn}
              onToggle={(state) => setIsLoopOn(state)}
            />
          </div>

          {/* No of Loops */}
          {isloopOn && (
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
                USDT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry Price + Total Units */}
      <div className=" flex flex-col gap-3">
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
          <div className="flex flex-col w-[168px] gap-1">
            <label className="text-[10px] text-[#111111] font-medium leading-[15px]">
              {orderType === "market" ? "Market Price" : "Entry Price"}
            </label>

            <div
              className={`flex h-9  items-center  rounded-lg border border-[#E2E2E2] ${
                orderType === "market" ? "" : "bg-white"
              } p-2`}
            >
              <div className="rounded-md py-1 flex gap-2.5 items-center">
                <input
                  type="number"
                  placeholder="Enter Amount"
                  disabled={orderType === "market"}
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
                className="flex h-full flex-1 items-center justify-center
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
          <Checkbox label="Take Profit" {...register("takeProfit")} />

          {takeProfitEnabled && (
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] leading-[15px] text-[#111111] font-medium">
                Multiple TP
              </span>
              <ToggleButton
                size="small"
                onToggle={(state) => setMultiTpEnabled(state)}
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
              />
            </div>
          </div>
        )}
        {takeProfitEnabled && multiTpEnabled && <MultipleTPInputs />}
      </div>

      <div
        className={` ${
          stopLossEnabled
            ? "flex flex-col gap-3 $ border-b border-[#E2E2E2] pb-4"
            : ""
        }`}
      >
        <Checkbox label="Stop Loss" {...register("stopLoss")} />

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
                  />
                  <span className="absolute right-1 text-[8px] leading-3 font-medium">
                    USDT
                  </span>
                </div>
              </div>
            </div>

            {/*Risk Reward */}
            <RiskRewardSelector
              value={ratio}
              onChange={setRatio}
              label="RR Ratio"
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

      {/* Submit */}
      <Button text="Place Order" size="small" type="solid" disabled={false} />
    </form>
  );
}
