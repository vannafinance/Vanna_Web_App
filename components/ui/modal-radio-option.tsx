"use client";

import { Radio } from "./radio-button";
import { ReactNode } from "react";
import { useTheme } from "@/contexts/theme-context";

interface ModalRadioOptionProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  onClick?: () => void;
  children?: ReactNode;
}

export const ModalRadioOption = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  onClick,
  children,
}: ModalRadioOptionProps) => {
  const { isDark } = useTheme();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      onChange();
    }
  };

  return (
    <div className="flex gap-1 cursor-pointer" onClick={handleClick}>
      <div className="shrink-0 mt-0.5">
        <Radio
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className={`text-[14px] leading-[21px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
          {title}
        </span>
        {children ? (
          children
        ) : (
          <span className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#5C5B5B]"}`}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
