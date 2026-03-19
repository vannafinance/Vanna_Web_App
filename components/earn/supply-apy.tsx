import { useState, useEffect, useRef } from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { useTheme } from "@/contexts/theme-context";

interface SupplyApyProps {
  supplyApy: {
    percentage: number;
    greaterThan: boolean;
  };
  setSupplyApyFilter: React.Dispatch<
    React.SetStateAction<{
      percentage: number;
      greaterThan: boolean;
    }>
  >;
  anythingLabel?: string;  // Custom label when percentage is 0
  supplyApyLabel?: string;
}

export const SupplyApy = (props: SupplyApyProps) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("less-than");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer w-fit h-[48px] flex rounded-[8px] border-[1px] py-[8px] px-[12px] items-center gap-[8px] ${
          isDark
            ? "bg-transparent"
            : "bg-white"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={`text-[14px] font-semibold ${
          isDark ? "text-white" : "text-[#111111]"
        }`}>
          {props.supplyApyLabel || "Supply APY is"}
        </span>
        <span className="w-fit h-fit rounded-[4px] p-[8px] bg-[#F1EBFD]">
          {props.supplyApy.percentage > 0 ? (
            <span className="text-[12px] font-semibold text-[#703AE6]">
              {props.supplyApy.greaterThan
                ? `>${props.supplyApy.percentage}`
                : `<${props.supplyApy.percentage}`}
            </span>
          ) : (
            <span className="text-[12px] font-semibold text-[#703AE6]">
              {props.anythingLabel || "Anything"}
            </span>
          )}
        </span>
      </button>
      {isOpen && (
        <section 
          className={`shadow-md w-[calc(100vw-32px)] sm:w-[370px] h-fit top-14 right-0 absolute rounded-[16px] p-3 sm:p-[16px] flex flex-col gap-[15px] z-50 border-[1px] ${
            isDark
              ? "bg-[#222222]"
              : "bg-[#F4F4F4]"
          }`}
          aria-label="Supply APY Filter"
        >
          <button
            type="button"
            onClick={() =>
              props.setSupplyApyFilter((prev) => ({
                ...prev,
                percentage: 0,
              }))
            }
            className={`text-end w-full text-[14px] font-semibold underline cursor-pointer hover:text-[#703AE6] transition-colors ${
              isDark ? "text-white" : ""
            }`}
          >
            Reset
          </button>
          <nav className="w-full h-[38px]" aria-label="Filter Type Selection">
            <AnimatedTabs
              tabs={[
                { label: "Greater than", id: "greater-than" },
                { label: "Less than", id: "less-than" },
              ]}
              type="ghost"
              activeTab={activeTab}
              containerClassName="w-full"
              onTabChange={(tab) => {
                setActiveTab(tab);
                if (tab === "greater-than") {
                  props.setSupplyApyFilter((prev) => ({
                    ...prev,
                    greaterThan: true,
                  }));
                } else {
                  props.setSupplyApyFilter((prev) => ({
                    ...prev,
                    greaterThan: false,
                  }));
                }
              }}
            />
          </nav>
          <div className={`flex justify-between items-center w-full h-[36px] rounded-[8px] border-[1px] p-[8px] ${
            isDark
              ? "bg-[#111111]"
              : "bg-white"
          }`}>
            <label htmlFor="apy-percentage" className="sr-only">
              APY Percentage
            </label>
            <input
              id="apy-percentage"
              type="number"
              placeholder="Enter Amount"
              value={props.supplyApy.percentage.toString()}
              onChange={(e) => {
                props.setSupplyApyFilter((prev) => ({
                  ...prev,
                  percentage: Number(e.target.value),
                }));
              }}
              className={`outline-none placeholder:text-[#C6C6C6] p-[4px] rounded-[6px] w-full h-fit text-[12px] font-medium ${
                isDark
                  ? "bg-[#111111] text-white"
                  : "bg-white"
              }`}
              aria-label="APY Percentage Value"
            />
          </div>
        </section>
      )}
    </div>
  );
};
