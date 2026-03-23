import { useTheme } from "@/contexts/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface SortOption {
  id: string;
  label: string;
  icon: string | null;
}

interface SortDropdownProps {
  selected: string;
  onSelect: (value: string) => void;
  options: SortOption[];
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const SortDropdown = ({
  selected,
  onSelect,
  options,
  isOpen,
  onToggle,
  search,
  onSearchChange,
}: SortDropdownProps) => {
  const { isDark } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const selectedSortOption = options.find((opt) => opt.id === selected);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => onToggle(!isOpen)}
        className={`cursor-pointer flex items-center gap-1 h-[47px] px-4 py-2 border rounded-lg text-[12px] leading-[18px] font-semibold ${isDark ? "bg-[#222222] border-[#333333] text-[#FFFFFF]" : "bg-white border-[#E2E2E2] text-[#111111]"}`}
      >
        {selectedSortOption && selectedSortOption.icon ? (
          <Image
            src={selectedSortOption.icon}
            alt={selectedSortOption.label}
            width={20}
            height={20}
            className={isDark ? "brightness-0 invert" : ""}
          />
        ) : (
          <span>Sort</span>
        )}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 mt-1 w-[299px] border shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] z-50 p-4 rounded-xl flex flex-col gap-[15px] ${isDark ? "bg-[#222222] border-[#333333]" : "bg-[#F4F4F4] border-[#E2E2E2]"}`}
          >
            {/* Search */}
            <div className={`flex items-center h-12 gap-2.5 px-2 py-3 rounded-lg border-b ${isDark ? "bg-[#111111] border-[#333333]" : "bg-[#FFFFFF] border-[#E2E2E2]"}`}>
              <Image
                src="/icons/search.svg"
                alt="search"
                width={24}
                height={24}
                className={isDark ? "brightness-0 invert" : ""}
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`flex-1 text-[14px] leading-[21px] font-medium outline-none placeholder:text-[#A7A7A7] ${isDark ? "bg-transparent text-[#FFFFFF]" : ""}`}
              />
            </div>
            {/* Options */}
            <div className="flex flex-col gap-[15px]">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelect(option.id);
                    onToggle(false);
                    onSearchChange("");
                  }}
                  className={`cursor-pointer w-full flex items-center justify-between text-[14px] leading-[21px] font-medium rounded-md ${isDark ? "hover:bg-[#333333]" : "hover:bg-[#F1EBFD]"} ${
                    selected === option.id
                      ? "text-[#703AE6]"
                      : isDark
                        ? "text-[#FFFFFF]"
                        : "text-[#111111]"
                  }`}
                >
                  <span>{option.label}</span>
                  {option.icon && (
                    <Image
                      src={option.icon}
                      alt=""
                      width={20}
                      height={20}
                      className={isDark ? "brightness-0 invert" : ""}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
