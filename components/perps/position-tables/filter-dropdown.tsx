import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface FilterDropdownProps {
  selected: string;
  onSelect: (value: string) => void;
  options: string[];
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const FilterDropdown = ({
  selected,
  onSelect,
  options,
  isOpen,
  onToggle,
  search,
  onSearchChange,
}: FilterDropdownProps) => {
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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => onToggle(!isOpen)}
        className="cursor-pointer flex items-center h-[47px] gap-1 px-4 py-2 bg-white border border-[#E2E2E2] rounded-lg text-[12px] leading-[18px] font-semibold text-[#111111]"
      >
        Filter: {selected}
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
            className="absolute top-full left-0 mt-1 w-60 bg-[#F4F4F4] rounded-xl z-50 p-4 shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] flex flex-col gap-[15px]"
          >
            {/* Search */}
            <div className="flex items-center h-12 gap-2.5 px-2 py-3 rounded-lg bg-[#FFFFFF] border-b border-[#E2E2E2]">
              <Image
                src="/icons/search.svg"
                alt="search"
                width={24}
                height={24}
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 text-[14px] leading-[21px] font-medium outline-none placeholder:text-[#A7A7A7]"
              />
            </div>
            {/* Options */}
            <div className="flex flex-col gap-[15px] max-h-[180px] overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSelect(option);
                    onToggle(false);
                    onSearchChange("");
                  }}
                  className="cursor-pointer w-full text-left px-3 text-[14px] leading-[21px] font-medium text-[#111111] hover:bg-[#F1EBFD] rounded-md"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
