import { DropdownOptions } from "@/lib/constants"
import { Dropdown } from "../ui/dropdown"
import { useState } from "react"
import { Button } from "../ui/button"
import { useUserStore } from "@/store/user"
import { useTheme } from "@/contexts/theme-context"
import { PERCENTAGE_COLORS } from "@/lib/constants/margin"

export const RemoveLiquidity = () => {
    const [selectedOption, setSelectedOption] = useState<string>("USDT")
    const [value, setValue] = useState<string>("")
    const [selectedPercentage, setSelectedPercentage] = useState<number>(0)
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
    }

    const { isDark } = useTheme()
    const userAddress = useUserStore((state) => state.address)

    return <div className="w-full h-fit flex flex-col gap-[24px]">
        <div className={`w-full h-fit flex rounded-[16px] gap-[8px] p-[20px] rounded-[16px] border-[1px] ${isDark ? "bg-[#111111]" : "bg-[#FFFFFF]"
            }`}>
            <div className="w-full h-fit flex flex-col gap-[20px]">
                <Dropdown items={DropdownOptions} setSelectedOption={setSelectedOption} selectedOption={selectedOption} classname="w-fit h-fit gap-[4px]" dropdownClassname="w-full h-fit" />
                <div className=" flex flex-col gap-[8px]">
                    <div className="w-full h-fit">
                        <input
                            type="text"
                            placeholder="0.00"
                            className={`w-full h-fit text-[16px] font-medium placeholder:text-[#CCCCCC] outline-none border-none ${isDark ? "text-white" : "text-[#111111]"
                                }`}
                            value={value}
                            onChange={onChange}
                        />
                    </div>
                    <div className={`w-full h-fit text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#76737B]"
                        }`}>
                        $0.00
                    </div>
                </div>
            </div>
            <div className="w-fit h-fit flex flex-col gap-[8px] items-end">
                <div className="flex gap-[8px]">
                    {[10, 25, 50, 100].map((pct) => {
                        // Get color for selected percentage, with fallback for 75
                        const selectedColor = PERCENTAGE_COLORS[pct] || "bg-[#F91A6F]";
                        return (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => setSelectedPercentage(pct)}
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
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
        <Button
            disabled={!userAddress || (Number(value) <= 0) ? true : false}
            type="gradient"
            size="large"
            text={!userAddress ? "Connect Wallet" : Number(value) > 0 ? "Remove Liquidity" : "Enter Amount"}
        />
    </div>
}