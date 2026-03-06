import { useTheme } from "@/contexts/theme-context";
import { SearchIcon } from "@/components/icons";

export const SearchBar = ({
  placeholder,
  onChange,
  value,
}: {
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
}) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`border-[1px] w-full h-[48px] flex items-center gap-[9px] pr-[24px] py-[8px] pl-[16px] rounded-[8px] ${
      isDark
        ? "bg-[#111111]"
        : "bg-white"
    }`}>
      <div className="w-[24px] h-[24px] flex flex-col items-center justify-center">
        <SearchIcon />
      </div>
      <div className="w-full h-full">
        <input
          onChange={onChange}
          type="text"
          value={value}
          placeholder={`Search for ${placeholder}`}
          className={`placeholder:text-[#A7A7A7] w-full h-full outline-none text-[14px] font-medium ${
            isDark ? "text-white bg-[#111111]" : "text-black"
          }`}
        />
      </div>
    </div>
  );
};
