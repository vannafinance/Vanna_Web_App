import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import ToggleButton from "../../ui/toggle";

interface PreferenceItem {
  id: string;
  label: string;
  hasToggle: boolean;
}

interface PreferencesDropdownProps {
  preferences: Record<string, boolean>;
  onTogglePreference: (id: string, state: boolean) => void;
  isOpen: boolean;
  onToggleOpen: (isOpen: boolean) => void;
  items: readonly PreferenceItem[];
}

export const PreferencesDropdown = ({
  preferences,
  onTogglePreference,
  isOpen,
  onToggleOpen,
  items,
}: PreferencesDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggleOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggleOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="cursor-pointer"
        onClick={() => onToggleOpen(!isOpen)}
      >
        <Image
          src="/icons/filter-icon.svg"
          alt="filter"
          width={20}
          height={14}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-1 w-[267px] bg-[#F7F7F7] rounded-xl z-50 py-3 px-2 shadow-[0px_7px_15px_rgba(0,0,0,0.08),0px_28px_28px_rgba(0,0,0,0.07)] flex flex-col gap-[23px]"
          >
            {/* Header */}
            <h3 className="text-[12px] leading-[18px] font-semibold text-[#111111]">
              Preferences
            </h3>

            {/* Preference Items */}
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between "
                >
                  <span className="text-[12px]  leading-[18px]font-medium text-[#111111]">
                    {item.label}
                  </span>
                  {item.hasToggle ? (
                    <ToggleButton
                      size="small"
                      defaultChecked={preferences[item.id]}
                      onToggle={(state) => onTogglePreference(item.id, state)}
                    />
                  ) : (
                    <div className="w-10" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
