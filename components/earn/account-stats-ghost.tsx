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
  gridCols?: string; // e.g., "grid-cols-3", "grid-cols-2", etc.
  gridRows?: string; // e.g., "grid-rows-1", "grid-rows-2", etc.
}

export const AccountStatsGhost = ({ items, type = "standard", gridCols, gridRows }: AccountStatsGhostProps) => {
  const { isDark } = useTheme();
  
  // Determine if we should use grid layout
  const useGrid = type === "background" || type === "background-light" || (gridCols && gridRows);
  
  // Default grid classes if not provided
  const defaultGridCols = gridCols || "grid-cols-3";
  const defaultGridRows = gridRows || "grid-rows-1";
  
  // Build container class
  let containerClass = "w-full h-full";
  
  if (useGrid) {
    containerClass += ` grid ${defaultGridCols} ${defaultGridRows} gap-[20px]`;
    if (type === "background" || type === "background-light") {
      containerClass += " place-items-center px-[10px] py-[20px] rounded-[24px] border-[1px]";
      containerClass += isDark 
        ? " bg-[#222222]" 
        : type === "background-light" 
        ? " bg-[#FFFFFF]" 
        : " bg-[#F7F7F7]";
    }
  } else {
    containerClass += " flex justify-between";
  }
  
  return (
    <section className={containerClass} aria-label="Statistics Overview">
      {items.map((items) => {
        const articleClass = useGrid
          ? "w-full h-fit flex flex-col gap-2 sm:gap-[12px]"
          : "w-full sm:w-[240px] h-fit flex flex-col gap-2 sm:gap-[12px]";
        
        const articlePadding = type === "background" || type === "background-light" ? "px-3 sm:px-[20px]" : "";
        
        return (
          <article
            key={items.id}
            className={`${articleClass} ${articlePadding}`}
          >
            <h3 className={`text-[11px] sm:text-[12px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#919191]"
            }`}>
              {items.name}
            </h3>
            <div className="w-full h-fit flex flex-col gap-[4px]">
              <p className={`text-[20px] sm:text-[24px] lg:text-[28px] font-bold ${
                isDark ? "text-white" : ""
              }`}>
                {items.amount}
              </p>
              {items.amountInToken && (
                <p className={`text-[11px] sm:text-[12px] font-medium ${
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
