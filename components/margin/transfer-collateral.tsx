import { useState, useEffect, useMemo } from "react";
import { Dropdown } from "../ui/dropdown";
import { AnimatePresence, motion } from "framer-motion";
import { DropdownOptions } from "@/lib/constants";
import { DEPOSIT_PERCENTAGES, PERCENTAGE_COLORS } from "@/lib/constants/margin";
import { DetailsPanel } from "../ui/details-panel";
import { Button } from "../ui/button";
import { withdrawTx } from "@/lib/utils/margin/transactions";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useFetchAccountCheck } from "@/lib/utils/margin/marginFetchers";
import { useMarginStore } from "@/store/margin-account-state";
import { toast } from "sonner";
import { useBalanceStore } from "@/store/balance-store";
import { SUPPORTED_TOKENS_BY_CHAIN, TOKEN_DECIMALS } from "@/lib/utils/web3/token";

export const TransferCollateral = () => {
  const { chainId, address } = useAccount();
  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(supportedTokens[0] || "");
  const [valueInput, setValueInput] = useState<string>("");
  const [valueInUsd, setValueInUsd] = useState<number>(0.0);
  const [percentage, setPercentage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get margin state from Zustand
  const marginState = useMarginStore((s) => s.marginState);

  const walletClient = useWalletClient();
  const publicClient = usePublicClient();


  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);

  // Get balance from store
  const getBalance = useBalanceStore((s) => s.getBalance);

  // Get max balance from margin account for selected asset
  const balanceAsset = selectedCurrency === "ETH" ? "WETH" : selectedCurrency;
  const maxBalance = getBalance(balanceAsset, "MB");

  const { reset, refreshBalances } = useBalanceStore();

 


  // Update when currency changes
  useEffect(() => {
    setValueInput("");
    setPercentage(0);
    setValueInUsd(0);
  }, [selectedCurrency]);

  useEffect(() => {
    if (supportedTokens.length > 0 && !supportedTokens.includes(selectedCurrency)) {
      setSelectedCurrency(supportedTokens[0]);
    }
  }, [supportedTokens, selectedCurrency]);

  const handlePercentageClick = (item: number) => {
    setPercentage(item);
    const calculatedAmount = (item / 100 * maxBalance).toFixed(2);
    setValueInput(calculatedAmount);
    setValueInUsd(Number(calculatedAmount));
  };

  const handleFlashClose = async () => {

    // Here we will implement the Logic like Close all open margin positions (spot + perps + borrow)
    // Settle funding / borrowing fees
    // Pay flash / unwind fee if protocol has one
    // Withdraw all remaining collateral to WB
    // Reset margin account to 0
    // Exit margin mode instantly, settle everything, return net collateral to wallet.


    const asset = selectedCurrency;
    const amount = maxBalance.toString(); // withdraw full MB balance

    if (!maxBalance || maxBalance <= 0) {
      toast.error(`No ${asset} available to close.`, { duration: 3000 });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`💨 Closing ${asset} position...`, { duration: Infinity });

    try {
      const { tx_hash, marginAccount } = await transfer_collateral(asset, amount);

      await refreshBalances({
        chainId,
        publicClient,
        address,
        marginAccount,
      });

      toast.success(`Flash close complete: ${maxBalance} ${asset} withdrawn.`, {
        id: toastId,
        duration: 5000,
      });

    } catch (err: any) {
      toast.error(err?.message ?? "Flash Close failed.", {
        duration: 5000,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const transfer_collateral = async (asset: string, amount: string) => {


    try {
      // Validate inputs
      if (!asset || !amount) {
        throw new Error("Asset and amount required");
      }

      if (Number(amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (!chainId) {
        throw new Error("Chain not connected");
      }

      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!walletClient.data) {
        throw new Error("Wallet client not available");
      }

      if (!publicClient) {
        throw new Error("Public client not available");
      }

      // Validate amount doesn't exceed asset-specific max balance
      const checkAsset = asset === "ETH" ? "WETH" : asset;
      const assetBalance = getBalance(checkAsset, "MB");
      if (Number(amount) > assetBalance) {
        throw new Error(`Amount exceeds available balance. Max: ${assetBalance} ${asset}`);
      }

      console.log("✓ All validations passed");

      // Call fetchAccountCheck to verify margin account exists
      console.log("Checking margin account...");
      const accounts = await fetchAccountCheck();
      console.log("Accounts found:", accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error("No margin account found for this address");
      }

      const marginAccount = accounts[0];
      console.log("Using margin account:", marginAccount);

      // Now call withdraw
      console.log("Calling withdrawTx with:", {
        asset,
        amount,
        marginAccount,
      });

      const tx_hash = await withdrawTx({
        walletClient: walletClient.data,
        publicClient: publicClient,
        chainId,
        fetchAccountCheck,
        asset,
        amount,
      });

      console.log("✓ Transaction successful:", tx_hash);
      return { tx_hash, marginAccount };

    } catch (error: any) {
      console.error("✗ Transfer failed:", {
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        stack: error?.stack,
        fullError: error,
      });

      // Categorize error - More specific messages
      if (error?.message?.includes("No margin account")) {
        throw new Error("❌ No margin account found. Please create one first.");
      }

      if (error?.message?.includes("exceeds available balance")) {
        throw new Error(`❌ ${error.message}`);
      }

      if (error?.reason?.includes("Insufficient balance")) {
        throw new Error(`❌ Insufficient balance in MB. You need ${amount} ${asset} but don't have enough to transfer to WB.`);
      }

      if (error?.message?.includes("insufficient") || error?.reason?.includes("insufficient")) {
        throw new Error(`❌ Insufficient balance in MB to transfer ${amount} ${asset} to WB.`);
      }

      if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        throw new Error("❌ Transaction rejected. You cancelled the transaction.");
      }

      if (error?.message?.includes("Chain not connected")) {
        throw new Error("❌ Chain not connected. Please connect your wallet.");
      }

      if (error?.message?.includes("Wallet not connected")) {
        throw new Error("❌ Wallet not connected. Please connect your wallet first.");
      }

      if (error?.message?.includes("not available")) {
        throw new Error("❌ Wallet connection issue. Please refresh and try again.");
      }

      if (error?.message?.includes("Network request failed")) {
        throw new Error("❌ Network error. Please check your connection and try again.");
      }

      if (error?.reason?.includes("execution reverted")) {
        throw new Error(`❌ Transaction failed. MB may not have enough ${asset} to transfer to WB.`);
      }

      // Default error message
      throw new Error(`❌ Transfer failed: ${error?.message || "Unknown error. Please try again."}`);
    }
  };

  const handleTransferClick = async () => {
    console.log("=== HANDLE TRANSFER CLICK ===");
    const asset = selectedCurrency;
    const amount = valueInput;

    console.log("Transfer initiated:", { asset, amount });

    if (!amount || Number(amount) === 0) {
      toast.error("⚠️ Please enter an amount", {
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`📤 Transferring ${amount} ${asset} from MB to WB...`, {
      duration: Infinity,
    });

    try {
      const { tx_hash, marginAccount } = await transfer_collateral(asset, amount);

      await refreshBalances({
        chainId,
        publicClient,
        address,
        marginAccount,
      });


      console.log("✓ Transaction confirmed:", tx_hash);

      if (tx_hash) {
        setValueInput("");
        setPercentage(0);
        toast.success(
          `✅ Transfer successful! ${amount} ${asset} moved from MB to WB.\nTx: ${tx_hash.slice(0, 10)}...`,
          {
            id: toastId,
            duration: 5000,
          }
        );
      }
    } catch (err: any) {
      console.error("✗ Transfer error in handler:", {
        message: err?.message,
        code: err?.code,
        reason: err?.reason,
        fullError: err,
      });

      const errorMessage = err?.message || "Transaction failed. Please try again.";

      toast.error(errorMessage, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueInput(value);
    setValueInUsd(Number(value));
  };

  const handleMaxValueClick = () => {
    const max = maxBalance.toFixed(2);
    setValueInput(max);
    setValueInUsd(maxBalance);
    setPercentage(100);
  };

  return (
    <motion.div
      className="flex flex-col justify-between gap-[24px] pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col gap-[24px] rounded-[16px] p-[20px] bg-[#FFFFFF] border-[1px] border-[#E2E2E2]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="">
          <motion.div
            key="editing"
            className="flex justify-between "
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div className="p-[10px]">
              <Dropdown
                classname="text-[16px] font-medium gap-[8px]"
                selectedOption={selectedCurrency}
                setSelectedOption={setSelectedCurrency}
                items={supportedTokens}
                dropdownClassname="text-[14px] font-medium gap-[8px]"
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key="editing-middle"
                className="flex flex-col justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div
                  className="flex gap-[8px]"
                  role="group"
                  aria-label="Deposit percentage"
                >
                  {DEPOSIT_PERCENTAGES.map((item) => {
                    return (
                      <motion.button
                        type="button"
                        key={item}
                        onClick={() => handlePercentageClick(item)}
                        className={`h-[44px] w-[95px] text-center text-[14px] text-medium cursor-pointer ${percentage === item
                            ? `${PERCENTAGE_COLORS[item]} text-white`
                            : "bg-[#F4F4F4]"
                          } p-[10px] rounded-[12px]`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        aria-label={`Select ${item} percent`}
                        aria-pressed={percentage === item}
                      >
                        {item}%
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
        <motion.div
          className="flex justify-between gap-[10px] items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            className="px-[10px] flex flex-col gap-[8px]"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div>
              <label htmlFor={`collateral-amount-input`} className="sr-only">
                Collateral amount
              </label>
              <input
                id={`collateral-amount-input`}
                onChange={handleInputChange}
                className="w-full text-[20px] focus:border-[0px] focus:outline-none font-medium"
                type="text"
                placeholder="0.0"
                value={valueInput}
                disabled={isLoading}
              />
            </div>
            <motion.div
              className="text-[12px] font-medium text-[#76737B]"
              aria-live="polite"
              key={valueInUsd}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {valueInUsd} USD
            </motion.div>
          </motion.div>
          <motion.div
            className="flex flex-col gap-[8px] items-end"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className=" text-[10px] font-medium ">
              Transfer To: <span className="font-semibold">WB</span>
            </div>
            <div className="text-[20px] font-medium ">{maxBalance.toFixed(2)} {selectedCurrency}</div>

            <motion.button
              onClick={handleMaxValueClick}
              disabled={isLoading || maxBalance === 0}
              className="cursor-pointer bg-[#FFE6F2] rounded-[4px] py-[4px] px-[8px] text-[12px] font-medium text-[#FF007A] disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Max Value
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <DetailsPanel
          items={[{ title: "Transfer Collateral", value: `${maxBalance.toFixed(2)} USD` }]}
        />
      </motion.div>
      <motion.div
        className="flex flex-col gap-[16px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <Button
            text="Transfer"
            size="large"
            type="gradient"
            disabled={!Number(valueInput) || isLoading}
            onClick={handleTransferClick}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Button
            text="Flash Close"
            size="large"
            type="ghost"
            onClick={handleFlashClose}
            disabled={!maxBalance || isLoading}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};