import { formatNumber } from "@/lib/utils/format-value";

const items = [
  {
    id: "1",
    name: "Total Supply",
    amount: "1000",
    amountInToken: "20",
  },
  {
    id: "2",
    name: "Available Liquidity",
    amount: "3400",
    amountInToken: "30.4",
  },
  {
    id: "3",
    name: "Utilization Rate ",
    amount: "6.5",
    
  },
  {
    id: "4",
    name: "Supply APY",
    amount: "2.5",
  },
];

export const AccountStatsGhost = () => {
  return (
    <div className="w-full h-full flex justify-between ">
      {items.map((items) => {
        return (
          <div
            key={items.id}
            className="w-[240px] h-fit flex flex-col gap-[12px]"
          >
            <div className="text-[12px] font-medium text-[#5C5B5B]">
              {items.name}
            </div>
            <div className="w-full h-fit flex flex-col gap-[4px] ">
              <div className="text-[28px] font-bold ">
                ${formatNumber(Number(items.amount))}
              </div>
              {items.amountInToken && <div className="text-[12px] font-medium ">
                {formatNumber(Number(items.amountInToken))} ETH
              </div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
