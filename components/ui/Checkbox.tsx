"use client";

import React, { useRef, useState } from 'react'


// We are adding the label and error because we are going to use InputelementAttribute which has everything 
// Just we are definign the custom lebel and error to handle our own logic  


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

    const handleFocusForward = () => {
        inputRef.current?.focus();
    };

    const isDisabled = rest.disabled;

    return (
        <label
            className={`flex items-center gap-3 select-none ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
            onClick={handleFocusForward}
        >


            {/* //////////////////////
           interactive input
           ////////////////////// */
            }

            <input
                ref={inputRef}
                type="checkbox"
                {...rest}
                className="peer absolute opacity-0 h-6 w-6"
            />

            {/* //////////////////////
            This visual  checkbox 
            ////////////////////// */}

            <span
                className={`
          w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all
          [&>svg]:opacity-0 
          peer-checked:[&>svg]:opacity-100

          ${error ? "border-[#FC5457]" : "border-gray-300"}
          peer-hover:border-[#703AE6]

          peer-focus:border-[#F845FC]
          peer-focus:ring-4 peer-focus:ring-[#F845FC]/30

          peer-checked:border-[#703AE6]
          peer-checked:bg-[#703AE6]
          peer-checked:ring-4 peer-checked:ring-[#703AE6]/40

          ${className}
        `}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-4 text-white transition"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
            </span>





            {label && (
                <span className={`${error ? "text-[#FC5457]" : ""}`}>{label}</span>
            )}
        </label>
    );
};