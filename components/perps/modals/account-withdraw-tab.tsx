"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { AccountType, TokenOption } from "@/lib/types";
import {
  CHAIN_OPTIONS,
  TOKEN_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from "@/lib/constants/perps";
import { useNexus, useNexusBalanceBreakdown } from "@/lib/nexus";

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
    // Form state
    const [amount, setAmount] = useState("");
    const [accountType, setAccountType] =
      useState<AccountType>("Portfolio Balance");
    const [selectedChain, setSelectedChain] = useState(CHAIN_OPTIONS[0].name);
    const [selectedToken, setSelectedToken] = useState<TokenOption>(
      TOKEN_OPTIONS[0],
    );
    // Nexus unified balance
    const { initialized: nexusReady } = useNexus();
    const { total: unifiedBalance } = useNexusBalanceBreakdown(
      selectedToken.symbol
    );

    const balance = nexusReady ? unifiedBalance.toFixed(4) : "--";
    const isValid = !!amount && parseFloat(amount) > 0;

    const handleTokenSelect = (value: string) => {
      const token = TOKEN_OPTIONS.find((t) => t.symbol === value);
      if (token) setSelectedToken(token);
    };

    // Notify parent when validity changes
    useEffect(() => {
      onValidChange(isValid);
    }, [isValid, onValidChange]);

    // Expose getData to parent via ref
    useImperativeHandle(ref, () => ({
      getData: () => ({
        accountType,
        chain: selectedChain,
        token: selectedToken.symbol,
        amount,
        bridge: "Avail Nexus",
      }),
    }));

    const handleMaxClick = () => {
      if (nexusReady) {
        setAmount(unifiedBalance.toString());
      }
    };

    return (
      <div className="flex flex-col gap-4">
        {/* Account Type Dropdown */}
        <Dropdown
          items={ACCOUNT_TYPE_OPTIONS as unknown as string[]}
          selectedOption={accountType}
          setSelectedOption={
            setAccountType as React.Dispatch<React.SetStateAction<string>>
          }
          classname="w-full! justify-between! rounded-lg! border border-[#E2E2E2] bg-white px-4 py-3 text-[12px] leading-[18px] font-medium"
          dropdownClassname="text-[12px] leading-[18px]"
          menuClassname="top-full left-0 mt-1 w-full border border-[#E2E2E2] rounded-lg"
          arrowClassname="size-4"
        />

        {/* Chain Selector Dropdown */}
        <Dropdown
          items={CHAIN_OPTIONS.map((c) => c.name)}
          selectedOption={selectedChain}
          setSelectedOption={setSelectedChain}
          classname="!w-full !justify-between !rounded-lg border border-[#E2E2E2] bg-white px-4 py-3 text-[12px] leading-[18px] font-medium"
          dropdownClassname="text-[12px] leading-[18px] gap-2"
          menuClassname="top-full left-0 mt-1 w-full border border-[#E2E2E2] rounded-lg"
          arrowClassname="size-4"
        />

        {/* Amount Input with Token Selector */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-4 py-3">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 text-[12px] leading-[18px] font-medium text-[#111111] placeholder:text-[#A7A7A7] outline-none bg-transparent"
            />
            {/* Token Selector */}
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
                menuClassname="right-0 mt-2 min-w-[100px] border border-[#E2E2E2] rounded-lg"
                arrowClassname="size-4"
              />
            </div>
          </div>
        </div>

        {/* Bridge provider badge */}
        <div className="flex items-center justify-between rounded-lg border border-[#D4C4F7] bg-[#F0EBFD] px-4 py-3">
          <span className="text-[12px] leading-[18px] font-medium text-[#4A2A8A]">
            Bridge via
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#703AE6]">
            Avail Nexus
          </span>
        </div>

        {/* Withdrawable amount with Max Value */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
            Withdrawable amount
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
              {balance} {selectedToken.symbol}
            </span>
            <button
              type="button"
              onClick={handleMaxClick}
              disabled={!nexusReady}
              className="cursor-pointer bg-[#FFE6F2] rounded-sm px-2 py-1 text-[10px] leading-[15px] font-semibold text-[#FF007A] hover:bg-[#FFD6E8] transition-colors disabled:opacity-50"
            >
              Max Value
            </button>
          </div>
        </div>

        {/* Bridge fee */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
            Bridge fee (est.)
          </span>
          <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
            Auto-optimized
          </span>
        </div>
      </div>
    );
  },
);

WithdrawTab.displayName = "WithdrawTab";
