"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { erc20Abi, formatUnits, parseUnits, encodeFunctionData } from "viem";
import { toast } from "sonner";

import { useTheme } from "@/contexts/theme-context";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useNexus, useNexusBalanceBreakdown, useBridgeAndExecute } from "@/lib/nexus";
import { iconPaths } from "@/lib/constants";
import { SUPPORTED_CHAIN_NAMES } from "@/lib/chains/chains";
import {
  SUPPORTED_TOKENS_BY_CHAIN,
  TOKEN_DECIMALS,
  tokenAddressByChain,
  accountManagerAddressByChain,
} from "@/lib/utils/web3/token";
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";
import { depositTx, getMarginAccount } from "@/lib/utils/margin/transactions";
import { SpinnerIcon } from "@/components/icons";
import { NexusBridgingDialogue } from "@/components/ui/nexus-bridging-dialogue";
import AccountManager from "@/abi/vanna/out/out/AccountManager.sol/AccountManager.json";

// ─── Types ──────────────────────────────────────────────

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "confirming" | "success" | "error";

const PERCENTAGES = [25, 50, 75, 100] as const;

// ─── Component ──────────────────────────────────────────

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const { isDark } = useTheme();
  const { address: walletAddress, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  // Use wagmi's useAccount address (always in sync with wallet) instead of persisted user store
  const address = walletAddress;
  const hasMarginAccount = useMarginAccountInfoStore((s) => s.hasMarginAccount);

  // Nexus — display + cross-chain bridge execution when needed
  const { initialized: nexusReady, fetchBridgeBalances } = useNexus();
  const nexusBridge = useBridgeAndExecute();
  const [showBridgingDialogue, setShowBridgingDialogue] = useState(false);

  // Form state
  const supportedTokens = useMemo(
    () => SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [],
    [chainId]
  );
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [activePercent, setActivePercent] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  // On-chain wallet balances (fetched directly, not from store which may be empty)
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});

  const fetchWalletBalances = useCallback(async () => {
    if (!publicClient || !address || !chainId) return;
    const tokens = SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? [];
    const addrMap = tokenAddressByChain[chainId] ?? {};
    const result: Record<string, number> = {};

    try {
      // Fetch ETH native balance
      const ethBal = await publicClient.getBalance({ address: address as `0x${string}` });
      result["ETH"] = Number(formatUnits(ethBal, 18));

      // Fetch ERC20 balances via multicall
      const erc20Tokens = tokens.filter((t) => t !== "ETH" && addrMap[t]);
      if (erc20Tokens.length > 0) {
        const contracts = erc20Tokens.map((t) => ({
          address: addrMap[t] as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address as `0x${string}`],
        }));
        const results = await publicClient.multicall({ contracts, allowFailure: true });
        erc20Tokens.forEach((t, i) => {
          if (results[i]?.status === "success") {
            const decimals = TOKEN_DECIMALS[t] ?? 18;
            result[t] = Number(formatUnits(results[i].result as bigint, decimals));
          } else {
            result[t] = 0;
          }
        });
      }
    } catch (err) {
      console.error("[DepositModal] Balance fetch error:", err);
    }

    setWalletBalances(result);
  }, [publicClient, address, chainId]);

  // Fetch balances when modal opens or chain/address changes
  useEffect(() => {
    if (isOpen) {
      fetchWalletBalances();
    }
  }, [isOpen, fetchWalletBalances]);

  // Margin account fetch
  const fetchAccountCheck = useFetchAccountCheck(
    chainId,
    address as `0x${string}`,
    publicClient
  );

  // Nexus balance breakdown (display only — same as collateral box)
  const { total: nexusTotal, breakdown: nexusBreakdown } =
    useNexusBalanceBreakdown(selectedToken);

  // Balance logic — current chain wallet balance for deposit execution
  // Nexus total shown for informational display only (like collateral box)
  const currentChainBalance = walletBalances[selectedToken] ?? 0;
  const depositAmount = parseFloat(amount) || 0;

  // Determine if bridging is needed (same logic as collateral box):
  // Need bridging when current chain balance < deposit amount but nexus has more across chains
  const needsBridging =
    nexusReady &&
    depositAmount > currentChainBalance &&
    currentChainBalance < (nexusTotal ?? 0);

  // USD estimate (stablecoins = $1, ETH fallback)
  const usdEstimate = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (selectedToken === "ETH") return amt * 2000; // rough estimate
    return amt; // stablecoins
  }, [amount, selectedToken]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setAmount("");
      setActivePercent(null);
      setErrorMsg("");
      setTxHash(undefined);
      setShowBridgingDialogue(false);
      nexusBridge.reset();
    }
  }, [isOpen]);

  // Reset token when chain changes
  useEffect(() => {
    if (supportedTokens.length > 0 && !supportedTokens.includes(selectedToken)) {
      setSelectedToken(supportedTokens[0]);
    }
  }, [supportedTokens, selectedToken]);

  const formatBalance = (val: number) => {
    if (val === 0) return "0";
    if (val < 0.0001) return "< 0.0001";
    return val.toFixed(6).replace(/\.?0+$/, "");
  };

  const handlePercentClick = (pct: number) => {
    setActivePercent(pct);
    // Use unified balance (nexusTotal) when it's more than current chain, same as collateral box
    const effectiveBalance =
      nexusReady && nexusTotal > currentChainBalance ? nexusTotal : currentChainBalance;
    const calculated = (pct / 100) * effectiveBalance;
    setAmount(formatBalance(calculated));
  };

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    setShowTokenPicker(false);
    setAmount("");
    setActivePercent(null);
  };

  // ─── Execute deposit ───────────────────────────────────
  // Two paths (same as leverage-assets-tab.tsx):
  // 1. LOCAL: current chain has enough balance → depositTx() (fast ~5s)
  // 2. BRIDGE: need funds from other chains → useBridgeAndExecute + NexusBridgingDialogue

  const handleDeposit = useCallback(async () => {
    if (!walletClient || !publicClient || !chainId) {
      toast.error("Wallet not connected");
      return;
    }

    // --- PATH 2: Cross-chain bridge deposit (Nexus bridgeAndExecute) ---
    if (needsBridging) {
      try {
        // Get margin account address
        const marginAccount = await getMarginAccount({ fetchAccountCheck });
        const accountManagerAddr = accountManagerAddressByChain[chainId];
        if (!accountManagerAddr) throw new Error("AccountManager not found for this chain");

        const tokenAddress = tokenAddressByChain[chainId]?.[selectedToken];
        if (!tokenAddress) throw new Error(`Token address not found for ${selectedToken}`);

        const decimals = TOKEN_DECIMALS[selectedToken] ?? 18;
        const amountBigInt = parseUnits(amount, decimals);

        // Build deposit calldata for the margin account (same as leverage-assets-tab)
        const depositCalldata = encodeFunctionData({
          abi: AccountManager.abi,
          functionName: "deposit",
          args: [marginAccount, tokenAddress, amountBigInt],
        });

        console.log(`[DepositModal] Bridging ${amount} ${selectedToken} to chain ${chainId} and depositing to margin account`);

        // Show bridging dialogue
        setShowBridgingDialogue(true);

        const result = await nexusBridge.execute({
          token: selectedToken,
          amount: amountBigInt,
          toChainId: chainId,
          executeTo: accountManagerAddr,
          executeData: depositCalldata,
        });

        if (result) {
          // Refresh Nexus balances after bridging
          fetchBridgeBalances();
          fetchWalletBalances();
          setShowBridgingDialogue(false);
          setTxHash(nexusBridge.txHash || undefined);
          setStep("success");
        } else if (nexusBridge.isCancelled) {
          setShowBridgingDialogue(false);
          setStep("form");
        } else {
          setShowBridgingDialogue(false);
          setStep("error");
          setErrorMsg(nexusBridge.error || "Cross-chain deposit failed");
        }
      } catch (err: any) {
        setShowBridgingDialogue(false);
        if (
          err?.code === 4001 ||
          err?.message?.includes("rejected") ||
          err?.message?.includes("cancelled")
        ) {
          setStep("form");
          return;
        }
        console.error("[DepositModal] Bridge error:", err);
        setStep("error");
        setErrorMsg(err?.message || "Bridge deposit failed");
      }
      return;
    }

    // --- PATH 1: Local deposit (same chain, fast ~5s) ---
    setStep("confirming");

    try {
      const txHash = await depositTx({
        walletClient,
        publicClient,
        chainId,
        fetchAccountCheck,
        asset: selectedToken,
        amount,
      });

      setTxHash(txHash);
      setStep("success");
    } catch (err: any) {
      if (
        err?.code === 4001 ||
        err?.message?.includes("rejected") ||
        err?.message?.includes("cancelled")
      ) {
        setStep("form");
        return;
      }
      console.error("[DepositModal] Error:", err);
      setStep("error");
      setErrorMsg(err?.message || "Transaction failed");
    }
  }, [walletClient, publicClient, chainId, fetchAccountCheck, selectedToken, amount, needsBridging, nexusBridge, fetchBridgeBalances, fetchWalletBalances]);

  if (!isOpen) return null;

  // Allow deposit up to nexusTotal when bridging is available, otherwise up to currentChainBalance
  const maxAvailable =
    nexusReady && nexusTotal > currentChainBalance ? nexusTotal : currentChainBalance;
  const isValid =
    depositAmount > 0 &&
    depositAmount <= maxAvailable &&
    step === "form" &&
    hasMarginAccount;

  // ─── Render ────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={step === "form" || step === "success" || step === "error" ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Main modal */}
          {(
            <motion.div
              className={`relative z-10 w-[440px] rounded-[24px] overflow-hidden ${
                isDark
                  ? "bg-[#0C0C0C] border border-[#1E1E1E]"
                  : "bg-white border border-[#EBEBEB]"
              }`}
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                boxShadow: isDark
                  ? "0 32px 80px rgba(112, 58, 230, 0.15), 0 8px 32px rgba(0,0,0,0.5)"
                  : "0 32px 80px rgba(112, 58, 230, 0.08), 0 8px 32px rgba(0,0,0,0.08)",
              }}
            >
              {/* Gradient top bar */}
              <div className="w-full h-[3px] bg-gradient" />

              <div className="flex flex-col p-[24px] gap-[20px]">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2
                    className={`text-[18px] font-semibold ${
                      isDark ? "text-white" : "text-[#111]"
                    }`}
                  >
                    {step === "success"
                      ? "Deposit Successful"
                      : step === "error"
                      ? "Deposit Failed"
                      : "Deposit to Margin Account"}
                  </h2>
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className={`w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer ${
                      isDark ? "bg-[#1A1A1A] hover:bg-[#222]" : "bg-[#F4F4F4] hover:bg-[#EEE]"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M6 7.68L1.68 12L0 10.32L4.32 6L0 1.68L1.68 0L6 4.32L10.32 0L12 1.68L7.68 6L12 10.32L10.32 12L6 7.68Z"
                        fill={isDark ? "#888" : "#999"}
                      />
                    </svg>
                  </motion.button>
                </div>

                {/* ─── FORM STEP ─── */}
                {step === "form" && (
                  <>
                    {/* No margin account warning */}
                    {!hasMarginAccount && (
                      <motion.div
                        className={`px-[14px] py-[10px] rounded-[12px] text-[12px] font-medium ${
                          isDark
                            ? "bg-[#2A1A00] text-[#FFB347] border border-[#3D2800]"
                            : "bg-[#FFF8F0] text-[#B35C00] border border-[#FFE0B2]"
                        }`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        No margin account found. Please create one on the Margin page first.
                      </motion.div>
                    )}

                    {/* Token selector + Amount input */}
                    <div
                      className={`rounded-[16px] p-[16px] ${
                        isDark ? "bg-[#111]" : "bg-[#F9F9F9]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-[12px]">
                        <span
                          className={`text-[11px] font-medium ${
                            isDark ? "text-[#666]" : "text-[#999]"
                          }`}
                        >
                          You deposit
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            isDark ? "text-[#666]" : "text-[#999]"
                          }`}
                        >
                          ~${usdEstimate.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-[12px]">
                        {/* Token picker button */}
                        <motion.button
                          type="button"
                          onClick={() => setShowTokenPicker(!showTokenPicker)}
                          className={`flex items-center gap-[8px] px-[12px] py-[10px] rounded-[12px] cursor-pointer ${
                            isDark
                              ? "bg-[#1A1A1A] hover:bg-[#222]"
                              : "bg-white hover:bg-[#F0F0F0]"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {iconPaths[selectedToken] && (
                            <Image
                              src={iconPaths[selectedToken]}
                              alt={selectedToken}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span
                            className={`text-[15px] font-semibold ${
                              isDark ? "text-white" : "text-[#111]"
                            }`}
                          >
                            {selectedToken}
                          </span>
                          <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                          >
                            <path
                              d="M1 1L5 5L9 1"
                              stroke={isDark ? "#666" : "#999"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.button>

                        {/* Amount input */}
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setActivePercent(null);
                          }}
                          placeholder="0.00"
                          className={`flex-1 text-right text-[24px] font-semibold bg-transparent outline-none placeholder:text-[#CCC] ${
                            isDark
                              ? "text-white placeholder:text-[#444]"
                              : "text-[#111]"
                          }`}
                        />
                      </div>

                      {/* Token picker dropdown */}
                      <AnimatePresence>
                        {showTokenPicker && (
                          <motion.div
                            className={`mt-[8px] rounded-[12px] overflow-hidden ${
                              isDark
                                ? "bg-[#1A1A1A] border border-[#2A2A2A]"
                                : "bg-white border border-[#E8E8E8]"
                            }`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {supportedTokens.map((token) => (
                              <motion.button
                                key={token}
                                type="button"
                                onClick={() => handleTokenSelect(token)}
                                className={`w-full flex items-center gap-[10px] px-[14px] py-[12px] cursor-pointer ${
                                  token === selectedToken
                                    ? isDark
                                      ? "bg-[#1A1035]"
                                      : "bg-[#F8F4FF]"
                                    : isDark
                                    ? "hover:bg-[#222]"
                                    : "hover:bg-[#F9F9F9]"
                                }`}
                                whileHover={{ x: 2 }}
                              >
                                {iconPaths[token] && (
                                  <Image
                                    src={iconPaths[token]}
                                    alt={token}
                                    width={22}
                                    height={22}
                                    className="rounded-full"
                                  />
                                )}
                                <span
                                  className={`text-[14px] font-medium ${
                                    isDark ? "text-white" : "text-[#111]"
                                  }`}
                                >
                                  {token}
                                </span>
                                <span
                                  className={`ml-auto text-[12px] ${
                                    isDark ? "text-[#666]" : "text-[#999]"
                                  }`}
                                >
                                  {formatBalance(walletBalances[token] ?? 0)}
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Percentage buttons */}
                    <div className="flex gap-[8px]">
                      {PERCENTAGES.map((pct) => (
                        <motion.button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentClick(pct)}
                          className={`flex-1 py-[10px] rounded-[10px] text-[13px] font-semibold cursor-pointer transition-colors ${
                            activePercent === pct
                              ? "bg-gradient text-white"
                              : isDark
                              ? "bg-[#1A1A1A] text-[#888] hover:bg-[#222] hover:text-white"
                              : "bg-[#F4F4F4] text-[#777] hover:bg-[#EEE] hover:text-[#111]"
                          }`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {pct}%
                        </motion.button>
                      ))}
                    </div>

                    {/* Balance info */}
                    <div
                      className={`rounded-[14px] p-[14px] flex flex-col gap-[8px] ${
                        isDark ? "bg-[#111]" : "bg-[#F9F9F9]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[12px] font-medium ${
                            isDark ? "text-[#666]" : "text-[#999]"
                          }`}
                        >
                          {nexusReady && nexusTotal > currentChainBalance
                            ? "Balance across chains"
                            : "Wallet Balance"}
                        </span>
                        <span
                          className={`text-[13px] font-semibold ${
                            isDark ? "text-white" : "text-[#111]"
                          }`}
                        >
                          {formatBalance(
                            nexusReady && nexusTotal > currentChainBalance
                              ? nexusTotal
                              : currentChainBalance
                          )}{" "}
                          {selectedToken}
                        </span>
                      </div>

                      {/* Per-chain breakdown (display only — same as collateral box) */}
                      {nexusReady &&
                        nexusBreakdown.length > 0 &&
                        nexusTotal > currentChainBalance && (
                          <div className="flex flex-col gap-[4px] pt-[4px]">
                            {nexusBreakdown
                              .filter((b) => b.value > 0)
                              .map((b) => (
                                <div
                                  key={b.chainId}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-[6px]">
                                    {(iconPaths[SUPPORTED_CHAIN_NAMES[b.chainId]] ||
                                      iconPaths[b.chainName]) && (
                                      <Image
                                        src={
                                          iconPaths[SUPPORTED_CHAIN_NAMES[b.chainId]] ||
                                          iconPaths[b.chainName]
                                        }
                                        alt={b.chainName}
                                        width={14}
                                        height={14}
                                        className="rounded-full"
                                      />
                                    )}
                                    <span
                                      className={`text-[11px] font-medium ${
                                        isDark ? "text-[#888]" : "text-[#777]"
                                      }`}
                                    >
                                      {SUPPORTED_CHAIN_NAMES[b.chainId] || b.chainName}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[11px] font-medium ${
                                      isDark ? "text-[#AAA]" : "text-[#555]"
                                    }`}
                                  >
                                    {parseFloat(b.balance).toFixed(4)} {selectedToken}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                      {/* Nexus bridging indicator — only show when bridging is actually needed */}
                      {nexusReady && needsBridging && (
                        <motion.div
                          className={`flex items-center gap-[6px] px-[8px] py-[4px] rounded-[8px] ${
                            isDark ? "bg-[#1A1035]" : "bg-[#F8F4FF]"
                          }`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div
                            className="flex-shrink-0 w-[14px] h-[14px] rounded-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #FC5457 10%, #703AE6 90%)" }}
                          >
                            <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <span className={`text-[10px] font-medium ${isDark ? "text-[#C4A8FF]" : "text-[#703AE6]"}`}>
                            Will bridge from other chains via Nexus
                          </span>
                        </motion.div>
                      )}

                      {/* Available on current chain */}
                      {nexusReady && nexusTotal > currentChainBalance && (
                        <div className="flex items-center justify-between pt-[4px] border-t border-dashed"
                          style={{ borderColor: isDark ? "#222" : "#E0E0E0" }}
                        >
                          <span
                            className={`text-[11px] font-medium ${
                              isDark ? "text-[#666]" : "text-[#999]"
                            }`}
                          >
                            Available on {SUPPORTED_CHAIN_NAMES[chainId ?? 0] || "this chain"}
                          </span>
                          <span
                            className={`text-[12px] font-semibold ${
                              isDark ? "text-white" : "text-[#111]"
                            }`}
                          >
                            {formatBalance(currentChainBalance)} {selectedToken}
                          </span>
                        </div>
                      )}

                      {/* Chain info */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[12px] font-medium ${
                            isDark ? "text-[#666]" : "text-[#999]"
                          }`}
                        >
                          Destination
                        </span>
                        <div className="flex items-center gap-[6px]">
                          {iconPaths[
                            SUPPORTED_CHAIN_NAMES[chainId ?? 0]
                          ] && (
                            <Image
                              src={
                                iconPaths[
                                  SUPPORTED_CHAIN_NAMES[chainId ?? 0]
                                ]
                              }
                              alt="chain"
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                          )}
                          <span
                            className={`text-[12px] font-semibold ${
                              isDark ? "text-white" : "text-[#111]"
                            }`}
                          >
                            {SUPPORTED_CHAIN_NAMES[chainId ?? 0] || "Unknown"}{" "}
                            Margin Account
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deposit button */}
                    <motion.button
                      type="button"
                      disabled={!isValid}
                      onClick={handleDeposit}
                      className={`w-full py-[16px] rounded-[14px] text-[15px] font-semibold cursor-pointer transition-all ${
                        isValid
                          ? "bg-gradient text-white hover:opacity-90"
                          : isDark
                          ? "bg-[#1A1A1A] text-[#444] cursor-not-allowed"
                          : "bg-[#E8E8E8] text-[#AAA] cursor-not-allowed"
                      }`}
                      whileHover={isValid ? { scale: 1.01 } : {}}
                      whileTap={isValid ? { scale: 0.99 } : {}}
                    >
                      {!hasMarginAccount
                        ? "Create Margin Account First"
                        : depositAmount <= 0
                        ? "Enter Amount"
                        : depositAmount > maxAvailable
                        ? "Insufficient Balance"
                        : needsBridging
                        ? "Bridge & Deposit"
                        : "Deposit"}
                    </motion.button>

                  </>
                )}

                {/* ─── CONFIRMING STEP ─── */}
                {step === "confirming" && (
                  <div className="flex flex-col items-center gap-[20px] py-[24px]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <SpinnerIcon
                        width={40}
                        height={40}
                        stroke={isDark ? "#703AE6" : "#703AE6"}
                      />
                    </motion.div>
                    <div className="flex flex-col items-center gap-[6px]">
                      <span
                        className={`text-[15px] font-semibold ${
                          isDark ? "text-white" : "text-[#111]"
                        }`}
                      >
                        Confirming Deposit
                      </span>
                      <span
                        className={`text-[12px] font-medium text-center ${
                          isDark ? "text-[#666]" : "text-[#999]"
                        }`}
                      >
                        Depositing {amount} {selectedToken} to your margin
                        account.
                        <br />
                        Please confirm in your wallet.
                      </span>
                    </div>
                  </div>
                )}

                {/* ─── SUCCESS STEP ─── */}
                {step === "success" && (
                  <div className="flex flex-col items-center gap-[20px] py-[16px]">
                    <motion.div
                      className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #FC5457 10%, #703AE6 90%)",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <motion.svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    </motion.div>
                    <div className="flex flex-col items-center gap-[6px]">
                      <span
                        className={`text-[16px] font-semibold ${
                          isDark ? "text-white" : "text-[#111]"
                        }`}
                      >
                        {amount} {selectedToken} Deposited
                      </span>
                      <span
                        className={`text-[12px] font-medium ${
                          isDark ? "text-[#666]" : "text-[#999]"
                        }`}
                      >
                        Successfully deposited to your margin account on{" "}
                        {SUPPORTED_CHAIN_NAMES[chainId ?? 0]}
                      </span>
                    </div>
                    {txHash && (
                      <motion.a
                        href={`${
                          chainId === 42161
                            ? "https://arbiscan.io"
                            : chainId === 10
                            ? "https://optimistic.etherscan.io"
                            : "https://basescan.org"
                        }/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-[#703AE6] hover:underline cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        View on Explorer
                      </motion.a>
                    )}
                    <motion.button
                      type="button"
                      onClick={onClose}
                      className="w-full py-[14px] rounded-[14px] text-[14px] font-semibold bg-gradient text-white cursor-pointer"
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      Done
                    </motion.button>
                  </div>
                )}

                {/* ─── ERROR STEP ─── */}
                {step === "error" && (
                  <div className="flex flex-col items-center gap-[20px] py-[16px]">
                    <motion.div
                      className={`w-[64px] h-[64px] rounded-full flex items-center justify-center ${
                        isDark ? "bg-[#2A1010]" : "bg-[#FFF0F0]"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <span className="text-[#EF4444] text-[28px] font-bold">
                        !
                      </span>
                    </motion.div>
                    <div className="flex flex-col items-center gap-[6px]">
                      <span
                        className={`text-[15px] font-semibold ${
                          isDark ? "text-white" : "text-[#111]"
                        }`}
                      >
                        Deposit Failed
                      </span>
                      <span
                        className={`text-[12px] font-medium text-center max-w-[320px] ${
                          isDark ? "text-[#666]" : "text-[#999]"
                        }`}
                      >
                        {errorMsg}
                      </span>
                    </div>
                    <div className="w-full flex gap-[8px]">
                      <motion.button
                        type="button"
                        onClick={() => setStep("form")}
                        className={`flex-1 py-[14px] rounded-[14px] text-[14px] font-semibold cursor-pointer ${
                          isDark
                            ? "bg-[#1A1A1A] text-white hover:bg-[#222]"
                            : "bg-[#F4F4F4] text-[#111] hover:bg-[#EEE]"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        Try Again
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 py-[14px] rounded-[14px] text-[14px] font-semibold cursor-pointer ${
                          isDark
                            ? "bg-[#222] text-[#888] hover:bg-[#2A2A2A]"
                            : "bg-[#F9F9F9] text-[#999] hover:bg-[#F0F0F0]"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        Close
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Nexus Bridging Dialogue — shown during cross-chain bridge deposits */}
      {showBridgingDialogue && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <NexusBridgingDialogue
            heading={`Bridging to ${SUPPORTED_CHAIN_NAMES[chainId ?? 0] || "destination"}`}
            status={nexusBridge.status}
            steps={nexusBridge.steps}
            startTime={nexusBridge.startTime}
            explorerUrl={nexusBridge.explorerUrl}
            asset={selectedToken}
            amount={amount}
            destChain={SUPPORTED_CHAIN_NAMES[chainId ?? 0] || ""}
            onClose={() => {
              setShowBridgingDialogue(false);
              nexusBridge.reset();
              // If bridge completed successfully, show success step
              if (nexusBridge.status === "success") {
                setStep("success");
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
