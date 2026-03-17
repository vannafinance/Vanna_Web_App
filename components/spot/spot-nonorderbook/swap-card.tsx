"use client";

import { useTheme } from "@/contexts/theme-context";
import { useState, useCallback, useRef } from "react";
import { useUserStore } from "@/store/user";
import { SwapInput } from "./swap-input";
import { SwapDirectionButton } from "./swap-direction-button";
import { SwapDetails } from "./swap-details";
import { SwapButton } from "./swap-button";
import { TokenSearchModal } from "./token-search-modal";
import { SwapSettings } from "./swap-settings";
import { Token, SwapButtonState, DexOption } from "@/lib/types";
import { TOKENS, POPULAR_TOKENS, BALANCES, DEXES } from "@/lib/constants/spot";
import { AnimatePresence, motion } from "framer-motion";

function deriveSwapButtonState(
  isWalletConnected: boolean,
  tokenIn: Token | null,
  tokenOut: Token | null,
  amountIn: string,
  isQuoteLoading: boolean,
  amountOut: string,
  tokenInBalance: string | null,
): SwapButtonState {
  if (!isWalletConnected) return "connect_wallet";
  if (!tokenIn || !tokenOut) return "select_token";
  if (!amountIn || amountIn === "0") return "enter_amount";
  if (isQuoteLoading) return "loading_quote";
  if (
    tokenInBalance !== null &&
    parseFloat(amountIn) > parseFloat(tokenInBalance.replace(/,/g, ""))
  )
    return "insufficient_balance";
  if (!amountOut) return "disabled";
  return "ready";
}

interface SwapCardProps {
  baseSymbol?: string;
  selectedDex?: string;
  dexes?: DexOption[];
  onDexChange?: (dexId: string) => void;
  onSwitchToOrderbook?: () => void;
}

export const SwapCard = ({
  baseSymbol,
  selectedDex,
  dexes = DEXES,
  onDexChange,
  onSwitchToOrderbook,
}: SwapCardProps) => {
  const { isDark } = useTheme();
  const [isDexDropdownOpen, setIsDexDropdownOpen] = useState(false);
  const dexDropdownRef = useRef<HTMLDivElement>(null);

  const activeDex = dexes.find((d) => d.id === selectedDex) || dexes[0];

  // Find token matching the URL pair, fallback to first token
  const initialToken = baseSymbol
    ? TOKENS.find((t) => t.symbol.toLowerCase() === baseSymbol.toLowerCase()) ||
      TOKENS[0]
    : TOKENS[0];

  // Token state
  const [tokenIn, setTokenIn] = useState<Token | null>(initialToken);
  const [tokenOut, setTokenOut] = useState<Token | null>(TOKENS[1]); // USDC

  // Amount state
  const [amountIn, setAmountIn] = useState("1.0");
  const [amountOut, setAmountOut] = useState("2,312.45");
  const [amountInUsd] = useState<string | null>("2,312.45");
  const [amountOutUsd] = useState<string | null>("2,312.45");

  // Quote state (mocked)
  const [isQuoteLoading] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Preset percentage state
  const [activePercent, setActivePercent] = useState<number | null>(null);

  // Settings state
  const [slippage, setSlippage] = useState("0.5");
  const [slippageMode, setSlippageMode] = useState<"auto" | "custom">("auto");
  const [deadline, setDeadline] = useState(20);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal state
  const [tokenModalTarget, setTokenModalTarget] = useState<"in" | "out" | null>(
    null,
  );

  // Wallet state from global store
  const userAddress = useUserStore((s) => s.address);
  const isWalletConnected = Boolean(userAddress);

  // Only show balances when connected
  const tokenInBalance =
    isWalletConnected && tokenIn ? BALANCES[tokenIn.id] || null : null;
  const tokenOutBalance =
    isWalletConnected && tokenOut ? BALANCES[tokenOut.id] || null : null;

  const buttonState = deriveSwapButtonState(
    isWalletConnected,
    tokenIn,
    tokenOut,
    amountIn,
    isQuoteLoading,
    amountOut,
    tokenInBalance,
  );

  // Handlers
  const handleFlip = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut.replace(/,/g, ""));
    setAmountOut(amountIn);
  }, [tokenIn, tokenOut, amountIn, amountOut]);

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (tokenModalTarget === "in") {
        if (token.id === tokenOut?.id) {
          setTokenOut(tokenIn);
        }
        setTokenIn(token);
      } else {
        if (token.id === tokenIn?.id) {
          setTokenIn(tokenOut);
        }
        setTokenOut(token);
      }
      setTokenModalTarget(null);
    },
    [tokenModalTarget, tokenIn, tokenOut],
  );

  const handlePercentClick = useCallback(
    (percent: number) => {
      if (tokenInBalance) {
        const balance = parseFloat(tokenInBalance.replace(/,/g, ""));
        const value = (balance * percent) / 100;
        setAmountIn(
          percent === 100
            ? balance.toString()
            : value.toFixed(2).replace(/\.?0+$/, ""),
        );
        setActivePercent(percent);
      }
    },
    [tokenInBalance],
  );

  // Connect wallet via global store (same as navbar login)
  const setUser = useUserStore((s) => s.set);
  const handleConnectWallet = useCallback(() => {
    if (isWalletConnected) return;
    setUser({ address: "0x1234567890123456789012345678901234567890" });
  }, [isWalletConnected, setUser]);

  // Button click handler — route based on state
  const handleButtonClick = useCallback(() => {
    if (buttonState === "connect_wallet") {
      handleConnectWallet();
      return;
    }
    // Other states (approve, swap) will be handled when blockchain integration is added
  }, [buttonState, handleConnectWallet]);

  const hasQuote = Boolean(
    isWalletConnected &&
    amountIn &&
    amountOut &&
    tokenIn &&
    tokenOut &&
    !isQuoteLoading,
  );

  return (
    <>
      <div
        className={`w-full max-w-[480px] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col transition-colors ${
          isDark
            ? "bg-[#1A1A1A] border border-[#2A2A2A]"
            : "bg-white border border-[#E8E8E8]"
        }`}
        style={{
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Card body */}
        <div className="p-3 sm:p-4 flex flex-col gap-1">
          {/* Swap heading + Protocol dropdown + Settings */}
          <div className="flex items-center justify-between px-0.5 pb-2">
            {/* Swap + Protocol dropdown */}
            {dexes.length > 1 ? (
              <div className="relative flex items-center" ref={dexDropdownRef}>
                <span
                  className={`text-[14px] sm:text-[16px] font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}
                >
                  Swap
                </span>
                <button
                  type="button"
                  onClick={() => setIsDexDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg text-[12px] sm:text-[14px] font-medium leading-[18px] cursor-pointer transition-colors ${
                    isDark
                      ? "text-[#777777] hover:text-[#A7A7A7]"
                      : "text-[#A7A7A7] hover:text-[#777777]"
                  }`}
                >
                  <span>via</span>
                  {activeDex?.logo && (
                    <img
                      src={activeDex.logo}
                      alt={activeDex.name}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                    />
                  )}
                  <span
                    className={`font-semibold ${isDark ? "text-[#CCCCCC]" : "text-[#555555]"}`}
                  >
                    {activeDex?.name}
                  </span>
                  <motion.svg
                    width="20"
                    height="20"
                    viewBox="0 0 10 10"
                    fill="none"
                    animate={{ rotate: isDexDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path
                      d="M2.5 3.75L5 6.25L7.5 3.75"
                      stroke={isDark ? "#555555" : "#B0B0B0"}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {isDexDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDexDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className={`absolute top-full left-0 mt-1 z-50 min-w-[170px] rounded-xl overflow-hidden border ${
                          isDark
                            ? "bg-[#222222] border-[#333333]"
                            : "bg-white border-[#E8E8E8]"
                        }`}
                        style={{
                          boxShadow: isDark
                            ? "0 8px 24px rgba(0,0,0,0.4)"
                            : "0 8px 24px rgba(0,0,0,0.1)",
                        }}
                      >
                        {dexes.map((dex) => {
                          const isActive = selectedDex === dex.id;
                          return (
                            <button
                              key={dex.id}
                              type="button"
                              onClick={() => {
                                onDexChange?.(dex.id);
                                setIsDexDropdownOpen(false);
                              }}
                              disabled={dex.isAvailable === false}
                              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left cursor-pointer transition-colors ${
                                isActive
                                  ? isDark
                                    ? "bg-[#703AE6]/10"
                                    : "bg-[#F6F2FE]"
                                  : isDark
                                    ? "hover:bg-[#2A2A2A]"
                                    : "hover:bg-[#FAFAFA]"
                              } ${dex.isAvailable === false ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              {dex.logo && (
                                <img
                                  src={dex.logo}
                                  alt={dex.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              )}
                              <span
                                className={`text-[13px] font-semibold leading-[18px] ${
                                  isActive
                                    ? "text-[#703AE6]"
                                    : isDark
                                      ? "text-[#CCCCCC]"
                                      : "text-[#333333]"
                                }`}
                              >
                                {dex.name}
                              </span>
                              {isActive && (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  className="ml-auto"
                                >
                                  <path
                                    d="M3 7L6 10L11 4"
                                    stroke="#703AE6"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <span
                className={`text-[14px] sm:text-[16px] font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}
              >
                Swap
              </span>
            )}

            {/* Settings button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                isSettingsOpen
                  ? isDark
                    ? "bg-[#2A2A2A]"
                    : "bg-[#F0F0F0]"
                  : isDark
                    ? "hover:bg-[#2A2A2A]"
                    : "hover:bg-[#F4F4F4]"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6.5 2.5L7.2 1.2C7.3 1.1 7.5 1 7.6 1H8.4C8.5 1 8.7 1.1 8.8 1.2L9.5 2.5L11 3.1L12.3 2.7C12.5 2.6 12.7 2.7 12.8 2.8L13.4 3.4C13.5 3.5 13.6 3.7 13.5 3.9L13.1 5.2L13.7 6.7L15 7.4C15.1 7.5 15.2 7.7 15.2 7.8V8.6C15.2 8.7 15.1 8.9 15 9L13.7 9.7L13.1 11.2L13.5 12.5C13.6 12.7 13.5 12.9 13.4 13L12.8 13.6C12.7 13.7 12.5 13.8 12.3 13.7L11 13.3L9.5 13.9L8.8 15.2C8.7 15.3 8.5 15.4 8.4 15.4H7.6C7.5 15.4 7.3 15.3 7.2 15.2L6.5 13.9L5 13.3L3.7 13.7C3.5 13.8 3.3 13.7 3.2 13.6L2.6 13C2.5 12.9 2.4 12.7 2.5 12.5L2.9 11.2L2.3 9.7L1 9C0.9 8.9 0.8 8.7 0.8 8.6V7.8C0.8 7.7 0.9 7.5 1 7.4L2.3 6.7L2.9 5.2L2.5 3.9C2.4 3.7 2.5 3.5 2.6 3.4L3.2 2.8C3.3 2.7 3.5 2.6 3.7 2.7L5 3.1L6.5 2.5Z"
                  stroke={
                    isSettingsOpen ? "#703AE6" : isDark ? "#555555" : "#B0B0B0"
                  }
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle
                  cx="8"
                  cy="8.2"
                  r="2.2"
                  stroke={
                    isSettingsOpen ? "#703AE6" : isDark ? "#555555" : "#B0B0B0"
                  }
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          {/* From Token Input */}
          <SwapInput
            label="You Pay"
            token={tokenIn}
            amount={amountIn}
            amountUsd={amountInUsd}
            balance={tokenInBalance}
            onTokenSelect={() => setTokenModalTarget("in")}
            onAmountChange={(val) => {
              setAmountIn(val);
              setActivePercent(null);
            }}
            onPercentClick={handlePercentClick}
            activePercent={activePercent}
            showPresets
          />

          {/* Swap Direction Button */}
          <SwapDirectionButton onClick={handleFlip} />

          {/* To Token Input */}
          <SwapInput
            label="You Receive"
            token={tokenOut}
            amount={amountOut}
            amountUsd={amountOutUsd}
            balance={tokenOutBalance}
            isReadOnly
            isLoading={isQuoteLoading}
            onTokenSelect={() => setTokenModalTarget("out")}
          />

          {/* Swap Details */}
          <div className="mt-2">
            <SwapDetails
              isVisible={hasQuote}
              isExpanded={isDetailsExpanded}
              onToggleExpand={() => setIsDetailsExpanded((prev) => !prev)}
              exchangeRate={
                tokenIn && tokenOut
                  ? `1 ${tokenIn.symbol} = 2,312.45 ${tokenOut.symbol}`
                  : null
              }
              priceImpact="0.04%"
              priceImpactLevel="low"
              slippage={slippageMode === "auto" ? "0.5" : slippage}
              minReceived={tokenOut ? `2,300.89 ${tokenOut.symbol}` : null}
              fee="0.05%"
              networkCost="~$1.20"
              onRefreshRate={() => {}}
              isRefreshing={false}
              onEditSlippage={() => setIsSettingsOpen(true)}
            />
          </div>

          {/* Swap CTA Button */}
          <div className="mt-2">
            <SwapButton
              state={buttonState}
              onClick={handleButtonClick}
              tokenSymbol={tokenIn?.symbol}
              isLoading={isQuoteLoading}
            />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SwapSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        slippage={slippage}
        onSlippageChange={setSlippage}
        slippageMode={slippageMode}
        onSlippageModeChange={setSlippageMode}
        deadline={deadline}
        onDeadlineChange={setDeadline}
      />

      {/* Token Search Modal */}
      <TokenSearchModal
        isOpen={tokenModalTarget !== null}
        onClose={() => setTokenModalTarget(null)}
        onSelect={handleTokenSelect}
        tokens={TOKENS}
        popularTokens={POPULAR_TOKENS}
        balances={BALANCES}
      />
    </>
  );
};
