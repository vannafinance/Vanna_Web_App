"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { AccountType, ChainOption, TokenOption } from "@/lib/types";
import {
  CHAIN_OPTIONS,
  TOKEN_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  DEPOSIT_TIME_CHAINS,
} from "@/lib/constants/perps";

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
    const [selectedChain, setSelectedChain] = useState<ChainOption>(
      CHAIN_OPTIONS[0],
    );
    const [selectedToken, setSelectedToken] = useState<TokenOption>(
      TOKEN_OPTIONS[0],
    );

    // Dropdown states
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
    const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

    // Mock balance - replace with actual balance
    const balance = "1000";

    const depositTimeEstimate = DEPOSIT_TIME_CHAINS[selectedChain.name];
    const isValid = !!amount && parseFloat(amount) > 0;

    // Notify parent when validity changes
    useEffect(() => {
      onValidChange(isValid);
    }, [isValid, onValidChange]);

    // Expose getData to parent via ref
    useImperativeHandle(ref, () => ({
      getData: () => ({
        accountType,
        chain: selectedChain.name,
        token: selectedToken.symbol,
        amount,
      }),
    }));

    const handleMaxClick = () => {
      setAmount(balance);
    };

    return (
      <div className="flex flex-col gap-4">
        {/* Account Type Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="cursor-pointer w-full flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-4 py-3"
          >
            <span className="text-[12px] leading-[18px] font-medium text-[#111111]">
              {accountType}
            </span>
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isAccountDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="#111111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>
          <AnimatePresence>
            {isAccountDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-[#E2E2E2] overflow-hidden"
              >
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setAccountType(option);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`cursor-pointer w-full px-4 py-3 text-left text-[12px] leading-[18px] font-medium hover:bg-[#F1EBFD] hover:text-[#703AE6] transition-colors ${
                      accountType === option
                        ? "bg-[#F1EBFD] text-[#703AE6]"
                        : "text-[#111111]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chain Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
            className="cursor-pointer w-full flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Image
                src={selectedChain.icon}
                width={20}
                height={20}
                alt={selectedChain.name}
                className="rounded-full"
              />
              <span className="text-[12px] leading-[18px] font-medium text-[#111111]">
                {selectedChain.name}
              </span>
            </div>
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{ rotate: isChainDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="#111111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </button>
          <AnimatePresence>
            {isChainDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-[#E2E2E2] overflow-hidden max-h-48 overflow-y-auto"
              >
                {CHAIN_OPTIONS.map((chain) => (
                  <button
                    key={chain.name}
                    type="button"
                    onClick={() => {
                      setSelectedChain(chain);
                      setIsChainDropdownOpen(false);
                    }}
                    className={`cursor-pointer w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-[#F1EBFD] hover:text-[#703AE6] transition-colors ${
                      selectedChain.name === chain.name
                        ? "bg-[#F1EBFD] text-[#703AE6]"
                        : "text-[#111111]"
                    }`}
                  >
                    <Image
                      src={chain.icon}
                      width={20}
                      height={20}
                      alt={chain.name}
                      className="rounded-full"
                    />
                    <span className="text-[12px] leading-[18px] font-medium">
                      {chain.name}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
        </div>

        {/* Balance Row with Max Value */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
            Balance
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
              {balance} {selectedToken.symbol}
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

        {/* Estimated Deposit Time Info */}
        {depositTimeEstimate && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FFF8E6] border border-[#FFE4A0]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="7" stroke="#F5A623" strokeWidth="1.5" />
              <path
                d="M8 5V8.5"
                stroke="#F5A623"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="11" r="0.75" fill="#F5A623" />
            </svg>
            <span className="text-[11px] leading-[16px] font-medium text-[#8B6914]">
              Estimated deposit time for {selectedChain.name} is{" "}
              {depositTimeEstimate}
            </span>
          </div>
        )}
      </div>
    );
  },
);

DepositTab.displayName = "DepositTab";
