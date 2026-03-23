import { useCallback, useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { vTokenAddressByChain } from "@/lib/utils/web3/token";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from '@/abi/vanna/out/out/VEther.sol/VEther.json';


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

// Fetcher 2: Get collateral state (using manual calculation for accuracy)
export const useFetchCollateralState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    // ✅ NEW APPROACH: Fetch individual collateral positions
    try {
      // Get list of collateral asset addresses
      const assetAddresses = await publicClient.readContract({
        address: acc,
        abi: Account.abi,
        functionName: "getAssets",
      }) as `0x${string}`[];

      if (assetAddresses.length === 0) {
        console.log(`[CollateralState] No collateral deposited`);
        return [{ token: "USD", amount: 0, usd: 0 }];
      }

      // Fetch prices from API
      let prices: Record<string, number> = {};
      try {
        const pricesRes = await fetch("/api/prices");
        prices = await pricesRes.json();
      } catch (err) {
        console.warn("[CollateralState] Failed to fetch prices, using defaults");
        prices = { USDC: 1, USDT: 1, DAI: 1, ETH: 3000 }; // Fallback prices
      }

      // Fetch balance for each collateral asset
      const collateralPositions = await Promise.all(
        assetAddresses.map(async (tokenAddr) => {
          try {
            const [symbol, decimals, balance] = await Promise.all([
              publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'symbol' }),
              publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'decimals' }),
              publicClient.readContract({
                address: tokenAddr,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [acc]
              }),
            ]);

            const amount = Number(formatUnits(balance as bigint, Number(decimals)));
            const lookupSym = symbol === "WETH" ? "ETH" : symbol;
            const price = prices[lookupSym] || 0;
            const usd = amount * price;

            console.log(`[CollateralState] ${symbol}: ${amount.toFixed(6)} @ $${price} = $${usd.toFixed(2)}`);

            return {
              token: symbol,
              amount,
              usd,
            };
          } catch (err) {
            console.error(`[CollateralState] Error fetching balance for token ${tokenAddr}:`, err);
            return null;
          }
        })
      );

      // Filter out nulls and zero balances
      const validPositions = collateralPositions.filter(
        (p) => p !== null && p.amount > 0
      ) as { token: string; amount: number; usd: number }[];

      // Dust threshold: Treat values below $0.01 as zero
      const DUST_THRESHOLD = 0.01;
      const cleanedPositions = validPositions.map(p => ({
        ...p,
        usd: p.usd < DUST_THRESHOLD ? 0 : p.usd
      })).filter(p => p.usd > 0);

      const totalUsd = cleanedPositions.reduce((sum, p) => sum + p.usd, 0);
      console.log(`[CollateralState] Total collateral: $${totalUsd.toFixed(2)} across ${cleanedPositions.length} assets`);

      // Return individual positions for transparency
      return cleanedPositions.length > 0 ? cleanedPositions : [{ token: "USD", amount: 0, usd: 0 }];
    } catch (error) {
      console.error("[CollateralState] Failed to fetch collateral state:", error);
      return [{ token: "USD", amount: 0, usd: 0 }];
    }
  }, [publicClient, chainId]);
};

// Fetcher 3: Get borrow state (using manual VToken calculation for accuracy)
export const useFetchBorrowState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    // ✅ NEW APPROACH: Fetch individual borrow positions from VToken contracts
    // This is more accurate than RiskEngine.getBorrows() which has decimal/price issues
    try {
      // Get list of borrowed token addresses
      const borrowedAddresses = await publicClient.readContract({
        address: acc,
        abi: Account.abi,
        functionName: "getBorrows",
      }) as `0x${string}`[];

      if (borrowedAddresses.length === 0) {
        console.log(`[BorrowState] No active borrows`);
        return [{ token: "USD", amount: 0, usd: 0 }];
      }

      // Fetch prices from API
      let prices: Record<string, number> = {};
      try {
        const pricesRes = await fetch("/api/prices");
        prices = await pricesRes.json();
      } catch (err) {
        console.warn("[BorrowState] Failed to fetch prices, using defaults");
        prices = { USDC: 1, USDT: 1, DAI: 1 }; // Stablecoin fallbacks
      }

      // Fetch borrow balance for each token
      const borrowPositions = await Promise.all(
        borrowedAddresses.map(async (tokenAddr) => {
          try {
            const [symbol, decimals] = await Promise.all([
              publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'symbol' }),
              publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'decimals' }),
            ]);

            const lookupSym = symbol === "WETH" ? "ETH" : symbol;
            const vTokenAddr = vTokenAddressByChain[chainId]?.[lookupSym];

            if (!vTokenAddr) {
              console.warn(`[BorrowState] No vToken address for ${symbol}`);
              return null;
            }

            const rawBalance = await publicClient.readContract({
              address: vTokenAddr,
              abi: VToken.abi,
              functionName: "getBorrowBalance",
              args: [acc],
            }) as bigint;

            const amount = Number(formatUnits(rawBalance, Number(decimals)));
            const price = prices[lookupSym] || 0;
            const usd = amount * price;

            console.log(`[BorrowState] ${symbol}: ${amount.toFixed(6)} @ $${price} = $${usd.toFixed(2)}`);

            return {
              token: symbol,
              amount,
              usd,
            };
          } catch (err) {
            console.error(`[BorrowState] Error fetching borrow for token ${tokenAddr}:`, err);
            return null;
          }
        })
      );

      // Filter out nulls and zero balances
      const validPositions = borrowPositions.filter(
        (p) => p !== null && p.amount > 0
      ) as { token: string; amount: number; usd: number }[];

      const totalUsd = validPositions.reduce((sum, p) => sum + p.usd, 0);
      console.log(`[BorrowState] Total borrowed: $${totalUsd.toFixed(2)} across ${validPositions.length} assets`);

      // Return individual positions for transparency
      return validPositions.length > 0 ? validPositions : [{ token: "USD", amount: 0, usd: 0 }];
    } catch (error) {
      console.error("[BorrowState] Failed to fetch borrow state:", error);
      return [{ token: "USD", amount: 0, usd: 0 }];
    }
  }, [publicClient, chainId]);
};

// Fetcher 4: Get detailed borrow positions (per asset)
export const useFetchBorrowPositions = (chainId?: number, publicClient?: any) => {
  return useCallback(async (marginAccount: `0x${string}`) => {
    if (!publicClient || !chainId || !marginAccount) return [];

    const borrowedAddresses = await publicClient.readContract({
      address: marginAccount,
      abi: Account.abi,
      functionName: "getBorrows",
    }) as `0x${string}`[];

    const positions = await Promise.all(borrowedAddresses.map(async (tokenAddr) => {
      const [symbol, decimals] = await Promise.all([
        publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'symbol' }),
        publicClient.readContract({ address: tokenAddr, abi: erc20Abi, functionName: 'decimals' }),
      ]);

      const lookupSym = symbol === "WETH" ? "ETH" : symbol;
      const vTokenAddr = vTokenAddressByChain[chainId]?.[lookupSym];

      if (!vTokenAddr) return null;

      const rawBalance = await publicClient.readContract({
        address: vTokenAddr,
        abi: VToken.abi,
        functionName: "getBorrowBalance",
        args: [marginAccount],
      }) as bigint;

      const amount = formatUnits(rawBalance, Number(decimals));

      return { asset: symbol, address: tokenAddr, decimals: Number(decimals), amount };
    }));

    return positions.filter(Boolean).filter(p => Number(p!.amount) > 0);
  }, [publicClient, chainId]);
};

// Fetcher 5: Get borrow balances directly from VToken contracts (like test implementation)
// Fetches ETH, USDC, and USDT (if available on the chain)
export const useFetchDirectBorrowBalances = (chainId?: number, publicClient?: any) => {
  return useCallback(async (marginAccount: `0x${string}`) => {
    if (!publicClient || !chainId || !marginAccount) {
      return { borrowedETH: 0n, borrowedUSDC: 0n, borrowedUSDT: 0n };
    }

    const addressList = getAddressList(chainId);
    if (!addressList) {
      return { borrowedETH: 0n, borrowedUSDC: 0n, borrowedUSDT: 0n };
    }

    try {
      // Fetch borrowed ETH from VEther contract
      let borrowedETHRaw = 0n;
      try {
        borrowedETHRaw = await publicClient.readContract({
          address: addressList.vEtherContractAddress,
          abi: VEther.abi,
          functionName: "getBorrowBalance",
          args: [marginAccount],
        }) as bigint;
      } catch (error) {
        console.error("Failed to fetch ETH borrow balance:", error);
      }

      // Fetch borrowed USDC from VToken contract
      let borrowedUSDCRaw = 0n;
      try {
        borrowedUSDCRaw = await publicClient.readContract({
          address: addressList.vUSDCContractAddress,
          abi: VToken.abi,
          functionName: "getBorrowBalance",
          args: [marginAccount],
        }) as bigint;
      } catch (error) {
        console.error("Failed to fetch USDC borrow balance:", error);
      }

      // Fetch borrowed USDT from VToken contract (optional - only if configured)
      let borrowedUSDTRaw = 0n;
      if (addressList.vUSDTContractAddress) {
        try {
          borrowedUSDTRaw = await publicClient.readContract({
            address: addressList.vUSDTContractAddress,
            abi: VToken.abi,
            functionName: "getBorrowBalance",
            args: [marginAccount],
          }) as bigint;
        } catch (error) {
          console.warn("Failed to fetch USDT borrow balance (may not be configured):", error);
        }
      }

      // Convert to display units (ETH: 18 decimals, USDC: 6 decimals, USDT: 6 decimals)
      const borrowedETH = borrowedETHRaw / (10n ** 18n);
      const borrowedUSDC = borrowedUSDCRaw / (10n ** 6n);
      const borrowedUSDT = borrowedUSDTRaw / (10n ** 6n);

      console.log(`[DirectBorrow] ETH: ${borrowedETH.toString()}, USDC: ${borrowedUSDC.toString()}, USDT: ${borrowedUSDT.toString()}`);

      return {
        borrowedETH,
        borrowedUSDC,
        borrowedUSDT,
        borrowedETHRaw,
        borrowedUSDCRaw,
        borrowedUSDTRaw
      };
    } catch (error) {
      console.error("Failed to fetch direct borrow balances:", error);
      return {
        borrowedETH: 0n,
        borrowedUSDC: 0n,
        borrowedUSDT: 0n,
        borrowedETHRaw: 0n,
        borrowedUSDCRaw: 0n,
        borrowedUSDTRaw: 0n
      };
    }
  }, [publicClient, chainId]);
};