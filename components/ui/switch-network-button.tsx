"use client";

import { useRequiredNetwork } from "@/lib/hooks/useRequiredNetwork";

export const SwitchNetworkButton = ({ size = "large" }: { size?: "large" | "small" }) => {
  const { switchToBase, isSwitching } = useRequiredNetwork();

  return (
    <button
      type="button"
      onClick={switchToBase}
      disabled={isSwitching}
      className={`w-full rounded-[12px] font-semibold text-white bg-gradient
        hover:opacity-90 active:scale-[0.98] transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${size === "large" ? "py-[14px] text-[15px]" : "py-[10px] text-[13px]"}
      `}
    >
      {isSwitching ? (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Switching to Base...
        </>
      ) : (
        "Switch to Base Network"
      )}
    </button>
  );
};
