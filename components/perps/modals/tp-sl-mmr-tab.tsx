import { useState } from "react";
import { QuantitySlider } from "../../ui/quantity-slider";

export const MmrSlTab = () => {
  const [triggerMmr, setTriggerMmr] = useState<number | null>(null);

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-[10px] leading-[15px] font-medium text-[#111111]">
            Trigger MMR
          </span>
          <div className="flex items-center gap-1">
           
            <span className="text-[10px] leading-[100%] font-medium text-[#111111]">
              Current MMR: 0%
            </span>
          </div>
        </div>
        <div className="h-9 flex gap-2 items-center rounded-lg border border-[#E2E2E2] bg-white px-2">
          <span className="text-[12px] text-[#A7A7A7] leading-[18px] font-medium shrink-0">
            Trigger MMR
          </span>
          <input
            type="number"
            value={triggerMmr ?? ""}
            onChange={(e) =>
              setTriggerMmr(e.target.value ? Number(e.target.value) : null)
            }
            className="flex-1 min-w-0 text-[12px] leading-[18px] font-medium outline-none"
          />
          <span className="text-[10px] leading-[15px] font-medium shrink-0">
            %
          </span>
        </div>
        <QuantitySlider
          min={0}
          max={100}
          step={1}
          value={triggerMmr ?? 0}
          onChange={setTriggerMmr}
          markers={[0, 25, 50, 75, 100]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#919191]">
            Trigger Price:
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            -- USDT
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1EBFD] border border-[#703AE6]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="8" r="7" stroke="#703AE6" strokeWidth="1.5" />
            <path
              d="M8 5V8.5"
              stroke="#703AE6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8" cy="11" r="0.75" fill="#703AE6" />
          </svg>
          <span className="text-[11px] leading-[16px] font-medium text-[#703AE6]">
            Position liquidation/reduction will be triggered based on MMR.
          </span>
        </div>
      </div>
    </>
  );
};
