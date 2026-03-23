"use client";

import { useState, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { AnimatedTabs } from "../ui/animated-tabs";
import {
  PerpsOrderPlacementFormValues,
  PerpsOrderAction,
  PerpsOrderType,
  TakeProfitType,
  StopLossType,
  TriggerPriceType,
  ExecutionPriceType,
  PerpsModalType,
  TwapFrequencyType,
  TimeInForce,
} from "@/lib/types";
import Image from "next/image";
import ToggleButton from "../ui/toggle";
import { InputWithoutUnit } from "../ui/InputWithoutUnit";
import { InputWithUnit } from "../ui/InputWithUnit";
import {
  TRIGGER_PRICE_SUFFIX_OPTIONS,
  EXECUTION_PRICE_SUFFIX_OPTIONS,
  TP_SUFFIX_OPTIONS,
  SL_SUFFIX_OPTIONS,
  TIME_IN_FORCE_OPTIONS,
  TWAP_FREQUENCY_OPTIONS,
} from "@/lib/constants/perps";
import { Checkbox } from "../ui/Checkbox";
import { Dropdown } from "../ui/dropdown";
import { useUserStore } from "@/store/user";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "../ui/button";
import PerpsOrderTypeTabs from "../ui/PerpsOrderTypeTabs";
import { Radio } from "../ui/radio-button";
import { RadioGroup } from "../ui/radio-button";
import { QuantitySlider } from "../ui/quantity-slider";
import PerpsModals from "./modals/perps-modals";

const PerpsOrderPlacementForm = () => {
  const { isDark } = useTheme();
  const [activeModal, setActiveModal] = useState<PerpsModalType>(null);

  const userAddress = useUserStore((state) => state.address);
  const [quantityPercentage, setQuantityPercentage] = useState(0);
  const isUpdatingFromSliderRef = useRef(false);
  const isUpdatingFromInputRef = useRef(false);

  // TODO: Replace with actual available margin balance from your API/store
  const availableMarginBalance = 1000.0; // Mock value in USDT

  // default values
  const perpsOrderPlacementFormValues: PerpsOrderPlacementFormValues = {
    leverage: 10,
    assetMode: "single",
    marginMode: "cross",
    positionMode: "hedge",

    perpsOrderAction: "open",
    perpsOrderType: "limit",

    loopEnabled: true,
    noOfLoops: undefined,

    price: undefined,

    // execution price
    executionPriceType: "limit",
    executionPrice: undefined,

    // quantity
    quantity: undefined,
    quantityUnit: "USDT",

    // trigger price
    triggerPriceType: "last",
    triggerPrice: undefined,

    // trailing entry
    trailingTriggerPriceEnabled: false,
    trailingTriggerPrice: undefined,
    trailVarianceValue: undefined,

    // scaled order
    lowestPrice: undefined,
    highestPrice: undefined,
    orderQuantity: undefined,
    sizeDistribution: "equal",
    averagePrice: undefined,

    // iceberg order
    qtyPerOrder: undefined,
    fasterExecution: undefined,
    splitSettings: "qty-per-order",
    orderPreference: "faster-execution",
    priceLimitEnabled: false,
    priceLimitValue: undefined,

    // twap order
    twapHours: undefined,
    twapMinutes: undefined,
    twapFrequency: "10s",

    // take profit
    takeProfitEnabled: false,
    takeProfitValue: undefined,
    takeProfitType: "price", // default to price

    // stop loss
    stopLossEnabled: false,
    stopLossValue: undefined,
    stopLossType: "price", // default to price

    timeInForce: "GTC",
  };

  const { watch, setValue, register, control, getValues } =
    useForm<PerpsOrderPlacementFormValues>({
      defaultValues: perpsOrderPlacementFormValues,
    });

  const leverage = watch("leverage");
  const assetMode = watch("assetMode");
  const marginMode = watch("marginMode");
  const positionMode = watch("positionMode");
  const perpsOrderAction: PerpsOrderAction = watch("perpsOrderAction");
  const perpsOrderType: PerpsOrderType = watch("perpsOrderType");
  const isLoopOn = watch("loopEnabled");
  const noOfLoops = watch("noOfLoops");
  const quantityUnit = watch("quantityUnit");
  const quantity = watch("quantity");
  const executionPriceType = watch("executionPriceType");
  const triggerPriceType = watch("triggerPriceType");
  const trailingTriggerPriceEnabled = watch("trailingTriggerPriceEnabled");
  const priceLimitEnabled = watch("priceLimitEnabled");
  const splitSettings = watch("splitSettings");
  const orderPreference = watch("orderPreference");
  const twapHours = watch("twapHours");
  const twapMinutes = watch("twapMinutes");
  const twapFrequency = watch("twapFrequency");
  const takeProfitEnabled = watch("takeProfitEnabled");
  const takeProfitType = watch("takeProfitType");
  const stopLossEnabled = watch("stopLossEnabled");
  const stopLossType = watch("stopLossType");
  const timeInForce = watch("timeInForce");

  // Sync slider with quantity field - when slider changes, update quantity
  useEffect(() => {
    if (isUpdatingFromSliderRef.current) {
      const calculatedQuantity =
        (availableMarginBalance * quantityPercentage) / 100;
      isUpdatingFromInputRef.current = true;
      setValue(
        "quantity",
        calculatedQuantity > 0 ? calculatedQuantity : undefined,
      );
      isUpdatingFromSliderRef.current = false;
      // Reset the input flag after a short delay
      setTimeout(() => {
        isUpdatingFromInputRef.current = false;
      }, 0);
    }
  }, [quantityPercentage, availableMarginBalance, setValue]);

  // Sync quantity field with slider - when quantity changes manually, update slider
  useEffect(() => {
    if (
      !isUpdatingFromInputRef.current &&
      quantity !== undefined &&
      quantity >= 0 &&
      availableMarginBalance > 0
    ) {
      const percentage = (quantity / availableMarginBalance) * 100;
      const clampedPercentage = Math.min(100, Math.max(0, percentage));
      if (Math.abs(clampedPercentage - quantityPercentage) > 0.1) {
        setQuantityPercentage(clampedPercentage);
      }
    }
  }, [quantity, availableMarginBalance, quantityPercentage]);

  const showTpSl =
    perpsOrderType === "limit" ||
    perpsOrderType === "market" ||
    perpsOrderType === "trigger" ||
    perpsOrderType === "trailing-entry";

  return (
    <>
      <form
        className={`w-full rounded-2xl p-4 flex flex-col gap-5 text-[10px] leading-[15px] font-medium ${isDark ? "bg-[#222222] border border-[#333333] text-[#FFFFFF]" : "bg-[#F7F7F7] border border-[#E2E2E2] text-[#111111]"}`}
      >
        {/* top buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveModal("marginMode")}
            className={`flex-1 cursor-pointer h-[39px] py-2.5 rounded-lg text-[12px] leading-[100%] font-semibold ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"}`}
          >
            {marginMode === "cross" ? "Cross" : "Isolated"}
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("leverage")}
            className={`flex-1 cursor-pointer h-[39px] py-2.5 rounded-lg text-[12px] leading-[100%] font-semibold ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"}`}
          >
            {leverage}x
          </button>
          {/* asset mode */}
          <button
            type="button"
            onClick={() => setActiveModal("assetMode")}
            className={`flex-1 cursor-pointer h-[39px] py-2.5 rounded-lg text-[12px] leading-[100%] font-semibold ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"}`}
          >
            {assetMode === "single" ? "S" : "M"}
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("positionMode")}
            className={`flex-1 cursor-pointer h-[39px] py-2.5 rounded-lg text-[12px] leading-[100%] font-semibold ${isDark ? "bg-[#333333]" : "bg-[#E2E2E2]"}`}
          >
            {positionMode === "hedge" ? "Hedge" : "One-Way"}
          </button>
        </div>

        {/* open & close toggle */}
        <AnimatedTabs
          type="segment"
          tabs={[
            { id: "open", label: "Open" },
            { id: "close", label: "Close" },
          ]}
          activeTab={perpsOrderAction}
          onTabChange={(val) =>
            setValue("perpsOrderAction", val as PerpsOrderAction)
          }
        />

        {/* order type */}
        <PerpsOrderTypeTabs
          value={perpsOrderType}
          onChange={(val) => {
            console.log("Order Type changed to:", val);
            setValue("perpsOrderType", val);
          }}
        />

        {/* available margin balance  */}
        <div className="flex gap-1 justify-end items-center">
          <Image
            className="object-cover"
            width={16}
            height={16}
            alt="icons"
            src="/icons/info.svg"
          />
          <span className="text-[12px] leading-[18px] font-medium">
            Available MB: {availableMarginBalance.toFixed(2)}USDT
          </span>
          <button
            type="button"
            onClick={() => setActiveModal("account")}
            className="cursor-pointer"
          >
            <Image
              className="object-cover"
              width={16}
              height={16}
              alt="transfer"
              src="/icons/swap.svg"
            />
          </button>
        </div>

        {/* Loop */}
        {perpsOrderType === "limit" && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-[10px] leading-[15px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
                Loop
              </span>
              <ToggleButton
                size="small"
                defaultChecked={isLoopOn}
                onToggle={(val) => setValue("loopEnabled", val)}
              />
            </div>
            {isLoopOn && (
              <div className="flex flex-col gap-2">
                <InputWithoutUnit
                  label="No of Loops"
                  placeholder="Enter No of Loops"
                  name="noOfLoops"
                  register={register}
                  disabled={noOfLoops === null}
                  rules={{
                    min: { value: 1, message: "Min 1 loop" },
                  }}
                />

                <div className="flex gap-2 min-w-0 ">
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue("noOfLoops", n)}
                      className={`flex-1 min-w-0 cursor-pointer  h-9 rounded-lg p-2.5  text-[12px] leading-[18px] font-medium  ${
                        noOfLoops === n
                          ? "bg-[#F1EBFD] text-[#703AE6]"
                          : isDark
                            ? "bg-[#111111] text-[#FFFFFF]"
                            : "bg-white text-[#111111]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setValue("noOfLoops", null)}
                    className={`flex-1 min-w-0 flex items-center justify-center cursor-pointer h-9 rounded-lg p-2.5 text-[20px] leading-[22px] font-medium ${
                      noOfLoops === null
                        ? "bg-[#703AE6] text-white"
                        : isDark
                          ? "bg-[#111111] text-[#FFFFFF]"
                          : "bg-white text-[#111111]"
                    }`}
                  >
                    <svg width="18" height="9" viewBox="0 0 16 7" fill="none">
                      <path d="M3.6598 6.9198C2.9798 6.9198 2.3598 6.77314 1.7998 6.4798C1.25314 6.17314 0.813138 5.7598 0.479805 5.2398C0.159805 4.70647 -0.000195295 4.11314 -0.000195295 3.4598C-0.000195295 2.79314 0.159805 2.1998 0.479805 1.6798C0.813138 1.1598 1.25314 0.753138 1.7998 0.459804C2.3598 0.153137 2.9798 -0.000195861 3.6598 -0.000195861C4.59314 -0.000195861 5.45981 0.266471 6.25981 0.799805C7.05981 1.3198 7.73981 2.06647 8.2998 3.0398V3.8798C7.76647 4.82647 7.09314 5.57314 6.27981 6.1198C5.47981 6.65314 4.60647 6.9198 3.6598 6.9198ZM3.77981 5.4798C4.36647 5.4798 4.90647 5.30647 5.39981 4.9598C5.90647 4.5998 6.34647 4.0998 6.71981 3.4598C6.34647 2.8198 5.90647 2.32647 5.39981 1.9798C4.90647 1.6198 4.36647 1.4398 3.77981 1.4398C3.1398 1.4398 2.6198 1.63314 2.2198 2.0198C1.8198 2.39314 1.6198 2.87314 1.6198 3.4598C1.6198 4.04647 1.8198 4.53314 2.2198 4.9198C2.6198 5.29314 3.1398 5.4798 3.77981 5.4798ZM11.4598 6.9198C10.5131 6.9198 9.6398 6.65314 8.8398 6.1198C8.0398 5.57314 7.36647 4.82647 6.81981 3.8798V3.0398C7.36647 2.0798 8.0398 1.33314 8.8398 0.799805C9.65314 0.266471 10.5265 -0.000195861 11.4598 -0.000195861C12.1531 -0.000195861 12.7731 0.153137 13.3198 0.459804C13.8665 0.753138 14.2998 1.1598 14.6198 1.6798C14.9531 2.1998 15.1198 2.79314 15.1198 3.4598C15.1198 4.11314 14.9531 4.70647 14.6198 5.2398C14.2998 5.7598 13.8598 6.17314 13.2998 6.4798C12.7531 6.77314 12.1398 6.9198 11.4598 6.9198ZM11.3398 5.4798C11.9798 5.4798 12.4998 5.29314 12.8998 4.9198C13.2998 4.53314 13.4998 4.04647 13.4998 3.4598C13.4998 2.87314 13.2998 2.39314 12.8998 2.0198C12.4998 1.63314 11.9798 1.4398 11.3398 1.4398C10.7265 1.4398 10.1731 1.6198 9.6798 1.9798C9.18647 2.3398 8.7598 2.83314 8.3998 3.4598C8.7598 4.0998 9.19314 4.5998 9.69981 4.9598C10.2198 5.30647 10.7665 5.4798 11.3398 5.4798Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* market order */}
        {perpsOrderType === "market" && (
          <div className="flex flex-col gap-1">
            <label>Price</label>
            <div
              className={`h-9 flex items-center p-2 rounded-lg text-[12px] leading-[18px] font-medium ${isDark ? "bg-[#111111] border border-[#333333] text-[#FFFFFF]" : "bg-[#E2E2E2] border border-[#E2E2E2]"}`}
            >
              Fill at market price
              <span className="ml-auto text-[8px] leading-3 font-medium">
                USDT
              </span>
            </div>
          </div>
        )}

        {/* limit order: price & BBO button */}
        {perpsOrderType === "limit" && (
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <InputWithUnit
                label="Price"
                placeholder="Enter Price"
                name="price"
                register={register}
                suffixMode="static"
                selectedSuffix="USDT"
              />
            </div>
            <div className="flex flex-col">
              <div className="h-[19px]" />
              <button
                type="button"
                className="cursor-pointer h-[36px] font-semibold text-[12px] leading-[100%] text-[#FFFFFF] bg-[#703AE6] px-4 py-3 rounded-lg items-end"
              >
                BBO
              </button>
            </div>
          </div>
        )}

        {/* Trigger Order: trigger price & execution price */}
        {perpsOrderType === "trigger" && (
          <>
            <InputWithUnit<TriggerPriceType>
              label="Trigger Price"
              placeholder="Enter Trigger Price"
              name="triggerPrice"
              register={register}
              suffixMode="dropdown"
              suffixOptions={TRIGGER_PRICE_SUFFIX_OPTIONS}
              selectedSuffix={triggerPriceType}
              onSuffixChange={(val) => setValue("triggerPriceType", val)}
            />
            <InputWithUnit<ExecutionPriceType>
              label="Execution Price"
              placeholder="Enter Execution Price"
              name="executionPrice"
              register={register}
              suffixMode="dropdown"
              suffixOptions={EXECUTION_PRICE_SUFFIX_OPTIONS}
              selectedSuffix={executionPriceType}
              onSuffixChange={(val) => setValue("executionPriceType", val)}
            />
          </>
        )}

        {/* tailing entry: trigger price , trail variance & preset buttons */}
        {perpsOrderType === "trailing-entry" && (
          <>
            <div className="flex flex-col gap-3">
              <Checkbox
                label="Trigger Price(Optional)"
                {...register("trailingTriggerPriceEnabled")}
              />

              {trailingTriggerPriceEnabled && (
                <InputWithUnit
                  placeholder="Enter Trigger Price"
                  name="trailingTriggerPrice"
                  register={register}
                  selectedSuffix="USDT"
                />
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <InputWithUnit
                  label="Trail Variance"
                  placeholder=""
                  name="trailVarianceValue"
                  register={register}
                  selectedSuffix="%"
                />
              </div>
              {/* preset buttons */}
              <div className="flex flex-col">
                {/* in place of spacer, ratio dropdown */}
                <div className="h-[19px]" />
                <div className="flex gap-2 min-w-0">
                  {[1, 2].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`flex-1 min-w-0 cursor-pointer h-9 rounded-lg p-2.5 text-[12px] leading-[18px] font-medium ${isDark ? "bg-[#111111] text-[#FFFFFF]" : "bg-white"}`}
                    >
                      {n}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* scaled order: lowest price & highest price & order quantity */}
        {perpsOrderType === "scaled-order" && (
          <>
            <div className="flex gap-3">
              <InputWithUnit
                label="Lowest Price"
                placeholder=""
                name="lowestPrice"
                register={register}
                selectedSuffix="USDT"
              />
              <InputWithUnit
                label="Highest Price"
                placeholder=""
                name="highestPrice"
                register={register}
                selectedSuffix="USDT"
              />
            </div>

            <InputWithUnit
              label="Order Quantity"
              placeholder="Enter Order Quantity"
              name="orderQuantity"
              register={register}
              selectedSuffix="USDT"
            />
          </>
        )}

        {/* quantity */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <label className={`text-[10px] leading-[15px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
              Quantity
            </label>
            <div
              className={`h-9 flex items-center gap-2 p-2 rounded-lg ${isDark ? "bg-[#111111] border border-[#333333]" : "bg-white border border-[#E2E2E2]"}`}
            >
              <input
                type="number"
                placeholder="Enter Amount"
                className={`flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium outline-none ${isDark ? "text-[#FFFFFF] placeholder:text-[#333333]" : "placeholder:text-[#C6C6C6]"}`}
                {...register("quantity")}
              />
              <button
                type="button"
                onClick={() => setActiveModal("futuresUnitSettings")}
                className="cursor-pointer flex items-center gap-1 px-2 py-1 rounded  hover:bg-[#E5DBFA] transition-colors"
              >
                <span className="text-[12px] leading-[18px] font-semibold text-[#111111] hover:text-[#703AE6]">
                  {quantityUnit}
                </span>
                <Image
                  src="/icons/down-arrow.svg"
                  width={12}
                  height={12}
                  alt="settings"
                />
              </button>
            </div>
          </div>

          {/* quantity slider */}
          <QuantitySlider
            min={0}
            max={100}
            step={1}
            value={quantityPercentage}
            onChange={(val) => {
              isUpdatingFromSliderRef.current = true;
              setQuantityPercentage(val);
            }}
            markers={[0, 25, 50, 75, 100]}
          />

          {/* cost
          <div className="flex text-[#5C5B5B] justify-between">
            <span>Cost:</span>
            <span>0.00/0.00 USDT</span>
          </div> */}
        </div>

        {/* scaled order: size Distribution and preview */}
        {perpsOrderType === "scaled-order" && (
          <>
            <div className="flex flex-col gap-2">
              {/* size distribution + preview */}
              <div className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Image
                    src="/icons/info.svg"
                    width={16}
                    height={16}
                    alt="info"
                  />
                  <span className="text-[12px] leading-[18px] font-medium">
                    Size Distribution
                  </span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Image
                    src="/icons/eye.svg"
                    width={16}
                    height={16}
                    alt="eye"
                  />
                  <span className="text-[12px] leading-[18px] font-medium">
                    Preview
                  </span>
                </button>
              </div>
              {/* radio options */}
              <Controller
                name="sizeDistribution"
                control={control}
                defaultValue="equal"
                render={({ field }) => (
                  <RadioGroup
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    className="flex flex-row gap-1.25 space-y-0 "
                  >
                    <Radio value="equal" label="Equal" />
                    <Radio value="increasing" label="Increasing" />
                    <Radio value="descending" label="Descending" />
                    <Radio value="random" label="Random" />
                  </RadioGroup>
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Average Price</label>
              <div
                className={`h-9 flex items-center p-2 rounded-lg text-[12px] leading-[18px] font-medium ${isDark ? "bg-[#111111] border border-[#333333] text-[#FFFFFF]" : "bg-[#E2E2E2] border border-[#E2E2E2]"}`}
              >
                {/* average price will be calculated based on the size distribution */}
                --
                <span className="ml-auto text-[8px] leading-3 font-medium">
                  USDT
                </span>
              </div>
            </div>
          </>
        )}

        {/* iceberg order: quantity per order & faster execution & pirce Limit  */}
        {perpsOrderType === "iceberg" && (
          <>
            <div className=" flex gap-2">
              <InputWithoutUnit
                label="Qty. Per Order"
                placeholder="2 - 20"
                name="qtyPerOrder"
                register={register}
              />
              <div className="flex flex-col">
                <div className="h-[19px]" />
                <button
                  type="button"
                  onClick={() => setActiveModal("splitSettings")}
                  className={`cursor-pointer flex items-center justify-center gap-0.5 h-9 w-[120px] rounded-lg py-2 px-4 ${isDark ? "border border-[#333333] bg-[#111111] text-[#FFFFFF]" : "border border-[#E2E2E2] bg-[#FFFFFF]"}`}
                >
                  <span className="text-[10px] leading-[15px] font-medium truncate">
                    {splitSettings === "qty-per-order"
                      ? "Qty Per Order"
                      : "No. of Split"}
                  </span>
                  <Image
                    src="/icons/down-arrow.svg"
                    width={12}
                    height={12}
                    alt="arrow-down"
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <InputWithoutUnit
                label="Faster Execution"
                placeholder="2 - 20"
                name="fasterExecution"
                register={register}
              />
              <div className="flex flex-col">
                <div className="h-[19px]" />
                <button
                  type="button"
                  onClick={() => setActiveModal("orderPreference")}
                  className={`cursor-pointer flex items-center justify-center gap-0.5 h-9 w-[120px] rounded-lg py-2 px-4 ${isDark ? "border border-[#333333] bg-[#111111] text-[#FFFFFF]" : "border border-[#E2E2E2] bg-[#FFFFFF]"}`}
                >
                  <span className="text-[10px] leading-[15px] font-medium truncate">
                    {orderPreference === "faster-execution"
                      ? "Faster"
                      : orderPreference === "fixed-distance"
                        ? "Fixed Dist."
                        : "Fixed Price"}
                  </span>
                  <Image
                    src="/icons/down-arrow.svg"
                    width={12}
                    height={12}
                    alt="arrow-down"
                  />
                </button>
              </div>
            </div>

            {/* checkbox Price Limit */}
            <div className="flex flex-col gap-3">
              <Checkbox
                label="Price Limit"
                {...register("priceLimitEnabled")}
              />
              {priceLimitEnabled && (
                <InputWithUnit
                  placeholder="Enter Price Limit"
                  name="priceLimitValue"
                  register={register}
                  suffixMode="static"
                  selectedSuffix="USDT"
                />
              )}
            </div>
          </>
        )}

        {/* TWAP order: total time , frequency, per order */}
        {perpsOrderType === "twap" && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label>Total Time</label>

                <div className="flex gap-3">
                  {/* hours */}
                  <InputWithUnit
                    label=""
                    placeholder="00"
                    name="twapHours"
                    register={register}
                    suffixMode="static"
                    selectedSuffix="h"
                  />
                  {/* minutes */}
                  <InputWithUnit
                    label=""
                    placeholder="00"
                    name="twapMinutes"
                    register={register}
                    suffixMode="static"
                    selectedSuffix="m"
                  />
                </div>
              </div>

              {/* preset Buttons */}
              <div className="flex flex-col gap-2">
                {/* hours preset */}
                <div className="flex gap-2 min-w-0">
                  {[1, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setValue("twapHours", h)}
                      className={`flex-1 min-w-0 cursor-pointer h-9 rounded-lg p-2.5 text-[12px] leading-[18px] font-medium ${
                        twapHours === h
                          ? "bg-[#F1EBFD] text-[#703AE6]"
                          : isDark
                            ? "bg-[#111111] text-[#FFFFFF]"
                            : "bg-white text-[#111111]"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}

                  {[5, 30].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setValue("twapMinutes", m)}
                      className={`flex-1 min-w-0 cursor-pointer h-9 rounded-lg p-2.5 text-[12px] leading-[18px] font-medium ${
                        twapMinutes === m
                          ? "bg-[#F1EBFD] text-[#703AE6]"
                          : isDark
                            ? "bg-[#111111] text-[#FFFFFF]"
                            : "bg-white text-[#111111]"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* frequency dropdown */}
            <div className="flex items-center gap-2">
              <label>Frequency</label>
              <Dropdown
                items={TWAP_FREQUENCY_OPTIONS}
                selectedOption={twapFrequency ?? "10s"}
                setSelectedOption={(val) =>
                  setValue("twapFrequency", val as TwapFrequencyType)
                }
                classname="text-[12px] p-2 rounded-lg text-[#FFFFFF] leading-[100%] font-semibold bg-[#24A0A9]"
                dropdownClassname="text-[12px]"
                arrowClassname="size-4"
              />
            </div>

            {/* per order */}
            <div className="flex flex-col gap-1">
              <label>Per Order</label>
              <div
                className={`h-9 flex items-center p-2 rounded-lg text-[12px] leading-[18px] font-medium ${isDark ? "bg-[#111111] border border-[#333333] text-[#FFFFFF]" : "bg-[#E2E2E2] border border-[#E2E2E2]"}`}
              >
                {/* per order will be calculated  */}
                ≈0.000/0.000 SBTC
              </div>
            </div>
          </>
        )}

        {showTpSl && (
          <>
            {/* Take Profit */}
            <div className="flex flex-col gap-3">
              <Checkbox
                label="Take Profit"
                {...register("takeProfitEnabled")}
              />

              {takeProfitEnabled && (
                <InputWithUnit<TakeProfitType>
                  placeholder=""
                  name="takeProfitValue"
                  register={register}
                  suffixMode="dropdown"
                  suffixOptions={TP_SUFFIX_OPTIONS}
                  selectedSuffix={takeProfitType}
                  onSuffixChange={(val) => setValue("takeProfitType", val)}
                />
              )}
            </div>

            {/* stop Loss */}
            <div className="flex flex-col gap-3">
              <Checkbox label="Stop Loss" {...register("stopLossEnabled")} />

              {stopLossEnabled && (
                <InputWithUnit<StopLossType>
                  placeholder=""
                  name="stopLossValue"
                  register={register}
                  suffixMode="dropdown"
                  suffixOptions={SL_SUFFIX_OPTIONS}
                  selectedSuffix={stopLossType}
                  onSuffixChange={(val) => setValue("stopLossType", val)}
                />
              )}
            </div>

            {/* advance tp/sl */}
            <button
              type="button"
              onClick={() => setActiveModal("advanceTpSl")}
              className={`cursor-pointer flex font-semibold underline decoration-solid ${isDark ? "text-[#A7A7A7]" : "text-[#333333]"}`}
            >
              Advance TP/SL
            </button>
          </>
        )}

        {/* Time in Force Dropdown */}
        {perpsOrderType === "limit" && (
          <div className="flex items-center gap-2 ">
            <div className="text-[#A7A7A7] text-[12px]  font-medium leading-[18px] whitespace-nowrap ">
              Time in Force
            </div>
            <Dropdown
              items={TIME_IN_FORCE_OPTIONS}
              selectedOption={timeInForce ?? "GTC"}
              setSelectedOption={(val) =>
                setValue("timeInForce", val as TimeInForce)
              }
              classname="gap-0.5 text-[12px] leading-[18px] font-medium"
              dropdownClassname="text-[12px] font-semibold"
              arrowClassname="size-4"
            />
          </div>
        )}

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
                  <span className="text-[#919191] font-semibold">
                    Liq Price:{" "}
                  </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Cost: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Max: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Fees: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
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
                  <span className="text-[#919191] font-semibold">
                    Liq Price:{" "}
                  </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Cost: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Max: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
                <p className="flex gap-0.5">
                  <span className="text-[#919191] font-semibold">Fees: </span>
                  <span
                    className={isDark ? "text-[#FFFFFF]" : "text-[#111111]"}
                  >
                    -- USDT
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      <PerpsModals
        activeModal={activeModal}
        close={() => setActiveModal(null)}
        setValue={setValue}
        formValues={getValues()}
      />
    </>
  );
};
export default PerpsOrderPlacementForm;
