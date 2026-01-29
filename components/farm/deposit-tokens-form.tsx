import Image from "next/image"
import ToggleButton from "../ui/toggle"
import { iconPaths } from "@/lib/constants"
import { Button } from "../ui/button"
import { useUserStore } from "@/store/user"
import { useState, useCallback } from "react"
import { useTheme } from "@/contexts/theme-context"


export const DepositTokensForm = ({ assets }: { assets: string[] }) => {
    const { isDark } = useTheme();
    const userAddress = useUserStore((state) => state.address)
    const [marginBalance, setMarginBalance] = useState(0)
    const [isSingleAsset, setIsSingleAsset] = useState(true)
    const [singleAsset, setSingleAsset] = useState({
        amount: 0,
        asset: assets[0],
        amountInUSD: 0,
    })
    const [multiAssets, setMultiAssets] = useState([{
        amount: 0,
        asset: assets[0],
        amountInUSD: 0,
    }, {
        amount: 0,
        asset: assets[1],
        amountInUSD: 0,
    }])

    // Common handler to update multi asset input
    const handleMultiAssetChange = useCallback((index: number, rawValue: string) => {
        const value = Number(rawValue) || 0
        setMultiAssets(prev => {
            const updated = [...prev]
            updated[index] = {
                ...updated[index],
                amount: value,
                amountInUSD: value * 100,
            }
            return updated
        })
    }, [])

    return <div className="w-full h-fit flex flex-col gap-[12px] ">
        <div className={`w-full h-fit text-[20px] font-semibold ${isDark ? "text-white" : "text-[#111111]"}`}>
            Deposit Tokens
        </div>
        <div className={`w-full h-fit text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
            Specify the token amounts for your liquidity contribution.
        </div>
        <div className={`w-full h-fit flex flex-col rounded-[20px] border-[1px] p-[16px] flex flex-col gap-[16px] ${isDark ? "bg-[#222222]" : "bg-[#F4F4F4]"}`}>
            <div className={`text-[14px] font-medium w-full h-fit flex gap-[8px] items-center justify-end ${isDark ? "text-white" : "text-[#111111]"}`}>
                Single Asset
                <ToggleButton onToggle={() => { setIsSingleAsset(!isSingleAsset) }} size="small" />
                Multi Assets
            </div>
            {!isSingleAsset && <div className="w-full h-fit flex flex-col gap-[12px]">
                <div className={`w-full h-[100px] rounded-[8px] p-[20px] border-[1px] flex gap-[20px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}>
                    <div className="   w-full h-full flex flex-col justify-between">
                        <div>
                            <input
                                value={multiAssets[0].amount}
                                onChange={(e) => handleMultiAssetChange(0, e.target.value)}
                                type="text"
                                placeholder="0.0"
                                className={`border-none outline-none w-full h-fit text-[16px] font-medium placeholder:text-[#CCCCCC] ${isDark ? "text-white" : "text-[#111111]"}`}
                            />
                        </div>
                        <div className={`w-full h-fit text-[10px]  font-medium ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
                            ${multiAssets[0].amountInUSD}
                        </div>
                    </div>
                    <div className=" w-full h-full flex flex-col justify-between items-end">
                        <div className="w-fit h-fit flex gap-[4px]">
                            <Image src={iconPaths[assets[0]]} alt="search" width={16} height={16} />
                            <div className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{assets[0].toUpperCase()}</div>
                        </div>
                        <div className={`whitespace-nowrap w-fit h-fit flex gap-[4px] items-center text-[12px] ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>
                            Margin Balance: <span className={`cursor-pointer whitespace-nowrap text-[12px] underline ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>{marginBalance} USD</span>
                        </div>
                    </div>
                </div>
                <div className={`w-full h-[100px] rounded-[8px] p-[20px] border-[1px] flex gap-[20px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}>
                    <div className="   w-full h-full flex flex-col justify-between">
                        <div>
                            <input
                                value={multiAssets[1].amount}
                                onChange={(e) => handleMultiAssetChange(1, e.target.value)}
                                type="text"
                                placeholder="0.0"
                                className={`border-none outline-none w-full h-fit text-[16px] font-medium placeholder:text-[#CCCCCC] ${isDark ? "text-white" : "text-[#111111]"}`}
                            />
                        </div>
                        <div className={`w-full h-fit text-[10px]  font-medium ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
                            ${multiAssets[1].amountInUSD}
                        </div>
                    </div>
                    <div className=" w-full h-full flex flex-col justify-between items-end">
                        <div className="w-fit h-fit flex gap-[4px]">
                            <Image src={iconPaths[assets[1]]} alt="search" width={16} height={16} />
                            <div className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{assets[1].toUpperCase()}</div>
                        </div>
                        <div className={`whitespace-nowrap w-fit h-fit flex gap-[4px] items-center text-[12px] ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>
                            Margin Balance: <span className={`cursor-pointer whitespace-nowrap text-[12px] underline ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>{marginBalance} USD</span>
                        </div>
                    </div>
                </div>
            </div>}
            {isSingleAsset && <div className={`w-full h-[100px] rounded-[8px] p-[20px] border-[1px] flex gap-[20px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"}`}>
                <div className="   w-full h-full flex flex-col justify-between">
                    <div>
                        <input
                            value={singleAsset.amount}
                            onChange={(e) => setSingleAsset({ ...singleAsset, amount: Number(e.target.value) })}
                            type="text"
                            placeholder="0.0"
                            className={`border-none outline-none w-full h-fit text-[16px] font-medium placeholder:text-[#CCCCCC] ${isDark ? "text-white" : "text-[#111111]"}`}
                        />
                    </div>
                    <div className={`w-full h-fit text-[10px]  font-medium ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>
                        ${singleAsset.amountInUSD}
                    </div>
                </div>
                <div className=" w-full h-full flex flex-col justify-between items-end">
                    <div className="w-fit h-fit flex gap-[4px]">
                        <Image src={iconPaths[assets[0]]} alt="search" width={16} height={16} />
                        <div className={`text-[14px] font-semibold ${isDark ? "text-white" : "text-[#000000]"}`}>{assets[0].toUpperCase()}</div>
                    </div>
                    <div className={`whitespace-nowrap w-fit h-fit flex gap-[4px] items-center text-[12px] ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>
                        Margin Balance: <span className={`cursor-pointer whitespace-nowrap text-[12px] underline ${isDark ? "text-[#919191]" : "text-[#363636]"}`}>{marginBalance} USD</span>
                    </div>
                </div>
            </div>}

            <Button text={`${userAddress ? "Deposit" : "Connect Wallet"}`} size="large" type="solid" disabled={!userAddress} />

        </div>


    </div>
}