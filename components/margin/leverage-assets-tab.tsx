"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
import ToggleButton from "@/components/ui/toggle";
import { Collaterals, BorrowInfo, MarginState } from "@/lib/types";

import { TOKEN_DECIMALS, TOKEN_OPTIONS, tokenAddressByChain, vTokenAddressByChain } from "@/lib/utils/web3/token";

import { BALANCE_TYPE_OPTIONS } from "@/lib/constants/margin";
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
import { constants } from "node:buffer";
import { getEnsAddressQueryOptions } from "wagmi/query";
import { withdraw } from "viem/zksync";

type Modes = "Deposit" | "Borrow";
type AddressList = typeof baseAddressList;

export const LeverageAssetsTab = () => {
  // Component state
  const hasMarginAccount = useMarginAccountInfoStore((state) => state.hasMarginAccount);


  const setHasMarginAccount = useMarginAccountInfoStore((state) => state.set);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Modes>("Deposit");
  const [borrowItems, setBorrowItems] = useState<BorrowInfo[]>([]);
  const [leverage, setLeverage] = useState(2);
  const [depositAmount, setDepositAmount] = useState<number | undefined>(0);
  const address = useUserStore((state) => state.address);
  const [marginState, setMarginState] = useState<MarginState | null>(null);


  const [depositCurrency, setDepositCurrency] = useState(TOKEN_OPTIONS[0])


  const [walletBalanceByAsset, setWalletBalanceByAsset] = useState<Record<string, number>>({});


  // Wagmi hooks
  const { chainId } = useAccount();

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const getAddressList = (): AddressList | null => {
    if (!chainId) return null;

    if (chainId === 42161) return arbAddressList;
    if (chainId === 10) return opAddressList;
    if (chainId === 8453) return baseAddressList;

    return null;
  };
  

  // Margin account creation Flow  
  const handlecreateAccount = async () => {

    const addressList = getAddressList();
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

      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      setLoadingMessage("Success! Account created.");
      setHasMarginAccount({ hasMarginAccount: true });

      // Small delay to show success message
      setTimeout(() => {
        setActiveDialogue("deposit-earn");
        toast("Margin account Created")
      }, 1000);

    } catch (err: any) {
      toast("Margin account creation failed", err);

      // User rejected transaction
      if (err?.code === 4001) {
        setLoadingMessage("Transaction rejected");
        setTimeout(() => {
          setActiveDialogue("none");
          setLoadingMessage("");
        }, 1500);
      } else {
        setLoadingMessage("Transaction failed. Please try again.");
        setTimeout(() => {
          setLoadingMessage("");
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };



  //fetchWalletBalance 
  const fetchWalletBalance = async (asset: string) => {
    if (!chainId || !publicClient || !address) return;

    const tokenAddress = tokenAddressByChain[chainId]?.[asset];
    if (asset === "ETH") {
      const raw = await publicClient.getBalance({ address });
      const formated = Number(formatUnits(raw, 18))

      return formated;

    }

    const raw = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address]

    })

    const decimals = TOKEN_DECIMALS[asset];
    const formated = Number(formatUnits(raw, decimals))
    return formated;


  }

  // fetchMarginBalance
  const fetchMarginBalances = async (): Promise<Collaterals[]> => {
    if (!chainId || !publicClient || !address) return [];

    const addressList = getAddressList();
    if (!addressList) return [];

    try {
      // 1. Resolve margin account
      const accounts = await fetchAccountCheck();

      if (!accounts || accounts.length === 0) {
        return []; // no margin account → no MB
      }

      const marginAccount = accounts[0];
      const results: Collaterals[] = [];

      for (const asset of TOKEN_OPTIONS) {
        let balance = 0;

        // 2. Native ETH path
        if (asset === "ETH") {
          const raw = await publicClient.getBalance({
            address: marginAccount
          });
          balance = Number(formatUnits(raw, 18));
        } else {
          // 3. ERC20 token path
          const token = tokenAddressByChain[chainId]?.[asset];

          if (!token) {
            console.warn(`No token mapping for ${asset} on chain ${chainId}`);
            continue;
          }

          try {
            const raw = await publicClient.readContract({
              address: token,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [marginAccount]
            }) as bigint;

            const decimals = TOKEN_DECIMALS[asset] ?? 18;
            balance = Number(formatUnits(raw, decimals));
          } catch (err) {
            console.warn(`balanceOf() failed for token ${asset}`, err);
            balance = 0;
          }
        }

        // 4. Skip empty zero assets
        if (balance > 0) {
          results.push({
            asset,
            amount: balance,
            amountInUsd: balance,     // mock 1:1
            balanceType: "mb",
            unifiedBalance: balance,
          });
        }
      }

      return results;
    } catch (err) {
      console.error("fetchMarginBalances() error:", err);
      return [];
    }
  };

  // Main function To handle the fetchBalance Mode(MB OR WB)
  const fetchBalance = async (asset: string | null, balanceType: "WB" | "MB") => {
    if (!chainId || !publicClient || !address) return;

    switch (balanceType) {
      case "MB":
        if (!asset) return 0;
        return fetchMarginBalances();

      case "WB":
        if (!asset) return 0;
        return asset && fetchWalletBalance(asset)
    }

  };

  const fetchAccountCheck = useCallback(async (): Promise<`0x${string}`[]> => {
  const addressList = getAddressList();
  if (!addressList) return [];

  const accounts = await publicClient.readContract({
    address: addressList.registryContractAddress,
    abi: Registry.abi,
    functionName: "accountsOwnedBy",
    args: [address],
  }) as `0x${string}`[];

  return accounts;
}, [address, publicClient, chainId]);


  // Fecth-Collatral state 
  // How much Your margin acc in Total 
  // Your margin acc has ETH,USDC,USDT but collatral value 
  // 1.2 ETH
  // 5000 USDC
  // collateralState = $8,540 otal collateral value

  const fetchCollateralState = useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList();
    if (!addressList) return [];

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBalance",
      args: [acc]
    }) as bigint[];


    const collatralUsd = Number(raw) / 1e16;

    return [
      {
        token: "USD",
        amount: collatralUsd,
        usd: collatralUsd
      }
    ]



  }, [publicClient, chainId])


  // Fetch-Borrow (from Risk-Engine Contract )

  const fetchBorrowState = useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return []

    const addressList = getAddressList()
    if (!addressList) return []

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBorrows",
      args: [acc]
    }) as bigint[];

    const borrowUsd = Number(raw) / 1e16;

    return [
      {
        token: "USD",
        amount: borrowUsd,
        usd: borrowUsd
      }
    ];



  }, [publicClient, chainId])



  //////////////////////////////////////////

  // Later i will placed in  a Lib file 

  //////////////////////////////////////////

  const calcCollateralUsd = (c: { usd: number }[]) =>
    c.reduce((s, x) => s + x.usd, 0);

  const calcBorrowUsd = (b: { usd: number }[]) =>
    b.reduce((s, x) => s + x.usd, 0);

  const calcHF = (collUsd: number, debtUsd: number) => {
    if (debtUsd <= 0) return Infinity;
    const CF = 0.9;
    return (collUsd * CF) / debtUsd;
  };

  const calcLTV = (collUsd: number, debtUsd: number) => {
    if (collUsd <= 0) return 0;
    return debtUsd / collUsd;
  };

  const calcMaxBorrow = (collUsd: number, debtUsd: number) => {
    const LTV_LIMIT = 0.9;
    return Math.max(0, collUsd * LTV_LIMIT - debtUsd);
  };

  const calcMaxWithdraw = (collUsd: number, debtUsd: number) => {
    const LTV_LIMIT = 0.9;
    if (debtUsd <= 0) return collUsd;
    return Math.max(0, collUsd - debtUsd / LTV_LIMIT);
  };




  // Fetch-WithdrawBalance 

  // 


  // Get Approval for ERC-20 token 
  const getapproved = async (token: `0x${string}`, parsed: bigint, spender: string) => {
    if (!publicClient || !walletClient || !address) return;

    // Read Current allowance 

    const allowance = await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, spender]

    }) as bigint

    if (allowance >= parsed) return;

    const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");


    // 3. Approve required amount
    return walletClient.writeContract({
      address: token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, MAX_UINT256],
    });


  }

  // Deposit into Margin Account 
  const deposit = async (
    asset: string,
    amount: string,
    marginAccount: string,
    opts?: {
      onStart?: () => void;
      onApproved?: () => void;
      onTxSubmitted?: (hash: string) => void;
      onSuccess?: (hash: string) => void;
      onError?: (err: any) => void;
      onFinally?: () => void;
    }
  ) => {
    if (!walletClient || !publicClient || !chainId || !amount) return;

    try {
      opts?.onStart?.();

      const addresses = getAddressList();
      if (!addresses) throw new Error("Unsupported network");

      const token = tokenAddressByChain[chainId]?.[asset];
      const decimals = TOKEN_DECIMALS[asset];
      const parsed = parseUnits(amount, decimals);

      // APPROVAL Needes 
      opts?.onApproved?.();
      await getapproved(token, parsed, addresses.accountManagerContractAddress);

      // TX
      const txHash = await walletClient.writeContract({
        address: addresses.accountManagerContractAddress,
        abi: AccountManager.abi,
        functionName: "deposit",
        args: [marginAccount, token, parsed],
      });

      opts?.onTxSubmitted?.(txHash);

      // RECEIPT
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      await reloadMarginState();

      opts?.onSuccess?.(txHash);
      return txHash;
    } catch (err: any) {
      if (err?.code === 4001) {
        // USER REJECTED
        opts?.onError?.({ type: "REJECTED", err });
        return;
      }

      opts?.onError?.({ type: "FAILED", err });
      throw err;
    } finally {
      opts?.onFinally?.();
    }
  };

  // Withdraw to WB  
  const withdraw = async (asset: string, amount: string) => {
  if (!publicClient || !walletClient || !address) return;

  const token = tokenAddressByChain[chainId!]?.[asset] as `0x${string}`;
  const decimals = TOKEN_DECIMALS[asset];
  const parsed = parseUnits(amount, decimals);

  const addressList = getAddressList();
  const acc = await fetchAccountCheck();
  const marginaccount = acc[0] ;

  let withdraw_hash;

  // Native/Wrapped logic by asset name, NOT token address
  if (asset === "WETH") {
    withdraw_hash = await walletClient.writeContract({
      address: addressList!.accountManagerContractAddress,
      abi: AccountManager.abi,
      functionName: "withdrawEth",
      args: [marginaccount, parsed]
    });
  } else {
    withdraw_hash = await walletClient.writeContract({
      address: addressList!.accountManagerContractAddress,
      abi: AccountManager.abi,
      functionName: "withdraw",
      args: [marginaccount, token, parsed]
    });
  }

  return withdraw_hash;
};


//  =>  Suppose you have 10 usdc then Our protocol will check the balance 1st in WB then MB 
//  IF MB or wb balance  > The amount you are putting in dual Borrow Mode and single Borrow mode we will allow them to borrow the usdc or corresponding token 
//  10 * leverage = 10 * 10 (We will calculate from MAX_Borrow )
// 

  

  // const borrow={we will write Borrow logic here }


  // Our Ui need a single function which tells wat is the current state of Margin acc 

  const reloadMarginState = useCallback(async () => {
    const accounts = await fetchAccountCheck();

    if (!accounts.length) {
      setMarginState(null)
      return null
    }

    const acc = accounts[0];

    const [col, bor] = await Promise.all([
      fetchCollateralState(acc),
      fetchBorrowState(acc)
    ]);

    const cUsd = calcCollateralUsd(col);
    const bUsd = calcBorrowUsd(bor);


    const state = {
      collateral: col,
      borrow: bor,
      collateralUsd: cUsd,
      borrowUsd: bUsd,
      hf: calcHF(cUsd, bUsd),
      ltv: calcLTV(cUsd, bUsd),
      maxBorrow: calcMaxBorrow(cUsd, bUsd),
      maxWithdraw: calcMaxWithdraw(cUsd, bUsd),

    }
    setMarginState(state)
    return state;


  }, [
    fetchAccountCheck,
    fetchCollateralState,
    fetchBorrowState
  ]);


  // Dialogue state
  type DialogueState = "none" | "create-margin" | "sign-agreement" | "deposit-borrow" | "deposit-earn";
  const [activeDialogue, setActiveDialogue] = useState<DialogueState>("none");

  // Local state
  const [currentCollaterals, setCurrentCollaterals] = useState<Collaterals[]>([]);
  const [currentBorrowItems, setCurrentBorrowItems] = useState<BorrowInfo[]>([]);
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>(BALANCE_TYPE_OPTIONS[0]);
  const [selectedMBCollaterals, setSelectedMBCollaterals] = useState<Collaterals[]>([]);
  const [mbAvailableCollaterals, setMbAvailableCollaterals] = useState<Collaterals[]>([]);

  // Get collateral mock data from store
  const collateralMock = useCollateralBorrowStore((state) => state.collaterals);

  // Single source of truth for MB mode
  const isMBMode =
    currentCollaterals.length === 1 &&
    currentCollaterals[0]?.balanceType.toLowerCase() === "mb";

  // Initialize with one empty collateral if none exist
  useEffect(() => {
    if (currentCollaterals.length === 0) {
      const newCollateral: Collaterals = {
        amount: 0,
        amountInUsd: 0,
        asset: TOKEN_OPTIONS[0],
        balanceType: "wb",
        unifiedBalance: 0,
      };
      setCurrentCollaterals([newCollateral]);
      setEditingIndex(0);
    }
  }, [currentCollaterals.length]);

  // Limit to 1 collateral in Borrow mode
  useEffect(() => {
    if (mode === "Borrow" && currentCollaterals.length > 1) {
      setCurrentCollaterals([currentCollaterals[0]]);
      if (editingIndex !== null && editingIndex > 0) {
        setEditingIndex(null);
      }
    }
  }, [mode, currentCollaterals.length, editingIndex]);


  // Calculate total deposit value from all collaterals
  const totalDepositValue = useMemo(
    () =>
      currentCollaterals.reduce(
        (sum, collateral) => sum + (collateral.amountInUsd || 0),
        0
      ),
    [currentCollaterals]
  );

  const mbTotalUsd = isMBMode ? totalDepositValue : 0;

  // Simple calculations
  const fees = totalDepositValue > 0 ? totalDepositValue * 0.000234 : 0;
  const totalDeposit = totalDepositValue + fees;
  const platformPoints = Number((leverage * 0.575).toFixed(1));
  const updatedCollateral = Math.round(depositAmount! * leverage * 0.6);
  const netHealthFactor = Number((2.0 - leverage * 0.0875).toFixed(2));

  // Update deposit amount and currency when collaterals change


  // Collateral handlers
  const handleAddCollateral = () => {
    if (editingIndex !== null) return;
    if (mode === "Borrow" && currentCollaterals.length >= 1) return;

    const newCollateral: Collaterals = {
      amount: 0,
      amountInUsd: 0,
      asset: TOKEN_OPTIONS[0],
      balanceType: "wb",
      unifiedBalance: 0,
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
    if (updatedCollateral.balanceType.toLowerCase() === "mb") {
      setCurrentCollaterals([updatedCollateral]);
      setEditingIndex(null);
    } else {
      const newCollaterals = [...currentCollaterals];
      newCollaterals[index] = updatedCollateral;
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

  // This will  make a changes On Balance 
  const handleBalanceTypeChange = (index: number) => {
    return async (balanceType: string | ((prev: string) => string)) => {
      let value = typeof balanceType === "function"
        ? balanceType(selectedBalanceType)
        : balanceType;

      const normalized = value.toLowerCase();

      // No change → ignore
      if (normalized === selectedBalanceType.toLowerCase()) return;

      if (!chainId || !address || !publicClient) return;

      // === MB MODE ===
      if (normalized === "mb") {
        setLoading(true);
        const available = await fetchMarginBalances();
        setLoading(false);

        setMbAvailableCollaterals(available);

        // Deposit mode → auto select all
        // Borrow mode → select none
        const initialSelected =
          mode === "Deposit" ? available : [];

        setSelectedMBCollaterals(initialSelected);

        // Compute unified sum
        const sumUsd = initialSelected.reduce(
          (acc, c) => acc + c.amountInUsd,
          0
        );

        const displayAsset =
          initialSelected.length === 0
            ? TOKEN_OPTIONS[0]
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

      // === WB MODE === (default)
      const prev = currentCollaterals[index] ?? {
        amount: 0,
        amountInUsd: 0,
        asset: TOKEN_OPTIONS[0],
        balanceType: "wb",
        unifiedBalance: 0,
      };

      const asset = prev.asset;

      const fetched = await fetchBalance(asset, "WB");
      const unified = typeof fetched === "number" ? fetched : 0;

      const updated: Collaterals = {
        ...prev,
        balanceType: "wb",
        unifiedBalance: unified,
        amountInUsd: unified, // mock 1:1 USD
      };

      let next = [...currentCollaterals];
      next[index] = updated;

      // Drop MB artifacts when leaving MB mode
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
          ? TOKEN_OPTIONS[0]
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

  useEffect(() => {
    (async () => {
      if (!publicClient || !chainId || !address) return;
      const state = await reloadMarginState();
      console.log("initial margin-state:", state);
    })();
  }, [chainId, address, publicClient, reloadMarginState]);

  // 🧪 Test here 
  const handleTest = async () => {

    // -----------------
    // deposit test 
    //------------------

  //   const addresses = getAddressList();

  //   const accounts = await publicClient.readContract({
  //     address: addresses!.registryContractAddress,
  //     abi: Registry.abi,
  //     functionName: "accountsOwnedBy",
  //     args: [address],
  //   });

  //   if (accounts.length === 0) {
  //     console.log("NO MARGIN ACCOUNT FOUND");
  //     return;
  //   }

  //   const marginAccount = accounts[0];

  //   await deposit("USDC", "0.1", marginAccount,{
  //      onStart: () => {
  //   console.log("Deposit started");
  //   setLoading(true);
  // },
  // onApproved: () => {
  //   console.log("Token approved!");
  //   toast.success("USDC approved!");
  // },
 
  // onSuccess: (hash) => {
  //   console.log("Deposit success:", hash);
  //   toast.success("Deposit complete!");
  // },
  // onError: ({ type, err }) => {
  //   console.error("Deposit failed:", type, err);
  //   toast.error(type === "REJECTED" ? "User rejected" : "Failed");
  // },
  // onFinally: () => {
  //   setLoading(false);
  // }
  //   });


    // ---------------------------
    // Fetch Borrow Test 
    // ---------------------------

  //  const withdraw_tx=await withdraw("USDC","1")
  //  console.log(withdraw_tx)


  };


  return (
    <>

      {/* //This is  only for test Purpose  */}
      <button
        onClick={handleTest}
        className="
                px-5 py-2
                rounded-lg
                text-white
                font-medium
                bg-gradient-to-r from-purple-600 to-indigo-600
                shadow-md
                hover:shadow-lg
                hover:scale-[1.03]
                active:scale-[0.97]
                transition-all
                duration-200
              "
      >
        TestDeposit
      </button>



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
            {/* Render MB UI if MB is selected, otherwise render collaterals */}
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
              depositAmount: depositAmount,
              fees: fees,
              totalDeposit: totalDeposit,
              updatedCollateral: updatedCollateral,
              netHealthFactor: netHealthFactor,
            }}
            showExpandable={true}
            expandableSections={[
              {
                title: "More Details",
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
                ],
                defaultExpanded: false,
                delay: 0.1,
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
            onClick={handleButtonClick}
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
                  await handlecreateAccount();
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
                buttonOnClick={() => {
                  // TODO: Implement deposit and earn logic
                  setActiveDialogue("none");
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
};