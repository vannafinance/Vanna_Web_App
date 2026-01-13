import { useTheme } from "@/contexts/theme-context";

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
        ? "border-[#333333] bg-[#111111]"
        : "border-[#E2E2E2] bg-white"
    }`}>
      <div className="w-[24px] h-[24px] flex flex-col items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.7502 18.7502L14.4072 14.4072M14.4072 14.4072C15.1501 13.6643 15.7394 12.7824 16.1414 11.8118C16.5435 10.8411 16.7504 9.80081 16.7504 8.75021C16.7504 7.6996 16.5435 6.65929 16.1414 5.68866C15.7394 4.71803 15.1501 3.83609 14.4072 3.09321C13.6643 2.35032 12.7824 1.76103 11.8118 1.35898C10.8411 0.956931 9.80081 0.75 8.75021 0.75C7.6996 0.75 6.65929 0.956931 5.68866 1.35898C4.71803 1.76103 3.83609 2.35032 3.09321 3.09321C1.59288 4.59354 0.75 6.62842 0.75 8.75021C0.75 10.872 1.59288 12.9069 3.09321 14.4072C4.59354 15.9075 6.62842 16.7504 8.75021 16.7504C10.872 16.7504 12.9069 15.9075 14.4072 14.4072Z"
            stroke="#A7A7A7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
