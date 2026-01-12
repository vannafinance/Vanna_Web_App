import Image from "next/image";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown";

interface TradingPairInfoProps {
  isOpen: boolean;
  onOpenPairSelector: () => void;
}

const TradingPairInfo = ({
  onOpenPairSelector,
  isOpen,
}: TradingPairInfoProps) => {
  return (
    <div className="bg-[#F7F7F7] border border-[#E2E2E2]  rounded-lg p-4 flex flex-1 gap-5">
      <button
        type="button"
        onClick={onOpenPairSelector}
        className="flex gap-3 px-4 cursor-pointer outline-none"
      >
        <Image src="/coins/btc.svg" alt="BTC" height={24} width={24} />
        <div>
          <div className="text-[#151517] text-[16px] leading-6 font-semibold">
            BTCUSDT
          </div>
          <div className=" text-[#57585C]  text-[12px] leading-[18px] font-medium text-left">
            spot
          </div>
        </div>
        <Image
          src="/icons/down-arrow.svg"
          alt="arrow"
          height={16}
          width={16}
          className={`transition-transform duration-200 ease-in-out ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div className="flex flex-col text-[#01BC8D] ">
        <div className="text-[16px] leading-6 font-semibold">3,377.88</div>
        <div className="flex gap-px">
          <div className="text-[12px] leading-[18px] font-medium">+52.47 </div>
          <div className="text-[12px] leading-[18px] font-medium">(+1.58%)</div>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-24">
        <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
          24h high
        </div>
        <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
          3,377.55
        </div>
      </div>

      <div className="flex flex-col gap-1 w-24">
        <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
          24h low
        </div>
        <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
          3,377.55
        </div>
      </div>
      <div className="flex flex-col gap-1 w-24">
        <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
          24h Change
        </div>
        <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
          951.99k
        </div>
      </div>
      <div className="flex flex-col gap-1 w-24">
        <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
          24h Volume
        </div>
        <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
          3,377.55
        </div>
      </div>
      <div className="flex flex-col gap-1 w-24">
        <div className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
          Market Cap
        </div>
        <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
          3.21B
        </div>
      </div>
    </div>
  );
};

export default TradingPairInfo;
