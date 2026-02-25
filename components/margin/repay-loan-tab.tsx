"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { useFetchAccountCheck, useFetchCollateralState, useFetchBorrowState, useFetchBorrowPositions, useFetchDirectBorrowBalances } from "@/lib/utils/margin/marginFetchers";
import { useTheme } from "@/contexts/theme-context";
import { TransactionModal } from "@/components/ui/transaction-modal";

export const RepayLoanTab = () => {
  const { isDark } = useTheme();
  // Repay form state
  // Repay loan statistics

  const { chainId, address } = useAccount();

  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalStatus, setTxModalStatus] = useState<"pending" | "success" | "error">("pending");
  const [txModalTitle, setTxModalTitle] = useState("");
  const [txModalMessage, setTxModalMessage] = useState("");
  const [txModalHash, setTxModalHash] = useState<string | undefined>(undefined);


  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);

  const { data: walletClient } = useWalletClient();


  const [selectedRepayCurrency, setSelectedRepayCurrency] =
    useState<string>(supportedTokens[0] || "");
  const [selectedRepayPercentage, setSelectedRepayPercentage] =
    useState<number>(10);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [repayAmountInUsd, setRepayAmountInUsd] = useState<number>(0);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [borrowPositions, setBorrowPositions] = useState<Array<{ asset: string; amount: string }>>([]);

  const publicClient = usePublicClient();
  const { marginState, reloadMarginState } = useMarginStore((s) => s);
  const { getBalance, refreshBalances } = useBalanceStore((s) => s);
  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);
  const fetchCollateralState = useFetchCollateralState(chainId, publicClient);
  const fetchBorrowState = useFetchBorrowState(chainId, publicClient);
  const fetchBorrowPositions = useFetchBorrowPositions(chainId, publicClient);
  const fetchDirectBorrowBalances = useFetchDirectBorrowBalances(chainId, publicClient);
  const [loading, setLoading] = useState(false);
  const [directBorrowBalances, setDirectBorrowBalances] = useState<{
    borrowedETH: bigint;
    borrowedUSDC: bigint;
    borrowedUSDT: bigint;
    borrowedETHRaw?: bigint;
    borrowedUSDCRaw?: bigint;
    borrowedUSDTRaw?: bigint;
  }>({ borrowedETH: 0n, borrowedUSDC: 0n, borrowedUSDT: 0n });

  // Inject fresh fetchers into the store to ensure state reloads use current closures
  const fetchers = useMemo(() => ({
    fetchAccountCheck,
    fetchCollateralState,
    fetchBorrowState,
  }), [fetchAccountCheck, fetchCollateralState, fetchBorrowState]);

  useEffect(() => {
    useMarginStore.getState().setFetchers(fetchers);
  }, [fetchers]);

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
        // Fallback for stablecoins if missing
        if (!data.USDC) data.USDC = 1;
        if (!data.USDT) data.USDT = 1;
        setPrices(data);
      } catch (e) {
        console.error("Error fetching prices:", e);
      }
    };
    fetchPrices();
  }, []);

  // Refresh balances and borrow positions only on wallet/network changes (not every tab switch)
  const hasLoadedRepayRef = useRef(false);
  const lastChainRepayRef = useRef<number | undefined>(undefined);
  const lastAddressRepayRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!chainId || !address || !publicClient) return;

    // Check if wallet or network actually changed
    const walletChanged = lastAddressRepayRef.current !== address;
    const networkChanged = lastChainRepayRef.current !== chainId;

    // Only fetch if wallet/network changed, or first load
    if (!hasLoadedRepayRef.current || walletChanged || networkChanged) {
      console.log('[RepayLoanTab] Loading borrow positions:', {
        reason: !hasLoadedRepayRef.current ? 'initial load' : walletChanged ? 'wallet changed' : 'network changed'
      });

      const refresh = async () => {
        try {
          const accounts = await fetchAccountCheck();
          const marginAccount = accounts[0];

          if (marginAccount) {
            // Fetch both borrow positions and direct borrow balances from contract
            const [positions, directBalances] = await Promise.all([
              fetchBorrowPositions(marginAccount),
              fetchDirectBorrowBalances(marginAccount)
            ]);

            setBorrowPositions(positions);
            setDirectBorrowBalances(directBalances);
          } else {
            setBorrowPositions([]);
            setDirectBorrowBalances({ borrowedETH: 0n, borrowedUSDC: 0n, borrowedUSDT: 0n });
          }

          hasLoadedRepayRef.current = true;
          lastChainRepayRef.current = chainId;
          lastAddressRepayRef.current = address;
        } catch (error) {
          console.error("Failed to load borrow positions in RepayLoanTab:", error);
        }
      };

      // Debounce to prevent rapid fetches
      const timer = setTimeout(refresh, 800);
      return () => clearTimeout(timer);
    } else {
      console.log('[RepayLoanTab] Using cached borrow positions');
    }
  }, [chainId, address, publicClient, fetchAccountCheck, fetchBorrowPositions, fetchDirectBorrowBalances]);

  // Get borrowed amount for a specific asset (using direct contract balances)
  const getBorrowedAmount = useCallback((asset: string): number => {
    // Use direct contract balances first (source of truth)
    if (asset === "ETH" || asset === "WETH") {
      const ethBorrowed = Number(directBorrowBalances.borrowedETH.toString());
      if (ethBorrowed > 0) return ethBorrowed;
    }
    if (asset === "USDC") {
      const usdcBorrowed = Number(directBorrowBalances.borrowedUSDC.toString());
      if (usdcBorrowed > 0) return usdcBorrowed;
    }
    if (asset === "USDT") {
      const usdtBorrowed = Number(directBorrowBalances.borrowedUSDT.toString());
      if (usdtBorrowed > 0) return usdtBorrowed;
    }

    // Fallback to positions
    const position = borrowPositions.find(p => p.asset === asset || (p.asset === "WETH" && asset === "ETH"));
    return position ? Number(position.amount) : 0;
  }, [directBorrowBalances, borrowPositions]);

  // Calculate total outstanding from borrow positions (more accurate than RiskEngine aggregate)
  // Track where the data is coming from for debugging
  const [dataSource, setDataSource] = useState<"positions" | "riskEngine" | "none">("none");


  const totalOutstandingUsd = useMemo(() => {
  const ethPrice = prices["ETH"] || 0;
  const usdcPrice = prices["USDC"] || 1;
  const usdtPrice = prices["USDT"] || 1;

  // DIRECT BALANCES ARE ALREADY HUMAN-READABLE (from your fetcher)
  const ethHuman = Number(directBorrowBalances.borrowedETH.toString());
  const usdcHuman = Number(directBorrowBalances.borrowedUSDC.toString());
  const usdtHuman = Number(directBorrowBalances.borrowedUSDT.toString());

  const directTotal = ethHuman * ethPrice + usdcHuman * usdcPrice + usdtHuman * usdtPrice;

  console.log(directTotal, "Here is your direct Total");

  // If direct balances exist, use them
  if (directTotal > 0) {
    console.log(`[RepayTab] Using direct contract balances - Total USD: ${directTotal.toFixed(2)}`);
    return directTotal;
  }

  // Fallback 1: borrowPositions (most accurate per-asset)
  if (borrowPositions.length > 0) {
    const positionsTotal = borrowPositions.reduce((sum, p) => {
      const price = prices[p.asset] || (p.asset === "WETH" ? prices["ETH"] : 0) || 0;
      return sum + Number(p.amount) * price;
    }, 0);
    console.log(`[RepayTab] Using borrowPositions – Total USD: ${positionsTotal.toFixed(2)}`);
    return positionsTotal;
  }

  // Fallback 2: RiskEngine aggregate
  const riskEngineValue = marginState?.borrowUsd || 0;
  if (riskEngineValue > 0) {
    console.log(`[RepayTab] Using RiskEngine value: ${riskEngineValue.toFixed(2)}`);
    return riskEngineValue;
  }

  return 0;
}, [directBorrowBalances, prices, borrowPositions, marginState]);

  
  useEffect(() => {
    const ethUSD = Number(directBorrowBalances.borrowedETH.toString()) * (prices["ETH"] || 0);
    const usdcUSD = Number(directBorrowBalances.borrowedUSDC.toString()) * (prices["USDC"] || 1);
    const usdtUSD = Number(directBorrowBalances.borrowedUSDT.toString()) * (prices["USDT"] || 1);
    const directTotal = ethUSD + usdcUSD + usdtUSD;

    if (directTotal > 0) {
      setDataSource("positions"); // Direct contract fetch (most accurate)
    } else if ((marginState?.borrowUsd || 0) > 0) {
      setDataSource("riskEngine");
    } else if (borrowPositions.length > 0) {
      setDataSource("positions");
    } else {
      setDataSource("none");
    }
  }, [directBorrowBalances, prices, borrowPositions, marginState]);



  // Derive stats directly from store state to ensure instant updates
  const repayStats = useMemo(() => ({
    netOutstandingAmountToPay: totalOutstandingUsd,
    availableBalance: getBorrowedAmount(selectedRepayCurrency),
    frozenBalance: marginState?.collateralUsd || 0,
  }), [totalOutstandingUsd, getBorrowedAmount, selectedRepayCurrency, marginState]);

  useEffect(() => {
    const price = prices[selectedRepayCurrency] || 0;
    setRepayAmountInUsd(Number(repayAmount) * price);
  }, [repayAmount, selectedRepayCurrency, prices]);

  // Format number to avoid scientific notation
  const formatAmount = (value: number, asset: string): string => {
    if (value === 0) return "0";
    const decimals = asset === "ETH" ? 18 : 6;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  };

  // Handler for percentage click
  const handlePercentageClick = (item: number) => {
    setSelectedRepayPercentage(item);
    const debt = marginState?.borrowUsd || 0;
    const targetUsd = (debt * item) / 100;
    const price = prices[selectedRepayCurrency] || 1;
    const amount = targetUsd / price;
    setRepayAmount(formatAmount(amount, selectedRepayCurrency));
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setRepayAmount(val);
    }
  };

  // Handler for pay now click
  const handlePayNowClick = () => {
    setIsPayNowPopupOpen(true);
  };

  // Handler for flash close click
  const handleFlashCloseClick = () => {
    setIsFlashClosePopupOpen(true);
  };

  const executeRepay = async () => {
    if (!walletClient || !publicClient || !chainId || !address) {
      setTxModalStatus("error");
      setTxModalTitle("Wallet Not Connected");
      setTxModalMessage("Please connect your wallet to continue.");
      setTxModalOpen(true);
      return;
    }

    const addressList = getAddressList(chainId);
    if (!addressList) {
      setTxModalStatus("error");
      setTxModalTitle("Unsupported Network");
      setTxModalMessage("This network is not supported.");
      setTxModalOpen(true);
      return;
    }

    const accounts = await fetchAccountCheck();
    if (!accounts.length) {
      setTxModalStatus("error");
      setTxModalTitle("No Margin Account");
      setTxModalMessage("No margin account found.");
      setTxModalOpen(true);
      return;
    }

    const marginAccount = accounts[0];
    const amountStr = repayAmount;
    const decimals = TOKEN_DECIMALS[selectedRepayCurrency] ?? 18;
    const parsedAmount = parseUnits(amountStr, decimals);

    setLoading(true);

    // Show pending modal
    setTxModalStatus("pending");
    setTxModalTitle("Processing Repayment");
    setTxModalMessage("Preparing repayment transaction...");
    setTxModalHash(undefined);
    setTxModalOpen(true);

    try {
      // 1. Deposit to Margin Account first (assuming paying from wallet)
      // Check allowance for ERC20 tokens (ETH is native and doesn't need allowance)
      const tokenAddress = tokenAddressByChain[chainId]?.[selectedRepayCurrency];

      if (selectedRepayCurrency !== "ETH") {
        if (!tokenAddress) throw new Error(`Token address not found for ${selectedRepayCurrency} on chain ${chainId}`);
        const allowance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, addressList.accountManagerContractAddress as `0x${string}`],
        }) as bigint;

        if (allowance < parsedAmount) {
          setTxModalMessage(`Approving ${selectedRepayCurrency}...`);
          // Use MAX_UINT256 so we only need to approve once
          const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          const approveHash = await walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [addressList.accountManagerContractAddress as `0x${string}`, MAX_UINT256],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // 2. Repay (Deposit + Repay logic handled by AccountManager if we use repay? No, usually separate)
      // Actually, AccountManager might have a function to repay from wallet?
      // Looking at LeverageAssetsTab, executeRepay with mode "WB" does: deposit -> repay.

      setTxModalMessage("Depositing for repayment...");
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

      setTxModalMessage("Repaying loan...");
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

      // Wait for next block to ensure state is updated on RPC
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh Margin State, Wallet Balances, Borrow Positions, and Direct Balances
      const [, , positions, directBalances] = await Promise.all([
        reloadMarginState(true),
        refreshBalances({ chainId, address, publicClient, marginAccount }),
        fetchBorrowPositions(marginAccount),
        fetchDirectBorrowBalances(marginAccount)
      ]);

      setBorrowPositions(positions);
      setDirectBorrowBalances(directBalances);

      // Show success modal
      setTxModalStatus("success");
      setTxModalTitle("Repayment Successful");
      setTxModalMessage(`Successfully repaid ${repayAmount} ${selectedRepayCurrency}!`);

      setRepayAmount("");
      setIsPayNowPopupOpen(false);

    } catch (error: any) {
      console.error(error);

      const isUserRejection =
        error?.code === 4001 ||
        error?.message?.includes("User rejected") ||
        error?.message?.includes("user rejected");

      // Show error modal
      setTxModalStatus("error");
      setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Repayment Failed");
      setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (error.message || "Repayment transaction failed"));
    } finally {
      setLoading(false);
    }
  };


  // Check if buttons should be disabled (when input is 0 or empty)
  const isInputEmpty = !repayAmount || Number(repayAmount) === 0;

  return (
    <motion.section
      className="w-full flex flex-col gap-[24px] pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <motion.section
        className="flex flex-col gap-[43px] h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Repay stats cards */}
        <motion.section
          className="flex justify-between gap-[12px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Map through repay stats */}
          {Object.entries(repayStats).map(([key, value], index) => {
            return (
              <motion.article
                key={key}
                className={`w-full flex flex-col justify-between h-[120px] rounded-[8px] border-[1px] p-[16px] ${isDark ? "bg-[#111111]" : "bg-white"
                  }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <motion.div
                  className={`text-[14px] font-medium max-w-[158.33px] ${isDark ? "text-[#919191]" : "text-[#9F9F9F]"
                    }`}
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
                      ? "Borrowed Balance"
                      : "Frozen Balance"}
                  {/* Debug badge for Net Outstanding */}

                </motion.div>
                <motion.div
                  className={`text-[24px] font-bold ${isDark ? "text-white" : "text-[#181822]"
                    }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.25 + index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  ${typeof value === 'number' ? value.toFixed(2) : value}
                </motion.div>
              </motion.article>
            );
          })}
        </motion.section>

        {/* Repay form */}
        <motion.article
          className={`w-full border-[1px] rounded-[16px] p-[20px] ${isDark ? "bg-[#111111]" : "bg-white"
            }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {/* Currency dropdown and percentage buttons */}
          <motion.header
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
              {DEPOSIT_PERCENTAGES.map((item: number, idx: number) => {
                return (
                  <motion.button
                    type="button"
                    key={item}
                    onClick={() => handlePercentageClick(item)}
                    className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${selectedRepayPercentage === item
                      ? `${PERCENTAGE_COLORS[item]} text-white`
                      : isDark
                        ? "bg-[#222222] text-white"
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
            </motion.div>
          </motion.header>

          {/* Amount input section */}
          <motion.section
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
                className={`w-fit text-[20px] focus:border-[0px] focus:outline-none font-medium transition-transform duration-200 focus:scale-[1.01] placeholder:text-[#C7C7C7] ${isDark ? "placeholder:text-[#A7A7A7]  text-white bg-[#111111]" : "bg-white"
                  }`}
                type="text"
                placeholder="0.0"
                value={repayAmount}
              />
            </motion.div>

            {/* USD value display */}
            <motion.p
              className={`text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"
                }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
              aria-live="polite"
            >
              {repayAmountInUsd.toFixed(2)} USD
            </motion.p>
          </motion.section>
        </motion.article>

        {/* Action buttons */}
        <motion.section
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
        </motion.section>
      </motion.section>

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

      {/* Transaction Status Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        status={txModalStatus}
        title={txModalTitle}
        message={txModalMessage}
        txHash={txModalHash}
        onClose={() => {
          setTxModalOpen(false);
        }}
        onRetry={
          txModalStatus === "error"
            ? () => {
              setTxModalOpen(false);
              // User can try again
            }
            : undefined
        }
      />
    </motion.section>
  );
};
