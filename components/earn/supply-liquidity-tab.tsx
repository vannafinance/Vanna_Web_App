import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import Image from "next/image";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { iconPaths } from "@/lib/constants";
import { InfoCard } from "../margin/info-card";
import { Button } from "../ui/button";
import { AmountBreakdownDialogue } from "../ui/amount-breakdown-dialogue";
import { TransactionModal } from "../ui/transaction-modal";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/theme-context";
import { EarnAsset } from "@/lib/types";
import { supply } from "@/lib/utils/earn/transactions";
import { useFetchUserWalletBalance, useFetchConvertToShares } from "@/lib/utils/earn/earnFetchers";
import { useVaultData } from "@/lib/hooks/useVaultData";
import { useNexus, useNexusBalanceBreakdown } from "@/lib/nexus";
import { SUPPORTED_CHAIN_NAMES } from "@/lib/chains/chains";
import { SwitchNetworkButton } from "@/components/ui/switch-network-button";
import { useRequiredNetwork } from "@/lib/hooks/useRequiredNetwork";

export const SupplyLiquidityTab = ({ asset }: { asset: EarnAsset }) => {
   const { isDark } = useTheme();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Asset is locked to the vault's token from the URL
  const selectedAsset = asset;

  const [amount, setAmount] = useState<string>("");
  const [selectedPercentage, setSelectedPercentage] = useState<number>(0);
  const [selectedBalance, setSelectedBalance] = useState<string>("WB");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isBalanceBreakdownOpen, setIsBalanceBreakdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharesPreview, setSharesPreview] = useState<number>(0);

  // Nexus unified balance (cross-chain)
  const { initialized: nexusReady } = useNexus();
  const { total: nexusUnifiedBalance, breakdown: nexusBreakdown } =
    useNexusBalanceBreakdown(selectedAsset);

  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    status: "pending" | "success" | "error";
    message?: string;
    txHash?: string;
    showFloatingTokens?: boolean;
    tokenSymbol?: "ETH" | "USDC" | "USDT";
  }>({
    isOpen: false,
    status: "pending",
  });

  const { isWrongNetwork } = useRequiredNetwork();

  // ✅ Use vault data from store (already cached via multicall)
  const { vault } = useVaultData(selectedAsset);

  // Fetchers
  const fetchWalletBalance = useFetchUserWalletBalance(chainId, selectedAsset, address, publicClient);
  const fetchConvertToShares = useFetchConvertToShares(chainId, selectedAsset, publicClient);

  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !address) {
        setWalletBalance(0);
        return;
      }
      const balanceResult = await fetchWalletBalance();
      if (balanceResult) setWalletBalance(balanceResult.balanceFormatted);
    };
    loadData();
  }, [selectedAsset, address, isConnected, fetchWalletBalance]);

  useEffect(() => {
    const previewShares = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setSharesPreview(0);
        return;
      }
      const result = await fetchConvertToShares(amount);
      if (result) setSharesPreview(result.sharesFormatted);
    };
    previewShares();
  }, [amount, fetchConvertToShares]);

  const formatAmount = (value: number): string => {
    if (value === 0) return "0";
    const decimals = selectedAsset === "ETH" ? 18 : 6;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  };

  // WB = on-chain wallet balance, PB = portfolio balance (to be integrated later)
  const effectiveBalance = walletBalance;

  const handlePercentageClick = (percent: number) => {
    setSelectedPercentage(percent);
    if (effectiveBalance > 0) {
      const calculatedAmount = (effectiveBalance * percent) / 100;
      setAmount(formatAmount(calculatedAmount));
    }
  };

  useEffect(() => {
    setAmount("");
    setSelectedPercentage(0);
  }, [selectedAsset]);

  const handleSupply = async () => {
    if (!walletClient || !publicClient || !chainId || !address) {
      setTxModal({ isOpen: true, status: "error", message: "Please connect your wallet" });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setTxModal({ isOpen: true, status: "error", message: "Please enter an amount" });
      return;
    }

    if (parseFloat(amount) > effectiveBalance) {
      setTxModal({ isOpen: true, status: "error", message: "Insufficient balance" });
      return;
    }

    setLoading(true);
    setTxModal({
      isOpen: true,
      status: "pending",
      message: `Supplying ${amount} ${selectedAsset}...`,
      tokenSymbol: selectedAsset,              
    });

    try {
      const result = await supply({ walletClient, publicClient, chainId, asset: selectedAsset, amount, userAddress: address });

      if (result.success) {
        setTxModal({
          isOpen: true,
          status: "success",
          message: `Successfully supplied ${amount} ${selectedAsset}`,
          txHash: result.txHash,
          showFloatingTokens: true,
          tokenSymbol: selectedAsset,          // ✅ PASS TOKEN
        });

        setAmount("");
        setSelectedPercentage(0);

        setTimeout(async () => {
          const balanceResult = await fetchWalletBalance();
          if (balanceResult) setWalletBalance(balanceResult.balanceFormatted);

          // Notify position components to refetch
          window.dispatchEvent(new CustomEvent("vanna:position-update"));
        }, 2000);
      } else {
        throw new Error(result.error || "Supply failed");
      }
    } catch (error: any) {
      const isUserRejection =
        error?.code === 4001 ||
        error?.message?.includes("User rejected") ||
        error?.message?.includes("user rejected") ||
        error?.message?.includes("User denied");

      setTxModal({
        isOpen: true,
        status: "error",
        message: isUserRejection ? "Transaction cancelled" : error.message || "Supply failed",
        tokenSymbol: selectedAsset,            // ✅ PASS TOKEN (optional)
      });
    } finally {
      setLoading(false);
    }
  };

  const exchangeRate = vault?.exchangeRate || 1;
  const supplyAPY = vault?.supplyAPY ? vault.supplyAPY * 100 : 0;
  const amountNum = parseFloat(amount) || 0;

  const monthlyEarnings = (amountNum * supplyAPY) / 100 / 12;
  const yearlyEarnings = (amountNum * supplyAPY) / 100;

  const infoData = {
    youGetVETH: sharesPreview,
    ethPerVETH: exchangeRate,
    currentAPY: supplyAPY,
    baseAPY: supplyAPY * 0.6,
    bonusAPY: supplyAPY * 0.1,
    rewardsAPY: supplyAPY * 0.3,
    projectedMonthlyFrom: monthlyEarnings,
    projectedMonthlyTo: monthlyEarnings * 1.1,
    projectedYearlyFrom: yearlyEarnings,
    projectedYearlyTo: yearlyEarnings * 1.1,
  };

  const infoPropsData = {
    data: infoData,
    expandableSections: [
      {
        title: "More Details",
        headingBold: false,
        defaultExpanded: false,
        items: [
          { id: "baseAPY", name: "Base APY (%)" },
          { id: "bonusAPY", name: "Bonus APY (%)" },
          { id: "rewardsAPY", name: "Rewards APY (%)" },
          { id: "youGetVETH", name: `You Get (v${selectedAsset})` },
          { id: "ethPerVETH", name: `${selectedAsset} per v${selectedAsset}` },
          { id: "currentAPY", name: "Current APY (%)" },
          { id: "projectedMonthlyFrom", name: "Projected Monthly Earnings (From)" },
          { id: "projectedMonthlyTo", name: "Projected Monthly Earnings (To)" },
          { id: "projectedYearlyFrom", name: "Projected Yearly Earnings (From)" },
          { id: "projectedYearlyTo", name: "Projected Yearly Earnings (To)" },
        ],
      },
    ],
    showExpandable: true,
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (loading) return "Supplying...";
    if (!amount || parseFloat(amount) <= 0) return "Enter Amount";
    if (parseFloat(amount) > effectiveBalance) return "Insufficient Balance";
    return "Supply Liquidity";
  };

  const isButtonDisabled =
    !isConnected || loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > effectiveBalance;
  return (
    <>
      <form className={`flex gap-[16px] items-center w-full h-fit border-[1px] rounded-[16px] p-[16px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
        }`}>
        <div className="w-full h-full flex flex-col gap-[44px] justify-between">
          <div className="w-full h-fit">
            <div className="flex items-center gap-[8px]">
              <Image
                src={iconPaths[selectedAsset] || "/icons/eth-icon.png"}
                alt={selectedAsset}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className={`text-[16px] font-semibold ${isDark ? "text-white" : "text-[#181822]"}`}>
                {selectedAsset}
              </span>
            </div>
          </div>
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <div className="w-full h-fit">
              <label htmlFor="supply-amount" className="sr-only">
                Supply Amount
              </label>
              <input
                id="supply-amount"
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedPercentage(0);
                }}
                value={amount}
                type="number"
                step="any"
                min="0"
                placeholder="Enter amount"
                disabled={!isConnected || loading}
                className={`w-full h-fit placeholder:text-[#C7C7C7] text-[16px] font-medium outline-none ${isDark ? "text-white bg-[#111111]" : "bg-white"
                  } ${!isConnected || loading ? "opacity-50" : ""}`}
                aria-describedby="usd-value"
              />
            </div>
            <output id="usd-value" className={`w-full h-fit text-[10px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"
              }`}>
              ≈ {sharesPreview.toFixed(4)} v{selectedAsset}
            </output>
          </div>
        </div>
        <div className="w-fit h-fit flex flex-col gap-[32px] items-end">
          <fieldset className="w-full h-fit flex gap-[8px]">
            <legend className="sr-only">Select deposit percentage</legend>
            {DEPOSIT_PERCENTAGES.map((item) => (
              <button
                type="button"
                onClick={() => handlePercentageClick(item)}
                key={item}
                disabled={!isConnected || loading || effectiveBalance <= 0}
                className={`flex justify-center items-center cursor-pointer text-[14px] font-semibold w-fit h-[44px] rounded-[12px] p-[10px] ${selectedPercentage === item
                  ? `${PERCENTAGE_COLORS[item]} text-white`
                  : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                  } ${!isConnected || loading || effectiveBalance <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-pressed={selectedPercentage === item}
              >
                {item}%
              </button>
            ))}
          </fieldset>
          <div className="w-fit h-fit flex flex-col items-end gap-[4px]">
            <fieldset className="flex w-fit h-fit rounded-[4px] gap-[4px] items-center">
              <legend className="sr-only">Select balance type</legend>
              <button
                type="button"
                onClick={() => setSelectedBalance("PB")}
                disabled={!isConnected}
                className={`w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium ${!isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${selectedBalance === "PB"
                  ? "bg-[#F1EBFD] text-[#703AE6]"
                  : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                  }`}
                aria-pressed={selectedBalance === "PB"}
                aria-label="Protocol Balance"
              >
                PB
              </button>
              <span className="w-[16px] h-[16px] flex items-center justify-center" aria-hidden="true">
                <svg
                  width="12"
                  height="11"
                  viewBox="0 0 12 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.9986 6.75H0.125171C0.0564207 6.75 0.000170742 6.80625 0.000170742 6.875V7.8125C0.000170742 7.88125 0.0564207 7.9375 0.125171 7.9375H9.58142L7.32673 10.7969C7.26267 10.8781 7.32048 11 7.42517 11H8.55798C8.63455 11 8.70642 10.9656 8.75486 10.9047L11.3924 7.55937C11.6502 7.23125 11.4174 6.75 10.9986 6.75ZM11.3752 3.0625H1.91892L4.17361 0.203125C4.23767 0.121875 4.17986 0 4.07517 0H2.94236C2.8658 0 2.79392 0.0343751 2.74548 0.0953126L0.107983 3.44063C-0.149829 3.76875 0.0829833 4.25 0.500171 4.25H11.3752C11.4439 4.25 11.5002 4.19375 11.5002 4.125V3.1875C11.5002 3.11875 11.4439 3.0625 11.3752 3.0625Z"
                    fill={isDark ? "#FFFFFF" : "#000000"}
                  />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBalance("WB")}
                disabled={!isConnected}
                className={`w-[28px] h-fit rounded-[4px] p-[4px] text-[12px] font-medium ${!isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${selectedBalance === "WB"
                  ? "bg-[#F1EBFD] text-[#703AE6]"
                  : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                  }`}
                aria-pressed={selectedBalance === "WB"}
                aria-label="Wallet Balance"
              >
                WB
              </button>
            </fieldset>
            <output className="w-fit h-fit text-[10px] flex gap-[4px] font-semibold">
              <button
                type="button"
                onClick={() => selectedBalance === "WB" && setIsBalanceBreakdownOpen(true)}
                className={`${selectedBalance === "WB" ? "underline cursor-pointer" : ""} ${isDark ? "text-white" : "text-[#111111]"
                  } text-[10px] font-semibold`}
                disabled={selectedBalance !== "WB"}
              >
                {selectedBalance === "WB"
                  ? "Wallet Balance:"
                  : "Balance:"}
              </button>
              <span className={isDark ? "text-white" : "text-[#363636]"}>
                {isConnected ? `${effectiveBalance.toFixed(4)} ${selectedAsset}` : `-- ${selectedAsset}`}
              </span>
            </output>
          </div>
        </div>
      </form>

      <section className="flex flex-col gap-[8px]" aria-label="Supply Details">
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </section>

      {isWrongNetwork ? (
        <SwitchNetworkButton />
      ) : (
        <Button
          text={getButtonText()}
          size="large"
          type="gradient"
          disabled={isButtonDisabled}
          onClick={handleSupply}
        />
      )}



      <AnimatePresence>
        {isBalanceBreakdownOpen && (
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="balance-breakdown-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsBalanceBreakdownOpen(false)}
          >
            <motion.article
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <AmountBreakdownDialogue
                heading={nexusReady && nexusUnifiedBalance > walletBalance ? "Balance Across Chains" : "Wallet Balance"}
                asset={selectedAsset}
                totalDeposit={effectiveBalance}
                breakdown={
                  nexusReady && nexusBreakdown.length > 0
                    ? nexusBreakdown
                        .filter((b) => b.value > 0)
                        .map((b) => ({
                          name:
                            SUPPORTED_CHAIN_NAMES[b.chainId] || b.chainName,
                          value: b.value,
                        }))
                    : [{ name: "Wallet Balance", value: walletBalance }]
                }
                onClose={() => setIsBalanceBreakdownOpen(false)}
              />
            </motion.article>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
     
      <TransactionModal
        key={`${txModal.txHash}-${txModal.status}`}
        isOpen={txModal.isOpen}
        status={txModal.status}
        message={txModal.message}
        txHash={txModal.txHash}
        showFloatingTokens={txModal.showFloatingTokens}
        tokenSymbol={txModal.tokenSymbol}
        onClose={() => setTxModal({ ...txModal, isOpen: false })}
        onRetry={txModal.status === "error" ? handleSupply : undefined}
      />

    </>
  );
};
