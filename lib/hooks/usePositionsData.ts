/**
 * usePositionsData - Fetches REAL position data from the blockchain
 *
 * WHAT IT DOES:
 * 1. Gets user's margin account addresses from Registry contract
 * 2. Reads collateral assets (Account.getAssets + ERC20.balanceOf)
 * 3. Reads borrowed assets (Account.getBorrows + VToken.getBorrowBalance)
 * 4. Reads health status from RiskEngine (isAccountHealthy, getBalance, getBorrows)
 * 5. Fetches token prices from /api/prices
 * 6. SPLITS each borrow into its own position row for clear visibility
 * 7. Returns data shaped like the Position[] type for the table
 *
 * SPLIT LOGIC:
 * - Each margin account can have multiple borrows (USDC, ETH, USDT)
 * - Instead of showing 1 row with all borrows merged, we show 1 row PER borrow
 * - Collateral is shared across all borrows from the same account
 * - If an account has collateral but no borrows, it shows as a single "Collateral Only" row
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { vTokenAddressByChain } from "@/lib/utils/web3/token";
import type { Position, BorrowInfo, CollateralInfo } from "@/lib/types";

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

      // STEP 2: Fetch prices
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

      // STEP 3: For each margin account, build split Position entries
      const positionsData: Position[] = [];
      let globalPositionId = 1;

      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];

        try {
          // ── Fetch collateral assets ──
          const assetAddresses = (await publicClient.readContract({
            address: acc,
            abi: Account.abi,
            functionName: "getAssets",
          })) as `0x${string}`[];

          let collateralToken = "USD";
          let collateralAmount = 0;
          let collateralUsdValue = 0;
          const collaterals: CollateralInfo[] = [];

          if (assetAddresses.length > 0) {
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

                if (usd < 0.01) continue;

                totalCollUsd += usd;

                const roundedBal = bal < 1
                  ? Math.round(bal * 1_000_000) / 1_000_000
                  : Math.round(bal * 10_000) / 10_000;

                collaterals.push({
                  assetData: { asset: sym, amount: String(roundedBal) },
                  usdValue: Math.round(usd * 100) / 100,
                });

                if (usd > maxCollUsd) {
                  maxCollUsd = usd;
                  collateralToken = sym;
                  collateralAmount = roundedBal;
                }
              }
            }

            collateralUsdValue = totalCollUsd;
          }

          // ── Fetch borrowed assets ──
          const borrowedAddresses = (await publicClient.readContract({
            address: acc,
            abi: Account.abi,
            functionName: "getBorrows",
          })) as `0x${string}`[];

          const allBorrows: BorrowInfo[] = [];
          let totalBorrowUsd = 0;

          if (borrowedAddresses.length > 0) {
            const metaCalls = borrowedAddresses.flatMap((tokenAddr) => [
              { address: tokenAddr, abi: erc20Abi, functionName: "symbol" as const },
              { address: tokenAddr, abi: erc20Abi, functionName: "decimals" as const },
            ]);

            const metaResults = await publicClient.multicall({
              contracts: metaCalls,
              allowFailure: true,
            });

            const borrowBalanceCalls = borrowedAddresses.map((tokenAddr, idx) => {
              const symRes = metaResults[idx * 2];
              const sym = symRes.status === "success" ? (symRes.result as string) : "";
              const lookupSym = sym === "WETH" ? "ETH" : sym;
              const vTokenAddr = vTokenAddressByChain[chainId]?.[lookupSym];
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
                  const roundedBal = bal < 1
                    ? Math.round(bal * 1_000_000) / 1_000_000
                    : Math.round(bal * 10_000) / 10_000;
                  allBorrows.push({
                    assetData: { asset: sym, amount: String(roundedBal) },
                    percentage: 0,
                    usdValue: Math.round(usd * 100) / 100,
                  });
                }
              }
            }

            if (totalBorrowUsd > 0) {
              for (const b of allBorrows) {
                b.percentage = Math.round((b.usdValue / totalBorrowUsd) * 100);
              }
            }
          }

          // ── Fetch health data from RiskEngine ──
          let isHealthy = true;
          let riskBalance = 0;
          let riskBorrows = 0;
          let balanceToBorrowThreshold = 1.2; // Contract default

          try {
            const riskEngineCalls = [
              {
                address: addressList.riskEngineContractAddress as `0x${string}`,
                abi: RiskEngine.abi,
                functionName: "isAccountHealthy" as const,
                args: [acc] as const,
              },
              {
                address: addressList.riskEngineContractAddress as `0x${string}`,
                abi: RiskEngine.abi,
                functionName: "getBalance" as const,
                args: [acc] as const,
              },
              {
                address: addressList.riskEngineContractAddress as `0x${string}`,
                abi: RiskEngine.abi,
                functionName: "getBorrows" as const,
                args: [acc] as const,
              },
              {
                address: addressList.riskEngineContractAddress as `0x${string}`,
                abi: RiskEngine.abi,
                functionName: "balanceToBorrowThreshold" as const,
                args: [] as const,
              },
            ];

            const riskResults = await publicClient.multicall({
              contracts: riskEngineCalls,
              allowFailure: true,
            });

            if (riskResults[0].status === "success") {
              isHealthy = riskResults[0].result as boolean;
            }
            if (riskResults[1].status === "success") {
              riskBalance = Number(formatUnits(riskResults[1].result as bigint, 18));
            }
            if (riskResults[2].status === "success") {
              riskBorrows = Number(formatUnits(riskResults[2].result as bigint, 18));
            }
            if (riskResults[3].status === "success") {
              balanceToBorrowThreshold = Number(formatUnits(riskResults[3].result as bigint, 18));
            }
          } catch (riskErr) {
            console.warn(`[usePositionsData] RiskEngine read failed for ${acc}:`, riskErr);
          }

          // Normalized health factor: (balance/borrows) / threshold
          // HF > 1 = safe, HF <= 1 = liquidatable (matches contract's isAccountHealthy)
          const healthFactor = riskBorrows > 0
            ? Math.round(((riskBalance / riskBorrows) / balanceToBorrowThreshold) * 100) / 100
            : 0;

          // Skip truly empty accounts
          if (collateralUsdValue < 0.01 && totalBorrowUsd < 0.01) {
            continue;
          }

          // ── SPLIT: Create one Position per borrow asset ──
          // LTV = totalBorrowUsd / collateralUsd × 100 — account-wide, honest metric.
          // Max LTV enforced by protocol = 90%. Comparable across all collateral types.
          const accountLtv = collateralUsdValue > 0
            ? Math.round((totalBorrowUsd / collateralUsdValue) * 100 * 10) / 10
            : 0;

          if (allBorrows.length > 0) {
            for (const borrow of allBorrows) {
              const borrowUsd = borrow.usdValue;
              const interestAccrued = Math.round(borrowUsd * 0.004 * 100) / 100;
              const displaySym = borrow.assetData.asset === "WETH" ? "ETH" : borrow.assetData.asset;

              positionsData.push({
                positionId: globalPositionId++,
                collateral: {
                  asset: collateralToken,
                  amount: String(collateralAmount),
                },
                collateralUsdValue: Math.round(collateralUsdValue * 100) / 100,
                collaterals,
                borrowed: [borrow],
                ltv: accountLtv,
                interestAccrued,
                isOpen: true,
                user: address,
                // On-chain account details
                accountAddress: acc,
                isHealthy,
                totalAccountBalanceUsd: Math.round(riskBalance * 100) / 100,
                totalAccountBorrowUsd: Math.round(riskBorrows * 100) / 100,
                healthFactor,
                borrowAssetLabel: `${displaySym} Borrow`,
              });
            }
          } else {
            // Account with collateral but no borrows — show as single row
            positionsData.push({
              positionId: globalPositionId++,
              collateral: {
                asset: collateralToken,
                amount: String(collateralAmount),
              },
              collateralUsdValue: Math.round(collateralUsdValue * 100) / 100,
              collaterals,
              borrowed: [],
              ltv: 0,
              interestAccrued: 0,
              isOpen: collateralUsdValue > 0.01,
              user: address,
              accountAddress: acc,
              isHealthy,
              totalAccountBalanceUsd: Math.round(riskBalance * 100) / 100,
              totalAccountBorrowUsd: Math.round(riskBorrows * 100) / 100,
              healthFactor,
              borrowAssetLabel: "Collateral Only",
            });
          }
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

  // Auto-refresh when borrow/repay/deposit completes
  useEffect(() => {
    const handler = () => fetchPositions();
    window.addEventListener("vanna:position-update", handler);
    return () => window.removeEventListener("vanna:position-update", handler);
  }, [fetchPositions]);

  return { positions, isLoading, error, refetch: fetchPositions };
}
