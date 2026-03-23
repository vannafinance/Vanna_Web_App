import { useMemo, useState } from "react"
import { AccountStatsGhost } from "../earn/account-stats-ghost"
import { CloseIcon } from "../icons"
import { AnimatedTabs } from "./animated-tabs"
import { Dropdown } from "./dropdown"

const accountStatsItems = [
    {
        id: "1",
        name: "Total Profit",
        amount: "$1000",
    },
    {
        id: "2",
        name: "Total Loss",
        amount: "$1000",
    },
    {
        id: "3",
        name: "Net Profit",
        amount: "$1000",
    },
]


const monthsDropdownItems = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const yearsDropdownItems = ["2024","2025","2026"]

const tabs = [{ id: "month", label: "Month" }, { id: "year", label: "Year" }]
export const ProfitLossCalender = () => {

    const [accountStats, setAccountStats] = useState<typeof accountStatsItems>(accountStatsItems)
    const [activeTab, setActiveTab] = useState<"month" | "year">("month")
    const [selectedMonth, setSelectedMonth] = useState<string>("January")
    const [selectedYear, setSelectedYear] = useState<string>("2024")

    const handleTabChange = (tabId: string) => {
        if (tabId === "month" || tabId === "year") {
            setActiveTab(tabId as "month" | "year")
        }
    }



    return <div className="w-full sm:w-fit h-fit rounded-[24px] border-[1px] p-4 sm:p-[32px] flex flex-col gap-[20px] bg-[#FFFFFF]">
        <div className="w-full h-fit flex justify-between items-center">
            <div className="w-full h-fit text-[20px] sm:text-[24px] font-bold text-[#111111]">
                Calendar
            </div>
            <CloseIcon className="cursor-pointer bg-[#E2E2E2] p-[12px] w-[36px] h-[36px] rounded-full flex-shrink-0" />
        </div>
        <div className="w-full sm:w-fit h-fit flex flex-col gap-[20px]">
            <AccountStatsGhost items={accountStats} gridCols="grid-cols-1 sm:grid-cols-3" gridRows="grid-rows-1" />
            <div className="w-full sm:w-fit h-fit flex flex-col gap-[12px]">
                <div className="w-full sm:w-fit h-full flex flex-wrap gap-3 sm:gap-[20px] items-center">
                    <div>
                        <AnimatedTabs customTabWidth="w-[100px]" type="ghost" tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
                    </div>
                    <div className="w-fit h-full flex gap-[8px]">
                        <div className="h-[38px] rounded-[8px] border-[1px] p-[10px] flex justify-center items-center">
                            <Dropdown items={monthsDropdownItems} setSelectedOption={setSelectedMonth} selectedOption={selectedMonth} classname="w-[80px] sm:w-[100px] gap-[4px] text-[12px] font-medium" dropdownClassname="w-[80px] sm:w-[100px]" />
                        </div>
                        <div className="h-[38px] rounded-[8px] border-[1px] p-[10px] flex justify-center items-center">
                            <Dropdown items={yearsDropdownItems} setSelectedOption={setSelectedYear} selectedOption={selectedYear} classname="w-[80px] sm:w-[100px] gap-[4px] text-[12px] font-medium" dropdownClassname="w-[80px] sm:w-[100px]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}