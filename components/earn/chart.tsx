import { useState, useMemo, useRef, useEffect } from "react";
import { Dropdown } from "../ui/dropdown";
import { ReusableChart } from "../ui/reusable-chart";
import { depositData, netApyData } from "@/lib/constants/earn";
import { AnimatedTabs } from "../ui/animated-tabs";
import { ExpandableModal } from "../ui/expandable-modal";
import { useTheme } from "@/contexts/theme-context";
import { netVolumeData , netEarningsData } from "@/lib/constants/portfolio";

interface ChartProps {
  type: "overall-deposit" | "net-apy" | "my-supply" | "deposit-apy" | "net-volume" | "net-profit-loss" | "farm";
  currencyTab?: boolean;
  height?: number;
  containerWidth?: string;
  containerHeight?: string;
  heading?: string; // Custom heading for farm type
  downtrend?: string; // Downtrend value (e.g., "0.07%") for farm type
  uptrend?: string; // Uptrend value (e.g., "0.07%") for farm type
}

const filterOptions = ["3 Months", "6 Months", "1 Year", "All Time"];
const dayOptions = ["1D", "7D", "30D", "1Y"];
const depositApyOptions = ["Deposit APY", "Net APY"];

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  return `${day} ${month}`;
};

// Helper function to filter data based on selected filter
const filterDataByTimeRange = (
  data: Array<{ date: string; amount: number }>,
  filter: string
): Array<{ date: string; amount: number }> => {
  const now = new Date();
  let startDate = new Date();

  switch (filter) {
    case "3 Months":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "6 Months":
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "1 Year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "All Time":
      return data;
    default:
      return data;
  }

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate;
  });
};

// Helper function to filter data based on selected days
const filterDataByDays = (
  data: Array<{ date: string; amount: number }>,
  days: string
): Array<{ date: string; amount: number }> => {
  const now = new Date();
  let startDate = new Date();

  switch (days) {
    case "1D":
      startDate.setDate(now.getDate() - 1);
      break;
    case "7D":
      startDate.setDate(now.getDate() - 7);
      break;
    case "30D":
      startDate.setDate(now.getDate() - 30);
      break;
    case "1Y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return data;
  }

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= startDate;
  });
};

export const Chart = ({ type, currencyTab, height, containerWidth, containerHeight, heading, downtrend, uptrend }: ChartProps) => {
  const { isDark } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("usd");
  const [selectedDays, setSelectedDays] = useState<string>(dayOptions[3]);
  const [selectedDepositApy, setSelectedDepositApy] = useState<string>(
    depositApyOptions[0]
  );
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dynamicHeight, setDynamicHeight] = useState<number>(height || 206);
  // Get data based on chart type
  const rawData = useMemo(() => {
    switch (type) {
      case "overall-deposit":
        return depositData;
      case "net-apy":
        return netApyData;
      case "farm":
        return depositData;
      case "my-supply":
        return depositData;
      case "deposit-apy":
        return netApyData;
      case "net-volume":
        return netVolumeData;
      case "net-profit-loss":
        return netEarningsData;
      default:
        return [];
    }
  }, [type]);

  // Filter data based on selected time range or days
  const filteredData = useMemo(() => {
    if (type === "deposit-apy") {
      // Use day filter for deposit-apy type
      return filterDataByDays(rawData, selectedDays);
    }
    // Use time range filter for other types
    return filterDataByTimeRange(rawData, selectedFilter);
  }, [rawData, selectedFilter, selectedDays, type]);

  // Convert array data to object format {xAxis: yAxis} for ReusableChart
  const chartData = useMemo(() => {
    const dataObj: Record<string, number> = {};
    filteredData.forEach((item) => {
      dataObj[item.date] = item.amount;
    });
    return dataObj;
  }, [filteredData]);

  // Calculate total value (latest value)
  const totalValue = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return filteredData[filteredData.length - 1].amount;
  }, [filteredData]);

  // Calculate dynamic height when containerHeight is h-full
  useEffect(() => {
    if (containerHeight !== "h-full") {
      setDynamicHeight(height || 206);
      return;
    }

    const updateHeight = () => {
      if (chartContainerRef.current) {
        const containerHeight = chartContainerRef.current.clientHeight;
        if (containerHeight > 0) {
          setDynamicHeight(containerHeight);
        }
      }
    };

    // Initial calculation with a small delay to ensure layout is complete
    const timeoutId = setTimeout(updateHeight, 0);

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [containerHeight, height]);

  // Format Y-axis label
  const formatYAxisLabel = (value: number): string => {
    if (type === "net-apy" || type === "deposit-apy") {
      // For APY, show with 2 decimal places
      return `${value.toFixed(2)}`;
    }
    // For deposit amounts, show with commas
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return `${value.toFixed(0)}`;
  };

  // Chart colors based on theme
  const chartGradientColors: [string, string] = isDark
    ? ["rgba(235, 252, 253, 0.3)", "rgba(235, 252, 253, 0.05)"]
    : ["rgba(124, 53, 248, 0.3)", "rgba(124, 53, 248, 0.05)"];
  const chartLineColor = isDark ? "#EBFCFD" : "#7C35F8";
  const chartTextColor = isDark ? "#FFFFFF" : "#181822";

  return (
    <article className={`flex flex-col gap-[24px] rounded-[16px] p-[16px] border-[1px] ${
      isDark ? "bg-transparent" : "bg-[#FFFFFF]"
    } ${containerWidth} ${containerHeight}`}>
      <header className="w-full h-fit flex justify-between flex-shrink-0">
        <div
          className={`w-full h-fit flex flex-col ${
            type === "deposit-apy" || type === "farm" ? "gap-[16px]" : ""
          }`}
        >
          <h2 className={`text-[12px] font-semibold ${isDark ? "text-white" : ""}`}>
            {type === "farm" ? (
              heading || "Farm"
            ) : type === "overall-deposit" ? (
              "Overall Deposit"
            ) : type === "net-apy" ? (
              "Net APY"
            ) : type === "my-supply" ? (
              "My Supply"
            ) : type === "net-volume" ? (
              "Net Volume"
            ) : type === "net-profit-loss" ? (
              "Net Profit & Loss"
            ) : (
              <Dropdown
                classname="text-[12px] font-semibold gap-[4px] w-[100px]"
                dropdownClassname="text-[12px] font-semibold w-full"
                items={depositApyOptions}
                setSelectedOption={(value) => setSelectedDepositApy(value)}
                selectedOption={selectedDepositApy}
              />
            )}
          </h2>
          {type === "farm" && uptrend && (
            <div className="w-full h-fit flex items-center gap-[4px]">
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 0L7.4641 6H0.535898L4 0Z"
                  fill="#10B981"
                />
              </svg>
              <p className={`text-[12px] font-medium text-[#10B981]`}>
                {uptrend}
              </p>
            </div>
          )}
          {type === "farm" && downtrend && (
            <div className="w-full h-fit flex items-center gap-[4px]">
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 8L0.535898 2H7.4641L4 8Z"
                  fill="#FC5457"
                />
              </svg>
              <p className={`text-[12px] font-medium text-[#FC5457]`}>
                {downtrend}
              </p>
            </div>
          )}
          {type !== "deposit-apy" && type !== "farm" && (
            <p className={`w-full text-[20px] font-semibold ${isDark ? "text-white" : ""}`}>
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          {type === "deposit-apy" && (
            <div className="w-full h-fit flex flex-col gap-[4px]">
              <p className={`text-[16px] font-semibold ${isDark ? "text-white" : ""}`}>0%</p>
              <time className={`text-[12px] font-medium ${isDark ? "text-gray-400" : "text-[#5C5B5B]"}`} dateTime="2025-03-11T15:14:00">
                03/11/2025 15:14
              </time>
            </div>
          )}
        </div>
        <div className="flex items-top gap-[8px]">
          {type !== "deposit-apy" && (
            <>
              {currencyTab && (
                <div className="w-[220px]">
                  <AnimatedTabs
                  type="ghost"
                  tabs={[
                    { id: "usd", label: "USD" },
                    { id: "usdc", label: "USDC" },
                  ]}
                  activeTab={selectedCurrency}
                  onTabChange={(tabId: string) => setSelectedCurrency(tabId)}
                />
                </div>
                
              )}
              <div className="p-[10px] h-fit rounded-[6px] border-[1px]">
                <Dropdown
                  dropdownClassname="text-[12px] font-semibold w-full"
                  classname="text-[12px] font-semibold gap-[4px]"
                  items={filterOptions}
                  setSelectedOption={(value) => setSelectedFilter(value)}
                  selectedOption={selectedFilter}
                />
              </div>
            </>
          )}
          {type === "deposit-apy" && (
            <nav className="w-fit h-fit flex gap-[6px]" aria-label="Time Period Selection">
              {dayOptions.map((item, idx) => {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDays(item)}
                    className={`cursor-pointer flex flex-col items-center justify-center font-semibold text-[14px] w-[56px] py-[10px] px-[20px] rounded-[8px] ${
                      selectedDays === item
                        ? "text-white bg-[#703AE6]"
                        : isDark
                        ? "text-white bg-[#1A1A1A] border-[1px]"
                        : "text-black bg-white border-[1px]"
                    }`}
                    aria-pressed={selectedDays === item}
                  >
                    {item}
                  </button>
                );
              })}
            </nav>
          )}
          <ExpandableModal
            scrollable={true}
            contentPosition="bottom"
            buttonClassName={`mt-[6px] cursor-pointer flex items-center justify-center w-[32px] h-[32px] rounded-[8px] border-[1px] ${
              isDark
                ? "bg-transparent [&>img]:brightness-0 [&>img]:invert"
                : "bg-white"
            }`}
            modalHeader={
              <header className="w-full h-fit flex justify-between">
                <div
                  className={`w-full h-fit flex flex-col ${
                    type === "deposit-apy" || type === "farm" ? "gap-[16px]" : ""
                  }`}
                >
                  <h2 className={`text-[12px] font-semibold ${isDark ? "text-white" : ""}`}>
                    {type === "farm" ? (
                      heading || "Farm"
                    ) : type === "overall-deposit" ? (
                      "Overall Deposit"
                    ) : type === "net-apy" ? (
                      "Net APY"
                    ) : type === "my-supply" ? (
                      "My Supply"
                    ) : (
                      <Dropdown
                        classname="text-[12px] font-semibold gap-[4px] w-[100px]"
                        dropdownClassname="text-[12px] font-semibold w-full"
                        items={depositApyOptions}
                        setSelectedOption={(value) =>
                          setSelectedDepositApy(value)
                        }
                        selectedOption={selectedDepositApy}
                      />
                    )}
                  </h2>
                  {type === "farm" && uptrend && (
                    <div className="w-full h-fit flex items-center gap-[4px]">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 0L7.4641 6H0.535898L4 0Z"
                          fill="#10B981"
                        />
                      </svg>
                      <p className={`text-[12px] font-medium text-[#10B981]`}>
                        {uptrend}
                      </p>
                    </div>
                  )}
                  {type === "farm" && downtrend && (
                    <div className="w-full h-fit flex items-center gap-[4px]">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 8L0.535898 2H7.4641L4 8Z"
                          fill="#FC5457"
                        />
                      </svg>
                      <p className={`text-[12px] font-medium text-[#FC5457]`}>
                        {downtrend}
                      </p>
                    </div>
                  )}
                  {type !== "deposit-apy" && type !== "farm" && (
                    <p className={`w-full text-[20px] font-semibold ${isDark ? "text-white" : ""}`}>
                      $
                      {totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                  {type === "deposit-apy" && (
                    <div className="w-full h-fit flex flex-col gap-[4px]">
                      <p className={`text-[16px] font-semibold ${isDark ? "text-white" : ""}`}>0%</p>
                      <time className={`text-[12px] font-medium ${isDark ? "text-gray-400" : "text-[#5C5B5B]"}`} dateTime="2025-03-11T15:14:00">
                        03/11/2025 15:14
                      </time>
                    </div>
                  )}
                </div>
                <div className="flex items-top gap-[8px]">
                  {type !== "deposit-apy" &&  (
                    <>
                      {currencyTab && (
                        <AnimatedTabs
                          type="ghost"
                          tabs={[
                            { id: "usd", label: "USD" },
                            { id: "usdc", label: "USDC" },
                          ]}
                          activeTab={selectedCurrency}
                          onTabChange={(tabId: string) =>
                            setSelectedCurrency(tabId)
                          }
                        />
                      )}
                      <div className="p-[10px] h-fit rounded-[6px] border-[1px]">
                        <Dropdown
                          dropdownClassname="text-[12px] font-semibold w-full"
                          classname="text-[12px] font-semibold gap-[4px]"
                          items={filterOptions}
                          setSelectedOption={(value) => setSelectedFilter(value)}
                          selectedOption={selectedFilter}
                        />
                      </div>
                    </>
                  )}
                  {type === "deposit-apy" && (
                    <nav className="w-fit h-fit flex gap-[6px]" aria-label="Time Period Selection">
                      {dayOptions.map((item, idx) => {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDays(item)}
                            className={`cursor-pointer flex flex-col items-center justify-center font-semibold text-[14px] w-[56px] py-[10px] px-[20px] rounded-[8px] ${
                              selectedDays === item
                                ? "text-white bg-[#703AE6]"
                                : isDark
                                ? "text-white bg-[#1A1A1A] border-[1px]"
                                : "text-black bg-white border-[1px]"
                            }`}
                            aria-pressed={selectedDays === item}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </nav>
                  )}
                </div>
              </header>
            }
          >
            <figure className="w-full h-full">
              {Object.keys(chartData).length > 0 ? (
                <ReusableChart
                  data={chartData}
                  gradientColors={chartGradientColors}
                  lineColor={chartLineColor}
                  height={450}
                  showGrid={true}
                  formatYAxisLabel={formatYAxisLabel}
                  textColor={chartTextColor}
                />
              ) : (
                <p className={`w-full h-[450px] flex items-center justify-center text-sm ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}>
                  No data available
                </p>
              )}
            </figure>
          </ExpandableModal>
        </div>
      </header>
      <figure
        ref={chartContainerRef}
        className={`w-full ${containerHeight === "h-full" ? "flex-1 min-h-0" : ""}`}
        style={containerHeight !== "h-full" ? { height: height ? `${height}px` : "203px", minHeight: height ? `${height}px` : "203px" } : {}}
      >
        {Object.keys(chartData).length > 0 ? (
          <ReusableChart
            data={chartData}
            gradientColors={chartGradientColors}
            lineColor={chartLineColor}
            height={dynamicHeight}
            showGrid={true}
            formatYAxisLabel={formatYAxisLabel}
            textColor={chartTextColor}
          />
        ) : (
          <p className={`w-full ${dynamicHeight?`h-[${dynamicHeight}px]` : "h-[393px]"} flex items-center justify-center text-sm ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}>
            No data available
          </p>
        )}
      </figure>
    </article>
  );
};
