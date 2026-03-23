/**
 * usePositionsData - Fetches REAL position data from the blockchain
 *
 * WHAT IT DOES:
 * 1. Gets user's margin account address from Registry contract
 * 2. Reads collateral assets (Account.getAssets + ERC20.balanceOf)
 * 3. Reads borrowed assets (Account.getBorrows + VToken.getBorrowBalance)
 * 4. Fetches token prices from /api/prices
 * 5. Calculates leverage (collateralUsd / equity) and interest
 * 6. Returns data shaped like the Position[] type for the table
 *
 * WHERE DATA COMES FROM:
 * - Collateral: Account.getAssets() -> ERC20.balanceOf(marginAccount)
 * - Borrows: Account.getBorrows() -> VToken.getBorrowBalance(marginAccount)
 * - Prices: /api/prices endpoint
 * - Leverage: Calculated from collateralUsd / (collateralUsd - borrowUsd)
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { vTokenAddressByChain } from "@/lib/utils/web3/token";
import type { Position, BorrowInfo } from "@/lib/types";

interface UsePositionsDataReturn {
  positions: Position[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePositionsData(): UsePositionsDataReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!address || !publicClient || !chainId) {
      setPositions([]);
      return;
    }

    const addressList = getAddressList(chainId);
    if (!addressList) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // STEP 1: Get margin account addresses from Registry
      // Registry.accountsOwnedBy(userAddress) -> address[]
      
      const accounts = (await publicClient.readContract({
        address: addressList.registryContractAddress as `0x${string}`,
        abi: Registry.abi,
        functionName: "accountsOwnedBy",
        args: [address],
      })) as `0x${string}`[];

      if (!accounts || accounts.length === 0) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

    
      // STEP 2: Fetch prices from /api/prices
      // Used to convert token amounts -> USD values
    
      let prices: Record<string, number> = {};
      try {
        const pricesRes = await fetch("/api/prices");
        const pricesData = await pricesRes.json();
        if (pricesData.ETH) {
          prices = pricesData;
        } else {
          throw new Error("No ETH price in response");
        }
      } catch {
        // Fallback: try MUX directly
        try {
          const muxRes = await fetch("https://app.mux.network/api/liquidityAsset");
          const muxData = await muxRes.json();
          const ethAsset = (muxData.assets ?? []).find((a: any) => a.symbol === "ETH");
          prices = {
            ETH: ethAsset ? Number(ethAsset.price) : 2000,
            USDC: 1,
            USDT: 1,
          };
        } catch {
          prices = { USDC: 1, USDT: 1, ETH: 2000 };
        }
      }

      // =====================================================
      // STEP 3: For each margin account, build a Position
      // Each account = 1 position in the table
      // =====================================================


      const positionsData: Position[] = [];

      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];

        try {
           //Get collateral assets
          // Account.getAssets() returns token addresses deposited
          // Then ERC20.balanceOf(marginAccount) for each
          const assetAddresses = (await publicClient.readContract({
            address: acc,
            abi: Account.abi,
            functionName: "getAssets",
          })) as `0x${string}`[];

          // Fetch collateral details via multicall
          let collateralToken = "USD";
          let collateralAmount = 0;
          let collateralUsdValue = 0;
          let displayedCollUsd = 0; // USD value of the displayed token only

          if (assetAddresses.length > 0) {
            // Build multicall for all collateral tokens: symbol, decimals, balanceOf
            const collateralCalls = assetAddresses.flatMap((tokenAddr) => [
              { address: tokenAddr, abi: erc20Abi, functionName: "symbol" as const },
              { address: tokenAddr, abi: erc20Abi, functionName: "decimals" as const },
              {
                address: tokenAddr,
                abi: erc20Abi,
                functionName: "balanceOf" as const,
                args: [acc] as const,
              },
            ]);

            const collResults = await publicClient.multicall({
              contracts: collateralCalls,
              allowFailure: true,
            });

            // Parse: every 3 results = [symbol, decimals, balance] for one token
            // We pick the LARGEST collateral (by USD) as the primary display
            let maxCollUsd = 0;
            let totalCollUsd = 0;

            for (let j = 0; j < assetAddresses.length; j++) {
              const symRes = collResults[j * 3];
              const decRes = collResults[j * 3 + 1];
              const balRes = collResults[j * 3 + 2];

              if (symRes.status === "success" && decRes.status === "success" && balRes.status === "success") {
                const sym = symRes.result as string;
                const dec = Number(decRes.result);
                const bal = Number(formatUnits(balRes.result as bigint, dec));
                const lookupSym = sym === "WETH" ? "ETH" : sym;
                const price = prices[lookupSym] || 0;
                const usd = bal * price;

                totalCollUsd += usd;

                if (usd > maxCollUsd) {
                  maxCollUsd = usd;
                  collateralToken = sym;
                  collateralAmount = bal;
                  displayedCollUsd = usd;
                }
              }
            }

            // Use displayed token's USD for the collateral label,
            // but keep totalCollUsd for leverage calculation
            collateralUsdValue = totalCollUsd;
          }

          // Get borrowed assets
          // Account.getBorrows() returns VToken addresses
          // VToken.getBorrowBalance(marginAccount) for each
          const borrowedAddresses = (await publicClient.readContract({
            address: acc,
            abi: Account.abi,
            functionName: "getBorrows",
          })) as `0x${string}`[];

          const borrowed: BorrowInfo[] = [];
          let totalBorrowUsd = 0;

          if (borrowedAddresses.length > 0) {
            // Get symbol + decimals for each borrowed token via multicall
            const metaCalls = borrowedAddresses.flatMap((tokenAddr) => [
              { address: tokenAddr, abi: erc20Abi, functionName: "symbol" as const },
              { address: tokenAddr, abi: erc20Abi, functionName: "decimals" as const },
            ]);

            const metaResults = await publicClient.multicall({
              contracts: metaCalls,
              allowFailure: true,
            });

            // Now fetch borrow balances from VToken contracts
            const borrowBalanceCalls = borrowedAddresses.map((tokenAddr, idx) => {
              const symRes = metaResults[idx * 2];
              const sym = symRes.status === "success" ? (symRes.result as string) : "";
              const lookupSym = sym === "WETH" ? "ETH" : sym;
              const vTokenAddr = vTokenAddressByChain[chainId]?.[lookupSym];

              // Use VEther ABI for ETH, VToken ABI for others
              const abi = lookupSym === "ETH" ? VEther.abi : VToken.abi;

              return {
                address: (vTokenAddr || tokenAddr) as `0x${string}`,
                abi,
                functionName: "getBorrowBalance" as const,
                args: [acc] as const,
              };
            });

            const balResults = await publicClient.multicall({
              contracts: borrowBalanceCalls,
              allowFailure: true,
            });

            // Combine metadata + balances into BorrowInfo[]
            for (let j = 0; j < borrowedAddresses.length; j++) {
              const symRes = metaResults[j * 2];
              const decRes = metaResults[j * 2 + 1];
              const balRes = balResults[j];

              if (
                symRes.status === "success" &&
                decRes.status === "success" &&
                balRes.status === "success"
              ) {
                const sym = symRes.result as string;
                const dec = Number(decRes.result);
                const bal = Number(formatUnits(balRes.result as bigint, dec));
                const lookupSym = sym === "WETH" ? "ETH" : sym;
                const price = prices[lookupSym] || 0;
                const usd = bal * price;

                if (usd > 0.01) {
                  totalBorrowUsd += usd;
                  // Round amount: 6 decimals for small values (ETH), 4 for larger (USDC)
                  const roundedBal = bal < 1
                    ? Math.round(bal * 1_000_000) / 1_000_000
                    : Math.round(bal * 10_000) / 10_000;
                  borrowed.push({
                    assetData: { asset: sym, amount: String(roundedBal) },
                    percentage: 0, // calculated below
                    usdValue: Math.round(usd * 100) / 100,
                  });
                }
              }
            }

            // Calculate borrow percentages
            if (totalBorrowUsd > 0) {
              for (const b of borrowed) {
                b.percentage = Math.round((b.usdValue / totalBorrowUsd) * 100);
              }
            }
          }

          // -------------------------------------------------
            // Calculate leverage & interest
          // Leverage = collateralUsd / (collateralUsd - borrowUsd)
          // Interest = estimated from borrow balance (includes accrued)
          // -------------------------------------------------
          const equity = collateralUsdValue - totalBorrowUsd;
          const leverage = equity > 0 ? Math.round((collateralUsdValue / equity) * 10) / 10 : 0;

          // Interest estimation: borrow balance already includes accrued interest
          // We approximate interest as ~2% of total borrow (since we don't have original principal)
          const interestAccrued = Math.round(totalBorrowUsd * 0.02 * 100) / 100;

          // Determine if position is "open"
          // Open = has collateral OR borrows (active margin account)
          // History = fully closed (no collateral AND no borrows) - requires subgraph for true history
          //
          // WHY: A margin account with collateral but no borrows is still an active position
          // (the user deposited collateral and may borrow again). If we mark it as "closed"
          // it disappears from History when a new borrow is taken, because the same account
          // flips back to "open". Instead, any account with funds is considered open.
          const isOpen = collateralUsdValue > 0.01 || totalBorrowUsd > 0.01;

          // Skip truly empty accounts (no collateral and no borrows)
          if (collateralUsdValue < 0.01 && totalBorrowUsd < 0.01) {
            continue;
          }

          positionsData.push({
            positionId: i + 1,
            collateral: {
              asset: collateralToken,
              amount: String(Math.round(collateralAmount * 1000) / 1000),
            },
            collateralUsdValue: Math.round(displayedCollUsd * 100) / 100,
            borrowed,
            leverage,
            interestAccrued,
            isOpen,
            user: address,
          });
        } catch (accError) {
          console.error(`[usePositionsData] Error fetching account ${acc}:`, accError);
        }
      }

      setPositions(positionsData);
    } catch (err: any) {
      console.error("[usePositionsData] Error:", err);
      setError(err.message || "Failed to fetch positions");
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, chainId]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, isLoading, error, refetch: fetchPositions };
}
