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
    <section className="w-full h-full flex justify-between" aria-label="Statistics Overview">
      {items.map((items) => {
        return (
          <article
            key={items.id}
            className="w-[240px] h-fit flex flex-col gap-[12px]"
          >
            <h3 className="text-[12px] font-medium text-[#5C5B5B]">
              {items.name}
            </h3>
            <div className="w-full h-fit flex flex-col gap-[4px]">
              <p className="text-[28px] font-bold">
                {items.amount}
              </p>
              {items.amountInToken && (
                <p className="text-[12px] font-medium">
                  {items.amountInToken}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
};
