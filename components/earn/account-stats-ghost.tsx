import { useTheme } from "@/contexts/theme-context";

interface AccountStatsItem {
  id: string;
  name: string;
  amount: string;
  amountInToken?: string;
}

interface AccountStatsGhostProps {
  items: AccountStatsItem[];
  type?: "standard" | "background" | "background-light";
  gridCols?: string;
  gridRows?: string;
}

export const AccountStatsGhost = ({ items, type = "standard", gridCols, gridRows }: AccountStatsGhostProps) => {
  const { isDark } = useTheme();

  const useGrid = type === "background" || type === "background-light" || (gridCols && gridRows);
  const defaultGridCols = gridCols || "grid-cols-3";
  const defaultGridRows = gridRows || "grid-rows-1";

  const hasBg = type === "background" || type === "background-light";
  const bgColor = isDark
    ? "bg-[#222222]"
    : type === "background-light"
    ? "bg-[#FFFFFF]"
    : "bg-[#F7F7F7]";

  return (
    <>
      {/* Mobile: horizontal scroll cards */}
      <div className="sm:hidden w-full overflow-x-auto no-scrollbar -mx-4 px-4" aria-label="Statistics Overview">
        <div className="flex gap-3 w-max py-1">
          {items.map((item) => (
            <article
              key={item.id}
              className={`flex-shrink-0 w-[148px] rounded-[16px] p-4 border-[1px] ${
                isDark ? "bg-[#222222]" : hasBg ? bgColor : "bg-[#F7F7F7]"
              }`}
            >
              <h3 className="text-[11px] font-medium text-[#919191] mb-2">
                {item.name}
              </h3>
              <p className={`text-[18px] font-bold leading-tight ${isDark ? "text-white" : ""}`}>
                {item.amount}
              </p>
              {item.amountInToken && (
                <p className={`text-[11px] font-medium mt-1 ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
                  {item.amountInToken}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>

      {/* Desktop/Tablet: grid or flex layout */}
      {useGrid ? (
        <section
          className={`hidden sm:grid w-full h-full ${defaultGridCols} ${defaultGridRows} gap-[20px] ${
            hasBg ? `place-items-center px-[10px] py-[20px] rounded-[24px] border-[1px] ${bgColor}` : ""
          }`}
          aria-label="Statistics Overview"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className={`w-full h-fit flex flex-col gap-[12px] ${hasBg ? "px-[20px]" : ""}`}
            >
              <h3 className="text-[12px] font-medium text-[#919191]">{item.name}</h3>
              <div className="w-full h-fit flex flex-col gap-[4px]">
                <p className={`text-[24px] lg:text-[28px] font-bold ${isDark ? "text-white" : ""}`}>
                  {item.amount}
                </p>
                {item.amountInToken && (
                  <p className={`text-[12px] font-medium ${isDark ? "text-white" : ""}`}>
                    {item.amountInToken}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="hidden sm:flex w-full h-full justify-between" aria-label="Statistics Overview">
          {items.map((item) => (
            <article key={item.id} className="w-[240px] h-fit flex flex-col gap-[12px]">
              <h3 className="text-[12px] font-medium text-[#919191]">{item.name}</h3>
              <div className="w-full h-fit flex flex-col gap-[4px]">
                <p className={`text-[24px] lg:text-[28px] font-bold ${isDark ? "text-white" : ""}`}>
                  {item.amount}
                </p>
                {item.amountInToken && (
                  <p className={`text-[12px] font-medium ${isDark ? "text-white" : ""}`}>
                    {item.amountInToken}
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
};
