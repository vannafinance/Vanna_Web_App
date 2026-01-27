import { ProgressBar } from "../ui/progress-bar";

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
    return <div className="w-[400px] h-fit rounded-[16px] border-[1px]  p-[20px] flex flex-col gap-[24px] bg-[#F7F7F7] ">
        {items.map((item,idx)=>{
            return <div key={idx} className="w-full min-w-[180px] h-fit flex flex-col gap-[12px] ">
                {item.heading && <div className="w-full h-fit text-[12px] font-medium text-[#5C5B5B] ">{item.heading}</div>}
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
                    <div className="w-fit h-fit text-[28px] font-bold text-[#000000] ">
                        {item.value}
                    </div>
                    <div className="w-fit h-fit flex items-center ">
                        {item.downtrend && (
                            <>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 8 8"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4 8L0.535898 2H7.4641L4 8Z"
                                        fill="#FC5457"
                                    />
                                </svg>
                                <p className="text-[12px] font-semibold text-[#131313A1]">
                                    {item.downtrend}
                                </p>
                            </>
                        )}
                        {!item.downtrend && item.uptrend && (
                            <>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 8 8"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M4 0L7.4641 6H0.535898L4 0Z"
                                        fill="#10B981"
                                    />
                                </svg>
                                <p className="text-[12px] font-semibold text-[#131313A1]">
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