"use client";

import { DEPOSIT_AMOUNT_BREAKDOWN_DROPDOWN_DATA } from "@/lib/constants/margin";
import { AmountBreakdownDropDown } from "@/components/ui/amount-breakdown-dropdown";
import { Dropdown } from "@/components/ui/dropdown";
import { useState } from "react";
import { SupplyApyPopup } from "@/components/earn/supply-apy-popup";
import { ProfitLossCalender } from "@/components/ui/profit-loss-calender";

export default function Home() {
  const [selectedOrderType, setSelectedOrderType] = useState<string>("GTC");
  return (
    <>

    </>

  );
}
