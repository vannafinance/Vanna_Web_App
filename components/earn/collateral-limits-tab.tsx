"use client";

import { useEffect, useState, useCallback } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { Table } from "./table";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import AccountManager from "@/abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import {
  vTokenAddressByChain,
  SUPPORTED_TOKENS_BY_CHAIN,
  TOKEN_DECIMALS,
  accountManagerAddressByChain,
  riskEngineAddressByChain,
} from "@/lib/utils/web3/token";
import { iconPaths } from "@/lib/constants";
import { useTheme } from "@/contexts/theme-context";
import type { EarnAsset } from "@/lib/types";

const tableHeadings = [
  { label: "Assets", id: "assets" },
  { label: "Limits Usage", id: "limits-usage" },
];

type CollateralRow = {
  cell: {
    icon?: string;
    title?: string;
    description?: string;
    percentage?: number;
    value?: string;
  }[];
};

const formatAmount = (value: number, decimals: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(decimals <= 6 ? 2 : 4);
};

const getVaultLabel = (asset: string): string => {
  if (asset === "ETH") return "vETH";
  return `v${asset}`;
};

export const CollateralLimitsTab = ({
  selectedAsset,
}: {
  selectedAsset?: EarnAsset;
}) => {
  const { isDark } = useTheme();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [rows, setRows] = useState<CollateralRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollateralData = useCallback(async () => {
    if (!publicClient || !chainId) return;

    setLoading(true);
    setError(null);

    try {
      const supportedTokens = SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? [];
      if (supportedTokens.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Build multicall: per token → totalAssets + getBorrows + isCollateralAllowed
      const accountManagerAddr = accountManagerAddressByChain[chainId];
      const riskEngineAddr = riskEngineAddressByChain[chainId];

      const contracts: any[] = [];

      for (const token of supportedTokens) {
        const vTokenAddr = vTokenAddressByChain[chainId]?.[token];
        if (!vTokenAddr) continue;

        const abi = token === "ETH" ? VEther.abi : VToken.abi;

        // totalAssets
        contracts.push({
          address: vTokenAddr,
          abi,
          functionName: "totalAssets",
        });

        // getBorrows (total borrows in the vault)
        contracts.push({
          address: vTokenAddr,
          abi,
          functionName: "getBorrows",
        });

        // isCollateralAllowed (check if this token is accepted as collateral)
        if (accountManagerAddr) {
          const tokenAddr =
            token === "ETH"
              ? // For ETH, check WETH address from the chain's token list
                vTokenAddr // AccountManager may not track vToken directly; use underlying
              : vTokenAddressByChain[chainId]?.[token];

          contracts.push({
            address: accountManagerAddr,
            abi: AccountManager.abi,
            functionName: "isCollateralAllowed",
            args: [tokenAddr],
          });
        }
      }

      // Also fetch balanceToBorrowThreshold from RiskEngine
      if (riskEngineAddr) {
        contracts.push({
          address: riskEngineAddr,
          abi: RiskEngine.abi,
          functionName: "balanceToBorrowThreshold",
        });
      }

      // Also fetch assetCap from AccountManager
      if (accountManagerAddr) {
        contracts.push({
          address: accountManagerAddr,
          abi: AccountManager.abi,
          functionName: "assetCap",
        });
      }

      const results = await publicClient.multicall({
        contracts,
        allowFailure: true,
      });

      // Parse results
      const callsPerToken = accountManagerAddr ? 3 : 2;
      const builtRows: CollateralRow[] = [];

      for (let i = 0; i < supportedTokens.length; i++) {
        const token = supportedTokens[i];
        const baseIdx = i * callsPerToken;
        const decimals = TOKEN_DECIMALS[token] ?? 18;

        const totalAssetsResult = results[baseIdx];
        const getBorrowsResult = results[baseIdx + 1];

        if (
          totalAssetsResult?.status === "failure" ||
          getBorrowsResult?.status === "failure"
        ) {
          continue;
        }

        const totalAssetsRaw = totalAssetsResult?.result as bigint;
        const getBorrowsRaw = getBorrowsResult?.result as bigint;

        const totalAssets = Number(formatUnits(totalAssetsRaw, decimals));
        const totalBorrows = Number(formatUnits(getBorrowsRaw, decimals));

        // Utilization = borrows / totalAssets * 100
        const utilization =
          totalAssets > 0 ? (totalBorrows / totalAssets) * 100 : 0;

        const formattedBorrows = formatAmount(totalBorrows, decimals);
        const formattedTotal = formatAmount(totalAssets, decimals);

        builtRows.push({
          cell: [
            {
              icon: iconPaths[token] || "/icons/eth-icon.png",
              title: token,
              description: getVaultLabel(token),
            },
            {
              percentage: Math.round(utilization * 100) / 100,
              value: `${formattedBorrows} of ${formattedTotal}`,
            },
          ],
        });
      }

      // Parse threshold and asset cap from the trailing calls
      const trailingStart = supportedTokens.length * callsPerToken;

      let thresholdValue: number | null = null;
      let assetCapValue: number | null = null;

      if (riskEngineAddr) {
        const thresholdResult = results[trailingStart];
        if (thresholdResult?.status === "success") {
          // balanceToBorrowThreshold is in 18 decimals (e.g., 1.2e18 = 120%)
          thresholdValue =
            Number(thresholdResult.result as bigint) / 1e18;
        }
      }

      if (accountManagerAddr) {
        const assetCapIdx = riskEngineAddr
          ? trailingStart + 1
          : trailingStart;
        const assetCapResult = results[assetCapIdx];
        if (assetCapResult?.status === "success") {
          assetCapValue = Number(assetCapResult.result as bigint);
        }
      }

      // Add a summary row for protocol parameters if we have them
      if (thresholdValue !== null || assetCapValue !== null) {
        const summaryParts: string[] = [];
        if (thresholdValue !== null)
          summaryParts.push(
            `LT: ${(thresholdValue * 100).toFixed(0)}%`
          );
        if (assetCapValue !== null)
          summaryParts.push(`Max Assets/Account: ${assetCapValue}`);

        // Log for debugging
        console.log(
          `[CollateralLimits] Protocol params: ${summaryParts.join(", ")}`
        );
      }

      setRows(builtRows);
    } catch (err) {
      console.error("[CollateralLimits] Failed to fetch data:", err);
      setError("Failed to load collateral and limits data");
    } finally {
      setLoading(false);
    }
  }, [publicClient, chainId]);

  useEffect(() => {
    fetchCollateralData();
  }, [fetchCollateralData]);

  if (loading) {
    return (
      <section
        className="w-full h-fit"
        aria-label="Collateral Limits Overview"
      >
        <div
          className={`w-full h-[200px] border-[1px] rounded-[8px] flex items-center justify-center ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
        >
          <p
            className={`text-[14px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}
          >
            Loading collateral and limits...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="w-full h-fit"
        aria-label="Collateral Limits Overview"
      >
        <div
          className={`w-full h-[200px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[8px] ${
            isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
          }`}
        >
          <p
            className={`text-[14px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}
          >
            {error}
          </p>
          <button
            onClick={fetchCollateralData}
            className="text-[12px] text-[#703AE6] font-medium hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const tableBody = { rows };

  return (
    <section className="w-full h-fit" aria-label="Collateral Limits Overview">
      <article aria-label="Asset Limits Usage">
        <Table
          heading={{}}
          tableHeadings={tableHeadings}
          tableBody={tableBody}
          showProgressBar={true}
        />
      </article>
    </section>
  );
};
