import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  memo,
} from "react";
import { motion } from "framer-motion";
import { AnimatedTabs } from "../ui/animated-tabs";
import { FilterDropdown } from "../ui/filter-dropdown";
import { SearchBar } from "../ui/search-bar";
import Image from "next/image";
import { iconPaths } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { SupplyApy } from "./supply-apy";
import { PieChart } from "../ui/pie-chart";
import { ProgressBar } from "../ui/progress-bar";
import { useTheme } from "@/contexts/theme-context";
import { ArrowTopRightIcon, SortVerticalIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const ITEMS_PER_PAGE = 4;

// Animation variants
const tableContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const paginationVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

const FILTER_OPTIONS = {
  collateral: ["ETH", "USDC", "USDT"],
  collateralFilters: ["All", "ETH", "USDC", "USDT"],
  deposit: ["BTC", "ETH", "USDC"],
  depositFilters: ["All"],
  allChains: ["ETH", "USDC", "USDT"],
  allChainsFilters: ["All", "ETH", "USDC", "USDT"],
  all: ["Vault Deposit", "Vault Collateral", "Vault Total", "Vault Withdraw"],
  allFilters: ["All"],
  vaults: ["USDC", "USDTO", "kHYPE", "USDe", "wHYPE", "wstHYPE", "HYPE"],
  vaultsFilters: ["All", "USDC","USDT", "HYPE"],
  curator: ["9summits"],
  curatorFilters: ["All"],
  provider: ["Kraken"],
  providerFilters: ["All"],
  protocol: ["v3", "v2"]
};

interface TableProps {
  tableBodyBackground?: string;
  tableHeadingTextColor?: string;
  heading: {
    tabsItems?: { label: string; id: string }[];
    heading?: string;
    tabType?: "solid" | "underline";
  };
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  filters?: {
    filters?: string[];
    customizeDropdown?: boolean;
    supplyApyTab?: boolean;
    supplyApyLabel?: string; // Custom label for "Supply APY is"
    anythingLabel?: string; // Custom label for "Anything"
    allChainDropdown?: boolean;
    filterTabType?: "solid" | "underline" | "ghost"; // For Lending/LP tabs
  };
  filterTabTypeOptions?: { id: string; label: string }[]; // e.g., ["Lending/Single Assets", "LP/Multiple Assets"]
  activeFilterTab?: string;
  onFilterTabTypeChange?: (filterTabId: string) => void;
  filterDropdownPosition?: "left" | "right"; // Control dropdown position (default: "left")
  tableHeadings: { label: string; id: string; icon?: boolean }[];
  tableBody: {
    rows: {
      cell: {
        chain?: string;
        icon?: string;
        title?: string;
        titles?: string[]; // Multiple titles separated by slash (e.g., ["USDT", "BNB"]) - icons auto-derived from iconPaths
        description?: string;
        tag?: string | number;
        tags?: (string | number)[]; // Multiple tags
        clickable?: string;
        onlyIcons?: string[];
        percentage?: number;
        value?: string;
      }[];
    }[];
  };
  onRowClick?: (row: any, rowIndex: number) => void;
  hoverBackground?: string;
  showPieChart?: boolean;
  showProgressBar?: boolean;
}

type FiltersState = {
  allChains: string[];
  collateral: string[];
  deposit: string[];
  all: string[];
  customize: string[];
  vaults: string[];
  curator: string[];
  provider: string[];
  protocol: string[];
};

type SupplyApyFilter = {
  percentage: number;
  greaterThan: boolean;
};

/* ---------- FILTER LOGIC (unchanged behavior) ---------- */

const applyFilters = (
  rows: TableProps["tableBody"]["rows"],
  searchLower: string,
  filtersState: FiltersState,
  supplyApyFilter: SupplyApyFilter,
  hasSupplyApyColumn: boolean,
  supplyApyColumnIndex: number,
  tableHeadings: TableProps["tableHeadings"]
) => {
  const hasAllChainsFilter =
    filtersState.allChains.length > 0 &&
    !filtersState.allChains.includes("All");
  const hasDepositFilter = filtersState.deposit.length > 0;
  const hasCollateralFilter =
    filtersState.collateral.length > 0 &&
    !filtersState.collateral.includes("All");
  const hasSupplyApyFilter =
    hasSupplyApyColumn && supplyApyFilter.percentage > 0;
  const hasAllFilter =
    filtersState.all.length > 0 && !filtersState.all.includes("All");
  const hasVaultsFilter =
    filtersState.vaults.length > 0 && !filtersState.vaults.includes("All");
  const hasCuratorFilter =
    filtersState.curator.length > 0 && !filtersState.curator.includes("All");
  const hasProviderFilter =
    filtersState.provider.length > 0 && !filtersState.provider.includes("All");
  const hasProtocolFilter =
    filtersState.protocol.length > 0 && !filtersState.protocol.includes("All");

  if (
    !searchLower &&
    !hasAllChainsFilter &&
    !hasDepositFilter &&
    !hasCollateralFilter &&
    !hasSupplyApyFilter &&
    !hasAllFilter &&
    !hasVaultsFilter &&
    !hasCuratorFilter &&
    !hasProviderFilter &&
    !hasProtocolFilter
  ) {
    return rows;
  }

  const typeColumnIndex = tableHeadings.findIndex(
    (h) => h.id === "type" || h.label.toLowerCase() === "type"
  );

  return rows.filter((row) => {
    if (
      searchLower &&
      !row.cell.some((cell) => cell.title?.toLowerCase().includes(searchLower))
    ) {
      return false;
    }

    if (hasAllChainsFilter) {
      const chain = row.cell[0]?.chain;
      if (!chain || !filtersState.allChains.includes(chain)) return false;
    }

    if (hasDepositFilter) {
      const poolName = row.cell[0]?.title?.toUpperCase() || "";
      if (!filtersState.deposit.some((d) => poolName.includes(d.toUpperCase())))
        return false;
    }

    if (hasCollateralFilter) {
      const collateralIcons = row.cell[row.cell.length - 1]?.onlyIcons || [];
      if (!filtersState.collateral.some((c) => collateralIcons.includes(c)))
        return false;
    }

    if (hasSupplyApyFilter) {
      const supplyApyCell = row.cell[supplyApyColumnIndex];
      if (!supplyApyCell?.title) return false;

      let cellValue = 0;
      const cellTitle = supplyApyCell.title;

      // Check for percentage (e.g., "5.5%")
      const percentageMatch = cellTitle.match(/(\d+\.?\d*)%/);
      if (percentageMatch) {
        cellValue = parseFloat(percentageMatch[1]);
      } else {
        // Check for Million (e.g., "$1.2M" or "1.2M")
        const millionMatch = cellTitle.match(/\$?(\d+\.?\d*)\s*M/i);
        if (millionMatch) {
          cellValue = parseFloat(millionMatch[1]);
        } else {
          // Check for Billion (e.g., "$1.2B" or "1.2B")
          const billionMatch = cellTitle.match(/\$?(\d+\.?\d*)\s*B/i);
          if (billionMatch) {
            cellValue = parseFloat(billionMatch[1]);
          } else {
            // Check for Thousand (e.g., "$1.2K" or "1.2K")
            const thousandMatch = cellTitle.match(/\$?(\d+\.?\d*)\s*K/i);
            if (thousandMatch) {
              cellValue = parseFloat(thousandMatch[1]);
            } else {
              // Check for plain numbers (e.g., "$1000" or "1000")
              const numberMatch = cellTitle.match(/\$?(\d+\.?\d*)/);
              if (numberMatch) {
                cellValue = parseFloat(numberMatch[1]);
              } else {
                return false; // No valid number found
              }
            }
          }
        }
      }

      const isValid =
        supplyApyFilter.greaterThan
          ? cellValue > supplyApyFilter.percentage
          : cellValue < supplyApyFilter.percentage;

      if (!isValid) return false;
    }

    if (hasAllFilter && typeColumnIndex !== -1) {
      const typeValue = row.cell[typeColumnIndex]?.title?.toUpperCase() || "";
      const matches = filtersState.all.some((f) => {
        const filterUpper = f.toUpperCase();
        return (
          typeValue.includes(filterUpper) || filterUpper.includes(typeValue)
        );
      });
      if (!matches) return false;
    }

    // Vaults filter - checks if vault name matches
    if (hasVaultsFilter) {
      const vaultName = row.cell[0]?.title?.toUpperCase() || "";
      if (!filtersState.vaults.some((v) => vaultName.includes(v.toUpperCase())))
        return false;
    }

    // Protocol filter - checks first tag (index 0) for protocol match
    if (hasProtocolFilter) {
      let protocolFound = false;
      for (const cell of row.cell) {
        if (cell.tags && cell.tags.length > 0) {
          const protocolTag = String(cell.tags[0]).toLowerCase();
          if (filtersState.protocol.some((p) => protocolTag.includes(p.toLowerCase()))) {
            protocolFound = true;
            break;
          }
        }
      }
      if (!protocolFound) return false;
    }

    // Curator filter - checks third tag (index 2) for curator match
    if (hasCuratorFilter) {
      let curatorFound = false;
      for (const cell of row.cell) {
        if (cell.tags && cell.tags.length > 2) {
          const curatorTag = String(cell.tags[2]).toLowerCase();
          if (filtersState.curator.some((c) => curatorTag.includes(c.toLowerCase()))) {
            curatorFound = true;
            break;
          }
        }
      }
      if (!curatorFound) return false;
    }

    // Provider filter - checks fourth tag (index 3) or third tag (index 2) if only 3 tags exist
    if (hasProviderFilter) {
      let providerFound = false;
      for (const cell of row.cell) {
        if (cell.tags) {
          let providerTag: string | null = null;
          
          // If 4 or more tags, provider is at index 3
          if (cell.tags.length >= 4) {
            providerTag = String(cell.tags[3]).toLowerCase();
          }
          // If only 3 tags, provider is at index 2
          else if (cell.tags.length === 3) {
            providerTag = String(cell.tags[2]).toLowerCase();
          }
          
          if (providerTag && filtersState.provider.some((p) => providerTag.includes(p.toLowerCase()))) {
            providerFound = true;
            break;
          }
        }
      }
      if (!providerFound) return false;
    }

    return true;
  });
};

/* ---------- SIMPLE CELL RENDER HELPERS ---------- */

const CellContent = ({
  cell,
  showPieChart,
  showProgressBar,
  isDark,
  hasHover,
}: {
  cell: any;
  showPieChart?: boolean;
  showProgressBar?: boolean;
  isDark?: boolean;
  hasHover?: boolean;
}) => {
  const hasPercentage = cell.percentage !== undefined;
  const showValueBlock =
    cell.title || cell.titles || (showPieChart && hasPercentage) || (showProgressBar && hasPercentage);

  if (!showValueBlock && !cell.onlyIcons && !cell.tag && !cell.tags) return null;

  if (cell.onlyIcons) {
    return (
      <div className="w-fit h-fit flex justify-start items-center">
        {cell.onlyIcons.map((icon: string, iconIdx: number) => (
          <Image
            key={iconIdx}
            className={`${iconIdx > 0 ? "-ml-[10px]" : ""} rounded-full ${
              isDark ? "border-[1px] border-black" : "border-[1px] border-white"
            }`}
            src={iconPaths[icon]}
            alt={icon}
            width={20}
            height={20}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {showValueBlock && (
        <div
          className={`${
            showProgressBar && hasPercentage ? "w-full" : "w-fit"
          } h-fit flex flex-col gap-[2px]`}
        >
          {showProgressBar && hasPercentage && (
            <div className="w-full h-fit">
              <ProgressBar
                percentage={cell.percentage}
                height={34}
                progressColor="#703AE6"
                backgroundColor="#FFFFFF"
                showPercentage={true}
                value={cell.value}
              />
            </div>
          )}

          <div className="w-fit h-fit flex gap-[8px] items-center">
            {cell.chain && (
              <Image
                src={iconPaths[cell.chain]}
                alt={cell.chain}
                width={10}
                height={10}
              />
            )}

            {showPieChart && hasPercentage ? (
              <div className="w-[24px] h-[24px]">
                <PieChart
                  percentage={cell.percentage}
                  strokeWidth={10}
                  showPercentage={false}
                  textSize="text-[8px]"
                />
              </div>
            ) : cell.titles && cell.titles.length > 0 ? (
              // Multiple icons derived from titles - half-half display
              <div className="flex items-center -space-x-[8px]">
                {cell.titles.map((titleName: string, iconIdx: number) => {
                  const iconPath = iconPaths[titleName];
                  if (!iconPath) return null;
                  return (
                    <Image
                      key={iconIdx}
                      src={iconPath}
                      alt={titleName}
                      width={16}
                      height={16}
                      className={`rounded-full ${
                        isDark ? "border-[1px] border-black" : "border-[1px] border-white"
                      }`}
                    />
                  );
                })}
              </div>
            ) : iconPaths[cell.title] || cell.icon ? (
              <Image
                src={cell.icon || iconPaths[cell.title]}
                alt={cell.title}
                width={16}
                height={16}
                className="rounded-full"
              />
            ) : null}

            {(!showProgressBar || cell.title || cell.titles) && (
              <div className={` w-fit h-fit flex flex-col gap-[4px] text-[14px] font-medium ${
                isDark 
                  ? hasHover 
                    ? "text-white group-hover:text-[#181822]" 
                    : "text-white"
                  : "text-[#181822]"
              }`}>
                <div className="whitespace-nowrap">
                  {cell.titles ? (
                    cell.titles.join(" / ")
                  ) : (
                    cell.title ?? (hasPercentage ? `${cell.percentage}%` : "")
                  )}
                </div>
                {cell.description && (
                  <div className={`py-[3px] text-[10px] font-medium ${
                    isDark 
                      ? hasHover 
                        ? "text-white group-hover:text-[#111111]" 
                        : "text-white"
                      : "text-[#111111]"
                  }`}>
                    {cell.description}
                  </div>
                )}
              </div>
            )}

            {cell.clickable && (
              <button
                type="button"
                className="cursor-pointer w-[20px] h-[20px] flex flex-col justify-center items-center"
              >
                <ArrowTopRightIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {(cell.tag || cell.tags) && !cell.onlyIcons && (
        <div className="w-fit h-fit flex gap-[4px] flex-wrap">
          {cell.tags ? (
            cell.tags.map((tag: string | number, idx: number) => (
              <div key={idx} className="w-fit h-fit rounded-[6px] py-[2px] px-[6px] font-medium text-[12px] bg-[#703AE6] text-white">
                {tag}
              </div>
            ))
          ) : (
            <div className="w-fit h-fit rounded-[6px] py-[2px] px-[6px] font-medium text-[12px] bg-[#703AE6] text-white">
              {cell.tag}
            </div>
          )}
        </div>
      )}
    </>
  );
};

const TableRow = memo(
  ({
    row,
    visibleHeadings,
    tableBodyBackground,
    tableHeadings,
    onRowClick,
    hoverBackground,
    rowIndex,
    showPieChart,
    showProgressBar,
    isDark,
  }: {
    row: any;
    visibleHeadings: any[];
    tableBodyBackground?: string;
    tableHeadings: TableProps["tableHeadings"];
    onRowClick?: (row: any, rowIndex: number) => void;
    hoverBackground?: string;
    rowIndex: number;
    showPieChart?: boolean;
    showProgressBar?: boolean;
    isDark?: boolean;
  }) => {
    const hasHover = Boolean(hoverBackground);
    const visibleCells = row.cell.filter((_: any, cellIdx: number) => {
      const heading = tableHeadings[cellIdx];
      return heading && visibleHeadings.some((vh) => vh.label === heading.label);
    });

    const handleClick = useCallback(() => {
      onRowClick?.(row, rowIndex);
    }, [onRowClick, row, rowIndex]);

    return (
      <motion.tr
        onClick={onRowClick ? handleClick : undefined}
        className={`group ${onRowClick ? "cursor-pointer" : ""} ${
          hoverBackground || ""
        } w-full h-fit rounded-[12px] py-[16px] px-[20px] flex gap-[16px] items-center ${
          isDark
            ? tableBodyBackground || "bg-[#222222]"
            : tableBodyBackground || "bg-[#F7F7F7]"
        } border-[1px]`}
        variants={tableRowVariants}
        whileHover={onRowClick ? { scale: 1.005, y: -2 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {visibleCells.map((cell: any, idx: number) => (
          <td
            key={idx}
            className={`flex flex-col gap-[6px] h-full ${
              visibleHeadings.length - 1 === idx && !showProgressBar
                ? "w-[120px] min-w-[120px] items-start"
                : visibleHeadings.length - 1 === idx && showProgressBar
                ? "w-full min-w-[120px] items-start"
                : "w-full min-w-[120px] items-start"
            }`}
          >
            <CellContent
              cell={cell}
              showPieChart={showPieChart}
              showProgressBar={showProgressBar}
              isDark={isDark}
              hasHover={hasHover}
            />
          </td>
        ))}
      </motion.tr>
    );
  }
);

TableRow.displayName = "TableRow";

/* ---------- MAIN TABLE COMPONENT ---------- */

export const Table = memo((props: TableProps) => {
  const { isDark } = useTheme();
  const activeTab = props.activeTab || props.heading.tabsItems?.[0]?.id || "";

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [filtersState, setFiltersState] = useState<FiltersState>({
    allChains: [],
    collateral: [],
    deposit: [],
    all: [],
    customize: [],
    vaults: [],
    curator: [],
    provider: [],
    protocol: [],
  });
  const [supplyApyFilter, setSupplyApyFilter] = useState<SupplyApyFilter>({
    percentage: 0,
    greaterThan: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    columnId: string | null;
    direction: "asc" | "desc";
  }>({
    columnId: null,
    direction: "asc",
  });
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const supplyApyColumnIndex = useMemo(() => {
    // If custom label is provided, find column by label match
    if (props.filters?.supplyApyLabel) {
      return props.tableHeadings.findIndex((h) => 
        h.label.toLowerCase().includes(props.filters!.supplyApyLabel!.toLowerCase())
      );
    }
    // Otherwise use default "supply-apy" id
    return props.tableHeadings.findIndex((h) => h.id === "supply-apy");
  }, [props.tableHeadings, props.filters?.supplyApyLabel]);
  
  const hasSupplyApyColumn = supplyApyColumnIndex !== -1;

  // Handle scroll to show/hide shadow indicators
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const debouncedSearchHandler = useDebounce((value: string) => {
    setDebouncedSearchValue(value);
  }, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      debouncedSearchHandler(value);
    },
    [debouncedSearchHandler]
  );

  const updateFilter = useCallback(
    (key: keyof FiltersState) => (value: string[]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const filteredData = useMemo(
    () =>
      applyFilters(
        props.tableBody.rows,
        debouncedSearchValue.toLowerCase().trim(),
        filtersState,
        supplyApyFilter,
        hasSupplyApyColumn,
        supplyApyColumnIndex,
        props.tableHeadings
      ),
    [
      debouncedSearchValue,
      filtersState,
      supplyApyFilter,
      hasSupplyApyColumn,
      supplyApyColumnIndex,
      props.tableBody.rows,
      props.tableHeadings,
    ]
  );

  const sortedData = useMemo(() => {
    if (!sortConfig.columnId) return filteredData;

    const columnIndex = props.tableHeadings.findIndex(
      (h) => h.id === sortConfig.columnId
    );
    if (columnIndex === -1) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aCell = a.cell[columnIndex];
      const bCell = b.cell[columnIndex];

      let aValue: string | number = aCell?.title || aCell?.tag || "";
      let bValue: string | number = bCell?.title || bCell?.tag || "";

      const aNumMatch = String(aValue).match(/(\d+\.?\d*)/);
      const bNumMatch = String(bValue).match(/(\d+\.?\d*)/);

      if (aNumMatch && bNumMatch) {
        aValue = parseFloat(aNumMatch[1]);
        bValue = parseFloat(bNumMatch[1]);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });
  }, [filteredData, sortConfig, props.tableHeadings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filteredData.length,
    supplyApyFilter.percentage,
    supplyApyFilter.greaterThan,
  ]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      props.onTabChange?.(tabId);
    },
    [props]
  );

  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (prev.columnId === columnId) {
        return {
          columnId,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { columnId, direction: "asc" };
    });
    setCurrentPage(1);
  }, []);

  const visibleHeadings = useMemo(
    () =>
      props.tableHeadings.filter(
        (h) => !filtersState.customize.includes(h.label)
      ),
    [props.tableHeadings, filtersState.customize]
  );

  const { filters } = props;
  const showAllChainDropdown = filters?.allChainDropdown;
  const showCustomizeDropdown = filters?.customizeDropdown;
  const showFilterTabType = filters?.filterTabType;
  const hasCollateral = filters?.filters?.includes("Collateral") ?? false;
  const hasDeposit = filters?.filters?.includes("Deposit") ?? false;
  const hasAll = filters?.filters?.includes("All") ?? false;
  const hasVaults = filters?.filters?.includes("Vaults") ?? false;
  const hasCurator = filters?.filters?.includes("Curator") ?? false;
  const hasProvider = filters?.filters?.includes("Provider") ?? false;
  const hasProtocol = filters?.filters?.includes("Protocol") ?? false;

  const customizeOptions = useMemo(
    () => props.tableHeadings.map((h) => h.label),
    [props.tableHeadings]
  );
  const customizeOptionsFilters = useMemo(() => ["All"], []);

  const hasHeadingTitle = Boolean(props.heading.heading);
  const hasTabs = Boolean(props.heading.tabsItems);

  const hasData = sortedData.length > 0;

  // Handle scroll to show/hide shadow indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasData) return;

    // Initial check with small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      handleScroll();
    }, 100);

    // Add scroll listener
    container.addEventListener("scroll", handleScroll);
    
    // Check on resize
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, hasData, sortedData.length]);

  return (
    <section className="w-full h-fit flex flex-col gap-[24px]" aria-label={props.heading.heading || "Data Table"}>
      {hasHeadingTitle && (
        <motion.header
          className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className={`text-[16px] font-semibold ${
            isDark ? "text-white" : "text-[#434C53F2]"
          }`}>
            {props.heading.heading}
          </h2>
          {!showAllChainDropdown && (
            <div className="flex items-center gap-3 sm:gap-[16px] flex-wrap" role="toolbar" aria-label="Table Filters">
              {hasCollateral && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.collateral}
                  dropdownOptionsFilters={FILTER_OPTIONS.collateralFilters}
                  currentDropdownItem={filtersState.collateral}
                  dropDownType="collateral"
                  onDropdownItemChange={updateFilter("collateral")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasDeposit && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.deposit}
                  dropdownOptionsFilters={FILTER_OPTIONS.depositFilters}
                  currentDropdownItem={filtersState.deposit}
                  dropDownType="deposit"
                  onDropdownItemChange={updateFilter("deposit")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasAll && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.all}
                  dropdownOptionsFilters={FILTER_OPTIONS.allFilters}
                  currentDropdownItem={filtersState.all}
                  dropDownType="All"
                  onDropdownItemChange={updateFilter("all")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasVaults && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.vaults}
                  dropdownOptionsFilters={FILTER_OPTIONS.vaultsFilters}
                  currentDropdownItem={filtersState.vaults}
                  dropDownType="vaults"
                  onDropdownItemChange={updateFilter("vaults")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasCurator && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.curator}
                  dropdownOptionsFilters={FILTER_OPTIONS.curatorFilters}
                  currentDropdownItem={filtersState.curator}
                  dropDownType="curator"
                  onDropdownItemChange={updateFilter("curator")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasProvider && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.provider}
                  dropdownOptionsFilters={FILTER_OPTIONS.providerFilters}
                  currentDropdownItem={filtersState.provider}
                  dropDownType="provider"
                  onDropdownItemChange={updateFilter("provider")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {hasProtocol && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.protocol}
                  currentDropdownItem={filtersState.protocol}
                  dropDownType="protocol"
                  onDropdownItemChange={updateFilter("protocol")}
                  showDropdownFilters={false}
                  showSearchBar={false}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
              {showCustomizeDropdown && customizeOptions.length > 0 && (
                <FilterDropdown
                  dropdownOptions={customizeOptions}
                  dropdownOptionsFilters={customizeOptionsFilters}
                  currentDropdownItem={filtersState.customize}
                  dropDownType="customize"
                  onDropdownItemChange={updateFilter("customize")}
                  dropdownPosition={props.filterDropdownPosition || "left"}
                />
              )}
            </div>
          )}
        </motion.header>
      )}

      {hasTabs && (
        <motion.nav
          className="w-fit h-fit"
          aria-label="Table Navigation Tabs"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <AnimatedTabs
            tabs={props.heading.tabsItems!}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            type={props.heading.tabType}
            tabClassName="text-[12px]"
          />
        </motion.nav>
      )}

      {showAllChainDropdown && (
        <motion.header
          className={`flex flex-wrap ${showFilterTabType && showAllChainDropdown ? "flex-col gap-[16px]" : "min-[550px]:justify-between min-[550px]:items-center gap-[16px] min-[550px]:gap-0"}`}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-[12px] flex-wrap w-full min-[550px]:w-auto">
            <FilterDropdown
              dropdownOptions={FILTER_OPTIONS.allChains}
              dropdownOptionsFilters={FILTER_OPTIONS.allChainsFilters}
              currentDropdownItem={filtersState.allChains}
              dropDownType="all-chains"
              onDropdownItemChange={updateFilter("allChains")}
            />
            <div className="w-full min-[550px]:w-auto" role="search" aria-label="Table Search">
              <SearchBar
                placeholder="Pools"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
            {showFilterTabType && props.filterTabTypeOptions && (
              <AnimatedTabs
                tabs={props.filterTabTypeOptions}
                activeTab={props.activeFilterTab || props.filterTabTypeOptions[0].id}
                onTabChange={(tabId: string) => props.onFilterTabTypeChange?.(tabId)}
                type={props.filters?.filterTabType}
                tabClassName="text-[12px]"
                containerClassName="w-fit"
                customTabWidth="w-[200px]"
              />
            )}
          </div>
          <div className="flex items-center gap-[16px] flex-wrap w-full min-[550px]:w-auto mt-4 min-[550px]:mt-4" role="toolbar" aria-label="Additional Table Filters">
            {hasCollateral && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.collateral}
                dropdownOptionsFilters={FILTER_OPTIONS.collateralFilters}
                currentDropdownItem={filtersState.collateral}
                dropDownType="collateral"
                onDropdownItemChange={updateFilter("collateral")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasDeposit && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.deposit}
                dropdownOptionsFilters={FILTER_OPTIONS.depositFilters}
                currentDropdownItem={filtersState.deposit}
                dropDownType="deposit"
                onDropdownItemChange={updateFilter("deposit")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasAll && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.all}
                dropdownOptionsFilters={FILTER_OPTIONS.allFilters}
                currentDropdownItem={filtersState.all}
                dropDownType="All"
                onDropdownItemChange={updateFilter("all")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasVaults && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.vaults}
                dropdownOptionsFilters={FILTER_OPTIONS.vaultsFilters}
                currentDropdownItem={filtersState.vaults}
                dropDownType="vaults"
                onDropdownItemChange={updateFilter("vaults")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasCurator && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.curator}
                dropdownOptionsFilters={FILTER_OPTIONS.curatorFilters}
                currentDropdownItem={filtersState.curator}
                dropDownType="curator"
                onDropdownItemChange={updateFilter("curator")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasProvider && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.provider}
                dropdownOptionsFilters={FILTER_OPTIONS.providerFilters}
                currentDropdownItem={filtersState.provider}
                dropDownType="provider"
                onDropdownItemChange={updateFilter("provider")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {hasProtocol && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.protocol}
                currentDropdownItem={filtersState.protocol}
                dropDownType="protocol"
                onDropdownItemChange={updateFilter("protocol")}
                showDropdownFilters={false}
                showSearchBar={false}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {showCustomizeDropdown && customizeOptions.length > 0 && (
              <FilterDropdown
                dropdownOptions={customizeOptions}
                dropdownOptionsFilters={customizeOptionsFilters}
                currentDropdownItem={filtersState.customize}
                dropDownType="customize"
                onDropdownItemChange={updateFilter("customize")}
                dropdownPosition={props.filterDropdownPosition || "left"}
              />
            )}
            {filters?.supplyApyTab && (
              <div className="w-full min-[550px]:w-auto mt-4 min-[550px]:mt-0">
                <SupplyApy
                  setSupplyApyFilter={setSupplyApyFilter}
                  supplyApy={supplyApyFilter}
                  supplyApyLabel={filters?.supplyApyLabel}
                  anythingLabel={filters?.anythingLabel}
                />
              </div>
            )}
          </div>
        </motion.header>
      )}

      {hasData ? (
        <div className="relative w-full">
          {/* Left Shadow Indicator */}
          {showLeftShadow && (
            <div
              className={`absolute left-0 top-0 bottom-0 w-[40px] pointer-events-none z-10 bg-gradient-to-r ${
                isDark ? "from-[#111111] via-[#111111]/40" : "from-white via-white/40"
              } to-transparent transition-opacity duration-300`}
            />
          )}
          
          {/* Right Shadow Indicator */}
          {showRightShadow && (
            <div
              className={`absolute right-0 top-0 bottom-0 w-[40px] pointer-events-none z-10 bg-gradient-to-l ${
                isDark ? "from-[#111111] via-[#111111]/40" : "from-white via-white/40"
              } to-transparent transition-opacity duration-300`}
            />
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: isDark ? "#444444 transparent" : "#E2E2E2 transparent",
            }}
          >
            <motion.table
              className="w-full h-fit rounded-[12px] flex flex-col gap-[8px] min-w-[1024px] lg:min-w-0"
              variants={tableContainerVariants}
              initial="hidden"
              animate="visible"
            >
              <thead>
                <tr className="w-full h-fit rounded-[12px] px-[20px] flex gap-[16px]">
                  {visibleHeadings.map((item, idx) => {
                    const isLast = visibleHeadings.length - 1 === idx;
                    const isSorted = sortConfig.columnId === item.id;
                    const isDesc = isSorted && sortConfig.direction === "desc";

                    return (
                      <th
                        key={item.id}
                        className={`whitespace-nowrap text-[14px] font-medium ${
                          props.tableHeadingTextColor || "text-[#999999]"
                        } min-w-[120px] h-fit flex ${
                          isLast ? "justify-start w-[120px]" : "justify-start w-full whitespace-nowrap"
                        } gap-[4px] items-center`}
                      >
                        {item.icon && (
                          <motion.button
                            type="button"
                            onClick={() => handleSort(item.id)}
                            className={`w-[20px] h-[20px] flex flex-col justify-center items-center cursor-pointer hover:opacity-70 transition-all ${
                              isDesc ? "rotate-180" : ""
                            }`}
                            aria-label={`Sort by ${item.label}`}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                          >
                            <SortVerticalIcon fill={props.tableHeadingTextColor || "#999999"} />
                          </motion.button>
                        )}
                        {item.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <motion.tbody
                className="flex flex-col gap-[8px] w-full"
                variants={tableContainerVariants}
              >
                {paginatedData.map((row, idx) => (
                  <TableRow
                    key={idx}
                    row={row}
                    visibleHeadings={visibleHeadings}
                    tableBodyBackground={props.tableBodyBackground}
                    tableHeadings={props.tableHeadings}
                    onRowClick={props.onRowClick}
                    hoverBackground={props.hoverBackground}
                    rowIndex={idx}
                    showPieChart={props.showPieChart}
                    showProgressBar={props.showProgressBar}
                    isDark={isDark}
                  />
                ))}
              </motion.tbody>
            </motion.table>
          </div>
        </div>
      ) : (
        <motion.section
          className={`w-full h-[402px] border-[1px] rounded-[8px] flex flex-col items-center justify-center ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
          variants={tableRowVariants}
          initial="hidden"
          animate="visible"
        >
          <p className={`text-[14px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}>
            No data available
          </p>
        </motion.section>
      )}

      {hasData && totalPages > 1 && (
        <motion.nav
          className="flex items-center justify-center gap-[16px] py-[16px]"
          aria-label="Table Pagination"
          variants={paginationVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.button
            type="button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-[40px] h-[40px] transition-colors ${
              currentPage === 1
                ? "cursor-not-allowed opacity-30"
                : "cursor-pointer hover:opacity-70"
            } ${isDark ? "text-white" : "text-[#111111]"}`}
            aria-label="Previous page"
            whileHover={currentPage !== 1 ? { scale: 1.1, x: -2 } : undefined}
            whileTap={currentPage !== 1 ? { scale: 0.95 } : undefined}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon stroke={isDark ? "#FFFFFF" : "#111111"} strokeWidth={1.5} />
          </motion.button>

          <motion.span
            className="px-[24px] py-[8px] rounded-full bg-[#F1EBFD] text-[#703AE6] text-[14px] font-semibold"
            aria-live="polite"
            aria-atomic="true"
            key={currentPage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage} of {totalPages}
          </motion.span>

          <motion.button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-[40px] h-[40px] transition-colors ${
              currentPage === totalPages
                ? "cursor-not-allowed opacity-30"
                : "cursor-pointer hover:opacity-70"
            } ${isDark ? "text-white" : "text-[#111111]"}`}
            aria-label="Next page"
            whileHover={currentPage !== totalPages ? { scale: 1.1, x: 2 } : undefined}
            whileTap={currentPage !== totalPages ? { scale: 0.95 } : undefined}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon stroke={isDark ? "#FFFFFF" : "#111111"} strokeWidth={1.5} />
          </motion.button>
        </motion.nav>
      )}
    </section>
  );
});

Table.displayName = "Table";
