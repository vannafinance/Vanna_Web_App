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
import { SUPPORTED_CHAIN_NAMES } from "@/lib/chains/chains";
import { useBalanceStore } from "@/store/balance-store";

export interface DepositTabRef {
  getData: () => {
    accountType: AccountType;
    chain: string;
    token: string;
    amount: string;
  };
}

interface DepositTabProps {
  onValidChange: (isValid: boolean) => void;
}

export const DepositTab = forwardRef<DepositTabRef, DepositTabProps>(
  ({ onValidChange }, ref) => {
    // Form state
    const [amount, setAmount] = useState("");
    const [accountType, setAccountType] =
      useState<AccountType>("Portfolio Balance");
    const [selectedChain, setSelectedChain] = useState(CHAIN_OPTIONS[0].name);
    const [selectedToken, setSelectedToken] = useState<TokenOption>(
      TOKEN_OPTIONS[0],
    );

    // Nexus unified balance (real cross-chain balance)
    const { initialized: nexusReady } = useNexus();
    const { total: unifiedBalance, breakdown } = useNexusBalanceBreakdown(
      selectedToken.symbol
    );

    // Current-chain wallet balance
    const currentChainBalance = useBalanceStore((s) => s.getBalance)(selectedToken.symbol, "WB");

    // Only need bridging if deposit amount exceeds current chain balance
    const depositAmount = parseFloat(amount) || 0;
    const needsBridging = nexusReady && depositAmount > currentChainBalance && currentChainBalance < unifiedBalance;

    // Use current-chain balance when sufficient, unified when needed
    const effectiveBalance = nexusReady && unifiedBalance > currentChainBalance
      ? unifiedBalance
      : currentChainBalance;
    const balance = nexusReady ? effectiveBalance.toFixed(4) : "--";

    const isValid = !!amount && parseFloat(amount) > 0;

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
      }),
    }));

    const handleTokenSelect = (value: string) => {
      const token = TOKEN_OPTIONS.find((t) => t.symbol === value);
      if (token) setSelectedToken(token);
    };

    const handleMaxClick = () => {
      if (nexusReady) {
        setAmount(effectiveBalance.toString());
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
          classname="!w-full !justify-between !rounded-lg border border-[#E2E2E2] bg-white px-4 py-3 text-[12px] leading-[18px] font-medium"
          dropdownClassname="text-[12px] leading-[18px]"
          menuClassname="top-full left-0 mt-1 w-full border border-[#E2E2E2] rounded-lg"
          arrowClassname="size-4"
        />

        {/* Chain Selector - Destination chain (Base, Arb, OP) */}
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

        {/* Balance Row with Max Value */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
            {nexusReady && unifiedBalance > currentChainBalance ? "Unified Balance" : "Balance"}
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

        {/* Per-chain balance breakdown — only show when bridging is relevant */}
        {nexusReady && breakdown.length > 1 && unifiedBalance > currentChainBalance && (
          <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
            <span className="text-[10px] leading-[15px] font-medium text-[#6F6F6F]">
              Balance across {breakdown.length} chain{breakdown.length > 1 ? "s" : ""}
            </span>
            {breakdown.map((b) => (
              <div
                key={b.chainId}
                className="flex items-center justify-between"
              >
                <span className="text-[11px] leading-[16px] font-medium text-[#333]">
                  {SUPPORTED_CHAIN_NAMES[b.chainId] || b.chainName}
                </span>
                <span className="text-[11px] leading-[16px] font-semibold text-[#111]">
                  {parseFloat(b.balance).toFixed(4)} {selectedToken.symbol}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Smart deposit info — only show when bridging will actually happen */}
        {needsBridging && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0EBFD] border border-[#D4C4F7]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="7" stroke="#703AE6" strokeWidth="1.5" />
              <path
                d="M8 5V8.5"
                stroke="#703AE6"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="11" r="0.75" fill="#703AE6" />
            </svg>
            <span className="text-[11px] leading-[16px] font-medium text-[#4A2A8A]">
              Smart deposit via Avail Nexus — will bridge from other chains
            </span>
          </div>
        )}
      </div>
    );
  },
);

DepositTab.displayName = "DepositTab";
