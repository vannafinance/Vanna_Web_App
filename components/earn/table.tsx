import { useEffect, useState } from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { FilterDropdown } from "../ui/filter-dropdown";
import { SearchBar } from "../ui/search-bar";
import Image from "next/image";
import { iconPaths } from "@/lib/constants";

const collateralFilterOptions = ["ETH", "USDC", "USDT"];
const collateralFilterOptionsFilters = ["All", "ETH", "USDC", "USDT"];
const depositFilterOptions = ["WBT", "WETH", "WBTC"];
const depositFilterOptionsFilters = ["WBT", "WETH", "WBTC"];
const allChainsOptions = ["ETH", "USDC", "USDT"];
const allChainsOptionsFilters = ["All", "ETH", "USDC", "USDT"];

const ITEMS_PER_PAGE = 4;

interface TableProps {
  tableBodyBackground?: string;
  tableHeadingTextColor?: string;
  heading: {
    tabsItems?: {
      label: string;
      id: string;
    }[];
    heading?: string;
    tabType?: "solid" | "underline";
  };
  filters?: {
    filters: ["Deposit", "Collateral"];
    customizeDropdown?: boolean;
    supplyApyTab?: boolean;
    allChainDropdown?: boolean;
  };
  tableHeadings: {
    label: string;
    id: string;
    icon?: boolean;
  }[];
  tableBody: {
    rows: {
      cell: {
        chain?: string;
        icon?: string;
        title?: string;
        description?: string;
        tag: string | number;
        clickable?: string;
        onlyIcons?: string[];
      }[];
    }[];
  };
}

type FiltersState = {
  allChains: string[];
  collateral: string[];
  deposit: string[];
};

export const Table = (props: TableProps) => {
  const [activeTab, setActiveTab] = useState(
    props.heading.tabsItems?.[0]?.id || ""
  );
  const [searchValue, setSearchValue] = useState("");

  const [filtersState, setFiltersState] = useState<FiltersState>({
    allChains: [],
    collateral: [],
    deposit: [],
  });

  const [supplyApyTab, setSupplyApyTab] = useState<string>("supply-apy");
  const [filteredData, setFilteredData] = useState<typeof props.tableBody.rows>(props.tableBody.rows);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const updateFilter = (key: keyof FiltersState) => (value: string[]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  useEffect(() => {
    let filteredData = props.tableBody.rows;

    // Apply search filter
    if (searchValue) {
      filteredData = filteredData.filter((row) => {
        return row.cell.some((cell) => {
          return cell.title?.toLowerCase().includes(searchValue.toLowerCase());
        });
      });
    }

    // Apply all chains filter
    if (filtersState.allChains.length > 0 && !filtersState.allChains.includes("All")) {
      filteredData = filteredData.filter((row) => {
        const chain = row.cell[0]?.chain;
        return chain && filtersState.allChains.includes(chain);
      });
    }

    // Apply collateral filter
    if (filtersState.collateral.length > 0 && !filtersState.collateral.includes("All")) {
      filteredData = filteredData.filter((row) => {
        const lastCell = row.cell[row.cell.length - 1];
        const collateralIcons = lastCell?.onlyIcons || [];
        // Check if any of the selected collateral options match any of the collateral icons
        return filtersState.collateral.some((selectedCollateral) =>
          collateralIcons.includes(selectedCollateral)
        );
      });
    }

    // Apply deposit filter (if needed in future)
    // if (filtersState.deposit.length > 0) {
    //   filteredData = filteredData.filter((row) => {
    //     const poolTitle = row.cell[0]?.title;
    //     return poolTitle && filtersState.deposit.some((deposit) =>
    //       poolTitle.toUpperCase().includes(deposit.toUpperCase())
    //     );
    //   });
    // }

    setFilteredData(filteredData);
    setCurrentPage(1); // Reset to page 1 when filters/search change
  }, [searchValue, filtersState, props.tableBody.rows]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const showAllChainDropdown = props.filters?.allChainDropdown;

  const hasCollateral = props.filters?.filters.includes("Collateral");
  const hasDeposit = props.filters?.filters.includes("Deposit");

  const renderFiltersRow = () => {
    if (!props.filters) return null;

    return (
      <div className="flex items-center gap-[16px]">
        {hasCollateral && (
          <FilterDropdown
            dropdownOptions={collateralFilterOptions}
            dropdownOptionsFilters={collateralFilterOptionsFilters}
            currentDropdownItem={filtersState.collateral}
            dropDownType="collateral"
            onDropdownItemChange={updateFilter("collateral")}
          />
        )}

        {hasDeposit && (
          <FilterDropdown
            dropdownOptions={depositFilterOptions}
            dropdownOptionsFilters={depositFilterOptionsFilters}
            currentDropdownItem={filtersState.deposit}
            dropDownType="deposit"
            onDropdownItemChange={updateFilter("deposit")}
          />
        )}
      </div>
    );
  };

  const renderAllChainsBar = () => {
    if (!props.filters || !showAllChainDropdown) return null;

    return (
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-full">
            <FilterDropdown
              dropdownOptions={allChainsOptions}
              dropdownOptionsFilters={allChainsOptionsFilters}
              currentDropdownItem={filtersState.allChains}
              dropDownType="all-chains"
              onDropdownItemChange={updateFilter("allChains")}
            />
          </div>
          <div className="w-full ">
            <SearchBar
              placeholder="Pools"
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-[16px]">
          {renderFiltersRow()}

          {props.filters.supplyApyTab && (
            <div className="w-full">
              <AnimatedTabs
                tabs={[
                  { label: "Supply APY is", id: "supply-apy" },
                  { label: "Anything", id: "anything" },
                ]}
                activeTab={supplyApyTab}
                onTabChange={setSupplyApyTab}
                type="ghost"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-fit flex flex-col gap-[24px]">
      {props.heading.heading && (
        <div className="flex justify-between items-center">
          <div className="text-[16px] font-semibold text-[#434C53F2]">
            {props.heading.heading}
          </div>

          {!showAllChainDropdown && renderFiltersRow()}
        </div>
      )}

      {props.heading.tabsItems && (
        <div className="w-[180px] h-fit">
          <AnimatedTabs
            tabs={props.heading.tabsItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            type={props.heading.tabType}
            tabClassName="text-[12px]"
          />
        </div>
      )}

      {renderAllChainsBar()}

      <table className="w-full h-fit rounded-[12px] flex flex-col gap-[8px]">
        <thead>
          <tr className="min-[1120px] w-full h-fit rounded-[12px] px-[20px] flex gap-[16px]">
            {props.tableHeadings.map((item, idx) => {
              return (
                <th
                  key={item.id}
                  className={`text-[14px] font-medium  ${props.tableHeadingTextColor || "text-[#999999]"} min-w-[120px]  h-fit flex ${
                    props.tableHeadings.length - 1 === idx
                      ? "justify-end w-[120px]"
                      : "justify-start w-full"
                  } gap-[4px] `}
                >
                  {item.icon && (
                    <div className=" w-[20px] h-[20px] flex flex-col justify-center items-center">
                      <svg
                        width="12"
                        height="13"
                        viewBox="0 0 12 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.86559 2.73278C6.98278 2.84983 7.14163 2.91557 7.30726 2.91557C7.47288 2.91557 7.63174 2.84983 7.74892 2.73278L8.34892 2.13278V10.6245C8.34892 10.7902 8.41477 10.9492 8.53198 11.0664C8.64919 11.1836 8.80816 11.2495 8.97392 11.2495C9.13968 11.2495 9.29866 11.1836 9.41587 11.0664C9.53308 10.9492 9.59892 10.7902 9.59892 10.6245V2.13278L10.1989 2.73278C10.2561 2.79419 10.3251 2.84344 10.4018 2.8776C10.4785 2.91176 10.5612 2.93013 10.6452 2.93161C10.7291 2.93309 10.8124 2.91765 10.8903 2.88622C10.9681 2.85478 11.0388 2.808 11.0981 2.74865C11.1575 2.6893 11.2043 2.61861 11.2357 2.54078C11.2671 2.46296 11.2826 2.3796 11.2811 2.29568C11.2796 2.21176 11.2612 2.129 11.2271 2.05234C11.1929 1.97567 11.1437 1.90667 11.0823 1.84945L9.41559 0.182783C9.2984 0.0657412 9.13955 0 8.97392 0C8.8083 0 8.64944 0.0657412 8.53226 0.182783L6.86559 1.84945C6.74855 1.96664 6.68281 2.12549 6.68281 2.29112C6.68281 2.45674 6.74855 2.6156 6.86559 2.73278ZM2.93226 10.7828L3.53226 10.1828C3.58948 10.1214 3.65848 10.0721 3.73514 10.038C3.81181 10.0038 3.89457 9.98544 3.97849 9.98396C4.06241 9.98248 4.14576 9.99791 4.22359 10.0293C4.30141 10.0608 4.37211 10.1076 4.43146 10.1669C4.4908 10.2263 4.53759 10.297 4.56903 10.3748C4.60046 10.4526 4.6159 10.536 4.61442 10.6199C4.61294 10.7038 4.59457 10.7866 4.56041 10.8632C4.52625 10.9399 4.477 11.0089 4.41559 11.0661L2.74892 12.7328C2.63174 12.8498 2.47288 12.9156 2.30726 12.9156C2.14163 12.9156 1.98278 12.8498 1.86559 12.7328L0.198923 11.0661C0.137518 11.0089 0.0882658 10.9399 0.0541058 10.8632C0.0199459 10.7866 0.00157792 10.7038 9.72687e-05 10.6199C-0.00138338 10.536 0.0140536 10.4526 0.0454878 10.3748C0.076922 10.297 0.123709 10.2263 0.183058 10.1669C0.242407 10.1076 0.313102 10.0608 0.390925 10.0293C0.468749 9.99791 0.552106 9.98248 0.636026 9.98396C0.719945 9.98544 0.802706 10.0038 0.879372 10.038C0.956038 10.0721 1.02504 10.1214 1.08226 10.1828L1.68226 10.7828V2.29112C1.68226 2.12536 1.7481 1.96639 1.86531 1.84917C1.98253 1.73196 2.1415 1.66612 2.30726 1.66612C2.47302 1.66612 2.63199 1.73196 2.7492 1.84917C2.86641 1.96639 2.93226 2.12536 2.93226 2.29112V10.7828Z"
                          fill="#999999"
                        />
                      </svg>
                    </div>
                  )}
                  {item.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="flex flex-col gap-[8px] w-full">
          {paginatedData.map((row, idx) => {
            return (
              <tr
                key={idx}
                className={`w-full h-fit rounded-[12px] rounded-[1px] py-[16px] px-[20px] flex gap-[16px] items-center ${props.tableBodyBackground || "bg-[#F7F7F7]"} border-[1px] border-[#E2E2E2]`}
              >
                {row.cell.map((cell, cellIdx) => {
                  return (
                    <td
                      className={`flex flex-col gap-[6px] h-full ${
                        props.tableHeadings.length - 1 === cellIdx
                          ? "w-[120px] min-w-[120px] items-end"
                          : "w-full min-w-[120px] items-start"
                      }`}
                      key={cellIdx}
                    >
                      {cell.title && !cell.onlyIcons && (
                        <div className="w-fit h-fit flex gap-[8px] items-center text-[14px] font-medium text-[#181822] ">
                          {cell.chain && (
                            <div className="w-fit h-fit flex flex-col justify-center items-center">
                              <Image
                                src={iconPaths[cell.chain]}
                                alt={cell.chain}
                                width={10}
                                height={10}
                              />
                            </div>
                          )}
                          {(iconPaths[cell.title] || cell.icon) && (
                            <div className="w-fit h-fit flex flex-col justify-center items-center">
                              <Image
                                src={
                                  cell.icon ? cell.icon : iconPaths[cell.title]
                                }
                                alt={cell.title}
                                width={16}
                                height={16}
                              />
                            </div>
                          )}
                          {cell.title}{" "}
                          {cell.clickable && (
                            <div className="w-[20px] h-[20px] flex flex-col justify-center items-center">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9.29169 4.95838L0.625 4.95838M9.29169 4.95838L4.95829 0.625M9.29169 4.95838L4.95829 9.29162"
                                  stroke="#434C53"
                                  stroke-opacity="0.95"
                                  stroke-width="1.25"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                          {cell.description && (
                            <div className="w-fit h-fit flex flex-col gap-[4px]">
                              <div className="text-[14px] font-medium text-[#181822]">
                                {cell.title}
                              </div>
                              <div className="text-[10px] py-[3px] px-[6px] ">
                                {cell.description}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {cell.tag && !cell.onlyIcons && (
                        <div className="w-fit h-fit rounded-[6px] py-[2px] px-[6px] font-medium text-[12px] bg-[#703AE6] text-white">
                          {cell.tag}
                        </div>
                      )}

                      {cell.onlyIcons && (
                        <div className="w-fit h-fit flex justify-end items-center">
                          {cell.onlyIcons.map((icon, iconIdx) => {
                            return (
                              <Image
                                className={`${iconIdx > 0 ? "-ml-[10px]" : ""}`}
                                key={iconIdx}
                                src={iconPaths[icon]}
                                alt={icon}
                                width={20}
                                height={20}
                              />
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination controls */}
      {filteredData.length > 0 && totalPages > 1 && (
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
            aria-label="Previous page"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
            {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
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
            aria-label="Next page"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
};
