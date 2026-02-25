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
import { useTheme } from "@/contexts/theme-context";
import { TransactionModal } from "@/components/ui/transaction-modal";



export const TransferCollateral = () => {



  const { isDark } = useTheme();

  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalStatus, setTxModalStatus] = useState<"pending" | "success" | "error">("pending");
  const [txModalTitle, setTxModalTitle] = useState("");
  const [txModalMessage, setTxModalMessage] = useState("");
  const [txModalHash, setTxModalHash] = useState<string | undefined>(undefined);
  const { chainId, address } = useAccount();
  const supportedTokens = useMemo(() => {
    return SUPPORTED_TOKENS_BY_CHAIN[chainId ?? 0] ?? [];
  }, [chainId]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(supportedTokens[0] || "USDC");
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
  const maxBalance = getBalance(selectedCurrency, "MB");

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

  // Format number to avoid scientific notation
  const formatAmount = (value: number): string => {
    if (value === 0) return "0";
    const decimals = selectedCurrency === "ETH" ? 18 : 6;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  };

  const handlePercentageClick = (item: number) => {
    setPercentage(item);
    const calculatedAmount = (item / 100) * maxBalance;
    setValueInput(formatAmount(calculatedAmount));
    setValueInUsd(calculatedAmount);
  };

  const handleFlashClose = async () => {

    // Here we will implement the Logic like Close all open margin positions (spot + perps + borrow)
    // Settle funding / borrowing fees
    // Pay flash / unwind fee if protocol has one
    // Withdraw all remaining collateral to WB
    // Reset margin account to 0
    // Exit margin mode instantly, settle everything, return net collateral to wallet.


    const asset = selectedCurrency;
    const amount = formatAmount(maxBalance); // withdraw full MB balance

    if (!maxBalance || maxBalance <= 0) {
      setTxModalStatus("error");
      setTxModalTitle("No Balance");
      setTxModalMessage(`No ${asset} available to close.`);
      setTxModalOpen(true);
      return;
    }

    setIsLoading(true);

    // Show pending modal
    setTxModalStatus("pending");
    setTxModalTitle("Flash Closing Position");
    setTxModalMessage(`Closing ${asset} position...`);
    setTxModalHash(undefined);
    setTxModalOpen(true);

    try {
      const { tx_hash, marginAccount } = await transfer_collateral(asset, amount);

      await refreshBalances({
        chainId: chainId!,
        publicClient,
        address: address as `0x${string}`,
        marginAccount,
      });

      // Show success modal
      setTxModalStatus("success");
      setTxModalTitle("Flash Close Complete");
      setTxModalMessage(`Successfully withdrawn ${maxBalance} ${asset} to wallet!`);

    } catch (err: any) {
      const isUserRejection =
        err?.code === 4001 ||
        err?.message?.includes("User rejected") ||
        err?.message?.includes("user rejected");

      setTxModalStatus("error");
      setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Flash Close Failed");
      setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (err?.message ?? "Flash Close transaction failed"));
    } finally {
      setIsLoading(false);
    }
  };

    const DEFAULT_TOKENS = ["USDC", "USDT", "ETH"];
  const dropdownItems =
  supportedTokens && supportedTokens.length > 0
    ? supportedTokens
    : DEFAULT_TOKENS;


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
      const assetBalance = getBalance(asset, "MB");
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
      setTxModalStatus("error");
      setTxModalTitle("Invalid Amount");
      setTxModalMessage("Please enter an amount to transfer.");
      setTxModalOpen(true);
      return;
    }

    setIsLoading(true);

    // Show pending modal
    setTxModalStatus("pending");
    setTxModalTitle("Transferring Collateral");
    setTxModalMessage(`Transferring ${amount} ${asset} from Margin to Wallet...`);
    setTxModalHash(undefined);
    setTxModalOpen(true);

    try {
      const { tx_hash, marginAccount } = await transfer_collateral(asset, amount);

      await refreshBalances({
        chainId: chainId!,
        publicClient,
        address: address as `0x${string}`,
        marginAccount,
      });


      console.log("✓ Transaction confirmed:", tx_hash);

      if (tx_hash) {
        setValueInput("");
        setPercentage(0);

        // Show success modal
        setTxModalStatus("success");
        setTxModalTitle("Transfer Successful");
        setTxModalMessage(`Successfully transferred ${amount} ${asset} from Margin Balance to Wallet Balance!`);
        setTxModalHash(tx_hash);
      }
    } catch (err: any) {
      console.error("✗ Transfer error in handler:", {
        message: err?.message,
        code: err?.code,
        reason: err?.reason,
        fullError: err,
      });

      const isUserRejection =
        err?.code === 4001 ||
        err?.message?.includes("User rejected") ||
        err?.message?.includes("user rejected");

      setTxModalStatus("error");
      setTxModalTitle(isUserRejection ? "Transaction Cancelled" : "Transfer Failed");
      setTxModalMessage(isUserRejection ? "You cancelled the transaction" : (err?.message || "Transfer transaction failed"));
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
                items={dropdownItems}
                dropdownClassname="text-[14px] font-medium gap-[8px]"
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key="editing-middle"
                className="flex gap-[8px]"
                role="group"
                aria-label="Deposit percentage"
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
          <motion.div
            className="flex flex-col gap-[8px] items-end"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <p className={`text-[10px] font-medium ${isDark ? "text-white" : ""}`}>
              Transfer To: <span className="font-semibold">WB</span>
            </p>
            <div className="text-[20px] font-medium ">{maxBalance.toFixed(4)} {selectedCurrency}</div>

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
      <motion.aside
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <DetailsPanel
          items={[{ title: "Transfer Collateral", value: `${maxBalance.toFixed(2)} USD` }]}
        />
      </motion.aside>
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

      {/* Transaction Status Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        status={txModalStatus}
        title={txModalTitle}
        message={txModalMessage}
        txHash={txModalHash}
        onClose={() => {
          setTxModalOpen(false);
        }}
        onRetry={
          txModalStatus === "error"
            ? () => {
                setTxModalOpen(false);
                // User can try again
              }
            : undefined
        }
      />
    </motion.div>
  );
};
