"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { AccountType, TokenOption } from "@/lib/types";
import { TOKEN_OPTIONS } from "@/lib/constants/perps";
import { useTheme } from "@/contexts/theme-context";

export interface TransferTabRef {
  getData: () => {
    transferFrom: AccountType;
    transferTo: AccountType;
    token: string;
    amount: string;
  };
}

interface TransferTabProps {
  onValidChange: (isValid: boolean) => void;
}

export const TransferTab = forwardRef<TransferTabRef, TransferTabProps>(
  ({ onValidChange }, ref) => {
    const { isDark } = useTheme();
    const [amount, setAmount] = useState("");
    const [transferFrom, setTransferFrom] =
      useState<AccountType>("Portfolio Balance");
    const [transferTo, setTransferTo] = useState<AccountType>("Margin Balance");
    const [selectedToken, setSelectedToken] = useState<TokenOption>(
      TOKEN_OPTIONS[0],
    );

    const balance = "1000";
    const isValid = !!amount && parseFloat(amount) > 0;

    useEffect(() => {
      onValidChange(isValid);
    }, [isValid, onValidChange]);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        transferFrom,
        transferTo,
        token: selectedToken.symbol,
        amount,
      }),
    }));

    const handleTokenSelect = (value: string) => {
      const token = TOKEN_OPTIONS.find((t) => t.symbol === value);
      if (token) setSelectedToken(token);
    };

    const handleMaxClick = () => {
      setAmount(balance);
    };

    const handleSwapTransfer = () => {
      const temp = transferFrom;
      setTransferFrom(transferTo);
      setTransferTo(temp);
    };

    return (
      <div className="flex flex-col gap-4">
        {/* From/To Selector */}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <span className={`text-[10px] leading-[15px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
              From
            </span>
            <div className={`rounded-lg border px-4 py-3 ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}>
              <p className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
                {transferFrom}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwapTransfer}
            className={`cursor-pointer p-2 mb-1 rounded-lg transition-colors ${isDark ? "hover:bg-[#333333]" : "hover:bg-[#E2E2E2]"}`}
            aria-label="Swap from and to"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.5 3.33334L4.16667 6.66668M4.16667 6.66668L7.5 10M4.16667 6.66668H15.8333M12.5 16.6667L15.8333 13.3333M15.8333 13.3333L12.5 10M15.8333 13.3333H4.16667"
                stroke={isDark ? "#FFFFFF" : "#111111"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <span className={`text-[10px] leading-[15px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
              To
            </span>
            <div className={`rounded-lg border px-4 py-3 ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}>
              <p className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
                {transferTo}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input with Token Selector */}
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className={`flex-1 text-[12px] leading-[18px] font-medium placeholder:text-[#A7A7A7] outline-none bg-transparent ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}
          />
          <div className="w-fit flex items-center">
            <Dropdown
              items={TOKEN_OPTIONS.map((t) => t.symbol)}
              selectedOption={selectedToken.symbol}
              setSelectedOption={
                handleTokenSelect as React.Dispatch<
                  React.SetStateAction<string>
                >
              }
              classname="gap-1 pl-2 text-[12px] leading-[18px] font-medium"
              dropdownClassname="text-[12px] leading-[18px] gap-2"
              menuClassname={`right-0 mt-2 min-w-[100px] border rounded-lg ${isDark ? "border-[#333333]" : "border-[#E2E2E2]"}`}
              arrowClassname="size-4"
            />
          </div>
        </div>

        {/* Transferable amount */}
        <div className="flex items-center justify-between">
          <span className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
            Transferable amount
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[12px] leading-[18px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
              --
            </span>
            <button
              type="button"
              onClick={handleMaxClick}
              className="cursor-pointer bg-[#FFE6F2] rounded-sm px-2 py-1 text-[10px] leading-[15px] font-semibold text-[#FF007A] hover:bg-[#FFD6E8] transition-colors"
            >
              Max Value
            </button>
          </div>
        </div>
      </div>
    );
  },
);

TransferTab.displayName = "TransferTab";
