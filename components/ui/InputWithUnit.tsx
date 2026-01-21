import { RegisterOptions, UseFormRegister } from "react-hook-form";
import { BaseInput } from "./BaseInput";
import { Dropdown } from "./dropdown";
import { Register } from "viem";

export interface SuffixOption<T extends string> {
  label: string;
  value: T;
}

interface InputWithUnitProps<T extends string> {
  label?: string;
  placeholder: string;
  register: UseFormRegister<any>;
  name: string;
  disabled?: boolean;
  rules?: RegisterOptions;

  suffixMode?: "static" | "dropdown";
  suffixOptions?: SuffixOption<T>[];
  selectedSuffix?: T;
  onSuffixChange?: (val: T) => void;
}

export function InputWithUnit<T extends string>({
  label,
  placeholder,
  register,
  name,
  disabled,
  rules,

  suffixMode = "static",
  suffixOptions = [],
  selectedSuffix,
  onSuffixChange,
}: InputWithUnitProps<T>) {
  const selectedSuffixLabel =
    suffixOptions.find((o) => o.value === selectedSuffix)?.label ??
    suffixOptions[0]?.label ??
    "";

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

      {suffixMode === "static" && selectedSuffix && (
        <span className="text-[8px] leading-3 font-medium text-[#111111]">
          {selectedSuffix}
        </span>
      )}

      {suffixMode === "dropdown" && (
        <div className="ml-auto">
          <Dropdown
            items={suffixOptions.map((o) => o.label)}
            selectedOption={selectedSuffixLabel}
            setSelectedOption={(label) => {
              const option = suffixOptions.find((o) => o.label === label);
              if (option) onSuffixChange?.(option.value);
            }}
            classname="text-[12px] font-medium leading-[18px] gap-2"
            dropdownClassname="text-[12px] font-medium"
          />
        </div>
      )}
    </BaseInput>
  );
}
