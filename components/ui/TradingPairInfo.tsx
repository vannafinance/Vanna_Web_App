import { TradingPairInfoStats } from "@/lib/types";
import Image from "next/image";
import { Dropdown } from "./dropdown";

interface TradingPairInfoProps {
  isOpen: boolean;
  onOpenPairSelector: () => void;
  pair: string;
  market: "spot" | "perps";
  icon: string;
  stats: TradingPairInfoStats[];
}

const TradingPairInfo = ({
  onOpenPairSelector,
  isOpen,
  pair,
  market,
  icon,
  stats,
}: TradingPairInfoProps) => {
  return (
    <div className="bg-[#F7F7F7] border border-[#E2E2E2]  rounded-lg p-4 flex flex-1 gap-5">
      <button
        type="button"
        onClick={onOpenPairSelector}
        className="flex gap-3 px-4 cursor-pointer outline-none"
      >
        <Image src={icon} alt={pair} height={24} width={24} />
        <div>
          <div className="text-[#151517] text-[16px] leading-6 font-semibold">
            {pair.toUpperCase()}
          </div>
          <div className=" text-[#57585C]  text-[12px] leading-[18px] font-medium text-left">
            {market}
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

      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 ">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-[#A7A7A7] font-medium text-[12px] leading-[18px]">
              {stat.label}
            </span>
            {stat.dropdown && (
              <Dropdown
                items={stat.dropdown.items}
                selectedOption={stat.dropdown.selectedOption}
                setSelectedOption={stat.dropdown.onSelect}
                classname="gap-0.5 text-[#111111] font-medium text-[12px] leading-[18px] bg-white border border-[#E2E2E2] rounded px-1  "
                dropdownClassname="text-[10px] leading-[12px] font-medium"
                arrowClassname="size-3"
              />
            )}
          </div>
          <div className="text-[#111111] font-medium text-[12px] leading-[18px]">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TradingPairInfo;
