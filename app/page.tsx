"use client";

import { depositAmountBreakdownDropDownData } from "@/lib/constants";
import { AmountBreakdownDropDown } from "@/components/ui/amount-breakdown-dropdown";

export default function Home() {
  return (
    <div className="">
      <AmountBreakdownDropDown breakdownData={depositAmountBreakdownDropDownData} />
    </div>
  );
}
