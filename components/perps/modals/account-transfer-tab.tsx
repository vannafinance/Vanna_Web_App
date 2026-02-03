"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { AccountType, TokenOption } from "@/lib/types";
import { TOKEN_OPTIONS } from "@/lib/constants/perps";

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
    // Form state
    const [amount, setAmount] = useState("");
    const [transferFrom, setTransferFrom] = useState<AccountType>("Portfolio Balance");
    const [transferTo, setTransferTo] = useState<AccountType>("Margin Balance");
    const [selectedToken, setSelectedToken] = useState<TokenOption>(TOKEN_OPTIONS[0]);

    // Dropdown states
    const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

    // Mock balance - replace with actual balance
    const balance = "1000";

    const isValid = !!amount && parseFloat(amount) > 0;

    // Notify parent when validity changes
    useEffect(() => {
      onValidChange(isValid);
    }, [isValid, onValidChange]);

    // Expose getData to parent via ref
    useImperativeHandle(ref, () => ({
      getData: () => ({
        transferFrom,
        transferTo,
        token: selectedToken.symbol,
        amount,
      }),
    }));

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
          {/* From */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] leading-[15px] font-medium text-[#6F6F6F]">
              From
            </span>
            <div className="rounded-lg border border-[#E2E2E2] bg-white px-4 py-3">
              <p className="text-[12px] leading-[18px] font-medium text-[#111111]">
                {transferFrom}
              </p>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwapTransfer}
            className="cursor-pointer p-2 mb-1 hover:bg-[#E2E2E2] rounded-lg transition-colors"
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
                stroke="#111111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* To */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] leading-[15px] font-medium text-[#6F6F6F]">
              To
            </span>
            <div className="rounded-lg border border-[#E2E2E2] bg-white px-4 py-3">
              <p className="text-[12px] leading-[18px] font-medium text-[#111111]">
                {transferTo}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input with Token Selector */}
        <div className="flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-4 py-3">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 text-[12px] leading-[18px] font-medium text-[#111111] placeholder:text-[#A7A7A7] outline-none bg-transparent"
          />
          {/* Token Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
              className="cursor-pointer flex items-center gap-1 pl-2"
            >
              <Image
                src={selectedToken.icon}
                width={20}
                height={20}
                alt={selectedToken.symbol}
                className="rounded-full"
              />
              <span className="text-[12px] leading-[18px] font-medium text-[#111111]">
                {selectedToken.symbol}
              </span>
              <motion.svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ rotate: isTokenDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="#111111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </button>
            <AnimatePresence>
              {isTokenDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 right-0 mt-2 bg-white rounded-lg shadow-lg border border-[#E2E2E2] overflow-hidden min-w-[100px]"
                >
                  {TOKEN_OPTIONS.map((token) => (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => {
                        setSelectedToken(token);
                        setIsTokenDropdownOpen(false);
                      }}
                      className={`cursor-pointer w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-[#F1EBFD] hover:text-[#703AE6] transition-colors ${
                        selectedToken.symbol === token.symbol
                          ? "bg-[#F1EBFD] text-[#703AE6]"
                          : "text-[#111111]"
                      }`}
                    >
                      <Image
                        src={token.icon}
                        width={16}
                        height={16}
                        alt={token.symbol}
                        className="rounded-full"
                      />
                      <span className="text-[12px] leading-[18px] font-medium">
                        {token.symbol}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Transferable amount */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
            Transferable amount
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
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
  }
);

TransferTab.displayName = "TransferTab";
