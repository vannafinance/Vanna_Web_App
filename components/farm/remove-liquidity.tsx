import { DropdownOptions } from "@/lib/constants"
import { Dropdown } from "../ui/dropdown"
import { useState, useCallback, useEffect } from "react"
import { Button } from "../ui/button"
import { useUserStore } from "@/store/user"
import { useFarmSimulationStore, generateTxHash } from "@/store/farm-simulation-store"
import { useTheme } from "@/contexts/theme-context"
import { PERCENTAGE_COLORS } from "@/lib/constants/margin"
import { motion } from "framer-motion"
import { toast } from "sonner"

export const RemoveLiquidity = () => {
    const [selectedOption, setSelectedOption] = useState<string>("USDT")
    const [value, setValue] = useState<string>("")
    const [selectedPercentage, setSelectedPercentage] = useState<number>(0)
    const [isProcessing, setIsProcessing] = useState(false)

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        if (v === "" || /^\d*\.?\d*$/.test(v)) {
            setValue(v)
            setSelectedPercentage(0) // Reset percentage when manually typing
        }
    }

    const { isDark } = useTheme()
    const userAddress = useUserStore((state) => state.address)

    // Farm simulation store
    const positions = useFarmSimulationStore(state => state.positions)
    const tokenPrices = useFarmSimulationStore(state => state.tokenPrices)
    const farmSimStore = useFarmSimulationStore

    // Calculate total liquidity for the selected token
    const totalLiquidity = positions
        .filter(p => p.assets.includes(selectedOption))
        .reduce((sum, p) => sum + p.liquidityAmount, 0)

    const tokenPrice = tokenPrices[selectedOption] || 1
    const inputAmount = Number(value) || 0
    const inputUSD = (inputAmount * tokenPrice).toFixed(2)
    const hasInsufficientLiquidity = inputAmount > totalLiquidity

    // Handle percentage selection
    const handlePercentageClick = useCallback((pct: number) => {
        setSelectedPercentage(pct)
        if (totalLiquidity > 0) {
            const amount = (totalLiquidity * pct) / 100
            setValue(amount % 1 === 0 ? amount.toString() : amount.toFixed(6))
        }
    }, [totalLiquidity])

    // Reset value when token changes
    useEffect(() => {
        setValue("")
        setSelectedPercentage(0)
    }, [selectedOption])

    const handleRemoveLiquidity = useCallback(async () => {
        if (isProcessing || inputAmount <= 0 || hasInsufficientLiquidity) return

        setIsProcessing(true)
        const txHash = generateTxHash()

        toast.loading(`Removing ${value} ${selectedOption} liquidity...`, { id: "farm-remove-tx" })
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Remove liquidity from positions
        let remainingToRemove = inputAmount
        const usdRemoved = inputAmount * tokenPrice

        farmSimStore.setState((prev) => {
            const newBalances = { ...prev.walletBalances }
            newBalances[selectedOption] = (newBalances[selectedOption] || 0) + inputAmount

            const updatedPositions = prev.positions
                .map(p => {
                    if (remainingToRemove <= 0 || !p.assets.includes(selectedOption)) return p
                    const removeFromThis = Math.min(p.liquidityAmount, remainingToRemove)
                    remainingToRemove -= removeFromThis
                    return {
                        ...p,
                        liquidityAmount: p.liquidityAmount - removeFromThis,
                        liquidityAmountUSD: (p.liquidityAmount - removeFromThis) * tokenPrice,
                    }
                })
                .filter(p => p.liquidityAmount > 0.0001) // Remove empty positions

            return {
                ...prev,
                walletBalances: newBalances,
                positions: updatedPositions,
                totalDepositedUSD: Math.max(0, prev.totalDepositedUSD - usdRemoved),
                lastTxHash: txHash,
            }
        })

        toast.success(`Removed ${value} ${selectedOption} liquidity!`, {
            id: "farm-remove-tx",
            description: `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)}`,
        })

        setValue("")
        setSelectedPercentage(0)
        setIsProcessing(false)
    }, [isProcessing, inputAmount, hasInsufficientLiquidity, selectedOption, value, tokenPrice, farmSimStore])

    const getButtonText = () => {
        if (!userAddress) return "Connect Wallet"
        if (isProcessing) return "Processing..."
        if (inputAmount <= 0) return "Enter Amount"
        if (hasInsufficientLiquidity) return `Insufficient ${selectedOption} Liquidity`
        return "Remove Liquidity"
    }

    return <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-fit flex flex-col gap-[24px]"
    >
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`w-full h-fit flex flex-col sm:flex-row rounded-[16px] gap-3 sm:gap-[8px] p-4 sm:p-[20px] border-[1px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
            }`}
        >
            <div className="w-full h-fit flex flex-col gap-[20px] relative z-20">
                <Dropdown items={DropdownOptions} setSelectedOption={setSelectedOption} selectedOption={selectedOption} classname="w-fit h-fit gap-[4px]" dropdownClassname="w-full h-fit" />
                <div className="flex flex-col gap-[8px]">
                    <div className="w-full h-fit">
                        <input
                            type="text"
                            placeholder="0.00"
                            className={`w-full h-fit text-[16px] font-medium placeholder:text-[#CCCCCC] outline-none border-none bg-transparent ${isDark ? "text-white" : "text-[#111111]"
                                }`}
                            value={value}
                            onChange={onChange}
                            disabled={isProcessing}
                        />
                    </div>
                    <div className={`w-full h-fit flex justify-between text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"
                        }`}>
                        <span>${inputUSD}</span>
                        <span>Available: {totalLiquidity.toLocaleString()} {selectedOption}</span>
                    </div>
                </div>
            </div>
            <div className="w-full sm:w-fit h-fit flex flex-col gap-[8px] items-start sm:items-end relative z-10">
                <div className="flex flex-wrap gap-2 sm:gap-[8px]">
                    {[10, 25, 50, 100].map((pct) => {
                        const selectedColor = PERCENTAGE_COLORS[pct] || "bg-[#F91A6F]";
                        return (
                            <motion.button
                                key={pct}
                                type="button"
                                onClick={() => handlePercentageClick(pct)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                disabled={isProcessing}
                                className={`flex justify-center items-center cursor-pointer text-[14px] font-semibold w-fit h-[36px] rounded-[10px] px-[12px] ${selectedPercentage === pct
                                        ? `${selectedColor} text-white`
                                        : isDark
                                            ? "bg-[#222222] text-white"
                                            : "bg-[#F4F4F4] text-[#111111]"
                                    }`}
                                aria-pressed={selectedPercentage === pct}
                                aria-label={`Select ${pct}%`}
                            >
                                {pct}%
                            </motion.button>
                        );
                    })}
                </div>
            </div>

        </motion.div>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            <Button
                disabled={!userAddress || inputAmount <= 0 || hasInsufficientLiquidity || isProcessing}
                type="gradient"
                size="large"
                text={getButtonText()}
                onClick={handleRemoveLiquidity}
            />
        </motion.div>
    </motion.div>
}
