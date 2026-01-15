import { useTheme } from "@/contexts/theme-context";

interface AccountStatsItem {
  id: string;
  name: string;
  amount: string;
  amountInToken?: string;
}

interface AccountStatsGhostProps {
  items: AccountStatsItem[];
  type?: "standard" | "background";
  gridCols?: string; // e.g., "grid-cols-3", "grid-cols-2", etc.
  gridRows?: string; // e.g., "grid-rows-1", "grid-rows-2", etc.
}

export const AccountStatsGhost = ({ items, type = "standard", gridCols = "grid-cols-3", gridRows = "grid-rows-1" }: AccountStatsGhostProps) => {
  const { isDark } = useTheme();
  
  const containerClass = type === "background"
    ? `w-full h-full grid ${gridCols} ${gridRows} gap-[20px] place-items-center px-[10px] py-[20px] rounded-[24px] border-[1px] ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`
    : "w-full h-full flex justify-between";
  
  return (
    <section className={containerClass} aria-label="Statistics Overview">
      {items.map((items) => {
        const articleClass = type === "background"
          ? "w-full h-fit flex flex-col gap-[12px] px-[20px]"
          : "w-[240px] h-fit flex flex-col gap-[12px]";
        
        return (
          <article
            key={items.id}
            className={articleClass}
          >
            <h3 className={`text-[12px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#5C5B5B]"
            }`}>
              {items.name}
            </h3>
            <div className="w-full h-fit flex flex-col gap-[4px]">
              <p className={`text-[28px] font-bold ${
                isDark ? "text-white" : ""
              }`}>
                {items.amount}
              </p>
              {items.amountInToken && (
                <p className={`text-[12px] font-medium ${
                  isDark ? "text-white" : ""
                }`}>
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
