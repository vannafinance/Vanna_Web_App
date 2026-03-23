import { BaseInput } from "./BaseInput";
import { useTheme } from "@/contexts/theme-context";

interface InputWithoutUnitProps {
  label: string;
  placeholder: string;
  register: any;
  name: string;
  disabled?: boolean;
  rules?: any;
}

export function InputWithoutUnit({
  label,
  placeholder,
  register,
  name,
  disabled,
  rules,
}: InputWithoutUnitProps) {
  const { isDark } = useTheme();

  return (
    <BaseInput label={label} disabled={disabled}>
      <input
        type="number"
        disabled={disabled}
        placeholder={placeholder}
        className={`
          w-full bg-transparent text-[12px] leading-[18px] font-medium
          outline-none disabled:text-[#9CA3AF]
          ${isDark ? "text-[#FFFFFF] placeholder:text-[#333333]" : "placeholder:text-[#C6C6C6]"}
        `}
        {...register(name, rules)}
      />
    </BaseInput>
  );
}
