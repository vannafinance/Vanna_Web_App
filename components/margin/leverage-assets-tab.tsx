"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo, MarginState } from "@/lib/types";

import { SUPPORTED_TOKENS_BY_CHAIN, TOKEN_DECIMALS, tokenAddressByChain, vTokenAddressByChain } from "@/lib/utils/web3/token";

import { BALANCE_TYPE_OPTIONS, MAX_LEVERAGE } from "@/lib/constants/margin";
import { Button } from "@/components/ui/button";
import { Collateral } from "./collateral-box";
import { BorrowBox } from "./borrow-box";
import { Dialogue } from "@/components/ui/dialogue";
import { InfoCard } from "./info-card";
import { Dropdown } from "../ui/dropdown";
import { Checkbox } from "../ui/Checkbox";
import { Radio } from "../ui/radio-button";
import Image from "next/image";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { MBSelectionGrid } from "./mb-selection-grid";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useUserStore } from "@/store/user";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import AccountManager from "../../abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import Registry from "../../abi/vanna/out/out/Registry.sol/Registry.json";
import ERC20 from "../../abi/vanna/out/out/ERC20.sol/ERC20.json"
import RiskEngine from "../../abi/vanna/out/out/RiskEngine.sol/RiskEngine.json"
import { toast } from "sonner"
import { PoolTable } from "@/lib/utils/margin/types";
import { baseAddressList, arbAddressList, opAddressList } from "@/lib/web3Constants";
import { erc20Abi, formatUnits, parseEther, parseUnits } from "viem";
import { iconPaths } from "@/lib/constants";

///lib/utils/margim/calculation iumport
import marginCalc from "@/lib/utils/margin/calculations"
import { depositTx, withdrawTx } from "@/lib/utils/margin/transactions";
import { useMarginStore } from "@/store/margin-account-state";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { useFetchAccountCheck, useFetchBorrowState, useFetchCollateralState, useFetchBorrowPositions } from "@/lib/utils/margin/marginFetchers";
import { useBalanceStore } from "@/store/balance-store";
import { useTheme } from "@/contexts/theme-context";
import { TransactionModal } from "@/components/ui/transaction-modal";



type Modes = "Deposit" | "Borrow";
type AddressList = typeof baseAddressList;

export const LeverageAssetsTab = () => {
  const { isDark } = useTheme();

  // Component state
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);
  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);
  const [borrowAsset, setBorrowAsset] = useState<string>("USDC");
  const [leverage, setLeverage] = useState(2);
  const address = useUserStore((state) => state.address);
  const marginState = useMarginStore((s) => s.marginState);
  const [marginAccountAddress, setMarginAccountAddress] = useState<`0x${string}` | undefined>(undefined);
  // Initialize prices with stablecoin defaults
  const [prices, setPrices] = useState<Record<string, number>>({
    USDC: 1,
    USDT: 1,
  });

  // Wagmi hooks
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showError = (msg: string, duration = 2500) => {
    setError(msg);

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }

    errorTimerRef.current = setTimeout(() => {
      setError(null);
      errorTimerRef.current = null;
    }, duration);
  };


  useEffect(() => {
  return () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
  };
}, []);





  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalStatus, setTxModalStatus] = useState<"pending" | "success" | "error">("pending");
  const [txModalTitle, setTxModalTitle] = useState("");
  const [txModalMessage, setTxModalMessage] = useState("");
  const [txModalHash, setTxModalHash] = useState<string | undefined>(undefined);

  // zustand state 

  const { reloadMarginState } = useMarginStore();

  // zustand Balance store 

  const walletBalances = useBalanceStore(s => s.walletBalances);
  const marginBalances = useBalanceStore(s => s.marginBalances);
  const getBalance = useBalanceStore(s => s.getBalance);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();

        // Ensure stablecoins always have $1 price if missing from API
        const updatedPrices = {
          USDC: data.USDC ?? 1,
          USDT: data.USDT ?? 1,
          ...data, // Spread other prices from API
        };

        setPrices(updatedPrices);
        console.log("[Prices] Fetched prices:", updatedPrices);
      } catch (e) {
        console.error("[Prices] Error fetching prices:", e);
        // Keep initial stablecoin prices even if fetch fails
      }
    };
    fetchPrices();
  }, []);

  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);

  const deposit = (asset: string, amount: string) => depositTx({
    walletClient,
    publicClient,
    chainId,
    fetchAccountCheck,
    asset,
    amount
  }
  );
  // Margin account creation Flow  
  const handlecreateAccount = async () => {
    const addressList = getAddressList(chainId!);
    if (!addressList) {
      toast("Unsupported network")
      setLoadingMessage("Unsupported network");
      setTimeout(() => setLoadingMessage(""), 2000);
      return;
    }

    if (!address || !publicClient || !walletClient || !chainId) {
      toast("Wallet not ready");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Checking existing accounts...");

      const accounts = await publicClient.readContract({
        address: addressList.registryContractAddress as `0x${string}`,
        abi: Registry.abi,
        functionName: "accountsOwnedBy",
        args: [address],
      });

      if ((accounts as any[]).length > 0) {
        setLoadingMessage("Account found!");
        setHasMarginAccount({ hasMarginAccount: true });
        setActiveDialogue("deposit-earn");
        return;
      }

      setLoadingMessage("Preparing transaction...");

      const { request } = await publicClient.simulateContract({
        address: addressList.accountManagerContractAddress as `0x${string}`,
        abi: AccountManager.abi,
        functionName: "openAccount",
        args: [address],
        account: address,
      });

      setLoadingMessage("Please confirm transaction in your wallet...");
      const txHash = await walletClient.writeContract(request);

      setLoadingMessage("Transaction submitted. Waiting for confirmation...");
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setLoadingMessage("Success! Account created.");
      setHasMarginAccount({ hasMarginAccount: true });

      setTimeout(() => {
        setActiveDialogue("deposit-earn");
        toast("Margin account Created")
      }, 1000);

    } catch (err: any) {
      toast("Margin account creation failed", err);

      if (err?.code === 4001) {
        setLoadingMessage("Transaction rejected");
        setTimeout(() => {
          setActiveDialogue("none");
          setLoadingMessage("");
        }, 1500);
      } else {
        setLoadingMessage("Transaction failed. Please try again.");
        setTimeout(() => setLoadingMessage(""), 3000);
      }
    } finally {
      setLoading(false);
    }
  };


  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);
  const fetchCollateralState = useFetchCollateralState(chainId, publicClient);
  const fetchBorrowState = useFetchBorrowState(chainId, publicClient);
  const fetchBorrowPositions = useFetchBorrowPositions(chainId, publicClient);

  const simulateStrategy = useCallback((
    state: MarginState | null,
    additionalCollateralUsd: number,
    additionalBorrowUsd: number
  ) => {
    const currentCollateral = state?.collateralUsd || 0;
    const currentDebt = state?.borrowUsd || 0;

    // Risk Engine logic: Borrowed funds are added to collateral balance for the check
    const newCollateralUsd = currentCollateral + additionalCollateralUsd;
    const newDebtUsd = currentDebt + additionalBorrowUsd;

    const newHF = marginCalc.calcHF(newCollateralUsd, newDebtUsd);
    const newLTV = marginCalc.calcLTV(newCollateralUsd, newDebtUsd);
    const projectedMaxBorrow = marginCalc.calcMaxBorrow(newCollateralUsd, newDebtUsd);

    return { newHF, newLTV, projectedMaxBorrow, newCollateralUsd, newDebtUsd };
  }, []);

  // New: HF signals (colors and warnings)
  const getHFColor = (hf: number) => {
    if (hf > 1.5) return 'green';
    if (hf > 1.3) return 'yellow';
    if (hf > 1.1) return 'orange';
    return 'red';
  };

  const getHFWarning = (hf: number) => {
    if (hf <= 1.0) return "Will liquidate";
    if (hf < 1.1) return "High Liquidation Risk";
    if (hf < 1.3) return "Low HF";
    return null;
  };

  const normalizeBorrowUsd = (asset: string, amount: string): number => {
    const price = prices[asset] || 0;
    return Number(amount) * price;
  };

  const validateBorrowRisk = (state: MarginState, totalUsd: number): boolean => {
    const { newHF, newLTV } = simulateStrategy(state, 0, totalUsd);
    if (newHF <= 1.0) {
      setTxModalStatus("error");
      setTxModalTitle("Risk Too High");
      setTxModalMessage("Borrow would put account into liquidation. Please reduce borrow amount or add more collateral.");
      setTxModalOpen(true);
      return false;
    }

    if (newLTV > 0.9) {
      setTxModalStatus("error");
      setTxModalTitle("LTV Limit Exceeded");
      setTxModalMessage("Borrow exceeds 90% Loan-to-Value ratio. Please reduce borrow amount.");
      setTxModalOpen(true);
      return false;
    }

    return true;
  };

  /**
   * Preflight check: calls RiskEngine.isBorrowAllowed() to verify borrow won't revert
   * This prevents MetaMask from showing absurd gas fees when tx would revert
   */
  const canBorrow = async (
    marginAccount: string,
    asset: string,
    amount: string
  ): Promise<{ allowed: boolean; error?: string }> => {
    const addressList = getAddressList(chainId);
    if (!addressList) return { allowed: false, error: "Unsupported chain" };

    const decimals = TOKEN_DECIMALS[asset] ?? 18;
    const parsed = parseUnits(amount, decimals);

    // Get token address (for ETH, use WETH address or special handling)
    let tokenAddress: `0x${string}`;
    if (asset === "ETH" || asset === "WETH") {
      tokenAddress = addressList.wethTokenAddress as `0x${string}`;
    } else {
      const token = tokenAddressByChain[chainId!]?.[asset];
      if (!token) return { allowed: false, error: `Token ${asset} not supported` };
      tokenAddress = token;
    }

    // Enhanced logging for debugging
    console.log(`[Borrow Check] Chain: ${chainId}, Asset: ${asset}, Amount: ${amount}`);
    console.log(`[Borrow Check] Token Address: ${tokenAddress}`);
    console.log(`[Borrow Check] Margin Account: ${marginAccount}`);
    console.log(`[Borrow Check] Parsed Amount: ${parsed.toString()} (${decimals} decimals)`);
    console.log(`[Borrow Check] Current Margin State:`, marginState);

    try {
      // Call RiskEngine.isBorrowAllowed() - this is a view function that simulates the borrow
      const isAllowed = await publicClient!.readContract({
        address: addressList.riskEngineContractAddress as `0x${string}`,
        abi: RiskEngine.abi,
        functionName: "isBorrowAllowed",
        args: [marginAccount, tokenAddress, parsed],
      });

      console.log(`[Borrow Check] RiskEngine.isBorrowAllowed returned:`, isAllowed);

      if (!isAllowed) {
        return { allowed: false, error: "Borrow would violate health factor. Need more collateral or lower borrow amount." };
      }

      return { allowed: true };
    } catch (err: any) {
      console.error("[Borrow Check] Preflight check FAILED:", err);
      console.error("[Borrow Check] Full error:", JSON.stringify(err, null, 2));

      // Parse common revert reasons
      const msg = err?.message || "";
      const shortMsg = err?.shortMessage || "";
      const errorStr = `${msg} ${shortMsg}`.toLowerCase();

      if (errorStr.includes("insufficient liquidity") || errorStr.includes("liquidity")) {
        return { allowed: false, error: "Insufficient liquidity in lending pool" };
      }
      if (errorStr.includes("oracle") || errorStr.includes("price")) {
        return { allowed: false, error: "Oracle price unavailable for this asset on Arbitrum. Try Base or Optimism." };
      }
      if (errorStr.includes("health factor") || errorStr.includes("healthfactor")) {
        return { allowed: false, error: "Health factor too low. Need more collateral." };
      }
      if (errorStr.includes("minimum") || errorStr.includes("min")) {
        return { allowed: false, error: "Amount below minimum threshold" };
      }

      return { allowed: false, error: `Borrow check failed: ${shortMsg || msg || "Unknown error"}` };
    }
  };

  const borrowTx = async (
    marginAccount: string,
    asset: string,
    amount: string
  ) => {
    const addressList = getAddressList(chainId);
    if (!addressList) throw new Error("Unsupported chain");

    // Preflight check to prevent MetaMask gas estimation failure
    const preflightResult = await canBorrow(marginAccount, asset, amount);
    if (!preflightResult.allowed) {
      throw new Error(preflightResult.error || "Borrow not allowed");
    }

    const decimals = TOKEN_DECIMALS[asset] ?? 18;
    const parsed = parseUnits(amount, decimals);

    // Get token address (use WETH for ETH)
    let token: `0x${string}`;
    if (asset === "ETH" || asset === "WETH") {
      token = addressList.wethTokenAddress as `0x${string}`;
    } else {
      const tokenAddr = tokenAddressByChain[chainId!]?.[asset];
      if (!tokenAddr) throw new Error(`Token mapping not found for ${asset}`);
      token = tokenAddr;
    }

    return walletClient!.writeContract({
      address: addressList.accountManagerContractAddress as `0x${string}`,
      abi: AccountManager.abi,
      functionName: "borrow",
      args: [marginAccount, token, parsed],
    });
  };

  const executeBorrow = async ({
    collateralAsset,
    collateralAmount,
    borrowAsset,
    borrowAmount,
    mode,
  }: {
    collateralAsset: string;
    collateralAmount: string;
    borrowAsset: string;
    borrowAmount: string;
    mode: "MB" | "WB";
  }) => {
    if (!walletClient || !publicClient || !chainId || !address) {
      return toast.error("Wallet not ready");
    }

    const addressList = getAddressList(chainId);
    if (!addressList) return toast.error("Unsupported network");

    const accounts = await fetchAccountCheck();
    if (!accounts.length) return toast.error("No Margin Account found");

    const marginAccount = accounts[0];
    let state = marginState || (await reloadMarginState());
    if (!state) return toast.error("Margin state missing");

    const amountUsd = normalizeBorrowUsd(borrowAsset, borrowAmount);

    if (mode === "MB") {
      if (state.collateralUsd <= 0) {
        return toast.error("Insufficient collateral in Margin Account. Deposit collateral first.");
      }

      console.log(`[Borrow] Attempting to borrow ${borrowAmount} ${borrowAsset} (${amountUsd} USD)`);
      console.log(`[Borrow] Current collateral: ${state.collateralUsd} USD`);
      console.log(`[Borrow] Current debt: ${state.borrowUsd} USD`);
      console.log(`[Borrow] Max borrow available: ${state.maxBorrow} USD`);
      console.log(`[Borrow] Current HF: ${state.hf}`);

      if (amountUsd > state.maxBorrow) {
        return toast.error(`Borrow amount ($${amountUsd.toFixed(2)}) exceeds max borrowing power ($${state.maxBorrow.toFixed(2)}). Reduce amount or add more collateral.`);
      }

      if (!validateBorrowRisk(state, amountUsd)) return;

      // Show pending modal
      setTxModalStatus("pending");
      setTxModalTitle("Processing Borrow");
      setTxModalMessage("Checking borrow eligibility and submitting transaction...");
      setTxModalHash(undefined);
      setTxModalOpen(true);

      try {
        const txHash = await borrowTx(marginAccount, borrowAsset, borrowAmount);
        setTxModalMessage("Borrow transaction submitted. Waiting for confirmation...");

        await reloadMarginState();

        // Show success modal
        setTxModalStatus("success");
        setTxModalTitle("Borrow Successful");
        setTxModalMessage(`Successfully borrowed ${borrowAmount} ${borrowAsset}!`);
        setTxModalHash(txHash);
      } catch (err: any) {
        console.error("[Borrow] Transaction error:", err);
        const isUserRejection =
          err?.code === 4001 ||
          err?.message?.includes("User rejected") ||
          err?.message?.includes("user rejected");

        // Show error modal
        setTxModalStatus("error");
        setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Borrow Failed");
        setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (err.message || "Borrow transaction failed"));
        console.error("[Borrow] Full error details:", JSON.stringify(err, null, 2));
      }
      return;
    }

    if (mode === "WB") {
      if (!collateralAmount || Number(collateralAmount) <= 0) {
        return toast.error("Deposit amount required in WB mode");
      }

      const depositUsd = Number(collateralAmount) * (prices[collateralAsset] || 0);

      console.log(`[WB Mode] Depositing ${collateralAmount} ${collateralAsset} (~$${depositUsd.toFixed(2)})`);
      console.log(`[WB Mode] Then borrowing ${borrowAmount} ${borrowAsset} (~$${amountUsd.toFixed(2)})`);

      // Show pending modal
      setTxModalStatus("pending");
      setTxModalTitle("Processing Deposit & Borrow");
      setTxModalMessage("Depositing collateral to margin account...");
      setTxModalHash(undefined);
      setTxModalOpen(true);

      try {
        await deposit(collateralAsset, collateralAmount);
        setTxModalMessage("Deposit complete. Refreshing account state...");

        state = await reloadMarginState();
        if (!state) {
          setTxModalStatus("error");
          setTxModalTitle("State Refresh Failed");
          setTxModalMessage("Failed to refresh margin account state");
          return;
        }

        console.log(`[WB Mode] After deposit - Collateral: ${state.collateralUsd} USD, Max Borrow: ${state.maxBorrow} USD`);

        if (amountUsd > state.maxBorrow) {
          setTxModalStatus("error");
          setTxModalTitle("Borrow Limit Exceeded");
          setTxModalMessage(`Borrow amount ($${amountUsd.toFixed(2)}) exceeds max borrow ($${state.maxBorrow.toFixed(2)}) after deposit`);
          return;
        }

        if (!validateBorrowRisk(state, amountUsd)) {
          setTxModalOpen(false);
          return;
        }

        setTxModalMessage("Checking borrow eligibility...");
        const txHash = await borrowTx(marginAccount, borrowAsset, borrowAmount);
        setTxModalMessage("Borrow submitted. Waiting for confirmation...");
        await reloadMarginState();

        // Show success modal
        setTxModalStatus("success");
        setTxModalTitle("Transaction Successful");
        setTxModalMessage(`Successfully deposited ${collateralAmount} ${collateralAsset} and borrowed ${borrowAmount} ${borrowAsset}!`);
        setTxModalHash(txHash);
      } catch (err: any) {
        console.error("[WB Mode] Deposit+Borrow error:", err);
        const isUserRejection =
          err?.code === 4001 ||
          err?.message?.includes("User rejected") ||
          err?.message?.includes("user rejected");

        // Show error modal
        setTxModalStatus("error");
        setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Operation Failed");
        setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (err.message || "Deposit and borrow operation failed"));
        console.error("[WB Mode] Full error:", JSON.stringify(err, null, 2));
      }
      return;
    }
  };

  const executeDualBorrow = async ({
    items,
    collateralAsset,
    collateralAmount,
    mode,
  }: {
    items: { asset: string; amount: string }[];
    collateralAsset: string;
    collateralAmount: string;
    mode: "MB" | "WB";
  }) => {
    if (!walletClient || !publicClient || !chainId || !address) {
      return toast.error("Wallet not ready");
    }

    const addressList = getAddressList(chainId);
    if (!addressList) return toast.error("Unsupported network");

    const accounts = await fetchAccountCheck();
    if (!accounts.length) return toast.error("No Margin Account found");

    const marginAccount = accounts[0];
    let state = marginState || (await reloadMarginState());
    if (!state) return toast.error("Margin state missing");

    const totalUsd = items
      .map(i => normalizeBorrowUsd(i.asset, i.amount))
      .reduce((a, b) => a + b, 0);

    if (totalUsd <= 0) return toast.error("Invalid borrow amounts");

    if (mode === "WB") {
      if (!collateralAmount || Number(collateralAmount) <= 0) {
        return toast.error("Deposit required in WB mode");
      }

      toast("Depositing collateral...");
      await deposit(collateralAsset, collateralAmount);

      state = await reloadMarginState();
      if (!state) return toast.error("State refresh failed");
    }

    if (totalUsd > state.maxBorrow) {
      return toast.error("Dual borrow exceeds leverage");
    }

    if (!validateBorrowRisk(state, totalUsd)) return;

    toast("Borrowing multiple assets...");

    for (const i of items) {
      await borrowTx(marginAccount, i.asset, i.amount);
    }

    await reloadMarginState();
    return toast.success("Dual Borrow completed!");
  };

  const repayTx = async (marginAccount: string, asset: string, amount: string) => {
    const addressList = getAddressList(chainId);
    if (!addressList) throw new Error("Unsupported chain");

    const decimals = TOKEN_DECIMALS[asset] ?? 18;
    const parsed = parseUnits(amount, decimals);

    if (asset === "ETH" || asset === "WETH") {
      return walletClient!.writeContract({
        address: addressList.accountManagerContractAddress as `0x${string}`,
        abi: AccountManager.abi,
        functionName: "repayEth",
        args: [marginAccount, parsed],
      });
    }

    const token = tokenAddressByChain[chainId!]?.[asset];
    if (!token) throw new Error(`Unknown token ${asset}`);

    return walletClient!.writeContract({
      address: addressList.accountManagerContractAddress as `0x${string}`,
      abi: AccountManager.abi,
      functionName: "repay",
      args: [marginAccount, token, parsed],
    });
  };

  const repayFull = async () => {
    // 1. Fetch the actual active borrows (not just USD aggregate)
    const accounts = await fetchAccountCheck();
    if (!accounts.length) {
      setTxModalStatus("error");
      setTxModalTitle("No Margin Account");
      setTxModalMessage("No margin account found.");
      setTxModalOpen(true);
      return;
    }

    const activeBorrows = await fetchBorrowPositions(accounts[0]);

    if (activeBorrows.length === 0) {
      setTxModalStatus("error");
      setTxModalTitle("No Active Borrows");
      setTxModalMessage("No active borrows found to repay.");
      setTxModalOpen(true);
      return;
    }

    // For now, let's repay the first found debt (or loop through them)
    const debt = activeBorrows[0];

    await executeRepay({
      asset: debt.asset, // 2. Use the actual borrowed asset
      amount: debt.amount, // 3. Use the actual token amount
      mode: "WB",
    });
  };

  const executeRepay = async ({
    asset,
    amount,
    mode,
  }: {
    asset: string;
    amount: string;
    mode: "MB" | "WB";
  }) => {
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
    let state = marginState || (await reloadMarginState());
    if (!state) {
      setTxModalStatus("error");
      setTxModalTitle("State Error");
      setTxModalMessage("Failed to load margin state.");
      setTxModalOpen(true);
      return;
    }

    const amountUsd = Number(amount);

    setTxModalStatus("pending");
    setTxModalTitle("Processing Repay");
    setTxModalMessage("Preparing repay transaction...");
    setTxModalOpen(true);

    try {
      if (mode === "MB") {
        if (state.borrowUsd <= 0) {
          setTxModalStatus("error");
          setTxModalTitle("No Debt");
          setTxModalMessage("No borrowed debt to repay.");
          return;
        }

        setTxModalMessage("Repaying from margin balance...");
        const txHash = await repayTx(marginAccount, asset, amount);
        await reloadMarginState();

        setTxModalStatus("success");
        setTxModalTitle("Repay Successful");
        setTxModalMessage(`Successfully repaid ${amount} ${asset}!`);
        setTxModalHash(txHash);
        return;
      }

      if (mode === "WB") {
        setTxModalMessage("Depositing from wallet to margin...");
        await deposit(asset, amount);

        setTxModalMessage("Repaying debt...");
        const txHash = await repayTx(marginAccount, asset, amount);

        await reloadMarginState();

        setTxModalStatus("success");
        setTxModalTitle("Repay Successful");
        setTxModalMessage(`Successfully repaid ${amount} ${asset} from wallet!`);
        setTxModalHash(txHash);
        return;
      }
    } catch (err: any) {
      const isUserRejection =
        err?.code === 4001 ||
        err?.message?.includes("User rejected") ||
        err?.message?.includes("user rejected");

      setTxModalStatus("error");
      setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Repay Failed");
      setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (err.message || "Repay transaction failed"));
    }
  };

  // Dialogue state
  type DialogueState = "none" | "create-margin" | "sign-agreement" | "deposit-borrow" | "deposit-earn";
  const [activeDialogue, setActiveDialogue] = useState<DialogueState>("none");

  // Local state
  const [currentCollaterals, setCurrentCollaterals] = useState<Collaterals[]>([]);
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>([]);
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(BALANCE_TYPE_OPTIONS[0]);
  const [selectedMBCollaterals, setSelectedMBCollaterals] = useState<Collaterals[]>([]);
  const [mbAvailableCollaterals, setMbAvailableCollaterals] = useState<Collaterals[]>([]);

  const isMBMode =
    currentCollaterals.length === 1 &&
    currentCollaterals[0]?.balanceType.toLowerCase() === "mb";


  useEffect(() => {
    if (currentCollaterals.length === 0 && supportedTokens.length > 0) {
      const defaultAsset = supportedTokens[0];
      const defaultBalance = getBalance(defaultAsset, "WB");
      const newId = Math.random().toString(36).substring(7);
      const newCollateral: Collaterals = {
        id: newId,
        amount: 0,
        amountInUsd: 0,
        asset: defaultAsset,
        balanceType: "wb",
        unifiedBalance: defaultBalance,
      };
      setCurrentCollaterals([newCollateral]);
      setEditingIndex(0);
    }
  }, [currentCollaterals.length, supportedTokens, getBalance]);

  useEffect(() => {
    if (mode === "Borrow" && currentCollaterals.length > 1) {
      setCurrentCollaterals([currentCollaterals[0]]);
      if (editingIndex !== null && editingIndex > 0) {
        setEditingIndex(null);
      }
    }
  }, [mode, currentCollaterals.length, editingIndex]);

  const totalDepositValue = useMemo(
    () =>
      currentCollaterals.reduce(
        (sum, collateral) => sum + (collateral.amountInUsd || 0),
        0
      ),
    [currentCollaterals]
  );

  const mbTotalUsd = isMBMode ? totalDepositValue : 0;

  // Calculate info card values based on margin state
  const fees = totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0;
  const totalDeposit = totalDepositValue + fees;
  const platformPoints = Number((leverage * 0.575).toFixed(1));

  const calculatedBorrowAmount = useMemo(() => {
    if (mode === "Deposit" && leverage > 1 && totalDepositValue > 0) {
      const borrowUsd = totalDepositValue * (leverage - 1);
      const price = prices[borrowAsset] || 0;
      if (price > 0) {
        return borrowUsd / price;
      }
    }
    return 0;
  }, [mode, leverage, totalDepositValue, borrowAsset, prices]);

  const maxBorrowAmount = useMemo(() => {
    if (mode === "Deposit" && totalDepositValue > 0) {
      const maxBorrowUsd = totalDepositValue * (MAX_LEVERAGE - 1);
      const price = prices[borrowAsset] || 0;
      if (price > 0) {
        return maxBorrowUsd / price;
      }
    }
    else if (mode === "Borrow") {
      // Calculate effective equity (Collateral - Debt)
      let equity = marginState?.collateralUsd || 0;
      // If depositing new collateral in WB mode, add it to equity
      if (!isMBMode) {
        equity += totalDepositValue;
      }

      // Calculate max borrowing power based on selected leverage
      // Target Debt = Equity * (Leverage - 1)
      const targetDebt = equity * (leverage - 1);

      // Available to borrow = Target Debt - Existing Debt
      const existingDebt = marginState?.borrowUsd || 0;
      return Math.max(0, targetDebt - existingDebt);
    }
    return 0;
  }, [mode, totalDepositValue, borrowAsset, prices, leverage, marginState, isMBMode]);

  // Updated collateral calculation using margin state
  // Calculate derived metrics
  const { netHealthFactor, netLTV, projectedMaxBorrow, newCollateralUsd } = useMemo(() => {
    let additionalCollateralUsd = 0;
    let additionalBorrowUsd = 0;

    // Calculate Borrow Amount
    if (mode === "Deposit") {
      if (leverage > 1) {
        additionalBorrowUsd = totalDepositValue * (leverage - 1);
      }
    } else {
      additionalBorrowUsd = borrowItems.reduce((sum, item) => sum + (item.usdValue || 0), 0);
    }

    // Calculate Collateral Increase
    if (mode === "Deposit") {
      if (isMBMode) {
        // MB mode: No new collateral deposit, only using existing
        additionalCollateralUsd = 0;
      } else {
        // WB mode: Only the deposit adds to collateral, NOT the borrow
        additionalCollateralUsd = totalDepositValue;
      }
    }

    const sim = simulateStrategy(marginState, additionalCollateralUsd, additionalBorrowUsd);

    return {
      netHealthFactor: Number(sim.newHF.toFixed(2)),
      netLTV: Number(sim.newLTV.toFixed(2)),
      projectedMaxBorrow: sim.projectedMaxBorrow,
      newCollateralUsd: sim.newCollateralUsd
    };
  }, [marginState, isMBMode, totalDepositValue, mode, leverage, borrowItems, simulateStrategy]);

  const updatedCollateral = useMemo(() => {
    return Math.round(newCollateralUsd);
  }, [newCollateralUsd]);

  const handleAddCollateral = useCallback(() => {
    if (editingIndex !== null) return;
    if (mode === "Borrow" && currentCollaterals.length >= 1) return;

    const defaultAsset = supportedTokens[0] || "ETH";
    const defaultBalance = getBalance(defaultAsset, "WB");
    const newId = Math.random().toString(36).substring(7);

    const newCollateral: Collaterals = {
      id: newId,
      amount: 0,
      amountInUsd: 0,
      asset: defaultAsset,
      balanceType: "wb",
      unifiedBalance: defaultBalance,
    };
    setCurrentCollaterals((prev) => [...prev, newCollateral]);
    setEditingIndex(currentCollaterals.length);
  }, [editingIndex, mode, currentCollaterals.length, supportedTokens, getBalance]);

  const handleEditCollateral = (index: number) => {
    if (editingIndex !== null && editingIndex !== index) return;
    setEditingIndex(index);
  };

  const handleSaveCollateral = (index: number, updatedCollateral: Collaterals) => {
    // Ensure unifiedBalance is up to date with the store for the selected token
    const type = updatedCollateral.balanceType.toUpperCase() as "WB" | "MB";
    const freshBalance = getBalance(updatedCollateral.asset, type);

    // ✅ VALIDATION: Check if total amount for this asset exceeds wallet balance (WB mode only)
    if (type === "WB") {
      // Calculate total amount for this asset across all collaterals (excluding current one being edited)
      const totalAmountForAsset = currentCollaterals
        .filter((c, i) => i !== index && c.asset === updatedCollateral.asset && c.balanceType.toLowerCase() === "wb")
        .reduce((sum, c) => sum + c.amount, 0);

      const newTotalAmount = totalAmountForAsset + updatedCollateral.amount;

      if (newTotalAmount > freshBalance) {
        showError(
          `Total deposit amount exceeds your wallet balance. Please reduce the amount.`
        );
        return;
      }




    }

    const collateralWithFreshBalance = {
      ...updatedCollateral,
      unifiedBalance: freshBalance,
    };

    if (updatedCollateral.balanceType.toLowerCase() === "mb") {
      setCurrentCollaterals([collateralWithFreshBalance]);
      setEditingIndex(null);
    } else {
      const newCollaterals = [...currentCollaterals];
      newCollaterals[index] = collateralWithFreshBalance;
      const filteredCollaterals = newCollaterals.filter(
        (c) => c.balanceType.toLowerCase() !== "mb"
      );
      setCurrentCollaterals(filteredCollaterals);
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    if (
      editingIndex !== null &&
      editingIndex > 0 &&
      editingIndex === currentCollaterals.length - 1
    ) {
      const collateral = currentCollaterals[editingIndex];
      if (collateral.amount === 0 && collateral.amountInUsd === 0) {
        setCurrentCollaterals(currentCollaterals.slice(0, -1));
      }
    }
    setEditingIndex(null);
  };

  const handleDeleteCollateral = (index: number) => {
    if (editingIndex !== null) return;
    if (index === 0) return;

    const newCollaterals = currentCollaterals.filter((_, i) => i !== index);
    setCurrentCollaterals(newCollaterals);
  };

  const handleModeToggle = () => {
    setMode((prev) => {
      const newMode = prev === "Borrow" ? "Deposit" : "Borrow";

      // When switching to Borrow mode, limit to 1 collateral
      if (newMode === "Borrow") {
        setCurrentCollaterals((prev) => {
          if (prev.length > 1) {
            setEditingIndex(null);
            return [prev[0]];
          }
          return prev;
        });
      }

      return newMode;
    });
  };

  const handleBalanceTypeChange = (index: number) => {
    return async (balanceType: string | ((prev: string) => string)) => {
      let value = typeof balanceType === "function"
        ? balanceType(selectedBalanceType)
        : balanceType;

      const normalized = value.toLowerCase();

      if (normalized === selectedBalanceType.toLowerCase()) return;

      if (!chainId || !address || !publicClient) return;

      if (normalized === "mb") {
        setLoading(true);
        const available: Collaterals[] = marginBalances
          .filter((b) => b.amount > 0)
          .map((b) => ({
            asset: b.asset,
            amount: b.amount,
            amountInUsd: Number((b.amount * (prices[b.asset] ?? 0)).toFixed(2)),
            unifiedBalance: b.amount,
            balanceType: "mb",
          }));
        setLoading(false);

        setMbAvailableCollaterals(available);

        const initialSelected = mode === "Deposit" ? available : [];

        setSelectedMBCollaterals(initialSelected);

        const sumUsd = initialSelected.reduce(
          (acc, c) => acc + c.amountInUsd,
          0
        );

        const displayAsset =
          initialSelected.length === 0
            ? supportedTokens[0]
            : initialSelected.length === 1
              ? initialSelected[0].asset
              : "Various";

        const unified: Collaterals = {
          asset: displayAsset,
          amount: sumUsd,
          amountInUsd: sumUsd,
          balanceType: "mb",
          unifiedBalance: sumUsd,
        };

        setCurrentCollaterals([unified]);
        setSelectedBalanceType("MB");
        setEditingIndex(null);

        return;
      }

      const prev = currentCollaterals[index] ?? {
        amount: 0,
        amountInUsd: 0,
        asset: supportedTokens[0],
        balanceType: "wb",
        unifiedBalance: 0,
      };

      let asset = prev.asset;
      if (asset === "Various" || !supportedTokens.includes(asset)) {
        asset = supportedTokens.find((t) => t !== "Various") || "";
      }

      const fetched = getBalance(asset, "WB");
      const unified = typeof fetched === "number" ? fetched : 0;

      const updated: Collaterals = {
        ...prev,
        asset: asset,
        balanceType: "wb",
        unifiedBalance: unified,
        amountInUsd: prev.amount,
      };

      let next = [...currentCollaterals];

      next[index] = updated;

      next = next.filter((c) => c.balanceType.toLowerCase() !== "mb");

      setCurrentCollaterals(next);
      setSelectedBalanceType("WB");
      setEditingIndex(index);

      setMbAvailableCollaterals([]);
      setSelectedMBCollaterals([]);
    };
  };

  useEffect(() => {
    if (
      isMBMode &&
      currentCollaterals.length === 1 &&
      currentCollaterals[0]?.balanceType === "mb"
    ) {
      const sumUsd = selectedMBCollaterals.reduce((acc, c) => acc + c.amountInUsd, 0);

      const selectedAssets = selectedMBCollaterals.map((c) => c.asset);
      const displayAsset =
        selectedAssets.length === 0
          ? supportedTokens[0]
          : selectedAssets.length === 1
            ? selectedAssets[0]
            : "Various";

      const next = {
        ...currentCollaterals[0],
        asset: displayAsset,
        amount: sumUsd,
        amountInUsd: sumUsd,
        unifiedBalance: sumUsd,
      };

      const curr = currentCollaterals[0];
      if (
        curr.asset !== next.asset ||
        curr.amount !== next.amount ||
        curr.unifiedBalance !== next.unifiedBalance
      ) {
        setCurrentCollaterals([next]);
      }
    }
  }, [selectedMBCollaterals, isMBMode, currentCollaterals]);

  const handleButtonClick = () => {
    if (hasMarginAccount) {
      setActiveDialogue("deposit-earn");
    } else {
      setActiveDialogue("create-margin");
    }
  };

  // only loads once wallet , chain are ready
  // no unnecessary console logs
  // we placed this fetchers things here just because we need the chnages in the zustabd store why ?? Because currently my
  // fetchAccountCheck, fetchCollateralState, fetchBorrowState is in leverage-asset-tab.tsx
  // It also good later we can shift these fetchAccount state things to another folder

  const fetchers = useMemo(() => ({
    fetchAccountCheck,
    fetchCollateralState,
    fetchBorrowState,
  }), [fetchAccountCheck, fetchCollateralState, fetchBorrowState]);

  // 1) Register fetchers into zustand when they change
  useEffect(() => {
    useMarginStore.getState().setFetchers(fetchers);
  }, [fetchers]);

  // 2) Trigger initial load once wallet/network is ready AND fetchers are registered
  // Only load on actual wallet/network changes, not on every component mount/tab switch
  const hasLoadedRef = useRef(false);
  const lastChainRef = useRef<number | undefined>(undefined);
  const lastAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!publicClient || !chainId || !address) return;

    // Check if wallet or network actually changed
    const walletChanged = lastAddressRef.current !== address;
    const networkChanged = lastChainRef.current !== chainId;

    // Only reload if wallet/network changed, or first load
    if (!hasLoadedRef.current || walletChanged || networkChanged) {
      console.log('[MarginStore] Loading margin state:', {
        reason: !hasLoadedRef.current ? 'initial load' : walletChanged ? 'wallet changed' : 'network changed',
        chainId,
        address: address.slice(0, 10) + '...'
      });

      // Debounce: Wait 1 second after change before reloading
      const timer = setTimeout(() => {
        reloadMarginState();
        hasLoadedRef.current = true;
        lastChainRef.current = chainId;
        lastAddressRef.current = address;
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      console.log('[MarginStore] Skipping reload - using cached data');
    }
  }, [publicClient, chainId, address, reloadMarginState]);

  // Fetch margin account address once
  useEffect(() => {
    if (!address || !publicClient || !chainId) {
      setMarginAccountAddress(undefined);
      return;
    }

    let active = true;
    const fetchAddr = async () => {
      try {
        const accounts = await fetchAccountCheck();
        if (active && accounts && accounts.length > 0) {
          setMarginAccountAddress(accounts[0] as `0x${string}`);
          if (!hasMarginAccount) {
            setHasMarginAccount({ hasMarginAccount: true });
          }
        } else if (active) {
          setMarginAccountAddress(undefined);
        }
      } catch (e) {
        console.error("Error fetching margin account:", e);
      }
    };
    fetchAddr();
    return () => { active = false; };
  }, [address, publicClient, chainId, fetchAccountCheck, hasMarginAccount, setHasMarginAccount]);

  // Poll balances using stored address
  useEffect(() => {
    if (!chainId || !address || !publicClient) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      await useBalanceStore.getState().refreshBalances({
        chainId,
        address: address as `0x${string}`,
        publicClient,
        marginAccount: marginAccountAddress,
      });
    };

    poll();                 // initial load
    const id = setInterval(poll, 10_000); // simple 10s interval

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [chainId, address, publicClient, marginAccountAddress]);

  // Sync Collateral UI with updated balances
  useEffect(() => {
    setCurrentCollaterals(prev => {
      let hasChanges = false;
      const next = prev.map(c => {
        const type = c.balanceType.toUpperCase() as "WB" | "MB";
        const bal = getBalance(c.asset, type);
        if (bal !== c.unifiedBalance) {
          hasChanges = true;
          return { ...c, unifiedBalance: bal };
        }
        return c;
      });
      return hasChanges ? next : prev;
    });
  }, [walletBalances, marginBalances, getBalance]);



  const handleExecuteStrategy = async () => {
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
      setTxModalMessage("This network is not supported. Please switch to Arbitrum, Base, or Optimism.");
      setTxModalOpen(true);
      return;
    }

    // Filter for Wallet Balance items that have an amount > 0
    // 1. Identify Deposits
    const deposits = currentCollaterals.filter(
      (c) => c.amount > 0 && c.balanceType.toLowerCase() === "wb"
    );

    // 2. Identify Borrows
    let borrowsToExecute: { asset: string; amount: string }[] = [];

    if (mode === "Deposit" && leverage > 1) {
      // Leverage mode: Calculate borrow amount based on leverage
      // Borrow Amount = Total Deposit Value * (Leverage - 1)
      const borrowAmountUsd = totalDepositValue * (leverage - 1);

      if (borrowAmountUsd > 0) {
        const price = prices[borrowAsset] || 1; // Default to 1 if price missing (risky, but prevents NaN)
        const tokenAmount = borrowAmountUsd / price;

        // Format to string with limited decimals to avoid precision errors
        borrowsToExecute.push({
          asset: borrowAsset,
          amount: tokenAmount.toFixed(6)
        });
      }
    } else if (mode === "Borrow") {
      // Dual Borrow mode: Use items from BorrowBox
      borrowsToExecute = borrowItems.map(item => ({
        asset: item.assetData.asset,
        amount: item.assetData.amount
      }));
    }

    if (deposits.length === 0 && borrowsToExecute.length === 0) {
      setActiveDialogue("none");
      return;
    }

    setLoading(true);

    // Show pending modal
    setTxModalStatus("pending");
    setTxModalTitle("Processing Transaction");
    setTxModalMessage("Preparing your transaction...");
    setTxModalHash(undefined);
    setTxModalOpen(true);

    // Track completed operations for partial failure handling
    let depositsCompleted = 0;
    let borrowsCompleted = 0;

    try {
      // Ensure we have the margin account address
      let targetAccount = marginAccountAddress;
      if (!targetAccount) {
        setTxModalMessage("Fetching margin account...");
        const accounts = await fetchAccountCheck();
        if (accounts && accounts.length > 0) {
          targetAccount = accounts[0] as `0x${string}`;
          setMarginAccountAddress(targetAccount);
          setHasMarginAccount({ hasMarginAccount: true });
        } else {
          throw new Error("No margin account found. Please create one first.");
        }
      }

      // --- EXECUTE DEPOSITS ---
      for (const item of deposits) {
        const decimals = TOKEN_DECIMALS[item.asset] ?? 18;
        const amountBigInt = parseUnits(item.amount.toString(), decimals);

        // Handle native ETH deposit first (no token address needed)
        if (item.asset === "ETH") {
          setTxModalMessage(`Depositing ${item.amount} ETH...`);
          const txHash = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "depositEth",
            args: [targetAccount],
            value: amountBigInt
          });
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          depositsCompleted++;
        } else {
          // ERC20 Deposit - check token address exists
          const tokenAddress = tokenAddressByChain[chainId]?.[item.asset];
          if (!tokenAddress) {
            console.warn(`Token address not found for ${item.asset}`);
            continue;
          }
          setTxModalMessage(`Checking allowance for ${item.asset}...`);
          const allowance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address as `0x${string}`, addressList.accountManagerContractAddress as `0x${string}`]
          }) as bigint;

          if (allowance < amountBigInt) {
            setTxModalMessage(`Approving ${item.asset}...`);
            const approveHash = await walletClient.writeContract({
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [addressList.accountManagerContractAddress as `0x${string}`, amountBigInt]
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
          }

          setTxModalMessage(`Depositing ${item.amount} ${item.asset}...`);
          const txHash = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "deposit",
            args: [targetAccount, tokenAddress, amountBigInt]
          });
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          depositsCompleted++;
          setTxModalHash(txHash); // Store last deposit hash
        }
      }

      // --- EXECUTE BORROWS ---
      if (borrowsToExecute.length > 0) {
        // Refresh state before borrowing to ensure we have latest collateral data
        setTxModalMessage("Refreshing account state before borrowing...");
        await reloadMarginState();

        for (const item of borrowsToExecute) {
          const decimals = TOKEN_DECIMALS[item.asset] ?? 18;
          const amountBigInt = parseUnits(item.amount, decimals);

          setTxModalMessage(`Borrowing ${item.amount} ${item.asset}...`);

          // Get token address (use WETH for ETH)
          let tokenAddress: `0x${string}`;
          if (item.asset === "ETH" || item.asset === "WETH") {
            tokenAddress = addressList.wethTokenAddress as `0x${string}`;
          } else {
            const tokenAddr = tokenAddressByChain[chainId]?.[item.asset];
            if (!tokenAddr) {
              console.warn(`Token address not found for ${item.asset}`);
              continue;
            }
            tokenAddress = tokenAddr;
          }

          const txHash = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "borrow",
            args: [targetAccount, tokenAddress, amountBigInt]
          });

          await publicClient.waitForTransactionReceipt({ hash: txHash });
          borrowsCompleted++;
          setTxModalHash(txHash); // Store last borrow hash
        }
      }

      // Refresh all stores
      setTxModalMessage("Updating balances...");

      await Promise.all([
        reloadMarginState(),
        useBalanceStore.getState().refreshBalances({
          chainId,
          address: address as `0x${string}`,
          publicClient,
          marginAccount: targetAccount
        })
      ]);

      // --- UPDATE POSITIONS HISTORY ---
      // TODO: Fill this later - Update the CollateralBorrowStore with the new position
      console.log("Strategy executed. Position data ready for store update.");

      setHasMarginAccount({ hasMarginAccount: true });

      // Show success modal
      setTxModalStatus("success");
      setTxModalTitle("Strategy Executed Successfully");
      setTxModalMessage(
        deposits.length > 0 && borrowsCompleted > 0
          ? `Deposited ${deposits.length} asset(s) and borrowed ${borrowsCompleted} asset(s)`
          : deposits.length > 0
            ? `Deposited ${deposits.length} asset(s)`
            : `Borrowed ${borrowsCompleted} asset(s)`
      );

      setActiveDialogue("none");

      // Reset form
      setCurrentCollaterals([]);
      setLeverage(1);

    } catch (error: any) {
      console.error("Strategy execution error:", error);

      // Check if user rejected the transaction
      const isUserRejection =
        error?.code === 4001 ||
        error?.message?.includes("User rejected") ||
        error?.message?.includes("user rejected") ||
        error?.message?.includes("User denied") ||
        error?.message?.includes("rejected the request");

      // Build context message for partial success
      const hasPartialSuccess = depositsCompleted > 0 || borrowsCompleted > 0;
      const partialSuccessMsg = hasPartialSuccess
        ? ` ${depositsCompleted} deposit${depositsCompleted !== 1 ? "s" : ""} completed before failure.`
        : "";

      // Show error modal
      setTxModalStatus("error");

      if (isUserRejection) {
        setTxModalTitle("Transaction Cancelled");
        setTxModalMessage(hasPartialSuccess ? `You cancelled the transaction.${partialSuccessMsg}` : "You cancelled the transaction");
      } else if (error?.message?.includes("insufficient funds")) {
        setTxModalTitle("Insufficient Funds");
        setTxModalMessage(`Not enough funds for transaction.${partialSuccessMsg}`);
      } else if (error?.message?.includes("execution reverted")) {
        setTxModalTitle("Transaction Reverted");
        setTxModalMessage(`Transaction failed - please check your balances.${partialSuccessMsg}`);
      } else {
        setTxModalTitle("Transaction Failed");
        const baseMsg = error.message || "Failed to execute strategy";
        setTxModalMessage(hasPartialSuccess ? `${baseMsg}${partialSuccessMsg}` : baseMsg);
      }

      // Refresh state if any operations completed successfully
      if (hasPartialSuccess) {
        try {
          await reloadMarginState();
        } catch {
          // Ignore refresh errors
        }
      }

      // Always close the dialogue on error
      setActiveDialogue("none");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };



  return (
    <>

      <motion.div
        className="w-full flex flex-col gap-[24px] pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Mode toggle: Deposit / Borrow */}
        <motion.header
          className={`w-full flex justify-end text-[14px] font-medium gap-2 items-center ${isDark ? "text-white" : ""
            }`}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          Multi Deposit{" "}
          <ToggleButton size="small" onToggle={handleModeToggle} /> Dual Borrow
        </motion.header>

        {/* Deposit section */}
        <motion.section
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.h2
            className={`w-full text-[16px] font-medium ${isDark ? "text-white" : ""}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            {isMBMode ? "Select Your Collateral" : "Deposit"}
          </motion.h2>
          <div className="flex flex-col gap-[12px]">
            {isMBMode ? (
              <motion.div
                className="flex flex-col gap-[24px] bg-white p-[20px] rounded-[16px] border-[1px] border-[#E2E2E2]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <header className="flex justify-between items-center">
                  <h3 className={`text-[20px] font-medium py-[10px] ${isDark ? "text-white" : ""}`}>
                    {mbTotalUsd} USD
                  </h3>
                  <div className={`py-[4px] pr-[4px] pl-[8px] rounded-[8px] ${isDark ? "bg-[#222222] " : "bg-[#F2EBFE]"
                    }`}>
                    <Dropdown
                      classname="text-[16px] font-medium gap-[8px]"
                      items={[...BALANCE_TYPE_OPTIONS]}
                      selectedOption={selectedBalanceType}
                      setSelectedOption={handleBalanceTypeChange(0)}
                      dropdownClassname="text-[14px] gap-[10px]"
                    />
                  </div>
                </header>
                <div className="p-[10px] rounded-[12px] bg-[#F4F4F4] grid grid-cols-2 gap-[15px]">
                  {mbAvailableCollaterals.length === 0 && (
                    <div className="col-span-2 text-center text-[14px] text-[#757575] py-2">
                      No assets in Margin Account
                    </div>
                  )}

                  {mbAvailableCollaterals.map((item, index) => {
                    const isSelected = selectedMBCollaterals.some(
                      (coll) =>
                        coll.asset === item.asset && coll.amount === item.amount
                    );

                    return (
                      <div key={index} className="flex gap-[10px] items-center">
                        <div>
                          {mode === "Deposit" ? (
                            <Checkbox
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedMBCollaterals((prev) =>
                                    prev.filter(
                                      (coll) =>
                                        !(
                                          coll.asset === item.asset && coll.amount === item.amount
                                        )
                                    )
                                  );
                                } else {
                                  setSelectedMBCollaterals((prev) => [
                                    ...prev,
                                    item,
                                  ]);
                                }
                              }}
                            />
                          ) : (
                            <Radio
                              name="mb-collateral-radio"
                              value={`collateral-${index}`}
                              checked={isSelected}
                              onChange={() => {
                                setSelectedMBCollaterals([item]);
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <Image
                            src={iconPaths[item.asset]}
                            alt={item.asset}
                            width={20}
                            height={20}
                          />
                        </div>
                        <div className="text-[16px] font-semibold">
                          {item.amount} {item.asset}
                        </div>
                        <div className="rounded-[4px] py-[2px] px-[4px] bg-[#FFFFFF] text-[10px] font-medium">
                          {item.amountInUsd} USD
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <section className={`${currentCollaterals.length > 2 ? "max-h-[364px] overflow-y-auto overflow-x-visible pr-[4px]" : ""} thin-scrollbar`}>
                <AnimatePresence mode="popLayout">
                  {currentCollaterals.length > 0 ? (
                    <ul className="flex flex-col gap-[12px]" role="list">
                      {currentCollaterals.map((collateral, index) => {
                        return (
                          <motion.div
                            key={collateral.id || index}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{
                              duration: 0.3,
                              ease: "easeOut",
                              delay: index * 0.05,
                            }}
                            layout
                          >
                            <li>
                              <Collateral
                                id={collateral.id}
                                collaterals={collateral}
                                isEditing={editingIndex === index}
                                isAnyOtherEditing={editingIndex !== null && editingIndex !== index}
                                onEdit={() => handleEditCollateral(index)}
                                onSave={(_id: string, data: Collaterals) => handleSaveCollateral(index, data)}
                                onCancel={handleCancelEdit}
                                onDelete={() => handleDeleteCollateral(index)}
                                onBalanceTypeChange={handleBalanceTypeChange(index)}
                                index={index}
                                supportedTokens={supportedTokens}
                                getBalance={getBalance}
                                prices={prices}
                              />
                            </li>
                          </motion.div>
                        );
                      })}
                    </ul>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Collateral
                        collaterals={null}
                        isEditing={true}
                        isAnyOtherEditing={false}
                        onEdit={() => { }}
                        onSave={(_id: string, data: Collaterals) => {
                          setCurrentCollaterals([data]);
                          setEditingIndex(null);
                        }}
                        onCancel={handleCancelEdit}
                        onBalanceTypeChange={handleBalanceTypeChange(0)}
                        index={0}
                        supportedTokens={supportedTokens}
                        getBalance={getBalance}
                        prices={prices}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </div>


          {error && (
            <motion.div
              animate={{ x: error ? [0, -5, 5, -5, 0] : 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2"
            >
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                ⚠️ {error}
              </div>
            </motion.div>
          )}


          {/* Add Collateral button */}
          <motion.button
            type="button"
            onClick={handleAddCollateral}
            disabled={
              editingIndex !== null ||
              (mode === "Borrow" && currentCollaterals.length >= 1) ||
              isMBMode
            }
            className={`w-fit py-[11px] px-[10px] rounded-[8px] flex gap-[4px] text-[14px] font-medium text-[#703AE6] items-center ${editingIndex !== null ||
              (mode === "Borrow" && currentCollaterals.length >= 1) ||
              isMBMode
              ? "opacity-50 cursor-not-allowed"
              : "hover:cursor-pointer hover:bg-[#F1EBFD]"
              }`}
            whileHover={
              editingIndex === null &&
                !(mode === "Borrow" && currentCollaterals.length >= 1) &&
                !isMBMode
                ? { x: 5 }
                : {}
            }
            transition={{ duration: 0.2 }}
            aria-label="Add new collateral"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5.33332 0.666748V10.0001M0.666656 5.33341H9.99999"
                stroke="#703AE6"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add Collateral
          </motion.button>
        </motion.section>

        {/* Borrow section */}
        <motion.section
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <motion.h2
            className={`w-full text-[16px] font-medium ${isDark ? "text-white" : ""}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            Borrow
          </motion.h2>
          <div>
            <BorrowBox
              mode={mode}
              leverage={leverage}
              setLeverage={setLeverage}
              totalDeposit={totalDeposit}
              onBorrowItemsChange={setBorrowItems}
              onAssetChange={setBorrowAsset}
              borrowAmount={calculatedBorrowAmount}
              maxBorrowAmount={maxBorrowAmount}
              assetPrice={prices[borrowAsset] || 0}
              supportedTokens={supportedTokens}
            />
          </div>
        </motion.section>

        {/* Details panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <InfoCard
            data={{
              platformPoints: platformPoints,
              leverage: leverage,
              depositAmount: totalDepositValue,
              fees: fees,
              totalDeposit: totalDeposit,
              updatedCollateral: updatedCollateral,
              netHealthFactor: netHealthFactor,
              // New derived fields from analysis
              netLTV: netLTV,
              hfColor: getHFColor(netHealthFactor),
              hfWarning: getHFWarning(netHealthFactor),
              ltv: netLTV,
              maxBorrow: projectedMaxBorrow,

              // Current Margin State (Already available)
              currentHealthFactor: marginState?.hf ?? 0,
              currentLTV: marginState?.ltv ?? 0,
              currentCollateral: marginState?.collateralUsd ?? 0,
              currentDebt: marginState?.borrowUsd ?? 0,
              currentMaxBorrow: marginState?.maxBorrow ?? 0,

              // Protocol Constants (TODO: Fill later from config/contract)
              liqThreshold: 0.9, // TODO: Fetch from RiskEngine (balanceToBorrowThreshold inverse)
              minDebt: 100, // TODO: Fetch from AccountManager or Config
              liqFee: 0.05, // TODO: Fetch from Config
            }}
            showExpandable={true}
            expandableSections={[

              {
                title: "Transaction Details",
                items: [
                  {
                    id: "platformPoints",
                    name: "Platform Points",
                  },
                  {
                    id: "leverage",
                    name: "Leverage",
                  },
                  {
                    id: "depositAmount",
                    name: "You're depositing",
                  },
                  {
                    id: "fees",
                    name: "Fees",
                  },
                  {
                    id: "totalDeposit",
                    name: "Total deposit including fees",
                  },
                  {
                    id: "updatedCollateral",
                    name: "Updated Collateral Before Liquidation",
                  },
                  {
                    id: "netHealthFactor",
                    name: "Updated Net Health Factor",
                  },
                  {
                    id: "netLTV",
                    name: "Updated LTV",
                  },
                  {
                    id: "maxBorrow",
                    name: "Projected Max Borrow",
                  },
                  // Protocol Info
                  {
                    id: "liqThreshold",
                    name: "Liquidation Threshold", // TODO: Fill later
                  },
                ],
                defaultExpanded: false,
                delay: 0.2,
              },
            ]}
          />
        </motion.div>

        {/* Create Margin Account button */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
          <Button
            disabled={!address || loading}
            size="large"
            text={
              loading
                ? "Processing..."
                : !address
                  ? "Connect Wallet"
                  : hasMarginAccount
                    ? "Deposit & Earn"
                    : "Create your Margin Account"
            }
            type="gradient"
            onClick={handlecreateAccount}
          />
        </motion.section>
      </motion.div>

      {/* First dialogue: Create Margin Account */}
      <AnimatePresence>
        {activeDialogue === "create-margin" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !loading && setActiveDialogue("none")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                buttonOnClick={() => setActiveDialogue("sign-agreement")}
                buttonText="Create Your Account"
                content={[
                  { line: "Connect your wallet to get started." },
                  {
                    line: "Confirm your Margin Account we will generate a unique address for you.",
                  },
                  { line: "Make a deposit to activate borrowing." },
                ]}
                heading="Create Margin Account"
                onClose={() => {
                  setActiveDialogue("none");
                  setLoading(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second dialogue: Review and Sign Agreement with Loading State */}
      <AnimatePresence>
        {activeDialogue === "sign-agreement" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !loading && setActiveDialogue("none")}
          >
            <motion.div
              className="w-full max-w-[891px]"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                description="Before you proceed, please review and accept the terms of borrowing on VANNA. This agreement ensures you understand the risks, responsibilities, and conditions associated with using the platform."
                buttonOnClick={async () => {
                  await handleExecuteStrategy(); // Updated function call
                }}
                buttonText={loading ? "Processing..." : "Sign Agreement"}
                buttonDisabled={loading}
                content={[
                  {
                    line: "Collateral Requirement",
                    points: [
                      "All borrowed positions must remain fully collateralized.",
                      "If collateral value falls below the liquidation threshold, your position may be liquidated.",
                    ],
                  },
                  {
                    line: "Borrow Limits & Leverage",
                    points: [
                      "You may only borrow assets up to the maximum Loan-to-Value (LTV) allowed.",
                      "Leverage is enabled only when collateral value supports it.",
                    ],
                  },
                  {
                    line: "Interest & Fees",
                    points: [
                      "Interest rates are variable and accrue in real time.",
                      "Additional protocol fees may apply for borrowing or liquidation events.",
                    ],
                  },
                  {
                    line: "Liquidation Risk",
                    points: [
                      "Market volatility can reduce collateral value.",
                      "If your position health factor drops below safe limits, collateral may be partially or fully liquidated without prior notice.",
                    ],
                  },
                  {
                    line: "User Responsibility",
                    points: [
                      "You are responsible for monitoring your positions, balances, and risks.",
                      "VANNA is a non-custodial protocol; all actions are initiated by your wallet.",
                    ],
                  },
                  {
                    line: "No Guarantee of Returns",
                    points: [
                      "Using borrowed assets in trading, farming, or external protocols involves risk.",
                      "VANNA does not guarantee profits or protection against losses.",
                    ],
                  },
                ]}
                heading="Review and Sign Agreement"
                checkboxContent="I have read and agree to the VANNA Borrow Agreement."
                onClose={() => !loading && setActiveDialogue("none")}
                loadingMessage={loadingMessage}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit & Earn dialogue */}
      <AnimatePresence>
        {activeDialogue === "deposit-earn" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#45454566]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setActiveDialogue("none")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dialogue
                buttonOnClick={async () => {
                  await handleExecuteStrategy()
                }}
                buttonText="Proceed to Deposit & Earn"
                content={[
                  { line: "Your Margin Account is ready." },
                  { line: "Deposit assets to start earning yields and borrowing." },
                  { line: "Earn competitive rates on your deposited collaterals." },
                ]}
                heading="Deposit & Earn"
                onClose={() => {
                  setActiveDialogue("none");
                  setLoading(false);
                }}
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
          // Reset form if successful
          if (txModalStatus === "success") {
            setCurrentCollaterals([]);
            setLeverage(2);
          }
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
    </>
  );
}
