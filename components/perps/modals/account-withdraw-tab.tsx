"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { AccountType, TokenOption } from "@/lib/types";
import {
  CHAIN_OPTIONS,
  TOKEN_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  BRIDGE_OPTIONS,
} from "@/lib/constants/perps";
import { useTheme } from "@/contexts/theme-context";

export interface WithdrawTabRef {
  getData: () => {
    accountType: AccountType;
    chain: string;
    token: string;
    amount: string;
    bridge: string | null;
  };
}

interface WithdrawTabProps {
  onValidChange: (isValid: boolean) => void;
}

export const WithdrawTab = forwardRef<WithdrawTabRef, WithdrawTabProps>(
  ({ onValidChange }, ref) => {
    const { isDark } = useTheme();
    const [amount, setAmount] = useState("");
    const [accountType, setAccountType] =
      useState<AccountType>("Portfolio Balance");
    const [selectedChain, setSelectedChain] = useState(CHAIN_OPTIONS[0].name);
    const [selectedToken, setSelectedToken] = useState<TokenOption>(
      TOKEN_OPTIONS[0],
    );
    const [selectedBridge, setSelectedBridge] = useState<string | null>(null);

    const balance = "1000";
    const isValid = !!amount && parseFloat(amount) > 0;

    const handleTokenSelect = (value: string) => {
      const token = TOKEN_OPTIONS.find((t) => t.symbol === value);
      if (token) setSelectedToken(token);
    };

    const handleBridgeSelect = (value: string) => {
      setSelectedBridge(value);
    };

    useEffect(() => {
      onValidChange(isValid);
    }, [isValid, onValidChange]);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        accountType,
        chain: selectedChain,
        token: selectedToken.symbol,
        amount,
        bridge: selectedBridge,
      }),
    }));

    const handleMaxClick = () => {
      setAmount(balance);
    };

    return (
      <div className="flex flex-col gap-4">
        <Dropdown
          items={ACCOUNT_TYPE_OPTIONS as unknown as string[]}
          selectedOption={accountType}
          setSelectedOption={
            setAccountType as React.Dispatch<React.SetStateAction<string>>
          }
          classname={`w-full! justify-between! rounded-lg! border px-4 py-3 text-[12px] leading-[18px] font-medium ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}
          dropdownClassname="text-[12px] leading-[18px]"
          menuClassname={`top-full left-0 mt-1 w-full border rounded-lg ${isDark ? "border-[#333333]" : "border-[#E2E2E2]"}`}
          arrowClassname="size-4"
        />

        <Dropdown
          items={CHAIN_OPTIONS.map((c) => c.name)}
          selectedOption={selectedChain}
          setSelectedOption={setSelectedChain}
          classname={`!w-full !justify-between !rounded-lg border px-4 py-3 text-[12px] leading-[18px] font-medium ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}
          dropdownClassname="text-[12px] leading-[18px] gap-2"
          menuClassname={`top-full left-0 mt-1 w-full border rounded-lg ${isDark ? "border-[#333333]" : "border-[#E2E2E2]"}`}
          arrowClassname="size-4"
        />

        <div className="flex flex-col gap-1">
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
        </div>

        <Dropdown
          items={BRIDGE_OPTIONS}
          selectedOption={selectedBridge || "Bridge Name"}
          setSelectedOption={
            handleBridgeSelect as React.Dispatch<React.SetStateAction<string>>
          }
          classname={`!w-full !justify-between !rounded-lg border px-4 py-3 text-[12px] leading-[18px] font-medium ${isDark ? "border-[#333333] bg-[#111111]" : "border-[#E2E2E2] bg-white"}`}
          dropdownClassname="text-[12px] leading-[18px]"
          menuClassname={`top-full left-0 mt-1 w-full border rounded-lg ${isDark ? "border-[#333333]" : "border-[#E2E2E2]"}`}
          arrowClassname="size-4"
        />

        <div className="flex items-center justify-between">
          <span className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
            Withdrawable amount
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

        <div className="flex items-center justify-between">
          <span className={`text-[12px] leading-[18px] font-medium ${isDark ? "text-[#A7A7A7]" : "text-[#6F6F6F]"}`}>
            Transaction fee/Bridge fee
          </span>
          <span className={`text-[12px] leading-[18px] font-semibold ${isDark ? "text-[#FFFFFF]" : "text-[#111111]"}`}>
            --
          </span>
        </div>
      </div>
    );
  },
);

WithdrawTab.displayName = "WithdrawTab";
