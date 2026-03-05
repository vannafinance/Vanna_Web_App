/**
 * Activity Tab - Shows REAL vault activity from blockchain events
 *
 * WHAT CHANGED (from hardcoded -> live data):
 * - OLD: Static mock data for User Distribution and All Transactions
 * - NEW: useVaultActivityData() hook fetches Deposit/Withdraw events from VToken contract
 *
 * DATA FLOW:
 * 1. Gets selected vault asset from useEarnVaultStore
 * 2. useVaultActivityData(asset) fetches Deposit + Withdraw event logs
 * 3. User Distribution = aggregated net deposits per address (top 10)
 * 4. All Transactions = chronological list of Deposit/Withdraw events with timestamps
 *
 * SECTIONS:
 * - "User Distribution": Top suppliers with amount, USD value, supply %
 * - "All Transactions": Recent deposits/withdrawals with date, type, amount, user
 */

import { useMemo } from "react";
import { Table } from "./table";
import { useTheme } from "@/contexts/theme-context";
import { useEarnVaultStore } from "@/store/earn-vault-store";
import { useVaultActivityData } from "@/lib/hooks/useVaultActivityData";
import { EarnAsset } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format-value";
import { iconPaths } from "@/lib/constants";

const userDistributionHeadings = [
  { label: "User Id", id: "user-id" },
  { label: "Supplied Assets", id: "supplied-assets" },
  { label: "Supply (%)", id: "supply-percent" },
];

export const transactionTableHeadings = [
  { label: "Date", id: "date" },
  { label: "Type", id: "type" },
  { label: "Amount", id: "amount" },
  { label: "User Id", id: "userId" },
];

// Legacy export for farm page compatibility (was hardcoded, now empty placeholder)
export const transactionTableBody = { rows: [] };

export const ActivityTab = ({ selectedAsset }: { selectedAsset?: EarnAsset }) => {
  const { isDark } = useTheme();

  // Use prop if provided, fallback to store, then default to ETH
  const selectedVault = useEarnVaultStore((state) => state.selectedVault);
  const asset = selectedAsset || (selectedVault?.title as EarnAsset) || "ETH";

  // Fetch real activity data from blockchain events
  const { userDistribution, transactions, isLoading, error, refetch } =
    useVaultActivityData(asset);

  // Convert userDistribution data into Table component format
  const userDistributionTableBody = useMemo(() => {
    if (userDistribution.length === 0) {
      return { rows: [] };
    }

    return {
      rows: userDistribution.map((user) => ({
        cell: [
          {
            icon: user.icon,
            title: user.address,
            clickable: "address",
          },
          {
            icon: iconPaths[user.asset] || "/icons/eth-icon.png",
            title: `${formatNumber(user.suppliedAmount)} ${user.asset}`,
            description: `$${formatNumber(user.suppliedUsd)}`,
          },
          {
            percentage: user.supplyPercent,
          },
        ],
      })),
    };
  }, [userDistribution, asset]);

  // Convert transactions data into Table component format
  const transactionTableBody = useMemo(() => {
    if (transactions.length === 0) {
      return { rows: [] };
    }

    return {
      rows: transactions.map((tx) => ({
        cell: [
          {
            title: tx.date,
            description: tx.time,
          },
          {
            title: tx.type,
          },
          {
            icon: tx.icon,
            title: `${formatNumber(tx.amount)} ${tx.asset}`,
            description: `$${formatNumber(tx.amountUsd)}`,
          },
          {
            icon: tx.userIcon,
            title: tx.userAddress,
          },
        ],
      })),
    };
  }, [transactions]);

  // Loading state
  if (isLoading) {
    return (
      <section
        className={`w-full h-[402px] rounded-[20px] border-[1px] p-[24px] flex flex-col items-center justify-center gap-[12px] ${
          isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
        }`}
      >
        <div className="w-[24px] h-[24px] border-2 border-[#703AE6] border-t-transparent rounded-full animate-spin" />
        <p
          className={`text-[14px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}
        >
          Loading vault activity...
        </p>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section
        className={`w-full h-[402px] rounded-[20px] border-[1px] p-[24px] flex flex-col items-center justify-center gap-[12px] ${
          isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
        }`}
      >
        <p className="text-[14px] font-medium text-red-500">
          Failed to load activity
        </p>
        <p
          className={`text-[12px] ${
            isDark ? "text-[#919191]" : "text-[#76737B]"
          }`}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="px-[16px] py-[8px] rounded-[8px] bg-[#703AE6] text-white text-[14px] font-medium cursor-pointer hover:opacity-80"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section
      className={`w-full h-fit rounded-[20px] border-[1px] p-[24px] flex flex-col gap-[24px] ${
        isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
      }`}
      aria-label="Activity Overview"
    >
      <article aria-label="User Distribution">
        <Table
          showPieChart={true}
          tableBodyBackground={isDark ? "bg-[#222222]" : "bg-white"}
          heading={{ heading: "User Distribution" }}
          tableHeadings={userDistributionHeadings}
          tableBody={userDistributionTableBody}
        />
      </article>
      <article aria-label="All Transactions">
        <Table
          filterDropdownPosition="right"
          tableBodyBackground={isDark ? "bg-[#222222]" : "bg-white"}
          heading={{ heading: "All Transactions" }}
          filters={{ filters: ["All"], customizeDropdown: true }}
          tableHeadings={transactionTableHeadings}
          tableBody={transactionTableBody}
        />
      </article>
    </section>
  );
};
