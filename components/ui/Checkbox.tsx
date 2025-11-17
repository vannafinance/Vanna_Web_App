"use client";

import React, { useRef } from "react";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  className?: string;
}

export const Checkbox = ({
  label,
  error = false,
  className = "",
  ...rest
}: CheckboxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = rest.disabled;

  const handleFocusForward = () => {
    inputRef.current?.focus();
  };

  return (
    <label
      onClick={handleFocusForward}
      className={`flex items-center gap-3 select-none
        ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
    >
      <input
        ref={inputRef}
        type="checkbox"
        {...rest}
        className="peer sr-only"
      />

      <span
        className={`
          w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all
          ${error ? "border-[#FC5457]" : "border-gray-300"}

          peer-hover:border-[#703AE6]
          peer-focus:border-[#F845FC]
          peer-focus:ring-4 peer-focus:ring-[#F845FC]/30

          peer-checked:border-[#703AE6]
          peer-checked:bg-[#703AE6]
          peer-checked:[&>svg]:opacity-100

          ${className}
        `}
      >
        <svg
          className="w-4 h-4 text-white opacity-0 transition"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>

      {label && (
        <span className={`${error ? "text-[#FC5457]" : ""}`}>
          {label}
        </span>
      )}
    </label>
  );
};
