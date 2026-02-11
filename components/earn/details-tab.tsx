import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import { StatsCard } from "../ui/stats-card";
import { getPercentage } from "@/lib/utils/helper";
import { formatValue } from "@/lib/utils/format-value";
import { useTheme } from "@/contexts/theme-context";
import { formatUsdValue } from "@/lib/utils/prices/priceFeed";
import { EarnAsset } from "@/lib/types";
import { vTokenAddressByChain, tokenAddressByChain } from "@/lib/utils/web3/token";
import { useVaultData } from "@/lib/hooks/useVaultData";

const maxEth = 1;
const maxUsd = 200000;

const addresses = [
  {
    heading: "Underlying ETH token",
    address: "0x8292...17eD",
    tooltip: "Address of the underlying ETH token",
  },
  {
    heading: "ETH vault",
    address: "0xaf53...9BB2",
    tooltip: "Vault contract holding ETH liquidity",
  },
  {
    heading: "Risk Curator",
    address: "0x9453...5685",
    tooltip: "Manages protocol risk parameters",
  },
  {
    heading: "Fee Receiver",
    address: "0xbE6b...EDF3",
    tooltip: "Receives protocol fees",
  },
  {
    heading: "Oracle router address",
    address: "0xD188...2F47",
    tooltip: "Routes price data from oracles",
  },
  {
    heading: "Interest rate model address",
    address: "0xfBae...8BcC",
    tooltip: "Defines borrowing and lending interest rates",
  },
];

export const Details = ({ selectedAsset = "ETH" as EarnAsset }) => {
  const { isDark } = useTheme();
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);

  // Get vault data from store
  const { vault: vaultStats, loading } = useVaultData(selectedAsset);

  // Fix hydration error by ensuring client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate totals
  const totalSupplied = useMemo(() => {
    if (!vaultStats) return { inAsset: 0, inUsd: 0 };
    return {
      inAsset: vaultStats.totalAssetsFormatted,
      inUsd: vaultStats.totalSupplyUsd,
    };
  }, [vaultStats]);

  const totalBorrowed = useMemo(() => {
    if (!vaultStats) return { inAsset: 0, inUsd: 0 };
    return {
      inAsset: vaultStats.totalBorrowsFormatted,
      inUsd: vaultStats.totalBorrowsUsd,
    };
  }, [vaultStats]);

  // Get contract addresses
  const vTokenAddress = vTokenAddressByChain[chainId || 1]?.[selectedAsset];
  const tokenAddress = tokenAddressByChain[chainId || 1]?.[selectedAsset];

  // Generate stats items
  const items = useMemo(() => {
    if (!vaultStats) return [];

    const availableLiquidityUsd = formatUsdValue(
      vaultStats.availableLiquidity * vaultStats.priceUsd
    );

    return [
      {
        heading: "Available Liquidity",
        mainInfo: `${formatValue(vaultStats.availableLiquidity, {
          type: "number",
          useLargeFormat: true,
        })} ${selectedAsset}`,
        subInfo: availableLiquidityUsd,
        tooltip: `Total ${selectedAsset} available for borrowing`,
      },
      {
        heading: "Supply APY",
        mainInfo: `${(vaultStats.supplyAPY * 100).toFixed(2)}%`,
        subInfo: `${formatValue(totalSupplied.inAsset, {
          type: "number",
          useLargeFormat: true,
        })} ${selectedAsset}`,
        tooltip: "Annual percentage yield for suppliers",
      },
      {
        heading: "Borrow APY",
        mainInfo: `${(vaultStats.borrowAPY * 100).toFixed(2)}%`,
        tooltip: "Annual percentage yield for borrowers",
      },
      {
        heading: "Utilization Rate",
        mainInfo: `${(vaultStats.utilizationRate * 100).toFixed(2)}%`,
        tooltip: "Ratio of borrowed assets to supplied assets",
      },
      {
        heading: "Liquidation Penalty",
        mainInfo: "Dynamic Range",
        subInfo: "0–15%",
        tooltip: "Penalty applied during liquidation events",
      },
      {
        heading: "Oracle Price",
        mainInfo: `$${vaultStats.priceUsd.toFixed(2)}`,
        tooltip: `Current oracle price of ${selectedAsset}`,
      },
      {
        heading: "Share Token Exchange Rate",
        mainInfo: vaultStats.exchangeRate.toFixed(6),
        tooltip: `Exchange rate between v${selectedAsset} and ${selectedAsset}`,
      },
    ];
  }, [vaultStats, selectedAsset, totalSupplied.inAsset]);

  // Fix hydration error: Don't render until mounted on client
  if (!isMounted) {
    return (
      <section className="w-full h-fit flex flex-col gap-[16px] rounded-[20px] border-[1px] bg-[#F4F4F4]" aria-label="Vault Details">
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="text-[14px] text-[#76737B]">Loading...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full h-fit flex flex-col gap-[16px] rounded-[20px] border-[1px] ${
      isDark ? "bg-[#111111]" : "bg-[#F4F4F4]"
    }`} aria-label="Vault Details">
      <div className="w-full h-fit rounded-[20px] pt-[24px] px-[24px] flex flex-col gap-[16px]">
        <h2 className={`w-full h-fit text-[20px] font-semibold ${
          isDark ? "text-white" : ""
        }`}>Statistics</h2>
        <article className={`w-full h-fit flex items-center rounded-[16px] gap-[12px] ${
          isDark ? "bg-[#222222]" : "bg-[#FFFFFF]"
        }`} aria-label="Supply and Borrow Overview">
          {loading ? (
            <div className={`w-full h-[120px] flex items-center justify-center text-[14px] ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              Loading vault statistics...
            </div>
          ) : (
            <>
              <StatsCard
                percentage={Math.min((totalSupplied.inAsset / maxEth) * 100, 100)}
                heading="Total Supplied"
                mainInfo={`${formatValue(totalSupplied.inAsset, {
                  type: "number",
                  useLargeFormat: true,
                })} ${selectedAsset}`}
                subInfo={formatUsdValue(totalSupplied.inUsd)}
                pie={true}
              />
              <StatsCard
                percentage={Math.min((totalBorrowed.inAsset / maxEth) * 100, 100)}
                heading="Total Borrowed"
                mainInfo={`${formatValue(totalBorrowed.inAsset, {
                  type: "number",
                  useLargeFormat: true,
                })} ${selectedAsset}`}
                subInfo={formatUsdValue(totalBorrowed.inUsd)}
                pie={true}
              />
            </>
          )}
        </article>
        <article className="w-full h-full grid grid-cols-3 grid-rows-3 gap-x-[15px]" aria-label="Vault Statistics">
          {loading ? (
            <div className={`col-span-3 h-[200px] flex items-center justify-center text-[14px] ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              Loading statistics...
            </div>
          ) : (
            items.map((item, idx) => {
              return (
                <StatsCard
                  key={idx}
                  heading={item.heading}
                  mainInfo={item.mainInfo}
                  subInfo={item.subInfo}
                  tooltip={item.tooltip}
                />
              );
            })
          )}
        </article>
        <article className="w-full h-fit rounded-[20px] pb-[24px]" aria-label="Contract Addresses">
          <h3 className={`text-[20px] font-semibold w-full h-fit ${
            isDark ? "text-white" : ""
          }`}>
            Addresses
          </h3>
          <div className="w-full h-full grid grid-cols-3 grid-rows-2">
            <StatsCard
              heading={`Underlying ${selectedAsset} token`}
              address={tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : "N/A"}
              tooltip={`Address of the underlying ${selectedAsset} token`}
            />
            <StatsCard
              heading={`${selectedAsset} vault`}
              address={vTokenAddress ? `${vTokenAddress.slice(0, 6)}...${vTokenAddress.slice(-4)}` : "N/A"}
              tooltip={`Vault contract holding ${selectedAsset} liquidity`}
            />
            {addresses.slice(2).map((item, idx) => {
              return (
                <StatsCard
                  key={idx}
                  heading={item.heading}
                  address={item.address}
                  tooltip={item.tooltip}
                />
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
};
