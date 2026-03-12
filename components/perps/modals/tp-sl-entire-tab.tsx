import { useState } from "react";
import { TpSlTriggerPriceType, TpSlValueType } from "@/lib/types";
import { TP_SL_PRICE_TYPE_OPTIONS, TP_SL_VALUE_TYPE_OPTIONS } from "@/lib/constants/perps";
import { Dropdown } from "../../ui/dropdown";
import { QuantitySlider } from "../../ui/quantity-slider";
import { useTheme } from "@/contexts/theme-context";

export const EntirePositionTab = () => {
  const { isDark } = useTheme();
  const [entireTpPrice, setEntireTpPrice] = useState("");
  const [entireTpPriceType, setEntireTpPriceType] =
    useState<TpSlTriggerPriceType>("Last");
  const [entireTpValue, setEntireTpValue] = useState<number | null>(null);
  const [entireTpValueType, setEntireTpValueType] =
    useState<TpSlValueType>("ROI(%)");

  const [entireSlPrice, setEntireSlPrice] = useState("");
  const [entireSlPriceType, setEntireSlPriceType] =
    useState<TpSlTriggerPriceType>("Last");
  const [entireSlValue, setEntireSlValue] = useState<number | null>(null);
  const [entireSlValueType, setEntireSlValueType] =
    useState<TpSlValueType>("ROI(%)");

  const textPrimary = isDark ? "text-[#FFFFFF]" : "text-[#111111]";
  const inputBg = isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white";

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <div className="flex-1 flex flex-col gap-1">
            <label className={`text-[10px] leading-[15px] font-medium ${textPrimary}`}>
              Take-Profit
            </label>
            <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                Trigger Price
              </span>
              <input
                type="number"
                value={entireTpPrice}
                onChange={(e) => setEntireTpPrice(e.target.value)}
                className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
              />
              <div className="shrink-0 flex items-center">
                <Dropdown
                  items={TP_SL_PRICE_TYPE_OPTIONS}
                  selectedOption={entireTpPriceType}
                  setSelectedOption={(val) => {
                    setEntireTpPriceType(val as TpSlTriggerPriceType);
                  }}
                  classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                  dropdownClassname="text-[12px] font-semibold"
                />
              </div>
            </div>
          </div>
          <div className="w-[180px] shrink-0 flex flex-col">
            <div className="h-[19px]" />
            <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
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
                className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
              />
              <div className=" flex items-center">
                <Dropdown
                  items={TP_SL_VALUE_TYPE_OPTIONS}
                  selectedOption={entireTpValueType}
                  setSelectedOption={(val) => {
                    setEntireTpValueType(val as TpSlValueType);
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
            <label className={`text-[10px] leading-[15px] font-medium ${textPrimary}`}>
              Stop-loss
            </label>
            <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
              <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
                Trigger Price
              </span>
              <input
                type="number"
                value={entireSlPrice}
                onChange={(e) => setEntireSlPrice(e.target.value)}
                className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
              />
              <div className="shrink-0 flex items-center">
                <Dropdown
                  items={TP_SL_PRICE_TYPE_OPTIONS}
                  selectedOption={entireSlPriceType}
                  setSelectedOption={(val) => {
                    setEntireSlPriceType(val as TpSlTriggerPriceType);
                  }}
                  classname="gap-0.5 text-[12px] leading-[18px] font-medium"
                  dropdownClassname="text-[12px] font-semibold"
                />
              </div>
            </div>
          </div>
          <div className="w-[180px] shrink-0 flex flex-col">
            <div className="h-[19px]" />
            <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
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
                className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
              />
              <div className="flex items-center">
                <Dropdown
                  items={TP_SL_VALUE_TYPE_OPTIONS}
                  selectedOption={entireSlValueType}
                  setSelectedOption={(val) => {
                    setEntireSlValueType(val as TpSlValueType);
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
  );
};
