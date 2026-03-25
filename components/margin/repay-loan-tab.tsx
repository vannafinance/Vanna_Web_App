"use client";

/**
 * Repay Loan Tab
 *
 * HOW REPAY WORKS:
 * ================
 * The margin account already holds tokens (deposited as collateral).
 * To repay a loan, we call AccountManager.repay(marginAccount, token, amount)
 * which takes tokens FROM the margin account and sends them to the VToken pool.
 *
 * WHAT CHANGED (from old version):
 * - OLD: deposit from wallet -> margin account, THEN repay. Required 2 txns + approval.
 * - NEW: repay directly from margin balance. Single txn, no approval needed.
 *
 * STAT CARDS:
 * - "Net Outstanding Amount to Repay" = total borrow USD across all assets
 * - "Margin Balance" = margin account balance for selected token (what you CAN use to repay)
 * - "Total Collateral" = total collateral value in margin account
 *
 * PERCENTAGE BUTTONS:
 * - Calculate % of the DEBT for selected asset
 * - Capped by margin balance (can't repay more than you have in margin)
 *
 * VALIDATION:
 * - Amount must be > 0
 * - Amount must not exceed margin balance for selected token
 * - Amount must not exceed outstanding debt for selected token
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { Dropdown } from "../ui/dropdown";
import { Popup } from "@/components/ui/popup";
import { useMarginStore } from "@/store/margin-account-state";
import { useAccount, usePublicClient } from "wagmi";
import { useWalletConnection } from "@/lib/hooks/useWalletConnection";
import { useBalanceStore } from "@/store/balance-store";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";
import { useWalletClient } from "wagmi";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { tokenAddressByChain, TOKEN_DECIMALS } from "@/lib/utils/web3/token";
import AccountManager from "../../abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import { parseUnits } from "viem";
import { useFetchAccountCheck, useFetchCollateralState, useFetchBorrowState, useFetchBorrowPositions, useFetchDirectBorrowBalances } from "@/lib/utils/margin/marginFetchers";
import { useTheme } from "@/contexts/theme-context";
import { TransactionModal } from "@/components/ui/transaction-modal";
import { SwitchNetworkButton } from "@/components/ui/switch-network-button";
import { useRequiredNetwork } from "@/lib/hooks/useRequiredNetwork";

export const RepayLoanTab = () => {
  const { isDark } = useTheme();

  const { chainId, address } = useAccount();

  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalStatus, setTxModalStatus] = useState<"pending" | "success" | "error">("pending");
  const [txModalTitle, setTxModalTitle] = useState("");
  const [txModalMessage, setTxModalMessage] = useState("");
  const [txModalHash, setTxModalHash] = useState<string | undefined>(undefined);

  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? ["ETH", "USDC", "USDT"];
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
  }>({ borrowedETH: BigInt(0), borrowedUSDC: BigInt(0), borrowedUSDT: BigInt(0) });

  // Inject fresh fetchers into the store
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
        if (!data.USDC) data.USDC = 1;
        if (!data.USDT) data.USDT = 1;
        setPrices(data);
      } catch (e) {
        console.error("Error fetching prices:", e);
      }
    };
    fetchPrices();
  }, []);

  // Refresh balances and borrow positions on wallet/network changes
  const hasLoadedRepayRef = useRef(false);
  const lastChainRepayRef = useRef<number | undefined>(undefined);
  const lastAddressRepayRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!chainId || !address || !publicClient) return;

    const walletChanged = lastAddressRepayRef.current !== address;
    const networkChanged = lastChainRepayRef.current !== chainId;

    if (!hasLoadedRepayRef.current || walletChanged || networkChanged) {
      console.log('[RepayLoanTab] Loading borrow positions:', {
        reason: !hasLoadedRepayRef.current ? 'initial load' : walletChanged ? 'wallet changed' : 'network changed'
      });

      const refresh = async () => {
        try {
          const accounts = await fetchAccountCheck();
          const marginAccount = accounts[0];

          if (marginAccount) {
            const [positions, directBalances] = await Promise.all([
              fetchBorrowPositions(marginAccount),
              fetchDirectBorrowBalances(marginAccount)
            ]);

            setBorrowPositions(positions as Array<{ asset: string; amount: string }>);
            setDirectBorrowBalances(directBalances);

            // Also refresh balance store so we have margin balances
            await refreshBalances({ chainId, address, publicClient, marginAccount });
          } else {
            setBorrowPositions([]);
            setDirectBorrowBalances({ borrowedETH: BigInt(0), borrowedUSDC: BigInt(0), borrowedUSDT: BigInt(0) });
          }

          hasLoadedRepayRef.current = true;
          lastChainRepayRef.current = chainId;
          lastAddressRepayRef.current = address;
        } catch (error) {
          console.error("Failed to load borrow positions in RepayLoanTab:", error);
        }
      };

      const timer = setTimeout(refresh, 800);
      return () => clearTimeout(timer);
    }
  }, [chainId, address, publicClient, fetchAccountCheck, fetchBorrowPositions, fetchDirectBorrowBalances, refreshBalances]);

  // =====================================================
  // Get BORROWED amount for selected asset (what you OWE)
  // Source: VToken.getBorrowBalance via direct contract reads
  // =====================================================
  const getBorrowedAmount = useCallback((asset: string): number => {
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

    const position = borrowPositions.find(p => p.asset === asset || (p.asset === "WETH" && asset === "ETH"));
    return position ? Number(position.amount) : 0;
  }, [directBorrowBalances, borrowPositions]);

  // =====================================================
  // Get MARGIN BALANCE for selected asset (what you HAVE to repay with)
  // Source: ERC20.balanceOf(marginAccount) via balance store
  // KEY FIX: This is what was missing - we need to show margin balance,
  //          not wallet balance, because repay uses margin funds
  // =====================================================
  const getMarginBalance = useCallback((asset: string): number => {
    return getBalance(asset, "MB");
  }, [getBalance]);

  // Total outstanding borrow in USD
  const totalOutstandingUsd = useMemo(() => {
    const ethPrice = prices["ETH"] || 0;
    const usdcPrice = prices["USDC"] || 1;
    const usdtPrice = prices["USDT"] || 1;

    const ethHuman = Number(directBorrowBalances.borrowedETH.toString());
    const usdcHuman = Number(directBorrowBalances.borrowedUSDC.toString());
    const usdtHuman = Number(directBorrowBalances.borrowedUSDT.toString());

    const directTotal = ethHuman * ethPrice + usdcHuman * usdcPrice + usdtHuman * usdtPrice;

    if (directTotal > 0) return directTotal;

    if (borrowPositions.length > 0) {
      return borrowPositions.reduce((sum, p) => {
        const price = prices[p.asset] || (p.asset === "WETH" ? prices["ETH"] : 0) || 0;
        return sum + Number(p.amount) * price;
      }, 0);
    }

    return marginState?.borrowUsd || 0;
  }, [directBorrowBalances, prices, borrowPositions, marginState]);

  // =====================================================
  // STAT CARDS - Updated to show margin balance
  // OLD: "Borrowed Balance" showed the borrow amount (confusing)
  // NEW: "Margin Balance" shows what's available in margin account to repay
  // =====================================================
  const repayStats = useMemo(() => ({
    netOutstandingAmountToPay: totalOutstandingUsd,
    marginBalance: getMarginBalance(selectedRepayCurrency),
    totalCollateral: marginState?.collateralUsd || 0,
  }), [totalOutstandingUsd, getMarginBalance, selectedRepayCurrency, marginState]);

  // Stat card labels
  const statLabels: Record<string, string> = {
    netOutstandingAmountToPay: "Net Outstanding Amount to Repay",
    marginBalance: "Margin Balance",
    totalCollateral: "Total Collateral",
  };

  useEffect(() => {
    const price = prices[selectedRepayCurrency] || 0;
    setRepayAmountInUsd(Number(repayAmount) * price);
  }, [repayAmount, selectedRepayCurrency, prices]);

  // Format number for display
  const formatAmount = (value: number, asset: string): string => {
    if (value === 0) return "0";
    const decimals = asset === "ETH" ? 8 : 6;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  };

  // =====================================================
  // PERCENTAGE BUTTONS - Calculate % of DEBT, capped by margin balance
  // Example: 50% of $1000 debt = $500, but if margin only has $300 USDC,
  //          we cap at $300 (can't repay more than you have)
  // =====================================================
  const handlePercentageClick = (item: number) => {
    setSelectedRepayPercentage(item);

    // Get the debt for selected asset
    const debtAmount = getBorrowedAmount(selectedRepayCurrency);
    // Get what's available in margin account
    const marginBal = getMarginBalance(selectedRepayCurrency);

    // Target: % of debt
    const targetAmount = (debtAmount * item) / 100;
    // Cap by margin balance (can't repay more than what's in margin)
    const cappedAmount = Math.min(targetAmount, marginBal);

    setRepayAmount(formatAmount(cappedAmount, selectedRepayCurrency));
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setRepayAmount(val);
    }
  };

  const handlePayNowClick = () => { setIsPayNowPopupOpen(true); };
  const handleFlashCloseClick = () => { setIsFlashClosePopupOpen(true); };
  const handleClosePayNowPopup = () => { setIsPayNowPopupOpen(false); };
  const handleCloseFlashClosePopup = () => { setIsFlashClosePopupOpen(false); };

  // =====================================================
  // VALIDATION
  // - Amount > 0
  // - Amount <= margin balance (can't repay with funds you don't have)
  // - Amount <= debt for that asset (can't overpay)
  // =====================================================
  const marginBal = getMarginBalance(selectedRepayCurrency);
  const debtAmount = getBorrowedAmount(selectedRepayCurrency);
  const numericAmount = Number(repayAmount) || 0;

  const isInputEmpty = !repayAmount || numericAmount === 0;
  const exceedsMarginBalance = numericAmount > marginBal;
  const exceedsDebt = numericAmount > debtAmount && debtAmount > 0;
  const isDisabled = isInputEmpty || exceedsMarginBalance || exceedsDebt;

  // Validation message
  const validationError = useMemo(() => {
    if (isInputEmpty) return null;
    if (exceedsMarginBalance) return `Exceeds margin balance (${formatAmount(marginBal, selectedRepayCurrency)} ${selectedRepayCurrency} available)`;
    if (exceedsDebt) return `Exceeds outstanding debt (${formatAmount(debtAmount, selectedRepayCurrency)} ${selectedRepayCurrency} owed)`;
    return null;
  }, [isInputEmpty, exceedsMarginBalance, exceedsDebt, marginBal, debtAmount, selectedRepayCurrency]);

  // =====================================================
  // EXECUTE REPAY
  // KEY FIX: No deposit step! Repay directly from margin balance.
  //
  // OLD FLOW (wrong):
  //   1. approve token for AccountManager
  //   2. deposit from wallet -> margin account
  //   3. repay from margin account -> VToken
  //
  // NEW FLOW (correct):
  //   1. repay from margin account -> VToken (single txn!)
  //
  // The margin account already holds the tokens as collateral.
  // AccountManager.repay() takes tokens FROM the margin account
  // and sends them to the VToken pool to reduce debt.
  // =====================================================
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
    setTxModalMessage(`Repaying ${repayAmount} ${selectedRepayCurrency} from margin balance...`);
    setTxModalHash(undefined);
    setTxModalOpen(true);

    try {
    //  repay directly from margin account balance
      
      const tokenAddress = selectedRepayCurrency === "ETH"
        ? addressList.wethTokenAddress as `0x${string}`
        : tokenAddressByChain[chainId]?.[selectedRepayCurrency];

      if (!tokenAddress) throw new Error(`Token address not found for ${selectedRepayCurrency}`);

      const txHash = await walletClient.writeContract({
        address: addressList.accountManagerContractAddress as `0x${string}`,
        abi: AccountManager.abi,
        functionName: "repay",
        args: [marginAccount, tokenAddress, parsedAmount]
      });

      setTxModalMessage("Waiting for confirmation...");
      setTxModalHash(txHash);
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Wait for next block to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh all state: margin, balances, borrow positions
      const [, , positions, directBalances] = await Promise.all([
        reloadMarginState(true),
        refreshBalances({ chainId, address, publicClient, marginAccount }),
        fetchBorrowPositions(marginAccount),
        fetchDirectBorrowBalances(marginAccount)
      ]);

      setBorrowPositions(positions as Array<{ asset: string; amount: string }>);
      setDirectBorrowBalances(directBalances);

      // Show success modal
      setTxModalStatus("success");
      setTxModalTitle("Repayment Successful");
      setTxModalMessage(`Successfully repaid ${repayAmount} ${selectedRepayCurrency} from margin balance!`);

      setRepayAmount("");
      setIsPayNowPopupOpen(false);

      // Notify position components to refetch
      setTimeout(() => window.dispatchEvent(new CustomEvent("vanna:position-update")), 2000);

    } catch (error: any) {
      console.error(error);

      const isUserRejection =
        error?.code === 4001 ||
        error?.message?.includes("User rejected") ||
        error?.message?.includes("user rejected");

      setTxModalStatus("error");
      setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Repayment Failed");
      setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (error.message || "Repayment transaction failed"));
    } finally {
      setLoading(false);
    }
  };

  const { isConnected: isWalletConnected, login: privyLogin } = useWalletConnection();
  const { isWrongNetwork } = useRequiredNetwork();

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
          className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-[12px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {Object.entries(repayStats).map(([key, value], index) => {
            return (
              <motion.article
                key={key}
                className={`w-full flex flex-col justify-between h-auto min-h-[100px] sm:h-[120px] rounded-[8px] border-[1px] p-3 sm:p-[16px] ${isDark ? "bg-[#111111]" : "bg-white"
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
                  {statLabels[key] || key}
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
                  {/* Show token amount for margin balance, USD for others */}
                  {key === "marginBalance"
                    ? `${typeof value === 'number' ? value.toFixed(value < 1 ? 6 : 2) : value} ${selectedRepayCurrency}`
                    : `$${typeof value === 'number' ? value.toFixed(2) : value}`}
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
            className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
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
              className="flex gap-2 sm:gap-[8px] flex-wrap"
              role="group"
              aria-label="Repay percentage"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            >
              {DEPOSIT_PERCENTAGES.map((item: number, idx: number) => {
                return (
                  <motion.button
                    type="button"
                    key={item}
                    onClick={() => handlePercentageClick(item)}
                    className={`h-[40px] sm:h-[44px] w-auto min-w-[60px] sm:w-[95px] text-center text-[13px] sm:text-[14px] text-medium cursor-pointer ${selectedRepayPercentage === item
                      ? `${PERCENTAGE_COLORS[item]} text-white`
                      : isDark
                        ? "bg-[#222222] text-white"
                        : "bg-[#F4F4F4]"
                      } p-2 sm:p-[10px] rounded-[12px]`}
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
                className={`w-full text-[20px] focus:border-[0px] focus:outline-none font-medium transition-transform duration-200 focus:scale-[1.01] placeholder:text-[#C7C7C7] bg-transparent ${isDark ? "placeholder:text-[#A7A7A7] text-white" : ""
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

            {/* Validation error message */}
            {validationError && (
              <motion.p
                className="text-[12px] font-medium text-red-500"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {validationError}
              </motion.p>
            )}
          </motion.section>
        </motion.article>

        {/* Action buttons */}
        <motion.section
          className="flex flex-col gap-[16px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.5,
            }}
            whileHover={isDisabled ? {} : { scale: 1.02 }}
            whileTap={isDisabled ? {} : { scale: 0.98 }}
          >
            {isWrongNetwork ? (
              <SwitchNetworkButton />
            ) : !isWalletConnected ? (
              <button
                onClick={privyLogin}
                className="w-full py-[14px] rounded-[12px] text-[15px] font-semibold text-white bg-[#AAAAAA] hover:bg-[#999999] transition-all cursor-pointer"
              >
                Connect Wallet
              </button>
            ) : (
              <Button
                text="Pay Now"
                size="large"
                type="gradient"
                onClick={handlePayNowClick}
                disabled={isDisabled}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.6,
            }}
            whileHover={isDisabled ? {} : { scale: 1.02 }}
            whileTap={isDisabled ? {} : { scale: 0.98 }}
          >
            <Button
              text="Flash Close"
              size="large"
              type="ghost"
              onClick={handleFlashCloseClick}
              disabled={isDisabled}
            />
          </motion.div>
        </motion.section>
      </motion.section>

      {/* Pay Now popup */}
      <AnimatePresence>
        {isPayNowPopupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] px-4"
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
                description={`Repay ${repayAmount} ${selectedRepayCurrency} from your margin balance. This will reduce your outstanding debt.`}
                buttonText="Confirm Repay"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566] px-4"
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
            }
            : undefined
        }
      />
    </motion.section>
  );
};
