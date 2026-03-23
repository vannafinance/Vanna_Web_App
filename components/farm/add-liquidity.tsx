import Image from "next/image"
import { useState, useCallback } from "react"
import { iconPaths } from "@/lib/constants"
import { InfoCard } from "../margin/info-card"
import { MARGIN_ACCOUNT_INFO_ITEMS } from "@/lib/constants/margin"
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store"
import { useUserStore } from "@/store/user"
import { useFarmSimulationStore, generateTxHash, generatePositionId } from "@/store/farm-simulation-store"
import { useFarmStore } from "@/store/farm-store"
import { Button } from "../ui/button"
import { useTheme } from "@/contexts/theme-context"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export const AddLiquidity = () => {
  const [value, setValue] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      setValue(v)
    }
  }

  const { isDark } = useTheme()
  const userAddress = useUserStore(user => user.address)
  const selectedRow = useFarmStore(state => state.selectedRow)

  // Farm simulation store
  const walletBalances = useFarmSimulationStore(state => state.walletBalances)
  const tokenPrices = useFarmSimulationStore(state => state.tokenPrices)
  const positions = useFarmSimulationStore(state => state.positions)
  const farmSimStore = useFarmSimulationStore

  // Determine the token from the selected row
  const token = selectedRow?.cell?.[0]?.titles?.[0] || selectedRow?.cell?.[0]?.title || "USDT"
  const tokenBalance = walletBalances[token] || 0
  const tokenPrice = tokenPrices[token] || 1
  const balanceUSD = (tokenBalance * tokenPrice).toFixed(2)
  const inputAmount = Number(value) || 0
  const inputUSD = (inputAmount * tokenPrice).toFixed(2)

  // Check if user has sufficient balance
  const hasInsufficientBalance = inputAmount > tokenBalance

  // Get margin account info from global store
  const totalBorrowedValue = useMarginAccountInfoStore(state => state.totalBorrowedValue)
  const totalCollateralValue = useMarginAccountInfoStore(state => state.totalCollateralValue)
  const totalValue = useMarginAccountInfoStore(state => state.totalValue)
  const avgHealthFactor = useMarginAccountInfoStore(state => state.avgHealthFactor)
  const timeToLiquidation = useMarginAccountInfoStore(state => state.timeToLiquidation)
  const borrowRate = useMarginAccountInfoStore(state => state.borrowRate)
  const liquidationPremium = useMarginAccountInfoStore(state => state.liquidationPremium)
  const liquidationFee = useMarginAccountInfoStore(state => state.liquidationFee)
  const debtLimit = useMarginAccountInfoStore(state => state.debtLimit)
  const minDebt = useMarginAccountInfoStore(state => state.minDebt)
  const maxDebt = useMarginAccountInfoStore(state => state.maxDebt)

  const marginAccountInfo = {
    totalBorrowedValue,
    totalCollateralValue,
    totalValue,
    avgHealthFactor,
    timeToLiquidation,
    borrowRate,
    liquidationPremium,
    liquidationFee,
    debtLimit,
    minDebt,
    maxDebt,
  }

  const handleAddLiquidity = useCallback(async () => {
    if (isProcessing || inputAmount <= 0 || hasInsufficientBalance) return

    setIsProcessing(true)
    const txHash = generateTxHash()

    // Step 1: Approving
    toast.loading(`Approving ${token}...`, { id: "farm-tx" })
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Step 2: Adding liquidity
    toast.loading(`Adding ${value} ${token} liquidity...`, { id: "farm-tx" })
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 3: Update balances
    const usdValue = inputAmount * tokenPrice
    const apr = 5 + Math.random() * 25 // Random APR between 5-30%

    farmSimStore.setState((prev) => {
      const newBalances = { ...prev.walletBalances }
      newBalances[token] = (newBalances[token] || 0) - inputAmount

      const newPosition = {
        id: generatePositionId(),
        poolName: selectedRow?.cell?.[0]?.title || selectedRow?.cell?.[0]?.titles?.join("/") || token,
        assets: [token],
        depositedAmount: 0,
        depositedAmountUSD: 0,
        liquidityAmount: inputAmount,
        liquidityAmountUSD: usdValue,
        earnedRewards: 0,
        apr,
        entryTime: Date.now(),
        type: "single" as const,
      }

      return {
        ...prev,
        walletBalances: newBalances,
        positions: [...prev.positions, newPosition],
        totalDepositedUSD: prev.totalDepositedUSD + usdValue,
        lastTxHash: txHash,
      }
    })

    // Update margin account info
    useMarginAccountInfoStore.setState((prev) => ({
      ...prev,
      totalCollateralValue: prev.totalCollateralValue + inputAmount * tokenPrice,
      totalValue: prev.totalValue + inputAmount * tokenPrice,
      avgHealthFactor: Math.max(1.2, prev.avgHealthFactor > 0 ? prev.avgHealthFactor + 0.1 : 2.5),
    }))

    toast.success(`Successfully added ${value} ${token} liquidity!`, {
      id: "farm-tx",
      description: `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`,
    })

    setValue("")
    setIsProcessing(false)
  }, [isProcessing, inputAmount, hasInsufficientBalance, token, value, tokenPrice, selectedRow, farmSimStore, positions])

  // Button text logic
  const getButtonText = () => {
    if (!userAddress) return "Connect Wallet"
    if (isProcessing) return "Processing..."
    if (inputAmount <= 0) return "Enter Amount"
    if (hasInsufficientBalance) return `Insufficient ${token} Balance`
    return "Add Liquidity"
  }

  return (
    <div className="w-full h-fit flex flex-col gap-[24px]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full h-fit p-4 sm:p-[20px] rounded-[16px] ${
          isDark ? "bg-[#111111]" : "bg-white"
        }`}
      >
        <div className="w-full flex items-center gap-3 sm:gap-[20px]">
          <div className="w-full h-full flex flex-col gap-[24px]">
            <div className="w-full h-fit ">
              <input
                type="text"
                placeholder="0.0"
                value={value}
                onChange={onChange}
                disabled={isProcessing}
                className={`w-full h-fit bg-transparent outline-none border-none text-[16px] font-medium placeholder:text-[#CCCCCC] ${
                  isDark ? "text-white" : "text-black"
                }`}
              />
            </div>
            <div className={`w-full h-fit text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              ${inputUSD}
            </div>
          </div>
          <div className="w-fit justify-end  items-end h-fit flex flex-col gap-[24px] ">
            <div className=" w-fit justify-end items-end h-fit flex gap-[4px]">
              <Image src={iconPaths[token] || iconPaths["USDT"]} alt={token} width={20} height={20} />
              <span className={`text-[14px] font-semibold ${
                isDark ? "text-white" : "text-[#111111]"
              }`}>{token}</span>
            </div>
            <div className=" justify-end items-end w-fit flex text-end h-fit gap-[4px] ">
              <span className={`text-end text-[12px] font-medium ${
                isDark ? "text-[#919191]" : "text-[#5C5B5B]"
              }`}><span className="hidden sm:inline">Balance:</span><span className="sm:hidden">Bal:</span></span>
              <span
                className={`text-end text-[12px] font-medium underline cursor-pointer ${
                  isDark ? "text-[#919191]" : "text-[#5C5B5B]"
                }`}
                onClick={() => setValue(tokenBalance.toString())}
              >
                {tokenBalance.toLocaleString()} {token} (${balanceUSD})
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {(inputAmount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <InfoCard
              data={marginAccountInfo}
              items={[...MARGIN_ACCOUNT_INFO_ITEMS]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button
          disabled={!userAddress || inputAmount <= 0 || hasInsufficientBalance || isProcessing}
          type="gradient"
          size="large"
          text={getButtonText()}
          onClick={handleAddLiquidity}
        />
      </motion.div>
    </div>
  )
}
