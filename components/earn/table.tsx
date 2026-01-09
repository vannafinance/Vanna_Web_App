import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
} from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { FilterDropdown } from "../ui/filter-dropdown";
import { SearchBar } from "../ui/search-bar";
import Image from "next/image";
import { iconPaths } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { SupplyApy } from "./supply-apy";
import { PieChart } from "../ui/pie-chart";
import { ProgressBar } from "../ui/progress-bar";

const ITEMS_PER_PAGE = 4;

const FILTER_OPTIONS = {
  collateral: ["ETH", "USDC", "USDT"],
  collateralFilters: ["All", "ETH", "USDC", "USDT"],
  deposit: ["BTC", "ETH", "USDC"],
  depositFilters: ["All"],
  allChains: ["ETH", "USDC", "USDT"],
  allChainsFilters: ["All", "ETH", "USDC", "USDT"],
  all: ["Vault Deposit", "Vault Collateral", "Vault Total", "Vault Withdraw"],
  allFilters: ["All"],
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
    allChainDropdown?: boolean;
  };
  tableHeadings: { label: string; id: string; icon?: boolean }[];
  tableBody: {
    rows: {
      cell: {
        chain?: string;
        icon?: string;
        title?: string;
        description?: string;
        tag?: string | number;
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

  if (
    !searchLower &&
    !hasAllChainsFilter &&
    !hasDepositFilter &&
    !hasCollateralFilter &&
    !hasSupplyApyFilter &&
    !hasAllFilter
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

      const percentageMatch = supplyApyCell.title.match(/(\d+\.?\d*)%/);
      if (!percentageMatch) return false;

      const cellPercentage = parseFloat(percentageMatch[1]);
      const isValid =
        supplyApyFilter.greaterThan
          ? cellPercentage > supplyApyFilter.percentage
          : cellPercentage < supplyApyFilter.percentage;

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

    return true;
  });
};

/* ---------- SIMPLE CELL RENDER HELPERS ---------- */

const CellContent = ({
  cell,
  showPieChart,
  showProgressBar,
}: {
  cell: any;
  showPieChart?: boolean;
  showProgressBar?: boolean;
}) => {
  const hasPercentage = cell.percentage !== undefined;
  const showValueBlock =
    cell.title || (showPieChart && hasPercentage) || (showProgressBar && hasPercentage);

  if (!showValueBlock && !cell.onlyIcons && !cell.tag) return null;

  if (cell.onlyIcons) {
    return (
      <div className="w-fit h-fit flex justify-end items-center">
        {cell.onlyIcons.map((icon: string, iconIdx: number) => (
          <Image
            key={iconIdx}
            className={iconIdx > 0 ? "-ml-[10px]" : ""}
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
            ) : iconPaths[cell.title] || cell.icon ? (
              <Image
                src={cell.icon || iconPaths[cell.title]}
                alt={cell.title}
                width={16}
                height={16}
                className="rounded-full"
              />
            ) : null}

            {(!showProgressBar || cell.title) && (
              <div className="w-fit h-fit flex flex-col gap-[4px] text-[14px] font-medium text-[#181822]">
                <div className="break-words break-all">
                  {cell.title ??
                    (hasPercentage ? `${cell.percentage}%` : "")}
                </div>
                {cell.description && (
                  <div className="py-[3px] text-[10px] font-medium text-[#111111]">
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
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M9.29169 4.95838L0.625 4.95838M9.29169 4.95838L4.95829 0.625M9.29169 4.95838L4.95829 9.29162"
                    stroke="#434C53"
                    strokeOpacity="0.95"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {cell.tag && !cell.onlyIcons && (
        <div className="w-fit h-fit rounded-[6px] py-[2px] px-[6px] font-medium text-[12px] bg-[#703AE6] text-white">
          {cell.tag}
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
  }) => {
    const visibleCells = row.cell.filter((_: any, cellIdx: number) => {
      const heading = tableHeadings[cellIdx];
      return heading && visibleHeadings.some((vh) => vh.label === heading.label);
    });

    const handleClick = useCallback(() => {
      onRowClick?.(row, rowIndex);
    }, [onRowClick, row, rowIndex]);

    return (
      <tr
        onClick={onRowClick ? handleClick : undefined}
        className={`${onRowClick ? "cursor-pointer" : ""} ${
          hoverBackground || ""
        } w-full h-fit rounded-[12px] py-[16px] px-[20px] flex gap-[16px] items-center ${
          tableBodyBackground || "bg-[#F7F7F7]"
        } border-[1px] border-[#E2E2E2]`}
      >
        {visibleCells.map((cell: any, idx: number) => (
          <td
            key={idx}
            className={`flex flex-col gap-[6px] h-full ${
              visibleHeadings.length - 1 === idx && !showProgressBar
                ? "w-[120px] min-w-[120px] items-end"
                : visibleHeadings.length - 1 === idx && showProgressBar
                ? "w-full min-w-[120px] items-end"
                : "w-full min-w-[120px] items-start"
            }`}
          >
            <CellContent
              cell={cell}
              showPieChart={showPieChart}
              showProgressBar={showProgressBar}
            />
          </td>
        ))}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

/* ---------- MAIN TABLE COMPONENT ---------- */

export const Table = memo((props: TableProps) => {
  const activeTab = props.activeTab || props.heading.tabsItems?.[0]?.id || "";

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [filtersState, setFiltersState] = useState<FiltersState>({
    allChains: [],
    collateral: [],
    deposit: [],
    all: [],
    customize: [],
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

  const supplyApyColumnIndex = useMemo(
    () => props.tableHeadings.findIndex((h) => h.id === "supply-apy"),
    [props.tableHeadings]
  );
  const hasSupplyApyColumn = supplyApyColumnIndex !== -1;

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
  const hasCollateral = filters?.filters?.includes("Collateral") ?? false;
  const hasDeposit = filters?.filters?.includes("Deposit") ?? false;
  const hasAll = filters?.filters?.includes("All") ?? false;

  const customizeOptions = useMemo(
    () => props.tableHeadings.map((h) => h.label),
    [props.tableHeadings]
  );
  const customizeOptionsFilters = useMemo(() => ["All"], []);

  const hasHeadingTitle = Boolean(props.heading.heading);
  const hasTabs = Boolean(props.heading.tabsItems);

  const hasData = sortedData.length > 0;

  return (
    <div className="w-full h-fit flex flex-col gap-[24px]">
      {hasHeadingTitle && (
        <div className="flex justify-between items-center">
          <div className="text-[16px] font-semibold text-[#434C53F2]">
            {props.heading.heading}
          </div>
          {!showAllChainDropdown && (
            <div className="flex items-center gap-[16px]">
              {hasCollateral && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.collateral}
                  dropdownOptionsFilters={FILTER_OPTIONS.collateralFilters}
                  currentDropdownItem={filtersState.collateral}
                  dropDownType="collateral"
                  onDropdownItemChange={updateFilter("collateral")}
                />
              )}
              {hasDeposit && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.deposit}
                  dropdownOptionsFilters={FILTER_OPTIONS.depositFilters}
                  currentDropdownItem={filtersState.deposit}
                  dropDownType="deposit"
                  onDropdownItemChange={updateFilter("deposit")}
                />
              )}
              {hasAll && (
                <FilterDropdown
                  dropdownOptions={FILTER_OPTIONS.all}
                  dropdownOptionsFilters={FILTER_OPTIONS.allFilters}
                  currentDropdownItem={filtersState.all}
                  dropDownType="All"
                  onDropdownItemChange={updateFilter("all")}
                />
              )}
              {showCustomizeDropdown && customizeOptions.length > 0 && (
                <FilterDropdown
                  dropdownOptions={customizeOptions}
                  dropdownOptionsFilters={customizeOptionsFilters}
                  currentDropdownItem={filtersState.customize}
                  dropDownType="customize"
                  onDropdownItemChange={updateFilter("customize")}
                />
              )}
            </div>
          )}
        </div>
      )}

      {hasTabs && (
        <div className="w-fit h-fit">
          <AnimatedTabs
            tabs={props.heading.tabsItems!}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            type={props.heading.tabType}
            tabClassName="text-[12px]"
          />
        </div>
      )}

      {showAllChainDropdown && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[12px]">
            <FilterDropdown
              dropdownOptions={FILTER_OPTIONS.allChains}
              dropdownOptionsFilters={FILTER_OPTIONS.allChainsFilters}
              currentDropdownItem={filtersState.allChains}
              dropDownType="all-chains"
              onDropdownItemChange={updateFilter("allChains")}
            />
            <SearchBar
              placeholder="Pools"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-[16px]">
            {hasCollateral && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.collateral}
                dropdownOptionsFilters={FILTER_OPTIONS.collateralFilters}
                currentDropdownItem={filtersState.collateral}
                dropDownType="collateral"
                onDropdownItemChange={updateFilter("collateral")}
              />
            )}
            {hasDeposit && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.deposit}
                dropdownOptionsFilters={FILTER_OPTIONS.depositFilters}
                currentDropdownItem={filtersState.deposit}
                dropDownType="deposit"
                onDropdownItemChange={updateFilter("deposit")}
              />
            )}
            {hasAll && (
              <FilterDropdown
                dropdownOptions={FILTER_OPTIONS.all}
                dropdownOptionsFilters={FILTER_OPTIONS.allFilters}
                currentDropdownItem={filtersState.all}
                dropDownType="All"
                onDropdownItemChange={updateFilter("all")}
              />
            )}
            {showCustomizeDropdown && customizeOptions.length > 0 && (
              <FilterDropdown
                dropdownOptions={customizeOptions}
                dropdownOptionsFilters={customizeOptionsFilters}
                currentDropdownItem={filtersState.customize}
                dropDownType="customize"
                onDropdownItemChange={updateFilter("customize")}
              />
            )}
            {filters?.supplyApyTab && (
              <SupplyApy
                setSupplyApyFilter={setSupplyApyFilter}
                supplyApy={supplyApyFilter}
              />
            )}
          </div>
        </div>
      )}

      {hasData ? (
        <table className="w-full h-fit rounded-[12px] flex flex-col gap-[8px]">
          <thead>
            <tr className="w-full h-fit rounded-[12px] px-[20px] flex gap-[16px]">
              {visibleHeadings.map((item, idx) => {
                const isLast = visibleHeadings.length - 1 === idx;
                const isSorted = sortConfig.columnId === item.id;
                const isDesc = isSorted && sortConfig.direction === "desc";

                return (
                  <th
                    key={item.id}
                    className={`text-[14px] font-medium ${
                      props.tableHeadingTextColor || "text-[#999999]"
                    } min-w-[120px] h-fit flex ${
                      isLast ? "justify-end w-[120px]" : "justify-start w-full"
                    } gap-[4px] items-center`}
                  >
                    {item.icon && (
                      <button
                        type="button"
                        onClick={() => handleSort(item.id)}
                        className={`w-[20px] h-[20px] flex flex-col justify-center items-center cursor-pointer hover:opacity-70 transition-all ${
                          isDesc ? "rotate-180" : ""
                        }`}
                        aria-label={`Sort by ${item.label}`}
                      >
                        <svg
                          width="12"
                          height="13"
                          viewBox="0 0 12 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.86559 2.73278C6.98278 2.84983 7.14163 2.91557 7.30726 2.91557C7.47288 2.91557 7.63174 2.84983 7.74892 2.73278L8.34892 2.13278V10.6245C8.34892 10.7902 8.41477 10.9492 8.53198 11.0664C8.64919 11.1836 8.80816 11.2495 8.97392 11.2495C9.13968 11.2495 9.29866 11.1836 9.41587 11.0664C9.53308 10.9492 9.59892 10.7902 9.59892 10.6245V2.13278L10.1989 2.73278C10.2561 2.79419 10.3251 2.84344 10.4018 2.8776C10.4785 2.91176 10.5612 2.93013 10.6452 2.93161C10.7291 2.93309 10.8124 2.91765 10.8903 2.88622C10.9681 2.85478 11.0388 2.808 11.0981 2.74865C11.1575 2.6893 11.2043 2.61861 11.2357 2.54078C11.2671 2.46296 11.2826 2.3796 11.2811 2.29568C11.2796 2.21176 11.2612 2.129 11.2271 2.05234C11.1929 1.97567 11.1437 1.90667 11.0823 1.84945L9.41559 0.182783C9.2984 0.0657412 9.13955 0 8.97392 0C8.8083 0 8.64944 0.0657412 8.53226 0.182783L6.86559 1.84945C6.74855 1.96664 6.68281 2.12549 6.68281 2.29112C6.68281 2.45674 6.74855 2.6156 6.86559 2.73278ZM2.93226 10.7828L3.53226 10.1828C3.58948 10.1214 3.65848 10.0721 3.73514 10.038C3.81181 10.0038 3.89457 9.98544 3.97849 9.98396C4.06241 9.98248 4.14576 9.99791 4.22359 10.0293C4.30141 10.0608 4.37211 10.1076 4.43146 10.1669C4.4908 10.2263 4.53759 10.297 4.56903 10.3748C4.60046 10.4526 4.6159 10.536 4.61442 10.6199C4.61294 10.7038 4.59457 10.7866 4.56041 10.8632C4.52625 10.9399 4.477 11.0089 4.41559 11.0661L2.74892 12.7328C2.63174 12.8498 2.47288 12.9156 2.30726 12.9156C2.14163 12.9156 1.98278 12.8498 1.86559 12.7328L0.198923 11.0661C0.137518 11.0089 0.0882658 10.9399 0.0541058 10.8632C0.0199459 10.7866 0.00157792 10.7038 9.72687e-05 10.6199C-0.00138338 10.536 0.0140536 10.4526 0.0454878 10.3748C0.076922 10.297 0.123709 10.2263 0.183058 10.1669C0.242407 10.1076 0.313102 10.0608 0.390925 10.0293C0.468749 9.99791 0.552106 9.98248 0.636026 9.98396C0.719945 9.98544 0.802706 10.0038 0.879372 10.038C0.956038 10.0721 1.02504 10.1214 1.08226 10.1828L1.68226 10.7828V2.29112C1.68226 2.12536 1.7481 1.96639 1.86531 1.84917C1.98253 1.73196 2.1415 1.66612 2.30726 1.66612C2.47302 1.66612 2.63199 1.73196 2.7492 1.84917C2.86641 1.96639 2.93226 2.12536 2.93226 2.29112V10.7828Z"
                            fill={isSorted ? "#999999" : "#D4D4D4"}
                          />
                        </svg>
                      </button>
                    )}
                    {item.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="flex flex-col gap-[8px] w-full">
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
              />
            ))}
          </tbody>
        </table>
      ) : (
        <section className="w-full h-[402px] bg-[#F7F7F7] border-[1px] border-[#E2E2E2] rounded-[8px] flex flex-col items-center justify-center">
          <p className="text-[14px] font-medium text-[#76737B]">
            No data available
          </p>
        </section>
      )}

      {hasData && totalPages > 1 && (
        <div className="flex items-center justify-center gap-[16px] py-[16px]">
          <button
            type="button"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-[32px] h-[32px] rounded-[8px] text-[14px] font-medium transition-colors ${
              currentPage === 1
                ? "bg-[#F4F4F4] text-[#A3A3A3] cursor-not-allowed"
                : "bg-white border-[1px] border-[#E2E2E2] text-[#111111] cursor-pointer hover:bg-[#F7F7F7]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M7.5 9L4.5 6L7.5 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="text-[14px] font-medium text-[#111111]">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} of{" "}
            {sortedData.length}
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-[32px] h-[32px] rounded-[8px] text-[14px] font-medium transition-colors ${
              currentPage === totalPages
                ? "bg-[#F4F4F4] text-[#A3A3A3] cursor-not-allowed"
                : "bg-white border-[1px] border-[#E2E2E2] text-[#111111] cursor-pointer hover:bg-[#F7F7F7]"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4.5 9L7.5 6L4.5 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

Table.displayName = "Table";
