import { AnimatedTabs } from "../ui/animated-tabs"
import { useState } from "react"

export const Form = () => {
    const [activeTab, setActiveTab] = useState<string>("add-liquidity")
  return (
    <div className="w-[480px] border-[1px] bg-[#F7F7F7] rounded-[20px] p-[16px] h-fit flex flex-col gap-[43px]">
      <AnimatedTabs type="gradient" tabs={[{id:"add-liquidity",label:"Add"},{id:"remove-liquidity",label:"Remove"}]} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="w-full h-fit p-[20px] rounded-[16px] bg-white ">
        <div className="w-full flex items-center gap-[20px]">

        </div>
      </div>
    </div>
  )
}