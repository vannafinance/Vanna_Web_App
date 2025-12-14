import Image from "next/image";
import { Checkbox } from "../ui/Checkbox";
import { useState } from "react";

interface TPRow {
  id: number;
}

const headerCell = "w-11 p-1 text-[8px] leading-3 font-medium text-[#A7A7A7]";

export default function MultiTp() {
  const [rows, setRows] = useState<TPRow[]>([{ id: 1 }]); // initially 1 row

  const addRow = () => {
    if (rows.length >= 3) return;
    setRows((prev) => [...prev, { id: Date.now() }]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };
  return (
    <div className="flex flex-col rounded-sm gap-3">
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

      {rows.map((row, index) => (
        <div key={row.id} className="flex gap-1 w-full">
          <div className="flex rounded-sm bg-white border border-[#E2E2E2] gap-1 p-1">
            <input className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <input className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>

          <div className="flex rounded-sm bg-white border border-[#E2E2E2] py-1">
            <input className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>

          <div className="flex rounded-sm bg-white border border-[#E2E2E2] gap-1 p-1">
            <input className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <input className="rounded-sm p-1 w-11 text-[10px] font-medium leading-[15px] text-[#111111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>
          <div className="w-11 p-1">
            <Checkbox />
          </div>

          {index === 0 ? (
            <button
              type="button"
              onClick={addRow}
              className="w-10 py-1 flex justify-center items-center"
            >
              <Image
                src="/icons/plus.svg"
                alt="info-icon"
                width={17}
                height={17}
                className="object-cover"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="w-10 py-1 flex justify-center items-center"
            >
              <Image
                src="/icons/minus.svg"
                alt="info-icon"
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
