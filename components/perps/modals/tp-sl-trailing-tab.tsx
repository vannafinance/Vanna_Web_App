import { useState } from "react";
import { TpSlTriggerPriceType } from "@/lib/types";
import { TP_SL_PRICE_TYPE_OPTIONS } from "@/lib/constants/perps";
import { Dropdown } from "../../ui/dropdown";
import { QuantitySlider } from "../../ui/quantity-slider";
import { useTheme } from "@/contexts/theme-context";

export const TrailingTab = () => {
  const { isDark } = useTheme();
  const [trailingTriggerPrice, setTrailingTriggerPrice] = useState("");
  const [trailingTriggerType, setTrailingTriggerType] =
    useState<TpSlTriggerPriceType>("Last");
  const [trailingCallbackRate, setTrailingCallbackRate] = useState("");
  const [trailingQuantity, setTrailingQuantity] = useState("");

  const textPrimary = isDark ? "text-[#FFFFFF]" : "text-[#111111]";
  const inputBg = isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white";

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className={`text-[10px] leading-[15px] font-medium ${textPrimary}`}>
          Trigger Price
        </label>
        <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
          <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium ">
            Trigger Price
          </span>
          <input
            type="number"
            value={trailingTriggerPrice}
            onChange={(e) => setTrailingTriggerPrice(e.target.value)}
            className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
          />
          <div className="ml-auto">
            <Dropdown
              items={TP_SL_PRICE_TYPE_OPTIONS}
              selectedOption={trailingTriggerType}
              setSelectedOption={(val) => {
                setTrailingTriggerType(val as TpSlTriggerPriceType);
              }}
              classname="gap-0.5 text-[12px] leading-[18px] font-medium"
              dropdownClassname="text-[12px] font-semibold"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 flex flex-col gap-1">
          <label className={`text-[10px] leading-[15px] font-medium ${textPrimary}`}>
            Callback Rate
          </label>
          <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
            <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
              Callback Rate
            </span>
            <input
              type="number"
              value={trailingCallbackRate}
              onChange={(e) => setTrailingCallbackRate(e.target.value)}
              className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
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
        <label className={`text-[10px] leading-[15px] font-medium ${textPrimary}`}>
          Quantity
        </label>
        <div className={`h-9 flex gap-2 items-center rounded-lg border ${inputBg} px-2`}>
          <input
            type="number"
            value={trailingQuantity}
            onChange={(e) => setTrailingQuantity(e.target.value)}
            className={`flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none bg-transparent ${textPrimary}`}
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
  );
};
