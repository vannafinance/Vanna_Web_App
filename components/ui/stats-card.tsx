import { PieChart } from "./pie-chart";
import { useTheme } from "@/contexts/theme-context";
import { InfoCircleIcon, LinkIcon, CopyIcon } from "@/components/icons";

interface StatsCardProps {
  percentage?: number;
  heading: string;
  mainInfo?: string;
  subInfo?: string;
  pie?: boolean;
  tooltip?: string;
  address?: string;
}

export const StatsCard = ({
  percentage,
  heading,
  mainInfo,
  subInfo,
  pie,
  address,
}: StatsCardProps) => {
  const { isDark } = useTheme();
  if (pie && percentage) {
    return (
      <div className={`w-full h-fit rounded-[12px] py-[32px] px-[20px] flex ${
        isDark ? "bg-[#222222]" : "bg-[#FFFFFF]"
      }`}>
        <div className="w-full h-fit flex gap-[16px] items-center ">
          <div className="w-[78.65px] h-[78.65px]">
            <PieChart
              percentage={percentage}
              textSize="text-[12px] font-medium "
            />
          </div>

          <div className="w-fit h-fit flex flex-col gap-[6px]">
            <div className={`w-fit h-fit flex gap-[4px] items-center text-[10px] font-medium ${
              isDark ? "text-[#919191]" : "text-[#5C5B5B]"
            }`}>
              {heading}
              <div className="cursor-pointer w-[12px] h-[12px] flex items-center ">
                <InfoCircleIcon />
              </div>
            </div>
            <div className="w-full h-fit flex flex-col gap-[2px]">
              {mainInfo && (
                <div className={`text-[14px] font-semibold ${
                  isDark ? "text-white" : "text-[#111111]"
                }`}>
                  {mainInfo}
                </div>
              )}
              {subInfo && (
                <div className={`text-[10px] font-medium ${
                  isDark ? "text-[#919191]" : "text-[#5C5B5B]"
                }`}>
                  {subInfo}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cols-span-1 row-span-1 w-full h-fit py-[16px]  ">
      <div className="w-fit h-fit flex flex-col gap-[6px] ">
        <div className={`w-fit h-fit flex gap-[4px] items-center text-[10px] font-medium ${
          isDark ? "text-[#919191]" : "text-[#5C5B5B]"
        }`}>
          {heading}
          <div className="cursor-pointer w-[12px] h-[12px] flex items-center ">
            <InfoCircleIcon />
          </div>
        </div>
        <div className="w-full h-fit flex flex-col gap-[2px]">
          <div className={`text-[14px] font-semibold ${
            isDark ? "text-white" : "text-[#111111]"
          }`}>
            {mainInfo}
          </div>
          <div className={`text-[10px] font-medium ${
            isDark ? "text-[#919191]" : "text-[#5C5B5B]"
          }`}>
            {subInfo}
          </div>
          {address && (
            <div className="flex gap-[8px] items-center">
              <div className={`text-[14px] font-semibold ${
                isDark ? "text-white" : "text-[#111111]"
              }`}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
              <div className="w-fit h-fit flex gap-[5px]">
                <div className="cursor-pointer w-[12px] h-[12px] flex items-center  ">
                  <LinkIcon fill={isDark ? "#FFFFFF" : "#111111"} />
                </div>
                <div className="cursor-pointer w-[12px] h-[12px] flex items-center  ">
                  <CopyIcon stroke={isDark ? "#FFFFFF" : "#111111"} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
