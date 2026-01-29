import { useState, useEffect, useMemo } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import { toast } from "sonner";
import { Dropdown } from "../ui/dropdown";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { InfoCard } from "../margin/info-card";
import { Button } from "../ui/button";
import { useTheme } from "@/contexts/theme-context";
import { EarnAsset } from "@/lib/types";
import { withdraw } from "@/lib/utils/earn/transactions";
import { useFetchUserVaultPosition, useFetchConvertToAssets, useFetchVaultData } from "@/lib/utils/earn/earnFetchers";
import { SUPPORTED_TOKENS_BY_CHAIN } from "@/lib/utils/web3/token";

export const WithdrawLiquidity = () => {
  const { isDark } = useTheme();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Get supported assets for current chain (asset isolation)
  const supportedAssets = useMemo(() => {
    const tokens = SUPPORTED_TOKENS_BY_CHAIN[chainId] || ["ETH", "USDC"];
    return tokens.filter((t): t is EarnAsset => ["ETH", "USDC", "USDT"].includes(t));
  }, [chainId]);

  // Local state
  const [selectedAsset, setSelectedAsset] = useState<EarnAsset>("ETH");

  // Reset selected asset when chain changes if current asset not supported
  useEffect(() => {
    if (!supportedAssets.includes(selectedAsset)) {
      setSelectedAsset(supportedAssets[0] || "ETH");
    }
  }, [chainId, supportedAssets, selectedAsset]);
  const [shares, setShares] = useState<string>("");
  const [selectedPercentage, setSelectedPercentage] = useState<number>(0);
  const [vTokenBalance, setVTokenBalance] = useState<number>(0);
  const [assetsValue, setAssetsValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [assetsPreview, setAssetsPreview] = useState<number>(0);

  // Vault data (local state)
  const [vaultData, setVaultData] = useState<{
    exchangeRate: number;
    supplyAPY: number;
  } | null>(null);

  // Fetchers
  const fetchVaultData = useFetchVaultData(chainId, selectedAsset, publicClient);
  const fetchUserPosition = useFetchUserVaultPosition(
    chainId,
    selectedAsset,
    address,
    publicClient
  );

  const fetchConvertToAssets = useFetchConvertToAssets(
    chainId,
    selectedAsset,
    publicClient
  );

  // Fetch vToken balance and vault data when asset or address changes
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !address) {
        setVTokenBalance(0);
        setAssetsValue(0);
        return;
      }

      // Fetch user position
      const positionResult = await fetchUserPosition();
      if (positionResult) {
        setVTokenBalance(positionResult.sharesFormatted);
        setAssetsValue(positionResult.assetsValue);
      }

      // Fetch vault data
      const vaultResult = await fetchVaultData();
      if (vaultResult) {
        setVaultData({
          exchangeRate: vaultResult.exchangeRate,
          supplyAPY: 0,
        });
      }
    };
    loadData();
  }, [selectedAsset, address, isConnected, fetchUserPosition, fetchVaultData]);

  // Preview assets when shares changes
  useEffect(() => {
    const previewAssets = async () => {
      if (!shares || parseFloat(shares) <= 0) {
        setAssetsPreview(0);
        return;
      }
      const result = await fetchConvertToAssets(shares);
      if (result) {
        setAssetsPreview(result.assetsFormatted);
      }
    };
    previewAssets();
  }, [shares, fetchConvertToAssets]);

  // Format number to avoid scientific notation (e.g., 5.49669311e-10)
  const formatAmount = (value: number): string => {
    if (value === 0) return "0";
    // vTokens use same decimals as underlying: ETH=18, USDC/USDT=6
    const decimals = selectedAsset === "ETH" ? 18 : 6;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  };

  // Handle percentage button click
  const handlePercentageClick = (percent: number) => {
    setSelectedPercentage(percent);
    if (vTokenBalance > 0) {
      const calculatedShares = (vTokenBalance * percent) / 100;
      setShares(formatAmount(calculatedShares));
    }
  };

  // Reset form when asset changes
  useEffect(() => {
    setShares("");
    setSelectedPercentage(0);
  }, [selectedAsset]);

  // Handle withdraw transaction
  const handleWithdraw = async () => {
    if (!walletClient || !publicClient || !chainId || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!shares || parseFloat(shares) <= 0) {
      toast.error("Please enter an amount");
      return;
    }

    if (parseFloat(shares) > vTokenBalance) {
      toast.error("Insufficient vToken balance");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Withdrawing ${shares} v${selectedAsset}...`);

    try {
      const result = await withdraw({
        walletClient,
        publicClient,
        chainId,
        asset: selectedAsset,
        shares,
        userAddress: address,
      });

      if (result.success) {
        toast.success(`Successfully withdrew ${assetsPreview.toFixed(4)} ${selectedAsset}`, {
          id: toastId,
        });

        // Reset form
        setShares("");
        setSelectedPercentage(0);

        // Reload balances
        const positionResult = await fetchUserPosition();
        if (positionResult) {
          setVTokenBalance(positionResult.sharesFormatted);
          setAssetsValue(positionResult.assetsValue);
        }

        // Reload vault data
        const vaultResult = await fetchVaultData();
        if (vaultResult) {
          setVaultData({
            exchangeRate: vaultResult.exchangeRate,
            supplyAPY: 0,
          });
        }
      } else {
        throw new Error(result.error || "Withdraw failed");
      }
    } catch (error: any) {
      console.error("Withdraw error:", error);

      // Check if user rejected
      const isUserRejection =
        error?.code === 4001 ||
        error?.message?.includes("User rejected") ||
        error?.message?.includes("user rejected") ||
        error?.message?.includes("User denied");

      if (isUserRejection) {
        toast.error("Transaction cancelled", { id: toastId });
      } else {
        toast.error(error.message || "Withdraw failed", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate info card data
  const exchangeRate = vaultData?.exchangeRate || 1;
  const supplyAPY = vaultData?.supplyAPY || 0;

  const infoData = {
    youGetVETH: assetsPreview,
    ethPerVETH: exchangeRate,
    currentAPY: supplyAPY,
    baseAPY: supplyAPY * 0.6,
    bonusAPY: supplyAPY * 0.1,
    rewardsAPY: supplyAPY * 0.3,
    projectedMonthlyFrom: 0,
    projectedMonthlyTo: 0,
    projectedYearlyFrom: 0,
    projectedYearlyTo: 0,
  };

  const infoPropsData = {
    data: infoData,
    expandableSections: [
      {
        title: "More Details",
        headingBold: false,
        defaultExpanded: false,
        items: [
          { id: "youGetVETH", name: `You Receive (${selectedAsset})` },
          { id: "ethPerVETH", name: `${selectedAsset} per v${selectedAsset}` },
          { id: "currentAPY", name: "Current APY (%)" },
        ],
      },
    ],
    showExpandable: true,
  };

  // Button text
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (loading) return "Withdrawing...";
    if (!shares || parseFloat(shares) <= 0) return "Enter Amount";
    if (parseFloat(shares) > vTokenBalance) return "Insufficient Balance";
    return "Withdraw Liquidity";
  };

  // Button disabled state
  const isButtonDisabled =
    !isConnected ||
    loading ||
    !shares ||
    parseFloat(shares) <= 0 ||
    parseFloat(shares) > vTokenBalance;

  return (
    <>
      <form className={`flex gap-[16px] items-start w-full h-fit border-[1px] rounded-[16px] p-[16px] ${
        isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
      }`}>
        <div className="w-full h-full flex flex-col gap-[44px] justify-between">
          {/* Asset selector */}
          <div className="w-fit h-fit">
            <Dropdown
              items={supportedAssets}
              setSelectedOption={(val) => setSelectedAsset(val as EarnAsset)}
              selectedOption={selectedAsset}
              classname="w-fit gap-[4px] items-center"
              dropdownClassname="w-full"
            />
          </div>

          {/* Amount input */}
          <div className="w-full h-fit flex flex-col gap-[8px]">
            <div className="w-full h-fit">
              <label htmlFor="withdraw-amount" className="sr-only">
                Withdraw Amount (vToken shares)
              </label>
              <input
                id="withdraw-amount"
                onChange={(e) => {
                  setShares(e.target.value);
                  setSelectedPercentage(0);
                }}
                value={shares}
                type="number"
                step="any"
                min="0"
                placeholder={`Enter v${selectedAsset} amount`}
                disabled={loading}
                className={`w-full h-fit placeholder:text-[#C7C7C7] text-[16px] font-medium outline-none ${
                  isDark ? "text-white bg-[#111111]" : "bg-white"
                } ${loading ? "opacity-50" : ""}`}
                aria-describedby="withdraw-assets-value"
              />
            </div>
            <output id="withdraw-assets-value" className={`w-full h-fit text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              ≈ {assetsPreview.toFixed(4)} {selectedAsset}
            </output>
          </div>
        </div>

        {/* Right side - percentages and balance */}
        <div className="w-fit h-fit flex flex-col gap-[16px] items-end">
          {/* Percentage buttons */}
          <fieldset className="w-full h-fit flex gap-[8px]">
            <legend className="sr-only">Select withdraw percentage</legend>
            {DEPOSIT_PERCENTAGES.map((item) => (
              <button
                type="button"
                onClick={() => handlePercentageClick(item)}
                key={item}
                disabled={loading || vTokenBalance <= 0}
                className={`flex justify-center items-center cursor-pointer text-[14px] font-semibold w-fit h-[44px] rounded-[12px] p-[10px] ${
                  selectedPercentage === item
                    ? `${PERCENTAGE_COLORS[item]} text-white`
                    : isDark
                    ? "bg-[#222222] text-white"
                    : "bg-[#F4F4F4] text-black"
                } ${loading || vTokenBalance <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-pressed={selectedPercentage === item}
              >
                {item}%
              </button>
            ))}
          </fieldset>

          {/* Balance display */}
          <div className="w-fit h-fit flex flex-col items-end gap-[4px]">
            <span className={`text-[10px] font-semibold ${
              isDark ? "text-[#919191]" : "text-[#363636]"
            }`}>
              Your v{selectedAsset} Balance:
            </span>
            <output className={`w-fit h-fit text-[12px] flex gap-[4px] font-semibold ${
              isDark ? "text-white" : "text-[#111111]"
            }`}>
              {vTokenBalance.toFixed(4)} v{selectedAsset}
            </output>
            <span className={`text-[10px] ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              ≈ {assetsValue.toFixed(4)} {selectedAsset}
            </span>
          </div>
        </div>
      </form>

      <section className="flex flex-col gap-[8px]" aria-label="Withdraw Details">
        <InfoCard
          data={infoPropsData.data}
          expandableSections={infoPropsData.expandableSections}
          showExpandable={infoPropsData.showExpandable}
        />
      </section>

      <Button
        text={getButtonText()}
        size="large"
        type="gradient"
        disabled={isButtonDisabled}
        onClick={handleWithdraw}
      />
    </>
  );
};
