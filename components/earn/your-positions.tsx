import { useState } from "react";
import { Chart } from "./chart"
import { Table } from "./table"
import { useTheme } from "@/contexts/theme-context";

const tabs = [{id:"current-positions",label:"Current Positions"},{id:"positions-history",label:"Positions History"}]

export const YourPositions = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("current-positions");
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <section 
      className={`w-full h-full flex flex-col gap-4 sm:gap-[24px] rounded-[20px] border-[1px] p-3 sm:p-[24px] ${
        isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
      }`}
      aria-label="Your Positions Overview"
    >
      <figure className="w-full flex-1 min-h-0">
        <Chart 
          type="my-supply" 
          currencyTab={true} 
          height={393} 
          containerWidth="w-full" 
          containerHeight="h-full" 
        />
      </figure>
      
      <article aria-label="Your Transactions">
        <Table
          filterDropdownPosition="right"
          heading={{
            heading: "Your Transactions",
            tabsItems: tabs,
            tabType: "solid"
          }} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          tableHeadings={[]} 
          tableBody={{rows: []}} 
          tableBodyBackground="bg-white" 
          filters={{
            customizeDropdown: true,
            filters: ["All"]
          }} 
        /> 
      </article>
    </section>
  );
};