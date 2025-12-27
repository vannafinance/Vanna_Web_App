import { iconPaths } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { SearchBar } from "./search-bar";
import { Checkbox } from "./checkbox";

interface FilterDropdownProps {
  dropDownType: "collateral" | "deposit" | "all-chains" | "All" | "customize";
  onDropdownItemChange: (item: string[]) => void;
  currentDropdownItem: string[];
  dropdownOptions: string[];
  dropdownOptionsFilters: string[];
}

// Memoized dropdown option item to prevent unnecessary re-renders
const DropdownOption = memo(({ 
  item, 
  isChecked, 
  dropDownType, 
  onToggle 
}: { 
  item: string; 
  isChecked: boolean; 
  dropDownType: FilterDropdownProps["dropDownType"];
  onToggle: () => void;
}) => {
  const hasIcon = iconPaths[item];

  if (dropDownType === "customize") {
    return (
      <div className="w-full h-fit flex items-center gap-[4px] text-[14px] font-semibold">
        <div
          onClick={onToggle}
          className="w-[16px] h-[16px] flex flex-shrink-0 flex-col items-center justify-center cursor-pointer"
        >
          {isChecked ? (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path
                d="M6.66667 7.27273C7.42424 7.27273 8.06818 7.00758 8.59848 6.47727C9.12879 5.94697 9.39394 5.30303 9.39394 4.54545C9.39394 3.78788 9.12879 3.14394 8.59848 2.61364C8.06818 2.08333 7.42424 1.81818 6.66667 1.81818C5.90909 1.81818 5.26515 2.08333 4.73485 2.61364C4.20455 3.14394 3.93939 3.78788 3.93939 4.54545C3.93939 5.30303 4.20455 5.94697 4.73485 6.47727C5.26515 7.00758 5.90909 7.27273 6.66667 7.27273ZM6.66667 6.18182C6.21212 6.18182 5.82576 6.02273 5.50758 5.70455C5.18939 5.38636 5.0303 5 5.0303 4.54545C5.0303 4.09091 5.18939 3.70455 5.50758 3.38636C5.82576 3.06818 6.21212 2.90909 6.66667 2.90909C7.12121 2.90909 7.50758 3.06818 7.82576 3.38636C8.14394 3.70455 8.30303 4.09091 8.30303 4.54545C8.30303 5 8.14394 5.38636 7.82576 5.70455C7.50758 6.02273 7.12121 6.18182 6.66667 6.18182ZM6.66667 9.09091C5.19192 9.09091 3.84848 8.67929 2.63636 7.85606C1.42424 7.03283 0.545455 5.92929 0 4.54545C0.545455 3.16162 1.42424 2.05808 2.63636 1.23485C3.84848 0.411616 5.19192 0 6.66667 0C8.14141 0 9.48485 0.411616 10.697 1.23485C11.9091 2.05808 12.7879 3.16162 13.3333 4.54545C12.7879 5.92929 11.9091 7.03283 10.697 7.85606C9.48485 8.67929 8.14141 9.09091 6.66667 9.09091Z"
                fill="#111111"
                opacity="0.5"
              />
              <line x1="0" y1="0" x2="14" y2="10" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path
                d="M6.66667 7.27273C7.42424 7.27273 8.06818 7.00758 8.59848 6.47727C9.12879 5.94697 9.39394 5.30303 9.39394 4.54545C9.39394 3.78788 9.12879 3.14394 8.59848 2.61364C8.06818 2.08333 7.42424 1.81818 6.66667 1.81818C5.90909 1.81818 5.26515 2.08333 4.73485 2.61364C4.20455 3.14394 3.93939 3.78788 3.93939 4.54545C3.93939 5.30303 4.20455 5.94697 4.73485 6.47727C5.26515 7.00758 5.90909 7.27273 6.66667 7.27273ZM6.66667 6.18182C6.21212 6.18182 5.82576 6.02273 5.50758 5.70455C5.18939 5.38636 5.0303 5 5.0303 4.54545C5.0303 4.09091 5.18939 3.70455 5.50758 3.38636C5.82576 3.06818 6.21212 2.90909 6.66667 2.90909C7.12121 2.90909 7.50758 3.06818 7.82576 3.38636C8.14394 3.70455 8.30303 4.09091 8.30303 4.54545C8.30303 5 8.14394 5.38636 7.82576 5.70455C7.50758 6.02273 7.12121 6.18182 6.66667 6.18182ZM6.66667 9.09091C5.19192 9.09091 3.84848 8.67929 2.63636 7.85606C1.42424 7.03283 0.545455 5.92929 0 4.54545C0.545455 3.16162 1.42424 2.05808 2.63636 1.23485C3.84848 0.411616 5.19192 0 6.66667 0C8.14141 0 9.48485 0.411616 10.697 1.23485C11.9091 2.05808 12.7879 3.16162 13.3333 4.54545C12.7879 5.92929 11.9091 7.03283 10.697 7.85606C9.48485 8.67929 8.14141 9.09091 6.66667 9.09091Z"
                fill="#111111"
              />
            </svg>
          )}
        </div>
        {hasIcon && <Image src={iconPaths[item]} alt={item} width={20} height={20} />}
        {item}
      </div>
    );
  }

  return (
    <div className="w-full h-fit flex items-center gap-[4px] text-[14px] font-semibold">
      <Checkbox checked={isChecked} onChange={onToggle} />
      {hasIcon && <Image src={iconPaths[item]} alt={item} width={20} height={20} />}
      {item}
    </div>
  );
});

DropdownOption.displayName = "DropdownOption";

// Memoized filter chip component
const FilterChip = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`${
      isActive ? "text-[#703AE6] bg-[#F1EBFD]" : "text-black hover:text-[#703AE6]"
    } w-fit h-fit rounded-[8px] py-[6px] px-[12px] text-[14px] font-semibold cursor-pointer`}
  >
    {item}
  </div>
));

FilterChip.displayName = "FilterChip";

// Static chain icons - compute once
const CHAIN_ICONS = Object.entries(iconPaths).slice(0, 3);

export const FilterDropdown = memo((props: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [dropdownFilters, setDropdownFilters] = useState<string[]>([
    props.dropdownOptionsFilters[0],
  ]);

  // Memoized filtered options - only recalculate when dependencies change
  const filteredOptions = useMemo(() => {
    let filtered = props.dropdownOptions;

    // Filter by dropdown filters
    if (!dropdownFilters.includes("All")) {
      filtered = filtered.filter((item) => dropdownFilters.includes(item));
    }

    // Filter by search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter((item) => item.toLowerCase().includes(searchLower));
    }

    return filtered;
  }, [searchValue, dropdownFilters, props.dropdownOptions]);

  // Memoized display text
  const displayText = useMemo(() => {
    if (props.dropDownType === "all-chains") {
      if (props.currentDropdownItem?.length === 0) return "All Chains";
      if (props.currentDropdownItem.length > 2) {
        return `${props.currentDropdownItem.slice(0, 2).join(", ")} +${props.currentDropdownItem.length - 2} more`;
      }
      return props.currentDropdownItem?.join(", ");
    }
    
    if (props.currentDropdownItem.length > 2) {
      return `${props.currentDropdownItem.slice(0, 2).join(", ")}, and ${props.currentDropdownItem.length - 2} more`;
    }
    return props.currentDropdownItem?.join(", ");
  }, [props.currentDropdownItem, props.dropDownType]);

  // Optimized click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Memoized handlers
  const toggleDropdown = useCallback(() => setIsOpen((prev) => !prev), []);
  
  const handleClearFilters = useCallback(() => {
    setDropdownFilters(["All"]);
  }, []);

  const handleFilterChipClick = useCallback((item: string) => {
    const hasAll = dropdownFilters.includes("All");

    if (item === "All") {
      if (!hasAll) setDropdownFilters(["All"]);
    } else {
      if (hasAll) {
        setDropdownFilters([item]);
      } else {
        setDropdownFilters((prev) =>
          prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
        );
      }
    }
  }, [dropdownFilters]);

  const handleClearSelection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    props.onDropdownItemChange([]);
  }, [props]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  // Create toggle handlers for each option (memoized)
  const createToggleHandler = useCallback((item: string) => {
    return () => {
      const isChecked = props.currentDropdownItem.includes(item);
      const newItems = isChecked
        ? props.currentDropdownItem.filter((i) => i !== item)
        : [...props.currentDropdownItem, item];
      props.onDropdownItemChange(newItems);
    };
  }, [props]);

  const isSmallDropdown = props.dropDownType === "collateral" || 
                         props.dropDownType === "All" || 
                         props.dropDownType === "deposit";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Large Dropdown Types (all-chains, customize) */}
      {(props.dropDownType === "all-chains" || props.dropDownType === "customize") && (
        <div
          onClick={toggleDropdown}
          className="cursor-pointer h-[48px] border border-[#E2E2E2] rounded-[8px] py-[12px] px-[16px] flex items-center gap-[4px] bg-white max-w-full min-w-0"
        >
          {props.dropDownType === "all-chains" && (
            <>
              {CHAIN_ICONS.map(([key, value], idx) => (
                <Image
                  key={key}
                  className={`${idx !== 0 ? "-ml-4" : ""} flex-shrink-0`}
                  src={value}
                  alt={key}
                  width={20}
                  height={20}
                />
              ))}
              <div className="text-[16px] font-semibold whitespace-nowrap flex-shrink-0">
                {displayText}
              </div>
            </>
          )}

          {props.dropDownType === "customize" && (
            <>
              <div className="w-[16px] h-[16px] flex flex-shrink-0 flex-col items-center justify-center">
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path
                    d="M6.66667 7.27273C7.42424 7.27273 8.06818 7.00758 8.59848 6.47727C9.12879 5.94697 9.39394 5.30303 9.39394 4.54545C9.39394 3.78788 9.12879 3.14394 8.59848 2.61364C8.06818 2.08333 7.42424 1.81818 6.66667 1.81818C5.90909 1.81818 5.26515 2.08333 4.73485 2.61364C4.20455 3.14394 3.93939 3.78788 3.93939 4.54545C3.93939 5.30303 4.20455 5.94697 4.73485 6.47727C5.26515 7.00758 5.90909 7.27273 6.66667 7.27273ZM6.66667 6.18182C6.21212 6.18182 5.82576 6.02273 5.50758 5.70455C5.18939 5.38636 5.0303 5 5.0303 4.54545C5.0303 4.09091 5.18939 3.70455 5.50758 3.38636C5.82576 3.06818 6.21212 2.90909 6.66667 2.90909C7.12121 2.90909 7.50758 3.06818 7.82576 3.38636C8.14394 3.70455 8.30303 4.09091 8.30303 4.54545C8.30303 5 8.14394 5.38636 7.82576 5.70455C7.50758 6.02273 7.12121 6.18182 6.66667 6.18182ZM6.66667 9.09091C5.19192 9.09091 3.84848 8.67929 2.63636 7.85606C1.42424 7.03283 0.545455 5.92929 0 4.54545C0.545455 3.16162 1.42424 2.05808 2.63636 1.23485C3.84848 0.411616 5.19192 0 6.66667 0C8.14141 0 9.48485 0.411616 10.697 1.23485C11.9091 2.05808 12.7879 3.16162 13.3333 4.54545C12.7879 5.92929 11.9091 7.03283 10.697 7.85606C9.48485 8.67929 8.14141 9.09091 6.66667 9.09091Z"
                    fill="#111111"
                  />
                </svg>
              </div>
              <div className="text-[14px] font-semibold whitespace-nowrap flex-shrink-0">
                Customize
              </div>
            </>
          )}

          <div className="w-[20] h-[20] flex flex-shrink-0 flex-col items-center justify-center">
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
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

      {/* Small Dropdown Types (collateral, deposit, All) */}
      {isSmallDropdown && (
        <div className="w-fit h-fit rounded-[8px] flex items-center gap-[4px] min-w-0">
          <div className="text-[12px] font-semibold text-[#5C5B5B]">
            {props.dropDownType.charAt(0).toUpperCase() + props.dropDownType.slice(1)}:
          </div>
          {props.currentDropdownItem?.length === 0 ? (
            <div
              onClick={toggleDropdown}
              className="cursor-pointer text-[12px] font-semibold text-black flex gap-[4px]"
            >
              <div className="w-[20] h-[20] flex flex-col items-center justify-center">
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
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
              {props.dropDownType !== "All" && "All"}
            </div>
          ) : (
            <div
              onClick={toggleDropdown}
              className="h-fit rounded-[8px] border-[1px] border-[#E2E2E2] flex items-center justify-center py-[8px] px-[16px] gap-[4px] max-w-full"
            >
              <div className="text-[14px] font-medium text-black whitespace-nowrap flex-shrink-0">
                {displayText}
              </div>
              <div
                className="w-[16px] h-[16px] flex flex-shrink-0 flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                onClick={handleClearSelection}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`bg-[#F4F4F4] absolute ${
            props.currentDropdownItem.length > 0 ? "top-12" : "top-6"
          } w-[368px] h-fit rounded-[16px] p-[16px] flex flex-col gap-[15px] shadow-md ${
            props.dropDownType === "all-chains" ? "left-0 top-14" : "right-0"
          }`}
        >
          <SearchBar
            value={searchValue}
            placeholder={props.dropDownType}
            onChange={handleSearchChange}
          />
          
          <div className="w-full h-full flex items-center px-[8px] justify-between">
            <div className="w-fit h-fit flex gap-[4px]">
              {props.dropdownOptionsFilters.map((item) => (
                <FilterChip
                  key={item}
                  item={item}
                  isActive={dropdownFilters.includes(item)}
                  onClick={() => handleFilterChipClick(item)}
                />
              ))}
            </div>
            <div
              onClick={handleClearFilters}
              className="cursor-pointer w-fit h-fit text-[14px] font-semibold underline rounded-[8px]"
            >
              Clear
            </div>
          </div>

          <div className="w-full h-full flex flex-col gap-[15px]">
            {filteredOptions.map((item) => (
              <DropdownOption
                key={item}
                item={item}
                isChecked={props.currentDropdownItem.includes(item)}
                dropDownType={props.dropDownType}
                onToggle={createToggleHandler(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

FilterDropdown.displayName = "FilterDropdown";