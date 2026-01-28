"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import Image from "next/image";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";
import { Radio } from "../ui/radio-button";
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
import { useFetchAccountCheck, useFetchBorrowState, useFetchCollateralState } from "@/lib/utils/margin/marginFetchers";
import { useBalanceStore } from "@/store/balance-store";



type Modes = "Deposit" | "Borrow";
type AddressList = typeof baseAddressList;

export const LeverageAssetsTab = () => {
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
  const [prices, setPrices] = useState<Record<string, number>>({});

  // Wagmi hooks
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

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
        setPrices(data);
      } catch (e) {
        console.error("Error fetching prices:", e);
      }
    };
    fetchPrices();
  }, []);

  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);



  // Bind deposit and withdrae as of now because we have moved this 2 fucntion as of now 
  //////////////////////////////////////////////////////////////////////////////////////////
  // we shift this  to @/lib/utils/web3
  // const getAddressList = (): AddressList | null => {
  //   if (!chainId) return null;
  //   if (chainId === 42161) return arbAddressList;
  //   if (chainId === 10) return opAddressList;
  //   if (chainId === 8453) return baseAddressList;
  //   return null;
  // };

  // const addressList=getAddressList(chainId!)

  const deposit = (asset: string, amount: string) => depositTx({
    walletClient,
    publicClient,
    chainId,
    fetchAccountCheck,
    asset,
    amount
  })

  // This is just a wrapper Our main logic has written  in lib/utils/margin/transaction.ts we have mentioned there 
  // to make it modular ! 

  // const withdraw = (asset: string, amount: string) =>
  //   withdrawTx({
  //     walletClient,
  //     publicClient,
  //     chainId,
  //     fetchAccountCheck,
  //     asset,
  //     amount,
  //   });

  // Later we will bind all the functionality in transaction.ts file 
  ////////////////////////////////////////////////////////////////////////////////////
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

  //   // fetchWalletBalance 
  //   const fetchWalletBalance = async (asset: string) => {
  //     if (!chainId || !publicClient || !address) return;

  //     const tokenAddress = tokenAddressByChain[chainId]?.[asset];
  //     if (asset === "ETH") {
  //       const raw = await publicClient.getBalance({ address });
  //       const formated = Number(formatUnits(raw, 18))
  //       return formated;
  //     }

  //     const raw = await publicClient.readContract({
  //       address: tokenAddress,
  //       abi: erc20Abi,
  //       functionName: "balanceOf",
  //       args: [address]
  //     })

  //     const decimals = TOKEN_DECIMALS[asset];
  //     const formated = Number(formatUnits(raw, decimals))
  //     return formated;
  //   }

  //   // fetchMarginBalance
  //   const fetchMarginBalances = async (): Promise<Collaterals[]> => {
  //   if (!chainId || !publicClient || !address) return [];

  //   const accounts = await fetchAccountCheck();
  //   if (!accounts || accounts.length === 0) return [];

  //   const marginAccount = accounts[0];

  //   // Split tokens
  //   const erc20Tokens = TOKEN_OPTIONS.filter(t => t !== "ETH");
  //   const ethToken = TOKEN_OPTIONS.includes("ETH");

  //   const addressMap = tokenAddressByChain[chainId] ?? {};

  //   // Prepare multicall args
  //   const erc20Calls = erc20Tokens.map(token => ({
  //     address: addressMap[token],
  //     abi: erc20Abi,
  //     functionName: "balanceOf",
  //     args: [marginAccount]
  //   }));

  //   const [ethBalanceRaw, erc20Results] = await Promise.all([
  //     ethToken ? publicClient.getBalance({ address: marginAccount }) : Promise.resolve(0n),
  //     erc20Calls.length > 0 ? publicClient.multicall({ contracts: erc20Calls }) : Promise.resolve([])
  //   ]);

  //   const results: Collaterals[] = [];

  //   // ETH mapping
  //   if (ethToken) {
  //     const ethBal = Number(formatUnits(ethBalanceRaw, 18));
  //     if (ethBal > 0) {
  //       results.push({
  //         asset: "ETH",
  //         amount: ethBal,
  //         amountInUsd: ethBal,
  //         unifiedBalance: ethBal,
  //         balanceType: "mb"
  //       });
  //     }
  //   }

  //   // ERC20 mapping
  //   erc20Tokens.forEach((token, i) => {
  //     const entry = erc20Results[i];
  //     if (!entry || entry.status === "failure") return;

  //     const raw = entry.result as bigint;
  //     const decimals = TOKEN_DECIMALS[token] ?? 18;
  //     const value = Number(formatUnits(raw, decimals));

  //     if (value > 0) {
  //       results.push({
  //         asset: token,
  //         amount: value,
  //         amountInUsd: value,
  //         unifiedBalance: value,
  //         balanceType: "mb"
  //       });
  //     }
  //   });

  //   return results;
  // };





  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);
  const fetchCollateralState = useFetchCollateralState(chainId, publicClient);
  const fetchBorrowState = useFetchBorrowState(chainId, publicClient);

  // We have placed the fetchAccountCheck,fetchCollateralState,fetchBorrowState into lib/utils/margin/Marginfetchers 
  // const fetchAccountCheck = useCallback(async (): Promise<`0x${string}`[]> => {
  //   const addressList = getAddressList(chainId);
  //   if (!addressList) return [];

  //   const accounts = await publicClient.readContract({
  //     address: addressList.registryContractAddress,
  //     abi: Registry.abi,
  //     functionName: "accountsOwnedBy",
  //     args: [address],
  //   }) as `0x${string}`[];

  //   return accounts;
  // }, [address, publicClient, chainId]);

  // const fetchCollateralState = useCallback(async (acc: `0x${string}`) => {
  //   if (!publicClient || !chainId) return [];

  //   const addressList = getAddressList(chainId);
  //   if (!addressList) return [];

  //   const raw = await publicClient.readContract({
  //     address: addressList.riskEngineContractAddress,
  //     abi: RiskEngine.abi,
  //     functionName: "getBalance",
  //     args: [acc]
  //   }) as bigint[];

  //   const collatralUsd = Number(raw) / 1e16;

  //   return [
  //     {
  //       token: "USD",
  //       amount: collatralUsd,
  //       usd: collatralUsd
  //     }
  //   ]
  // }, [publicClient, chainId])

  // const fetchBorrowState = useCallback(async (acc: `0x${string}`) => {
  //   if (!publicClient || !chainId) return []

  //   const addressList = getAddressList(chainId)
  //   if (!addressList) return []

  //   const raw = await publicClient.readContract({
  //     address: addressList.riskEngineContractAddress,
  //     abi: RiskEngine.abi,
  //     functionName: "getBorrows",
  //     args: [acc]
  //   }) as bigint[];

  //   const borrowUsd = Number(raw) / 1e16;

  //   return [
  //     {
  //       token: "USD",
  //       amount: borrowUsd,
  //       usd: borrowUsd
  //     }
  //   ];
  // }, [publicClient, chainId])


  // New: Simulation functions for preview (without mutating state)


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

  // const reloadMarginState = useCallback(async () => {
  //   const accounts = await fetchAccountCheck();

  //   if (!accounts.length) {
  //     setMarginState(null)
  //     return null
  //   }

  //   const acc = accounts[0];

  //   const [col, bor] = await Promise.all([
  //     fetchCollateralState(acc),
  //     fetchBorrowState(acc)
  //   ]);

  //   const cUsd = marginCalc.calcCollateralUsd(col);
  //   const bUsd = marginCalc.calcBorrowUsd(bor);

  //   const state = {
  //     collateral: col,
  //     borrow: bor,
  //     collateralUsd: cUsd,
  //     borrowUsd: bUsd,
  //     hf: marginCalc.calcHF(cUsd, bUsd),
  //     ltv: marginCalc.calcLTV(cUsd, bUsd),
  //     maxBorrow: marginCalc.calcMaxBorrow(cUsd, bUsd),
  //     maxWithdraw: marginCalc.calcMaxWithdraw(cUsd, bUsd),
  //   }
  //   setMarginState(state)
  //   return state;
  // }, [
  //   fetchAccountCheck,
  //   fetchCollateralState,
  //   fetchBorrowState
  // ]);

  // Get Approval for ERC-20 token 
  // const getapproved = async (token: `0x${string}`, parsed: bigint, spender: string) => {
  //   if (!publicClient || !walletClient || !address) return;

  //   const allowance = await publicClient.readContract({
  //     address: token,
  //     abi: erc20Abi,
  //     functionName: 'allowance',
  //     args: [address, spender]
  //   }) as bigint

  //   if (allowance >= parsed) return;

  //   const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

  //   return walletClient.writeContract({
  //     address: token,
  //     abi: erc20Abi,
  //     functionName: 'approve',
  //     args: [spender, MAX_UINT256],
  //   });
  // }

  // Deposit into Margin Account 
  // const deposit = async (
  //   asset: string,
  //   amount: string,
  //   marginAccount: string,
  //   opts?: {
  //     onStart?: () => void;
  //     onApproved?: () => void;
  //     onTxSubmitted?: (hash: string) => void;
  //     onSuccess?: (hash: string) => void;
  //     onError?: (err: any) => void;
  //     onFinally?: () => void;
  //   }
  // ) => {
  //   if (!walletClient || !publicClient || !chainId || !amount) return;

  //   try {
  //     opts?.onStart?.();

  //     const addresses = getAddressList();
  //     if (!addresses) throw new Error("Unsupported network");

  //     const token = tokenAddressByChain[chainId]?.[asset];
  //     const decimals = TOKEN_DECIMALS[asset];
  //     const parsed = parseUnits(amount, decimals);

  //     opts?.onApproved?.();
  //     await getapproved(token, parsed, addresses.accountManagerContractAddress);

  //     const txHash = await walletClient.writeContract({
  //       address: addresses.accountManagerContractAddress,
  //       abi: AccountManager.abi,
  //       functionName: "deposit",
  //       args: [marginAccount, token, parsed],
  //     });

  //     opts?.onTxSubmitted?.(txHash);

  //     await publicClient.waitForTransactionReceipt({ hash: txHash });

  //     await reloadMarginState();

  //     opts?.onSuccess?.(txHash);
  //     return txHash;
  //   } catch (err: any) {
  //     if (err?.code === 4001) {
  //       opts?.onError?.({ type: "REJECTED", err });
  //       return;
  //     }

  //     opts?.onError?.({ type: "FAILED", err });
  //     throw err;
  //   } finally {
  //     opts?.onFinally?.();
  //   }
  // };

  // Withdraw to WB  
  // we already have executeTransferToWallet ! 
  // const withdraw = async (asset: string, amount: string) => {
  //   if (!publicClient || !walletClient || !address) return;

  //   const token = tokenAddressByChain[chainId!]?.[asset] as `0x${string}`;
  //   const decimals = TOKEN_DECIMALS[asset];
  //   const parsed = parseUnits(amount, decimals);

  //   const addressList = getAddressList();
  //   const acc = await fetchAccountCheck();
  //   const marginaccount = acc[0];

  //   let withdraw_hash;

  //   if (asset === "WETH") {
  //     withdraw_hash = await walletClient.writeContract({
  //       address: addressList!.accountManagerContractAddress,
  //       abi: AccountManager.abi,
  //       functionName: "withdrawEth",
  //       args: [marginaccount, parsed]
  //     });
  //   } else {
  //     withdraw_hash = await walletClient.writeContract({
  //       address: addressList!.accountManagerContractAddress,
  //       abi: AccountManager.abi,
  //       functionName: "withdraw",
  //       args: [marginaccount, token, parsed]
  //     });
  //   }

  //   return withdraw_hash;
  // };

  const normalizeBorrowUsd = (asset: string, amount: string): number => {
    const price = prices[asset] || 0;
    return Number(amount) * price;
  };

  const validateBorrowRisk = (state: MarginState, totalUsd: number): boolean => {
    const { newHF, newLTV } = simulateBorrow(state, totalUsd);
    if (newHF <= 1.0) {
      toast.error("Borrow would put account into liquidation");
      return false;
    }

    if (newLTV > 0.9) {
      toast.error("Borrow exceeds 90% LTV");
      return false;
    }

    return true;
  };

  const borrowTx = async (
    marginAccount: string,
    asset: string,
    amount: string
  ) => {
    const addressList = getAddressList(chainId);
    if (!addressList) throw new Error("Unsupported chain");

    const decimals = TOKEN_DECIMALS[asset] ?? 18;
    const parsed = parseUnits(amount, decimals);

    if (asset === "ETH" || asset === "WETH") {
      return walletClient!.writeContract({
        address: addressList.accountManagerContractAddress as `0x${string}`,
        abi: AccountManager.abi,
        functionName: "borrowEth",
        args: [marginAccount, parsed],
      });
    }

    const token = tokenAddressByChain[chainId!]?.[asset];
    if (!token) throw new Error(`Token mapping not found for ${asset}`);

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
        return toast.error("Insufficient collateral in Margin Account");
      }

      if (amountUsd > state.maxBorrow) {
        return toast.error("Borrow exceeds leverage limit");
      }

      if (!validateBorrowRisk(state, amountUsd)) return;

      toast("Borrowing...");
      await borrowTx(marginAccount, borrowAsset, borrowAmount);
      await reloadMarginState();
      return toast.success("Borrow successful!");
    }

    if (mode === "WB") {
      if (!collateralAmount || Number(collateralAmount) <= 0) {
        return toast.error("Deposit amount required in WB mode");
      }

      toast("Depositing collateral...");
      await deposit(collateralAsset, collateralAmount);

      state = await reloadMarginState();
      if (!state) return toast.error("State refresh failed");

      if (amountUsd > state.maxBorrow) {
        return toast.error("Borrow exceeds leverage limit after deposit");
      }

      if (!validateBorrowRisk(state, amountUsd)) return;

      toast("Borrowing...");
      await borrowTx(marginAccount, borrowAsset, borrowAmount);

      await reloadMarginState();
      return toast.success("Deposit + Borrow completed!");
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
    const state = await reloadMarginState();
    if (!state || state.borrowUsd <= 0) return;

    await executeRepay({
      asset: "USDC",
      amount: state.borrowUsd.toFixed(6),
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
      return toast.error("Wallet not ready");
    }

    const addressList = getAddressList(chainId);
    if (!addressList) return toast.error("Unsupported network");

    const accounts = await fetchAccountCheck();
    if (!accounts.length) return toast.error("No Margin Account found");

    const marginAccount = accounts[0];
    let state = marginState || (await reloadMarginState());
    if (!state) return toast.error("State missing");

    const amountUsd = Number(amount);

    if (mode === "MB") {
      if (state.borrowUsd <= 0) {
        return toast.error("No borrowed debt to repay");
      }

      toast("Repaying...");
      await repayTx(marginAccount, asset, amount);
      await reloadMarginState();
      return toast.success("Repay completed!");
    }

    if (mode === "WB") {
      toast("Paying from wallet → depositing into margin...");
      await deposit(asset, amount);

      toast("Repaying...");
      await repayTx(marginAccount, asset, amount);

      await reloadMarginState();
      return toast.success("Wallet repay completed!");
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

  const collateralMock = useCollateralBorrowStore((state) => state.collaterals);

  const isMBMode =
    currentCollaterals.length === 1 &&
    currentCollaterals[0]?.balanceType.toLowerCase() === "mb";


  useEffect(() => {
    if (currentCollaterals.length === 0 && supportedTokens.length > 0) {
      const defaultAsset = supportedTokens[0];
      const defaultBalance = getBalance(defaultAsset, "WB");
      const newCollateral: Collaterals = {
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
  }, [mode, currentCollaterals.length, editingIndex, currentCollaterals]);

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

  const handleAddCollateral = () => {
    if (editingIndex !== null) return;
    if (mode === "Borrow" && currentCollaterals.length >= 1) return;

    const defaultAsset = supportedTokens[0] || "ETH";
    const defaultBalance = getBalance(defaultAsset, "WB");

    const newCollateral: Collaterals = {
      amount: 0,
      amountInUsd: 0,
      asset: defaultAsset,
      balanceType: "wb",
      unifiedBalance: defaultBalance,
    };
    const newIndex = currentCollaterals.length;
    setCurrentCollaterals([...currentCollaterals, newCollateral]);
    setEditingIndex(newIndex);
  };

  const handleEditCollateral = (index: number) => {
    if (editingIndex !== null && editingIndex !== index) return;
    setEditingIndex(index);
  };

  const handleSaveCollateral = (index: number, updatedCollateral: Collaterals) => {
    // Ensure unifiedBalance is up to date with the store for the selected token
    const type = updatedCollateral.balanceType.toUpperCase() as "WB" | "MB";
    const freshBalance = getBalance(updatedCollateral.asset, type);

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
    setMode((prev) => (prev === "Borrow" ? "Deposit" : "Borrow"));
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

  // 2) Trigger initial load once wallet/network is ready
  useEffect(() => {
    if (!publicClient || !chainId || !address) return;
    reloadMarginState();
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
      toast.error("Wallet not connected");
      return;
    }

    const addressList = getAddressList(chainId);
    if (!addressList) {
      toast.error("Unsupported network");
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

    try {
      // Ensure we have the margin account address
      let targetAccount = marginAccountAddress;
      if (!targetAccount) {
        setLoadingMessage("Fetching margin account...");
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
          setLoadingMessage(`Depositing ${item.amount} ETH...`);
          const txHash = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "depositEth",
            args: [targetAccount],
            value: amountBigInt
          });
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          toast.success(`Deposited ${item.amount} ETH`);
        } else {
          // ERC20 Deposit - check token address exists
          const tokenAddress = tokenAddressByChain[chainId]?.[item.asset];
          if (!tokenAddress) {
            console.warn(`Token address not found for ${item.asset}`);
            continue;
          }
          setLoadingMessage(`Checking allowance for ${item.asset}...`);
          const allowance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: erc20Abi,
            functionName: "allowance",
            args: [address as `0x${string}`, addressList.accountManagerContractAddress as `0x${string}`]
          }) as bigint;

          if (allowance < amountBigInt) {
            setLoadingMessage(`Approving ${item.asset}...`);
            const approveHash = await walletClient.writeContract({
              address: tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: "approve",
              args: [addressList.accountManagerContractAddress as `0x${string}`, amountBigInt]
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            toast.success(`Approved ${item.asset}`);
          }

          setLoadingMessage(`Depositing ${item.amount} ${item.asset}...`);
          const txHash = await walletClient.writeContract({
            address: addressList.accountManagerContractAddress as `0x${string}`,
            abi: AccountManager.abi,
            functionName: "deposit",
            args: [targetAccount, tokenAddress, amountBigInt]
          });
          await publicClient.waitForTransactionReceipt({ hash: txHash });
          toast.success(`Deposited ${item.amount} ${item.asset}`);
        }
      }

      // --- EXECUTE BORROWS ---
      if (borrowsToExecute.length > 0) {
        // Refresh state before borrowing to ensure we have latest collateral data
        await reloadMarginState();

        for (const item of borrowsToExecute) {
          const decimals = TOKEN_DECIMALS[item.asset] ?? 18;
          const amountBigInt = parseUnits(item.amount, decimals);

          setLoadingMessage(`Borrowing ${item.amount} ${item.asset}...`);

          let txHash: `0x${string}`;

          if (item.asset === "ETH") {
            // Borrow native ETH
            txHash = await walletClient.writeContract({
              address: addressList.accountManagerContractAddress as `0x${string}`,
              abi: AccountManager.abi,
              functionName: "borrowEth",
              args: [targetAccount, amountBigInt]
            });
          } else {
            // Borrow ERC20 token
            const tokenAddress = tokenAddressByChain[chainId]?.[item.asset];
            if (!tokenAddress) {
              console.warn(`Token address not found for ${item.asset}`);
              continue;
            }

            txHash = await walletClient.writeContract({
              address: addressList.accountManagerContractAddress as `0x${string}`,
              abi: AccountManager.abi,
              functionName: "borrow",
              args: [targetAccount, tokenAddress, amountBigInt]
            });
          }

          await publicClient.waitForTransactionReceipt({ hash: txHash });
          toast.success(`Borrowed ${item.amount} ${item.asset}`);
        }
      }

      // Refresh all stores
      setLoadingMessage("Updating balances...");

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
      // We need to construct a Position object and add it to the store.
      /*
      const newPosition = {
        positionId: `pos-${Date.now()}`,
        isOpen: true,
        collateral: deposits.map(d => ({ asset: d.asset, amount: d.amount })),
        borrowed: borrowsToExecute.map(b => ({ asset: b.asset, amount: b.amount })),
        leverage: leverage,
        collateralUsdValue: totalDepositValue,
        borrowUsdValue: borrowsToExecute.reduce((acc, b) => acc + normalizeBorrowUsd(b.asset, b.amount), 0),
        timestamp: Date.now(),
        txHash: txHash // Use the last hash or array of hashes
      };
      useCollateralBorrowStore.getState().addPosition(newPosition);
      */
      console.log("Strategy executed. Position data ready for store update.");

      setHasMarginAccount({ hasMarginAccount: true });

      toast.success("Strategy executed successfully!");
      setActiveDialogue("none");

      // Reset form
      setCurrentCollaterals([]);
      setLeverage(1);

    } catch (error: any) {
      console.error("Strategy execution error:", error);
      toast.error(error.message || "Failed to execute strategy");
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
        <motion.div
          className="w-full flex justify-end text-[14px] font-medium gap-2 items-center"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
        >
          Multi Deposit{" "}
          <ToggleButton size="small" onToggle={handleModeToggle} /> Dual Borrow
        </motion.div>

        {/* Deposit section */}
        <motion.div
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="w-full text-[16px] font-medium"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            {isMBMode ? "Select Your Collateral" : "Deposit"}
          </motion.div>
          <div className="flex flex-col gap-[12px]">
            {isMBMode ? (
              <motion.div
                className="flex flex-col gap-[24px] bg-white p-[20px] rounded-[16px] border-[1px] border-[#E2E2E2]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-[20px] font-medium py-[10px]">
                    {mbTotalUsd} USD
                  </div>
                  <div className="py-[4px] pr-[4px] pl-[8px] bg-[#F2EBFE] rounded-[8px]">
                    <Dropdown
                      classname="text-[16px] font-medium gap-[8px]"
                      items={[...BALANCE_TYPE_OPTIONS]}
                      selectedOption={selectedBalanceType}
                      setSelectedOption={handleBalanceTypeChange(0)}
                      dropdownClassname="text-[14px] gap-[10px]"
                    />
                  </div>
                </div>
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
              <AnimatePresence mode="popLayout">
                {currentCollaterals.length > 0 ? (
                  currentCollaterals.map((collateral, index) => (
                    <motion.div
                      key={index}
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
                      <Collateral
                        collaterals={collateral}
                        isEditing={editingIndex === index}
                        isAnyOtherEditing={
                          editingIndex !== null && editingIndex !== index
                        }
                        onEdit={() => handleEditCollateral(index)}
                        onSave={(data) => handleSaveCollateral(index, data)}
                        onCancel={handleCancelEdit}
                        onDelete={() => handleDeleteCollateral(index)}
                        onBalanceTypeChange={handleBalanceTypeChange(index)}
                        index={index}
                        supportedTokens={supportedTokens}
                        getBalance={getBalance}
                        prices={prices}
                      />
                    </motion.div>
                  ))
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
                      onSave={(data) => {
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
            )}
          </div>

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
        </motion.div>

        {/* Borrow section */}
        <motion.div
          className="w-full flex flex-col gap-[8px]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <motion.div
            className="w-full text-[16px] font-medium"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            Borrow
          </motion.div>
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
        </motion.div>

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
        <motion.div
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
        </motion.div>
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
                buttonOnClick={async() => {
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
    </>
  );
}