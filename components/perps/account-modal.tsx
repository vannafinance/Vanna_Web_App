"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "../ui/button";

type AccountTab = "deposit" | "withdraw" | "transfer";
type AccountType = "Portfolio Balance" | "Margin Balance";

interface ChainOption {
  name: string;
  icon: string;
}

interface TokenOption {
  symbol: string;
  icon: string;
}

const CHAIN_OPTIONS: ChainOption[] = [
  { name: "BNB Chain", icon: "/icons/bnb-icon.svg" },
  { name: "Arbitrum", icon: "/icons/arbitrum-icon.svg" },
  { name: "Ethereum", icon: "/icons/eth-icon.png" },
  { name: "Polygon", icon: "/icons/polygon-icon.png" },
  { name: "Base", icon: "/icons/base-icon.svg" },
  { name: "Optimism", icon: "/icons/optimism-icon.svg" },
];

const TOKEN_OPTIONS: TokenOption[] = [
  { symbol: "USDT", icon: "/icons/usdt-icon.svg" },
  { symbol: "USDC", icon: "/icons/usdc-icon.svg" },
  { symbol: "ETH", icon: "/icons/eth-icon.png" },
];

const ACCOUNT_TYPE_OPTIONS: AccountType[] = [
  "Portfolio Balance",
  "Margin Balance",
];

const BRIDGE_OPTIONS = ["Stargate", "LayerZero", "Wormhole", "Across"];

// Chains that show deposit time estimate
const DEPOSIT_TIME_CHAINS: Record<string, string> = {
  Arbitrum: "5~10 minutes",
  Ethereum: "10~15 minutes",
  Polygon: "5~10 minutes",
  "BNB Chain": "3~5 minutes",
  Base: "5~10 minutes",
  Optimism: "5~10 minutes",
};

interface AccountModalProps {
  onClose: () => void;
  defaultTab?: AccountTab;
}

export const AccountModal = ({
  onClose,
  defaultTab = "deposit",
}: AccountModalProps) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(defaultTab);
  const [accountType, setAccountType] =
    useState<AccountType>("Portfolio Balance");
  const [selectedChain, setSelectedChain] = useState<ChainOption>(
    CHAIN_OPTIONS[0],
  );
  const [selectedToken, setSelectedToken] = useState<TokenOption>(
    TOKEN_OPTIONS[0],
  );
  const [amount, setAmount] = useState<string>("");

  // Dropdown states
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [isBridgeDropdownOpen, setIsBridgeDropdownOpen] = useState(false);
  const [selectedBridge, setSelectedBridge] = useState<string | null>(null);

  // Transfer states
  const [transferFrom, setTransferFrom] = useState<AccountType>("Portfolio Balance");
  const [transferTo, setTransferTo] = useState<AccountType>("Margin Balance");

  // Mock balance - replace with actual balance
  const balance = "1000";

  const handleMaxClick = () => {
    setAmount(balance);
  };

  const handleSwapTransfer = () => {
    const temp = transferFrom;
    setTransferFrom(transferTo);
    setTransferTo(temp);
  };

  const handleSubmit = () => {
    // Handle deposit/withdraw/transfer action
    console.log({
      action: activeTab,
      accountType,
      chain: selectedChain.name,
      token: selectedToken.symbol,
      amount,
    });
    onClose();
  };

  const getButtonText = () => {
    switch (activeTab) {
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "transfer":
        return "Transfer";
    }
  };

  const depositTimeEstimate = DEPOSIT_TIME_CHAINS[selectedChain.name];

  return (
    <motion.div
      className="w-[400px] rounded-[20px] p-5 bg-[#F7F7F7] flex flex-col gap-4"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <h3 className="text-[16px] leading-6 font-semibold text-[#111111]">
        Account
      </h3>

      {/* Tabs + History Icon Row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg p-1 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("deposit")}
            className={`cursor-pointer px-4 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
              activeTab === "deposit"
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-transparent text-[#111111]"
            }`}
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("withdraw")}
            className={`cursor-pointer px-4 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
              activeTab === "withdraw"
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-transparent text-[#111111]"
            }`}
          >
            Withdraw
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transfer")}
            className={`cursor-pointer px-4 h-[39px] rounded-lg py-3 text-[12px] font-semibold transition-colors ${
              activeTab === "transfer"
                ? "bg-[#F1EBFD] text-[#703AE6]"
                : "bg-transparent text-[#111111]"
            }`}
          >
            Transfer
          </button>
        </div>

        {/* History Icon */}
        <button
          type="button"
          className="cursor-pointer p-2 hover:bg-[#E2E2E2] rounded-lg transition-colors"
          aria-label="Transaction History"
        >
          <Image
            src="/icons/transaction-history-icon.svg"
            width={24}
            height={24}
            alt="Transaction History"
          />
        </button>
      </div>

      {/* Account Type Dropdown - only for deposit/withdraw */}
      {activeTab !== "transfer" && (
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
      )}

      {/* Chain Selector Dropdown - only for deposit/withdraw */}
      {activeTab !== "transfer" && (
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
      )}

      {/* Amount Input with Token Selector - only for deposit/withdraw */}
      {activeTab !== "transfer" && (
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
      )}

      {/* Withdraw specific fields */}
      {activeTab === "withdraw" && (
        <>
          {/* Bridge Name Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBridgeDropdownOpen(!isBridgeDropdownOpen)}
              className="cursor-pointer w-full flex items-center justify-between rounded-lg border border-[#E2E2E2] bg-white px-4 py-3"
            >
              <span
                className={`text-[12px] leading-[18px] font-medium ${selectedBridge ? "text-[#111111]" : "text-[#A7A7A7]"}`}
              >
                {selectedBridge || "Bridge Name"}
              </span>
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ rotate: isBridgeDropdownOpen ? 180 : 0 }}
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
              {isBridgeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-[#E2E2E2] overflow-hidden"
                >
                  {BRIDGE_OPTIONS.map((bridge) => (
                    <button
                      key={bridge}
                      type="button"
                      onClick={() => {
                        setSelectedBridge(bridge);
                        setIsBridgeDropdownOpen(false);
                      }}
                      className={`cursor-pointer w-full px-4 py-3 text-left text-[12px] leading-[18px] font-medium hover:bg-[#F1EBFD] hover:text-[#703AE6] transition-colors ${
                        selectedBridge === bridge
                          ? "bg-[#F1EBFD] text-[#703AE6]"
                          : "text-[#111111]"
                      }`}
                    >
                      {bridge}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Withdrawable amount with Max Value */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
              Withdrawable amount
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

          {/* Transaction fee/Bridge fee */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] leading-[18px] font-medium text-[#6F6F6F]">
              Transaction fee/Bridge fee
            </span>
            <span className="text-[12px] leading-[18px] font-semibold text-[#111111]">
              --
            </span>
          </div>
        </>
      )}

      {/* Transfer specific fields */}
      {activeTab === "transfer" && (
        <>
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
        </>
      )}

      {/* Balance Row with Max Value - only for deposit */}
      {activeTab === "deposit" && (
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
      )}

      {/* Estimated Deposit Time Info (only for deposit tab) */}
      {activeTab === "deposit" && depositTimeEstimate && (
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

      {/* Action Button */}
      <Button
        text={getButtonText()}
        size="small"
        type="solid"
        disabled={!amount || parseFloat(amount) <= 0}
        onClick={handleSubmit}
      />

      {/* Close Link */}
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer text-center text-[12px] leading-[18px] font-semibold text-[#111111] hover:text-[#703AE6] transition-colors"
      >
        Close
      </button>
    </motion.div>
  );
};
