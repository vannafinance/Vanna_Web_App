import { BaseInput } from "./BaseInput";

interface InputWithUnitProps {
  label: string;
  unit: string;
  placeholder: string;
  register: any;
  name: string;
  disabled?: boolean;
  rules?: any;
}

export function InputWithUnit({
  label,
  unit,
  placeholder,
  register,
  name,
  disabled,
  rules,
}: InputWithUnitProps) {
  return (
    <BaseInput label={label} disabled={disabled}>
      <input
        type="number"
        disabled={disabled}
        placeholder={placeholder}
        className="
          flex-1 min-w-0 bg-transparent text-[12px] leading-[18px] font-medium
          outline-none placeholder:text-[#C6C6C6]
          disabled:text-[#9CA3AF]
        "
        {...register(name, rules)}
      />

      <span className="text-[8px] leading-3 font-medium text-[#111111]">
        {unit}
      </span>
    </BaseInput>
  );
}
