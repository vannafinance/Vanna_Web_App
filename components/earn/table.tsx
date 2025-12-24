import { useState } from "react";
import { AnimatedTabs } from "../ui/animated-tabs";
import { Dropdown } from "../ui/dropdown";
import { FilterDropdown } from "../ui/filter-dropdown";

const collateralFilterOptions = ["ETH", "USDC", "USDT"];
const collateralFilterOptionsFilters = ["All", "ETH", "USDC", "USDT"];
const depositFilterOptions = ["WBT", "WETH", "WBTC"];
const depositFilterOptionsFilters = ["WBT", "WETH", "WBTC"];
const allChainsOptions = ["ETH", "USDC", "USDT"];
const allChainsOptionsFilters = ["All", "ETH", "USDC", "USDT"];

interface TableProps {
  heading: {
    tabsItems?: {
      label: string;
      id: string;
    }[];
    heading?: string;
    tabType: "solid" | "underline";
  };
  filters?: {
    filters: ["Deposit", "Collateral"];
    customizeDropdown?: boolean;
    supplyApyTab?: boolean;
    allChainDropdown?: boolean;
  };
}

export const Table = (props: TableProps) => {
  const [activeTab, setActiveTab] = useState(
    props.heading.tabsItems?.[0]?.id || ""
  );

  const [filterAllChains, setFilterAllChains] = useState<string[]>([]);
  const [filterCollaterals, setFilterCollaterals] = useState<string[]>([]);
  const [filterDeposits, setFilterDeposits] = useState<string[]>([]);

  return (
    <div className="w-full h-fit flex flex-col gap-[24px]">
      {props.heading.heading && (
        <div className="text-[16px] font-semibold text-[#434C53F2] ">
          {props.heading.heading}
        </div>
      )}
      {props.heading.tabsItems && (
        <div className="w-[180px] h-[fit]">
          <AnimatedTabs
            tabs={props.heading.tabsItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            type={props.heading.tabType}
            tabClassName="text-[12px] "
          />
        </div>
      )}

      {props.filters && (
        <div className="flex justify-between items-center ">
          {props.filters.allChainDropdown && (
            <div>
              <FilterDropdown
                dropdownOptions={allChainsOptions}
                dropdownOptionsFilters={allChainsOptionsFilters}
                currentDropdownItem={filterAllChains}
                dropDownType={"all-chains"}
                onDropdownItemChange={(item) => setFilterAllChains(item)}
              />
            </div>
          )}
          <div className="flex items-center gap-[16px]">
            {props.filters.filters.includes("Collateral") && (
              <div>
                <FilterDropdown
                  dropdownOptions={collateralFilterOptions}
                  dropdownOptionsFilters={collateralFilterOptionsFilters}
                  currentDropdownItem={filterCollaterals}
                  dropDownType={"collateral"}
                  onDropdownItemChange={(item) => setFilterCollaterals(item)}
                />
              </div>
            )}
            {props.filters.filters.includes("Deposit") && (
              <div>
                <FilterDropdown
                  dropdownOptions={depositFilterOptions}
                  dropdownOptionsFilters={depositFilterOptionsFilters}
                  currentDropdownItem={filterDeposits}
                  dropDownType={"deposit"}
                  onDropdownItemChange={(item) => setFilterDeposits(item)}
                />
              </div>
            )}
            {props.filters.supplyApyTab && (
              <div className="w-full">
                <AnimatedTabs
                  tabs={[
                    { label: "Supply APY is", id: "supply-apy" },
                    { label: "Anything", id: "anything" },
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  type="ghost"
                />
              </div>
            )}

            
          </div>
        </div>
      )}
    </div>
  );
};
