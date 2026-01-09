interface AccountStatsItem {
  id: string;
  name: string;
  amount: string;
  amountInToken?: string;
}

interface AccountStatsGhostProps {
  items: AccountStatsItem[];
}

export const AccountStatsGhost = ({ items }: AccountStatsGhostProps) => {
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
                {items.amount}
              </div>
              {items.amountInToken && (
                <div className="text-[12px] font-medium ">
                  {items.amountInToken}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
