import { useState } from "react";
import { TpSlTriggerPriceType, TpSlValueType, TpSlOrderType, TpSlBBOType } from "@/lib/types";
import {
  TP_SL_PRICE_TYPE_OPTIONS,
  TP_SL_VALUE_TYPE_OPTIONS,
  TP_SL_ORDER_TYPE_OPTIONS,
  TP_SL_BBO_OPTIONS,
} from "@/lib/constants/perps";
import { Checkbox } from "../../ui/Checkbox";
import { Dropdown } from "../../ui/dropdown";
import { QuantitySlider } from "../../ui/quantity-slider";

export const PartialPositionTab = () => {
  // Partial Position - Take Profit states
  const [partialTpLimitOrder, setPartialTpLimitOrder] = useState(false);
  const [partialTpTriggerPrice, setPartialTpTriggerPrice] = useState("");
  const [partialTpTriggerType, setPartialTpTriggerType] =
    useState<TpSlTriggerPriceType>("Last");
  const [partialTpRoi, setPartialTpRoi] = useState<number | null>(null);
  const [partialTpRoiType, setPartialTpRoiType] =
    useState<TpSlValueType>("ROI(%)");
  const [partialTpOrderType, setPartialTpOrderType] =
    useState<TpSlOrderType>("Limit");
  const [partialTpPrice, setPartialTpPrice] = useState("");
  const [partialTpBboType, setPartialTpBboType] =
    useState<TpSlBBOType>("Counterparty 1");
  const [partialTpQuantity, setPartialTpQuantity] = useState<number | null>(
    null,
  );

  // Partial Position - Stop Loss states
  const [partialSlLimitOrder, setPartialSlLimitOrder] = useState(false);
  const [partialSlTriggerPrice, setPartialSlTriggerPrice] = useState("");
  const [partialSlTriggerType, setPartialSlTriggerType] =
    useState<TpSlTriggerPriceType>("Last");
  const [partialSlRoi, setPartialSlRoi] = useState<number | null>(null);
  const [partialSlRoiType, setPartialSlRoiType] =
    useState<TpSlValueType>("ROI(%)");
  const [partialSlOrderType, setPartialSlOrderType] =
    useState<TpSlOrderType>("Limit");
  const [partialSlPrice, setPartialSlPrice] = useState("");
  const [partialSlBboType, setPartialSlBboType] =
    useState<TpSlBBOType>("Counterparty 1");
  const [partialSlQuantity, setPartialSlQuantity] = useState<number | null>(
    null,
  );

  return (
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
                items={TP_SL_PRICE_TYPE_OPTIONS}
                selectedOption={partialTpTriggerType}
                setSelectedOption={(val) =>
                  setPartialTpTriggerType(val as TpSlTriggerPriceType)
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
                items={TP_SL_VALUE_TYPE_OPTIONS}
                selectedOption={partialTpRoiType}
                setSelectedOption={(val) =>
                  setPartialTpRoiType(val as TpSlValueType)
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
                    items={TP_SL_BBO_OPTIONS}
                    selectedOption={partialTpBboType}
                    setSelectedOption={(val) =>
                      setPartialTpBboType(val as TpSlBBOType)
                    }
                    classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                )}
              </div>
              <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <Dropdown
                  items={TP_SL_ORDER_TYPE_OPTIONS}
                  selectedOption={partialTpOrderType}
                  setSelectedOption={(val) =>
                    setPartialTpOrderType(val as TpSlOrderType)
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
                items={TP_SL_PRICE_TYPE_OPTIONS}
                selectedOption={partialSlTriggerType}
                setSelectedOption={(val) =>
                  setPartialSlTriggerType(val as TpSlTriggerPriceType)
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
                items={TP_SL_VALUE_TYPE_OPTIONS}
                selectedOption={partialSlRoiType}
                setSelectedOption={(val) =>
                  setPartialSlRoiType(val as TpSlValueType)
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
                    items={TP_SL_BBO_OPTIONS}
                    selectedOption={partialSlBboType}
                    setSelectedOption={(val) =>
                      setPartialSlBboType(val as TpSlBBOType)
                    }
                    classname="flex-1 gap-0.5 text-[12px] leading-[18px] font-medium"
                    dropdownClassname="text-[12px] font-semibold"
                  />
                )}
              </div>
              <div className="w-[180px] shrink-0 h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
                <Dropdown
                  items={TP_SL_ORDER_TYPE_OPTIONS}
                  selectedOption={partialSlOrderType}
                  setSelectedOption={(val) =>
                    setPartialSlOrderType(val as TpSlOrderType)
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
  );
};
