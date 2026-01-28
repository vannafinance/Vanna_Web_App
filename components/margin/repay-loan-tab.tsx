"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { Dropdown } from "../ui/dropdown";
import { Popup } from "@/components/ui/popup";
import { useMarginStore } from "@/store/margin-account-state";
import { useAccount, usePublicClient } from "wagmi";
import { useBalanceStore } from "@/store/balance-store";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { tokenAddressByChain, TOKEN_DECIMALS } from "@/lib/utils/web3/token";
import AccountManager from "../../abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import { erc20Abi, parseUnits } from "viem";
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";

export const RepayLoanTab = () => {
  // Repay form state
  // Repay loan statistics

   const { chainId, address } = useAccount();


   const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);

  const { data: walletClient } = useWalletClient();
  
  const [repayStats, setRepayStats] = useState({
    netOutstandingAmountToPay: 0,
    availableBalance: 0,
    frozenBalance: 0,
  });


  const [selectedRepayCurrency, setSelectedRepayCurrency] =
    useState<string>(supportedTokens[0] || "");
  const [selectedRepayPercentage, setSelectedRepayPercentage] =
    useState<number>(10);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayAmountInUsd, setRepayAmountInUsd] = useState<number>(0);
  const [prices, setPrices] = useState<Record<string, number>>({});
  
  const publicClient = usePublicClient();
  const { marginState, reloadMarginState } = useMarginStore((s) => s);
  const getBalance = useBalanceStore((s) => s.getBalance);
  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);
  const [loading, setLoading] = useState(false);

  // Popup visibility states
  const [isPayNowPopupOpen, setIsPayNowPopupOpen] = useState(false);
  const [isFlashClosePopupOpen, setIsFlashClosePopupOpen] = useState(false);

  useEffect(() => {
    if (supportedTokens.length > 0 && !supportedTokens.includes(selectedRepayCurrency)) {
      setSelectedRepayCurrency(supportedTokens[0]);
    }
  }, [supportedTokens, selectedRepayCurrency]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        setPrices(data);
      } catch (e) {
        console.error("Error fetching prices:", e);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    if (marginState) {
      setRepayStats({
        netOutstandingAmountToPay: marginState.borrowUsd,
        availableBalance: getBalance(selectedRepayCurrency, "WB"),
        frozenBalance: marginState.collateralUsd,
      });
    }
  }, [marginState, getBalance, selectedRepayCurrency]);

  useEffect(() => {
    const price = prices[selectedRepayCurrency] || 0;
    setRepayAmountInUsd(repayAmount * price);
  }, [repayAmount, selectedRepayCurrency, prices]);

  // Handler for percentage click
  const handlePercentageClick = (item: number) => {
    setSelectedRepayPercentage(item);
    const debt = marginState?.borrowUsd || 0;
    const targetUsd = (debt * item) / 100;
    const price = prices[selectedRepayCurrency] || 1;
    const amount = targetUsd / price;
    setRepayAmount(Number(amount.toFixed(6)));
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepayAmount(Number(e.target.value));
  };

  // Handler for pay now click
  const handlePayNowClick = () => {
    setIsPayNowPopupOpen(true);
  };

  // Handler for flash close click
  const handleFlashCloseClick = () => {
    setIsFlashClosePopupOpen(true);
  };
  

  // Handler for closing pay now popup
  const handleClosePayNowPopup = () => {
    setIsPayNowPopupOpen(false);
  };

  // Handler for closing flash close popup
  const handleCloseFlashClosePopup = () => {
    setIsFlashClosePopupOpen(false);
  };

  const executeRepay = async () => {
    if (!walletClient || !publicClient || !chainId || !address) {
      return toast.error("Wallet not ready");
    }

    const addressList = getAddressList(chainId);
    if (!addressList) return toast.error("Unsupported network");

    const accounts = await fetchAccountCheck();
    if (!accounts.length) return toast.error("No Margin Account found");

    const marginAccount = accounts[0];
    const amountStr = repayAmount.toString();
    const decimals = TOKEN_DECIMALS[selectedRepayCurrency] ?? 18;
    const parsedAmount = parseUnits(amountStr, decimals);

    setLoading(true);
    const toastId = toast.loading("Processing Repayment...");

    try {
      // 1. Deposit to Margin Account first (assuming paying from wallet)
      // Check allowance
      const tokenAddress = tokenAddressByChain[chainId]?.[selectedRepayCurrency];
      if (!tokenAddress) throw new Error("Token address not found");

      if (selectedRepayCurrency !== "ETH") {
        const allowance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, addressList.accountManagerContractAddress as `0x${string}`],
        }) as bigint;

        if (allowance < parsedAmount) {
          toast.loading("Approving token...", { id: toastId });
          const approveHash = await walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [addressList.accountManagerContractAddress as `0x${string}`, parsedAmount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Repay (Deposit + Repay logic handled by AccountManager if we use repay? No, usually separate)
      // Actually, AccountManager might have a function to repay from wallet?
      // Looking at LeverageAssetsTab, executeRepay with mode "WB" does: deposit -> repay.
      
      toast.loading("Depositing for repayment...", { id: toastId });
      // Deposit
      if (selectedRepayCurrency === "ETH") {
         const tx = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "depositEth",
            args: [marginAccount],
            value: parsedAmount
         });
         await publicClient.waitForTransactionReceipt({ hash: tx });
      } else {
         const tx = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "deposit",
            args: [marginAccount, tokenAddress, parsedAmount]
         });
         await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      toast.loading("Repaying loan...", { id: toastId });
      // Repay
      if (selectedRepayCurrency === "ETH") {
         const tx = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "repayEth",
            args: [marginAccount, parsedAmount]
         });
         await publicClient.waitForTransactionReceipt({ hash: tx });
      } else {
         const tx = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "repay",
            args: [marginAccount, tokenAddress, parsedAmount]
         });
         await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      await reloadMarginState();
      toast.success("Repayment successful!", { id: toastId });
      setRepayAmount(0);
      setIsPayNowPopupOpen(false);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Repayment failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  

  // Check if buttons should be disabled (when input is 0 or empty)
  const isInputEmpty = repayAmount === 0 || repayAmount === null || repayAmount === undefined;

  return (
    <motion.div
      className="w-full flex flex-col gap-[24px] pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <motion.div
        className="flex flex-col gap-[43px] h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Repay stats cards */}
        <motion.div
          className="flex justify-between gap-[12px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Map through repay stats */}
          {Object.entries(repayStats).map(([key, value], index) => {
            return (
              <motion.div
                key={key}
                className="w-full flex flex-col justify-between h-[120px] rounded-[8px] border-[1px] border-[#E2E2E2] p-[16px] bg-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <motion.div
                  className="text-[14px] font-medium text-[#9F9F9F] max-w-[158.33px] "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.2 + index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  {key === "netOutstandingAmountToPay"
                    ? "Net Outstanding Amount to Repay"
                    : key === "availableBalance"
                    ? "Available Balance"
                    : "Frozen Balance"}
                </motion.div>
                <motion.div
                  className="text-[24px] font-bold text-[#181822]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.25 + index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  {typeof value === 'number' ? value.toFixed(4) : value}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Repay form */}
        <motion.div
          className="bg-white w-full border-[1px] border-[#E2E2E2] rounded-[16px] p-[20px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {/* Currency dropdown and percentage buttons */}
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            {/* Currency selector */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="p-[10px]"
            >
              <Dropdown
              classname="text-[16px] font-medium gap-[8px]"
                items={supportedTokens}
                selectedOption={selectedRepayCurrency}
                setSelectedOption={setSelectedRepayCurrency}
                dropdownClassname="text-[14px] font-medium gap-[8px]"
              />
            </motion.div>

            {/* Percentage buttons */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            >
              <div className="flex gap-[8px]" role="group" aria-label="Repay percentage">
                {DEPOSIT_PERCENTAGES.map((item: number, idx: number) => {
                  return (
                    <motion.button
                      type="button"
                      key={item}
                      onClick={() => handlePercentageClick(item)}
                      className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${
                        selectedRepayPercentage === item
                          ? `${PERCENTAGE_COLORS[item]} text-white`
                          : "bg-[#F4F4F4]"
                      } p-[10px] rounded-[12px]`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      aria-label={`Repay ${item} percent`}
                      aria-pressed={selectedRepayPercentage === item}
                    >
                      {item}%
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Amount input section */}
          <motion.div
            className="px-[10px] flex flex-col gap-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            {/* Repay amount input */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.55, ease: "easeOut" }}
            >
              <label htmlFor="repay-amount-input" className="sr-only">
                Repay amount
              </label>
              <input
                id="repay-amount-input"
                onChange={handleInputChange}
                className="w-full text-[20px] focus:border-[0px] focus:outline-none font-medium transition-transform duration-200 focus:scale-[1.01]"
                type="text"
                placeholder="0.0"
                value={repayAmount}
              />
            </motion.div>

            {/* USD value display */}
            <motion.div
              className="text-[12px] font-medium text-[#76737B]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
              aria-live="polite"
            >
              {repayAmountInUsd.toFixed(2)} USD
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col gap-[16px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {/* Pay Now button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.5,
            }}
            whileHover={isInputEmpty ? {} : { scale: 1.02 }}
            whileTap={isInputEmpty ? {} : { scale: 0.98 }}
          >
            <Button
              text="Pay Now"
              size="large"
              type="gradient"
              onClick={handlePayNowClick}
              disabled={isInputEmpty}
            />
          </motion.div>

          {/* Flash Close button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.6,
            }}
            whileHover={isInputEmpty ? {} : { scale: 1.02 }}
            whileTap={isInputEmpty ? {} : { scale: 0.98 }}
          >
            <Button
              text="Flash Close"
              size="large"
              type="ghost"
              onClick={handleFlashCloseClick}
              disabled={isInputEmpty}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Pay Now popup */}
      <AnimatePresence>
        {isPayNowPopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClosePayNowPopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popup
                icon="/assets/exclamation.png"
                description="Are you sure you want to close this position? This action will lock in your current P&L and cannot be undone."
                buttonText="Close Position"
                buttonOnClick={executeRepay}
                closeButtonText="Cancel"
                closeButtonOnClick={handleClosePayNowPopup}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Close popup */}
      <AnimatePresence>
        {isFlashClosePopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseFlashClosePopup}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Popup
                icon="/assets/lightning.svg"
                description="Are you sure you want to flash close all positions? All open trades will be closed instantly, locking in current P&L, and this action cannot be undone."
                buttonText="Close all Position"
                buttonOnClick={handleCloseFlashClosePopup}
                closeButtonText="Cancel"
                closeButtonOnClick={handleCloseFlashClosePopup}
                iconBgColor="bg-[#F1EBFD]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
