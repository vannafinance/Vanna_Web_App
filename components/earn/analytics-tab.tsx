"use client";

import { useCallback, useEffect, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { Chart } from "./chart";
import DefaultRateModel from "@/abi/vanna/out/out/DefaultRateModel.sol/DefaultRateModel.json";
import { vTokenAddressByChain, TOKEN_DECIMALS, rateModelAddressByChain } from "@/lib/utils/web3/token";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import earnCalc from "@/lib/utils/earn/calculations";
import type { EarnAsset } from "@/lib/types";

interface AnalyticsTabProps {
  selectedAsset?: EarnAsset;
}

export const AnalyticsTab = ({ selectedAsset = "ETH" }: AnalyticsTabProps) => {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [supplyAPY, setSupplyAPY] = useState<number>(0);
  const [borrowAPY, setBorrowAPY] = useState<number>(0);

  const fetchCurrentAPY = useCallback(async () => {
    if (!publicClient || !chainId || !selectedAsset) return;

    try {
      const vTokenAddr = vTokenAddressByChain[chainId]?.[selectedAsset];
      const rateModelAddr = rateModelAddressByChain[chainId];
      if (!vTokenAddr || !rateModelAddr) return;

      const abi = selectedAsset === "ETH" ? VEther.abi : VToken.abi;
      const decimals = TOKEN_DECIMALS[selectedAsset] ?? 18;

      // Fetch totalAssets and getBorrows from vault
      const [totalAssetsResult, getBorrowsResult] = await publicClient.multicall({
        contracts: [
          { address: vTokenAddr, abi, functionName: "totalAssets" },
          { address: vTokenAddr, abi, functionName: "getBorrows" },
        ],
        allowFailure: true,
      });

      if (
        totalAssetsResult?.status === "failure" ||
        getBorrowsResult?.status === "failure"
      ) {
        return;
      }

      const totalAssetsRaw = totalAssetsResult.result as bigint;
      const borrowsRaw = getBorrowsResult.result as bigint;
      const availableLiquidity = totalAssetsRaw - borrowsRaw;

      // Fetch on-chain rate from DefaultRateModel
      const ratePerSecond = await publicClient.readContract({
        address: rateModelAddr,
        abi: DefaultRateModel.abi,
        functionName: "getBorrowRatePerSecond",
        args: [availableLiquidity, borrowsRaw],
      }) as bigint;

      const rateFormatted = Number(formatUnits(ratePerSecond, 18));
      const bAPY = earnCalc.calcBorrowAPYFromRate(rateFormatted);
      const sAPY = earnCalc.calcSupplyAPYFromRate(bAPY);

      setBorrowAPY(bAPY);
      setSupplyAPY(sAPY);
    } catch (err) {
      console.error("[AnalyticsTab] Failed to fetch APY:", err);
    }
  }, [publicClient, chainId, selectedAsset]);

  useEffect(() => {
    fetchCurrentAPY();
  }, [fetchCurrentAPY]);

  return (
    <section className="w-full flex-1 min-h-0" aria-label="Analytics Dashboard">
      <figure className="w-full h-full">
        <Chart
          type="deposit-apy"
          currencyTab={true}
          height={393}
          containerWidth="w-full"
          containerHeight="h-full"
          supplyAPY={supplyAPY}
          borrowAPY={borrowAPY}
        />
      </figure>
    </section>
  );
};
