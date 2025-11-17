'use client'

import React, { useState } from "react";

// Toggle Props
interface ToggleProps {
    onToggle: (state: boolean) => void;
    defaultChecked?: boolean;
    size?: "small" | "medium" | "large";
    disabled?: boolean;
}

// Circle size
const circleSize = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6",
};

// Wrapper size
const wrapperSize = {
    small: "w-10 h-5",
    medium: "w-12 h-7", // <-- FIXED width
    large: "w-16 h-8",
};


// Translate values corrected for alignment
const translateValues = {
    small: "translate-x-5",
    medium: "translate-x-6",
    large: "translate-x-9",
};


const ToggleButton = ({
    onToggle,
    defaultChecked = false,
    size = "medium",
    disabled = false,
}: ToggleProps) => {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    const handleToggle = () => {
        if (disabled) return;
        const newState = !isChecked;
        setIsChecked(newState);
        onToggle(newState);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={disabled}
            role="switch"
            aria-checked={isChecked}
            className={`
        ${wrapperSize[size]}
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
        ${disabled
                    ? "bg-[#D5D5D5] opacity-40 cursor-not-allowed"
                    : isChecked
                        ? "bg-[#703AE6]"
                        : "bg-[#D5D5D5] hover:bg-[#BFBFBF] cursor-pointer"}
        focus:outline-none focus:ring-2 focus:ring-[#F845FC] focus:ring-offset-2
      `}
        >
            <span
                className={`
    ${circleSize[size]}
    inline-block bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out
    ${isChecked ? translateValues[size] : "translate-x-1"}
  `}
            />

        </button>
    );
};

export default ToggleButton;
