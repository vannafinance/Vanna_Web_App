"use client";

import Image from "next/image";
import { Checkbox } from "../ui/Checkbox";
import { FieldArrayWithId, UseFormRegister } from "react-hook-form";
import { OrderPlacementFormValues } from "@/lib/types";

interface MultipleTpProps {
  fields: FieldArrayWithId<
    OrderPlacementFormValues,
    "multipleTakeProfits",
    "id"
  >[];
  register: UseFormRegister<OrderPlacementFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxReached: boolean;
}

const headerCell = "w-11 p-1 text-[8px] leading-3 font-medium text-[#A7A7A7]";

export default function MultipleTp({
  fields,
  register,
  onAdd,
  onRemove,
  maxReached,
}: MultipleTpProps) {
  return (
    <div className="flex flex-col rounded-sm gap-3">
      {/* Header */}
      <div className="flex w-full gap-2.5">
        <div className="flex gap-1 px-1">
          <div className={headerCell}>Exit Price (USD)</div>
          <div className={headerCell}>Profit (%)</div>
        </div>

        <div className={headerCell}>Profit (USD)</div>

        <div className="flex gap-1 px-1">
          <div className={headerCell}>Units (%)</div>
          <div className={headerCell}>Units</div>
        </div>

        <div className={headerCell}>Market Price</div>
        <div className={headerCell}>Add/Del</div>
      </div>

      {/* Rows */}
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-1 w-full">
          {/* Exit + Profit % */}
          <div className="flex rounded-sm bg-white border border-[#E2E2E2] gap-1 p-1">
            <input
              type="number"
              placeholder="Exit Price(USD)"
              {...register(`multipleTakeProfits.${index}.exitPricePercent`)}
              className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111]
                placeholder:text-[8px]
                placeholder:font-medium
                placeholder:text-[#C6C6C6]
                outline-none [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              type="number"
              placeholder="Profit(%)"
              {...register(`multipleTakeProfits.${index}.profitPercent`)}
              className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111]
                placeholder:text-[8px]
                placeholder:font-medium
                placeholder:text-[#C6C6C6]
                outline-none [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Profit USD */}
          <div className="flex rounded-sm bg-white border border-[#E2E2E2] py-1">
            <input
              type="number"
              placeholder="Profit(USD)"
              {...register(`multipleTakeProfits.${index}.profitAmount`)}
              className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111]
                placeholder:text-[8px]
                placeholder:font-medium
                placeholder:text-[#C6C6C6]
                outline-none [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Units % + Units */}
          <div className="flex rounded-sm bg-white border border-[#E2E2E2] gap-1 p-1">
            <input
              type="number"
              placeholder="Units (%)"
              {...register(`multipleTakeProfits.${index}.unitsPercent`)}
              className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111]
                placeholder:text-[8px]
                placeholder:font-medium
                placeholder:text-[#C6C6C6]
                outline-none [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
            />
            <input
              type="number"
              placeholder="Units"
              {...register(`multipleTakeProfits.${index}.units`)}
              className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111]
                placeholder:text-[8px]
                placeholder:font-medium
                placeholder:text-[#C6C6C6]
                outline-none [appearance:textfield]
                [&::-webkit-inner-spin-button]:appearance-none
                [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Market Price */}
          <div className="w-11 p-1">
            <Checkbox
              {...register(`multipleTakeProfits.${index}.marketPrice`)}
            />
          </div>

          {/* Add / Remove */}
          {index === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={maxReached}
              className={`w-10 py-1 flex justify-center items-center ${
                maxReached ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <Image
                src="/icons/plus.svg"
                alt="add"
                width={17}
                height={17}
                className="object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="w-10 py-1 flex justify-center items-center"
            >
              <Image
                src="/icons/minus.svg"
                alt="remove"
                width={17}
                height={17}
                className="object-cover"
              />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
