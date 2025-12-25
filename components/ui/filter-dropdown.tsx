import { iconPaths } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SearchBar } from "./search-bar";
import { Checkbox } from "./checkbox";

interface FilterDropdownProps {
  dropDownType: "collateral" | "deposit" | "all-chains" ;
  onDropdownItemChange: (item: string[]) => void;
  currentDropdownItem: string[];
  dropdownOptions: string[];
  dropdownOptionsFilters: string[];
}

export const FilterDropdown = (props: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dropdownFilters, setDropdownFilters] = useState<string[]>([
    props.dropdownOptionsFilters[0],
  ]);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  useEffect(() => {
    let filtered = props.dropdownOptions;

    // First filter by dropdown filters (All, ETH, BTC, etc.)
    if (!dropdownFilters.includes("All")) {
      filtered = filtered.filter((item) => dropdownFilters.includes(item));
    }

    // Then filter by search value
    if (searchValue !== "") {
      filtered = filtered.filter((item) =>
        item.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    setFilteredOptions(filtered);
  }, [searchValue, dropdownFilters, props.dropdownOptions]);

  return (
    <div className="relative">
      {props.dropDownType === "all-chains" && (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className=" cursor-pointer  w-fit h-[48px] border border-[#E2E2E2] rounded-[8px] py-[12px] px-[16px] flex items-center gap-[4px] bg-white"
        >
          {Object.entries(iconPaths)
            .slice(0, 3)
            .map(([key, value], idx) => {
              return (
                <Image
                  className={`${idx !== 0 ? "-ml-4" : ""}`}
                  src={value}
                  alt={key}
                  width={20}
                  height={20}
                  key={key}
                />
              );
            })}

          <div className="text-[16px] font-semibold ">
            {props.currentDropdownItem?.length === 0
              ? "All Chains"
              : props.currentDropdownItem.length > 2
              ? `${props.currentDropdownItem.slice(0, 2).join(", ")} +${
                  props.currentDropdownItem.length - 2
                } more`
              : props.currentDropdownItem?.join(", ")}
          </div>
          <div className="w-[20] h-[20] flex flex-col items-center justify-center">
            <svg
              width="12"
              height="7"
              viewBox="0 0 12 7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.833008 0.833496L5.83301 5.8335L10.833 0.833496"
                stroke="black"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {(props.dropDownType === "collateral" ||
        props.dropDownType === "deposit") && (
        <div className="w-fit h-fit rounded-[8px] flex items-center gap-[4px] ">
          <div className="text-[12px] font-semibold text-[#5C5B5B] ">
            {props.dropDownType.charAt(0).toUpperCase() +
              props.dropDownType.slice(1)}
            :
          </div>
          {props.currentDropdownItem?.length === 0 && (
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="text-[12px] font-semibold text-black flex gap-[4px]"
            >
              <div className="w-[20] h-[20] flex flex-col items-center justify-center">
                <svg
                  width="17"
                  height="12"
                  viewBox="0 0 17 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 0.833333C0 0.373096 0.373096 0 0.833333 0H15.8333C16.2936 0 16.6667 0.373096 16.6667 0.833333C16.6667 1.29357 16.2936 1.66667 15.8333 1.66667H0.833333C0.373096 1.66667 0 1.29357 0 0.833333Z"
                    fill="#19191A"
                  />
                  <path
                    d="M2.08333 5.83333C2.08333 5.3731 2.45643 5 2.91667 5H13.75C14.2102 5 14.5833 5.3731 14.5833 5.83333C14.5833 6.29357 14.2102 6.66667 13.75 6.66667H2.91667C2.45643 6.66667 2.08333 6.29357 2.08333 5.83333Z"
                    fill="#19191A"
                  />
                  <path
                    d="M5.83333 10C5.3731 10 5 10.3731 5 10.8333C5 11.2936 5.3731 11.6667 5.83333 11.6667H10.8333C11.2936 11.6667 11.6667 11.2936 11.6667 10.8333C11.6667 10.3731 11.2936 10 10.8333 10H5.83333Z"
                    fill="#19191A"
                  />
                </svg>
              </div>
              All
            </div>
          )}
          {props.currentDropdownItem.length > 0 && (
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="w-fit h-fit rounded-[8px] border-[1px] border-[#E2E2E2] flex items-center justify-center py-[8px] px-[16px] gap-[4px] "
            >
              <div className="text-[14px] font-medium text-black ">
                {props.currentDropdownItem.length > 2
                  ? `${props.currentDropdownItem.slice(0, 2).join(", ")}, and ${
                      props.currentDropdownItem.length - 2
                    } more`
                  : props.currentDropdownItem?.join(", ")}
              </div>
              <div
                className="w-[16px] h-[16px] flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  props.onDropdownItemChange([]);
                }}
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.25 0.75L0.75 7.25M0.75 0.75L7.25 7.25"
                    stroke="#111111"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
      {isOpen && (
        <div className={`bg-[#F4F4F4] absolute  ${props.currentDropdownItem.length>0?"top-12":"top-6"}   w-[368px] h-fit rounded-[16px] p-[16px] flex flex-col gap-[15px] shadow-md ${
          props.dropDownType === "all-chains" ? "left-0 top-14" :  " right-0" 
        }`}>
          <SearchBar
            placeholder={props.dropDownType}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <div className="w-full h-full flex items-center px-[8px] justify-between">
            <div className="w-fit h-fit flex gap-[4px] ">
              {props.dropdownOptionsFilters.map((item, idx) => {
                return (
                  <div
                    onClick={() => {
                      const hasAll = dropdownFilters.includes("All");

                      if (item === "All") {
                        // If "All" is clicked
                        if (hasAll) {
                          // If "All" is already selected, do nothing
                          return;
                        } else {
                          // If "All" is not selected, set only "All" and remove all others
                          setDropdownFilters(["All"]);
                        }
                      } else {
                        // If any other item is clicked
                        if (hasAll) {
                          // If "All" is selected, remove it and add the clicked item
                          setDropdownFilters([item]);
                        } else {
                          // Normal toggle behavior
                          const newFilters = dropdownFilters.includes(item)
                            ? dropdownFilters.filter((i) => i !== item)
                            : [...dropdownFilters, item];
                          setDropdownFilters(newFilters);
                        }
                      }
                    }}
                    key={idx}
                    className={` ${
                      dropdownFilters.includes(item)
                        ? "text-[#703AE6] bg-[#F1EBFD]"
                        : "text-black hover:text-[#703AE6]"
                    }   w-fit h-fit rounded-[8px] py-[6px] px-[12px] text-[14px] font-semibold cursor-pointer `}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
            <div
              onClick={() => {
                setDropdownFilters(["All"]);
              }}
              className="cursor-pointer w-fit h-fit text-[14px] font-semibold underline rounded-[8px] "
            >
              Clear
            </div>
          </div>

          <div className="w-full h-full flex flex-col gap-[15px] ">
            {filteredOptions.map((item, idx) => {
              const isChecked = props.currentDropdownItem.includes(item);
              return (
                <div
                  key={idx}
                  className="w-full h-fit flex items-center gap-[4px] text-[14px] font-semibold"
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={() => {
                      const newItems = isChecked
                        ? props.currentDropdownItem.filter((i) => i !== item)
                        : [...props.currentDropdownItem, item];
                      props.onDropdownItemChange(newItems);
                    }}
                  />
                  {iconPaths[item] && (
                    <Image
                      src={iconPaths[item]}
                      alt={item}
                      width={20}
                      height={20}
                    />
                  )}
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
