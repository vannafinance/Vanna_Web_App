"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { Table } from "./table";
import { fetchAllMarginAccountsMulticall, fetchBorrowPositionsMulticall } from "@/lib/utils/margin/marginMulticall";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import { useTheme } from "@/contexts/theme-context";
import type { EarnAsset } from "@/lib/types";

const tableHeadings = [
  { label: "Margin Manager", id: "margin-manager" },
  { label: "Current Debt", id: "current-debt" },
  { label: "Asset LT", id: "asset-lt" },
];

type MarginRow = {
  cell: {
    title?: string;
    description?: string;
  }[];
};

const shortenAddr = (addr: string) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const MarginManagersTab = ({
  selectedAsset = "ETH" as EarnAsset,
}: {
  selectedAsset?: EarnAsset;
}) => {
  const { isDark } = useTheme();
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  const [rows, setRows] = useState<MarginRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarginData = useCallback(async () => {
    if (!publicClient || !chainId || !userAddress) return;

    setLoading(true);
    setError(null);

    try {
      // Stage 1: Fetch all margin accounts with collateral/borrow stats
      const stats = await fetchAllMarginAccountsMulticall(
        chainId,
        publicClient as any,
        userAddress
      );

      if (!stats || stats.accounts.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Stage 2: For each account, fetch borrow positions + collateral asset count
      const builtRows: MarginRow[] = await Promise.all(
        stats.accounts.map(async (account, index) => {
          // Fetch borrowed asset details
          let debtLabel = "$0.00";
          let debtDescription = "$0.00";

          try {
            const positions = await fetchBorrowPositionsMulticall(
              chainId,
              publicClient as any,
              account.accountAddress
            );

            if (positions.length > 0) {
              // Show the largest position as the main label
              const mainPos = positions[0];
              const sym = mainPos.asset === "WETH" ? "ETH" : mainPos.asset;
              const amount = Number(mainPos.amount);
              debtLabel = `${amount.toFixed(2)} ${sym}`;
              debtDescription = `$${account.borrowUsd.toFixed(2)}`;
            } else {
              debtLabel = `0.00 ${selectedAsset}`;
              debtDescription = "$0.00";
            }
          } catch {
            debtLabel = `0.00 ${selectedAsset}`;
            debtDescription = `$${account.borrowUsd.toFixed(2)}`;
          }

          // Fetch collateral asset count
          let assetCount = 0;
          try {
            const assets = (await publicClient.readContract({
              address: account.accountAddress,
              abi: Account.abi,
              functionName: "getAssets",
            })) as `0x${string}`[];
            assetCount = assets.length;
          } catch {
            assetCount = 0;
          }

          return {
            cell: [
              {
                title: `Tier #${index + 1}`,
                description: shortenAddr(account.accountAddress),
              },
              {
                title: debtLabel,
                description: debtDescription,
              },
              {
                title: `${assetCount} asset${assetCount !== 1 ? "s" : ""}`,
              },
            ],
          };
        })
      );

      setRows(builtRows);
    } catch (err) {
      console.error("[MarginManagers] Failed to fetch data:", err);
      setError("Failed to load margin manager data");
    } finally {
      setLoading(false);
    }
  }, [publicClient, chainId, userAddress, selectedAsset]);

  useEffect(() => {
    fetchMarginData();
  }, [fetchMarginData]);

  if (!userAddress) {
    return (
      <section className="w-full h-fit" aria-label="Margin Managers Overview">
        <div className={`w-full h-[200px] border-[1px] rounded-[8px] flex items-center justify-center ${
          isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
        }`}>
          <p className={`text-[14px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}>
            Connect your wallet to view margin managers
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="w-full h-fit" aria-label="Margin Managers Overview">
        <div className={`w-full h-[200px] border-[1px] rounded-[8px] flex items-center justify-center ${
          isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
        }`}>
          <p className={`text-[14px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}>
            Loading margin managers...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full h-fit" aria-label="Margin Managers Overview">
        <div className={`w-full h-[200px] border-[1px] rounded-[8px] flex flex-col items-center justify-center gap-[8px] ${
          isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"
        }`}>
          <p className={`text-[14px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}>
            {error}
          </p>
          <button
            onClick={fetchMarginData}
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
    <section className="w-full h-fit" aria-label="Margin Managers Overview">
      <article aria-label="Margin Managers List">
        <Table
          heading={{}}
          tableHeadings={tableHeadings}
          tableBody={tableBody}
        />
      </article>
    </section>
  );
};
