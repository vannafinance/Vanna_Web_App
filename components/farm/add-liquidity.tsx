import Image from "next/image"
import { useState } from "react"
import { iconPaths } from "@/lib/constants"
import { InfoCard } from "../margin/info-card"
import { MARGIN_ACCOUNT_INFO_ITEMS } from "@/lib/constants/margin"
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store"
import { useUserStore } from "@/store/user"
import { Button } from "../ui/button"
import { useTheme } from "@/contexts/theme-context"

export const AddLiquidity = () => {
  const [value, setValue] = useState<string>("")
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const { isDark } = useTheme()

  const userAddress = useUserStore(user => user.address)

  // Get margin account info from global store using selector to prevent unnecessary re-renders
  const totalBorrowedValue = useMarginAccountInfoStore(
    (state) => state.totalBorrowedValue
  );
  const totalCollateralValue = useMarginAccountInfoStore(
    (state) => state.totalCollateralValue
  );
  const totalValue = useMarginAccountInfoStore((state) => state.totalValue);
  const avgHealthFactor = useMarginAccountInfoStore(
    (state) => state.avgHealthFactor
  );
  const timeToLiquidation = useMarginAccountInfoStore(
    (state) => state.timeToLiquidation
  );
  const borrowRate = useMarginAccountInfoStore((state) => state.borrowRate);
  const liquidationPremium = useMarginAccountInfoStore(
    (state) => state.liquidationPremium
  );
  const liquidationFee = useMarginAccountInfoStore(
    (state) => state.liquidationFee
  );
  const debtLimit = useMarginAccountInfoStore((state) => state.debtLimit);
  const minDebt = useMarginAccountInfoStore((state) => state.minDebt);
  const maxDebt = useMarginAccountInfoStore((state) => state.maxDebt);

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
  };

  return (
    <>
      <div className={`w-full h-fit p-[20px] rounded-[16px] ${
        isDark ? "bg-[#111111]" : "bg-white"
      }`}>
        <div className="w-full flex items-center gap-[20px]">
          <div className="w-full h-full flex flex-col gap-[24px]">
            <div className="w-full h-fit ">
              <input 
                type="text" 
                placeholder="0.0" 
                value={value} 
                onChange={onChange} 
                className={`w-full h-fit bg-transparent outline-none border-none text-[16px] font-medium placeholder:text-[#CCCCCC] ${
                  isDark ? "text-white" : "text-black"
                }`}
              />
            </div>
            <div className={`w-full h-fit text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#76737B]"
            }`}>
              $0.00
            </div>
          </div>
          <div className="w-fit justify-end  items-end h-fit flex flex-col gap-[24px] ">
            <div className=" w-fit justify-end items-end h-fit flex gap-[4px]">
              <Image src={iconPaths["USDT"]} alt="USDT" width={20} height={20} />
              <span className={`text-[14px] font-semibold ${
                isDark ? "text-white" : "text-[#111111]"
              }`}>USDT</span>
            </div>
            <div className=" justify-end items-end w-fit flex text-end h-fit gap-[4px] ">
              <span className={`text-nowrap text-end text-[12px] font-medium ${
                isDark ? "text-[#919191]" : "text-[#5C5B5B]"
              }`}>Margin Balance:</span>
              <span className={`text-nowrap text-end text-[12px] font-medium underline cursor-pointer ${
                isDark ? "text-[#919191]" : "text-[#5C5B5B]"
              }`}>7000 USD</span>
            </div>
          </div>
        </div>
      </div>
      {(Number(value) > 0) && (
        <div>
          <InfoCard
            data={marginAccountInfo}
            items={[...MARGIN_ACCOUNT_INFO_ITEMS]}
          />
        </div>
      )}

      <Button 
        disabled={!userAddress || (Number(value) <= 0) ? true : false} 
        type="gradient" 
        size="large" 
        text={!userAddress ? "Connect Wallet" : Number(value) > 0 ? "Add Liquidity" : "Enter Amount"}
      />
    </>
  )
}

