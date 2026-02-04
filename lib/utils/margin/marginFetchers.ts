import { useCallback, useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { vTokenAddressByChain } from "@/lib/utils/web3/token";

// Minimal ABI to get borrow balance from vToken/DebtToken
const VTokenABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getBorrowBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Fetcher 1: Get account addresses
export const useFetchAccountCheck = (
  chainId?: number,
  address?: `0x${string}`,
  publicClient?: any
) => {
  return useCallback(async (): Promise<`0x${string}`[]> => {
    if (!publicClient || !chainId || !address) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    const accounts = await publicClient.readContract({
      address: addressList.registryContractAddress,
      abi: Registry.abi,
      functionName: "accountsOwnedBy",
      args: [address],
    }) as `0x${string}`[];

    return accounts;
  }, [address, publicClient, chainId]);
};

// Fetcher 2: Get collateral state
export const useFetchCollateralState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    // Get latest block number to ensure fresh read
    const blockNumber = await publicClient.getBlockNumber();

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBalance",
      args: [acc],
      blockNumber: blockNumber,
    }) as bigint;  // ✅ Fixed: Returns single bigint, not array

    // RiskEngine returns values in 18 decimals (1e18)
    const collateralUsd = Number(raw) / 1e18;

    // Dust threshold: Treat values below $0.01 as zero
    const DUST_THRESHOLD = 0.01;
    const cleanCollateralUsd = collateralUsd < DUST_THRESHOLD ? 0 : collateralUsd;

    console.log(`[RiskEngine] Raw balance: ${raw.toString()}, USD: ${collateralUsd.toFixed(6)}, Clean: ${cleanCollateralUsd}`);

    return [{ token: "USD", amount: cleanCollateralUsd, usd: cleanCollateralUsd }];
  }, [publicClient, chainId]);
};

// Fetcher 3: Get borrow state
export const useFetchBorrowState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    // Get latest block number to ensure fresh read
    const blockNumber = await publicClient.getBlockNumber();

    console.log(`[RiskEngine getBorrows] Fetching for account: ${acc}`);
    console.log(`[RiskEngine getBorrows] RiskEngine address: ${addressList.riskEngineContractAddress}`);

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBorrows",
      args: [acc],
      blockNumber: blockNumber,
    });

    console.log(`[RiskEngine getBorrows] Raw response type: ${typeof raw}`);
    console.log(`[RiskEngine getBorrows] Raw response value:`, raw);

    // Handle different return types
    let borrowUsd = 0;
    if (typeof raw === "bigint") {
      // RiskEngine returns values in 18 decimals (1e18)
      borrowUsd = Number(raw) / 1e18;
      console.log(`[RiskEngine getBorrows] Parsed as bigint: ${borrowUsd}`);
    } else if (typeof raw === "number") {
      borrowUsd = raw;
      console.log(`[RiskEngine getBorrows] Parsed as number: ${borrowUsd}`);
    } else if (Array.isArray(raw)) {
      console.warn(`[RiskEngine getBorrows] Unexpected array response:`, raw);
      borrowUsd = 0;
    } else {
      console.warn(`[RiskEngine getBorrows] Unexpected response type:`, typeof raw, raw);
    }

    // Dust threshold: Treat values below $0.01 as zero
    const DUST_THRESHOLD = 0.01;
    const cleanBorrowUsd = borrowUsd < DUST_THRESHOLD ? 0 : borrowUsd;

    console.log(`[RiskEngine getBorrows] Final: Raw=${raw.toString()}, USD=${borrowUsd.toFixed(6)}, Clean=${cleanBorrowUsd}`);

    return [{ token: "USD", amount: cleanBorrowUsd, usd: cleanBorrowUsd }];
  }, [publicClient, chainId]);
};

// Fetcher 4: Get detailed borrow positions (per asset)
export const useFetchBorrowPositions = (chainId?: number, publicClient?: any) => {
  return useCallback(async (marginAccount: `0x${string}`) => {
    if (!publicClient || !chainId || !marginAccount) return [];

    try {
      // 1. Get list of borrowed token addresses from the Margin Account
      const borrowedAddresses = await publicClient.readContract({
        address: marginAccount,
        abi: Account.abi,
        functionName: "getBorrows",
      }) as `0x${string}`[];

      if (!borrowedAddresses || borrowedAddresses.length === 0) return [];

      // 2. Fetch details for each token
      const positions = await Promise.all(borrowedAddresses.map(async (tokenAddr) => {
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'symbol' }),
          publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'decimals' })
        ]);

        const sym = symbol as string;
        // Handle WETH -> ETH mapping for vToken lookup
        const lookupSym = sym === "WETH" ? "ETH" : sym;
        let amount = "0";

        // 3. Get the vToken (Debt Token) address for this asset
        const vTokenAddr = vTokenAddressByChain[chainId]?.[lookupSym];

        if (vTokenAddr) {
          try {
            const rawBalance = await publicClient.readContract({
              address: vTokenAddr,
              abi: VTokenABI,
              functionName: "getBorrowBalance",
              args: [marginAccount],
            }) as bigint;
            amount = formatUnits(rawBalance, Number(decimals));
          } catch (err) {
            console.warn(`Failed to fetch borrow balance for ${lookupSym}`, err);
          }
        }

        return { asset: sym, address: tokenAddr, decimals: Number(decimals), amount };
      }));

      // Filter out positions that have no debt (just in case)
      return positions.filter(p => Number(p.amount) > 0);
    } catch (e) {
      console.error("Error fetching borrow positions:", e);
      return [];
    }
  }, [publicClient, chainId]);
};
