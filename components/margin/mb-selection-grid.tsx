"use client";

import { memo } from "react";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";
import { Radio } from "../ui/radio-button";
import { iconPaths } from "@/lib/constants";
import { Collaterals } from "@/lib/types";

type Mode = "Deposit" | "Borrow";

interface MBSelectionGridProps {
  items: Collaterals[];
  selectedIds: Set<string>;
  mode: Mode;
  onToggle: (itemId: string, isSelected: boolean) => void;
  onRadioSelect: (itemId: string) => void;
}

const MBSelectionGridComponent = ({
  items,
  selectedIds,
  mode,
  onToggle,
  onRadioSelect,
}: MBSelectionGridProps) => {
  return (
    <section className="p-[10px] rounded-[12px] bg-[#F4F4F4] grid grid-cols-2 gap-[15px]">
      {items.map((item, index) => {
        const itemId = `${item.asset}-${item.amount}`;
        const isSelected = selectedIds.has(itemId);

        return (
          <article key={index} className="flex gap-[10px] items-center">
            {mode === "Deposit" ? (
              <Checkbox
                checked={isSelected}
                onChange={() => onToggle(itemId, isSelected)}
              />
            ) : (
              <Radio
                name="mb-collateral-radio"
                value={`collateral-${index}`}
                checked={isSelected}
                onChange={() => onRadioSelect(itemId)}
              />
            )}
            <Image
              src={iconPaths[item.asset]}
              alt={item.asset}
              width={20}
              height={20}
            />
            <div className="text-[16px] font-semibold">
              {item.amount} {item.asset}
            </div>
            <div className="rounded-[4px] py-[2px] px-[4px] bg-[#FFFFFF] text-[10px] font-medium">
              {item.amountInUsd} USD
            </div>
          </article>
        );
      })}
    </section>
  );
};

// Memoized component with custom comparison
export const MBSelectionGrid = memo(MBSelectionGridComponent, (prevProps, nextProps) => {
  // Compare mode
  if (prevProps.mode !== nextProps.mode) return false;
  
  // Compare items array (reference check is fine if items don't change often)
  if (prevProps.items !== nextProps.items) {
    // Deep compare if reference changed
    if (prevProps.items.length !== nextProps.items.length) return false;
    for (let i = 0; i < prevProps.items.length; i++) {
      if (prevProps.items[i] !== nextProps.items[i]) return false;
    }
  }
  
  // Compare selectedIds Set
  if (prevProps.selectedIds !== nextProps.selectedIds) {
    if (prevProps.selectedIds.size !== nextProps.selectedIds.size) return false;
    for (const id of prevProps.selectedIds) {
      if (!nextProps.selectedIds.has(id)) return false;
    }
  }
  
  // Compare handlers (reference check)
  if (prevProps.onToggle !== nextProps.onToggle) return false;
  if (prevProps.onRadioSelect !== nextProps.onRadioSelect) return false;
  
  // All props are equal, skip re-render
  return true;
});

