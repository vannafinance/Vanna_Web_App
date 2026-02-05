import { ProgressBar } from "../ui/progress-bar";
import { useTheme } from "@/contexts/theme-context";
import { TrendUpIcon, TrendDownIcon } from "@/components/icons";

interface FarmStatsCardProps {
    items:{
        heading:string;
        value:string;
        downtrend?:string;
        uptrend?:string;
        progressBar?:{
            percentage:number;
            value:string;
        }
    }[]
}


export const FarmStatsCard = ({items}:FarmStatsCardProps) =>{
    const { isDark } = useTheme();
    
    return <div className={`w-[400px] h-fit rounded-[16px] border-[1px]  p-[20px] flex flex-col gap-[24px] ${isDark ? "bg-[#222222]" : "bg-[#F7F7F7]"}`}>
        {items.map((item,idx)=>{
            return <div key={idx} className="w-full min-w-[180px] h-fit flex flex-col gap-[12px] ">
                {item.heading && <div className={`w-full h-fit text-[12px] font-medium ${isDark ? "text-[#919191]" : "text-[#5C5B5B]"}`}>{item.heading}</div>}
                {item.progressBar && item.progressBar.percentage  && item.progressBar.value && <ProgressBar 
                height={34}
                progressColor="#703AE6"
                backgroundColor="#FFFFFF"
                showPercentage={true}
                percentage={item.progressBar.percentage}
                value={item.progressBar.value}
                textSize="14px"
                />}
                {item.value  && !item.progressBar&& <div className="w-full h-fit flex gap-[4px]">
                    <div className={`w-fit h-fit text-[28px] font-bold ${isDark ? "text-white" : "text-[#000000]"}`}>
                        {item.value}
                    </div>
                    <div className="w-fit h-fit flex items-center ">
                        {item.downtrend && (
                            <>
                                <TrendDownIcon width={16} height={16} />
                                <p className={`text-[12px] font-semibold text-red-500`}>
                                    {item.downtrend}
                                </p>
                            </>
                        )}
                        {!item.downtrend && item.uptrend && (
                            <>
                                <TrendUpIcon width={16} height={16} />
                                <p className={`text-[12px] font-semibold text-green-500`}>
                                    {item.uptrend}
                                </p>
                            </>
                        )}
                    </div>
                    </div>}
            </div>
        })}
    </div>
}