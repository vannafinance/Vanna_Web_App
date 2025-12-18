"use client";

import { DEPOSIT_AMOUNT_BREAKDOWN_DROPDOWN_DATA } from "@/lib/constants/margin";
import { AmountBreakdownDropDown } from "@/components/ui/amount-breakdown-dropdown";
import { Dropdown } from "@/components/ui/dropdown";
import { useState } from "react";

export default function Home() {
  const [selectedOrderType, setSelectedOrderType] = useState<string>("GTC");
  return (
    <div className="ml-5">
      <AmountBreakdownDropDown breakdownData={[...DEPOSIT_AMOUNT_BREAKDOWN_DROPDOWN_DATA]} />
      <Dropdown dropdownClassname="text-[14px] gap-[10px] " items={["GTC","Post-only","FOK","IOC"]} setSelectedOption={setSelectedOrderType} selectedOption={selectedOrderType} classname={"text-[16px] font-medium gap-[4px]"} />
    </div>
  );
}
