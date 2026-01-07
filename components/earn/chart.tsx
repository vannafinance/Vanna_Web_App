import { useState, useMemo, useRef, useEffect } from "react";
import { Dropdown } from "../ui/dropdown";
import { ReusableChart } from "../ui/reusable-chart";
import { depositData, netApyData } from "@/lib/constants/earn";
import { AnimatedTabs } from "../ui/animated-tabs";
import { ExpandableModal } from "../ui/expandable-modal";

interface ChartProps {
  type: "overall-deposit" | "net-apy" | "my-supply" | "deposit-apy";
  currencyTab?: boolean;
  height?: number;
  containerWidth?: string;
  containerHeight?: string;
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

export const Chart = ({ type, currencyTab, height, containerWidth, containerHeight }: ChartProps) => {
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
      case "my-supply":
        return depositData;
      case "deposit-apy":
        return netApyData;
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

  return (
    <div className={` flex flex-col gap-[24px]  rounded-[16px] p-[16px] border-[1px] border-[#E2E2E2] bg-[#FFFFFF] ${containerWidth} ${containerHeight}`}>
      <div className="w-full h-fit flex justify-between flex-shrink-0">
        <div
          className={`w-full h-fit flex flex-col ${
            type === "deposit-apy" ? "gap-[16px]" : ""
          } `}
        >
          <div className="text-[12px] font-semibold">
            {type === "overall-deposit" ? (
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
                setSelectedOption={(value) => setSelectedDepositApy(value)}
                selectedOption={selectedDepositApy}
              />
            )}
          </div>
          {type !== "deposit-apy" && (
            <div className="w-full text-[20px] font-semibold">
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )}
          {type === "deposit-apy" && (
            <div className="w-full h-fit flex flex-col gap-[4px]">
              <div className="text-[16px] font-semibold">0%</div>
              <div className="text-[12px] font-medium text-[#5C5B5B]">
                03/11/2025 15:14
              </div>
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
              <div className="p-[10px] h-fit rounded-[6px] border-[1px] border-[#E2E2E2]">
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
            <div className="w-fit h-fit flex gap-[6px]">
              {dayOptions.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDays(item)}
                    className={` cursor-pointer flex flex-col items-center justify-center font-semibold text-[14px] w-[56px] py-[10px] px-[20px] rounded-[8px] ${
                      selectedDays === item
                        ? "text-white bg-[#703AE6]"
                        : "text-black bg-white border-[1px] border-[#E2E2E2]"
                    } `}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          )}
          <ExpandableModal
            scrollable={true}
            contentPosition="bottom"
            modalHeader={
              <div className="w-full h-fit flex justify-between">
                <div
                  className={`w-full h-fit flex flex-col ${
                    type === "deposit-apy" ? "gap-[16px]" : ""
                  }`}
                >
                  <div className="text-[12px] font-semibold">
                    {type === "overall-deposit" ? (
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
                  </div>
                  {type !== "deposit-apy" && (
                    <div className="w-full text-[20px] font-semibold">
                      $
                      {totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  )}
                  {type === "deposit-apy" && (
                    <div className="w-full h-fit flex flex-col gap-[4px]">
                      <div className="text-[16px] font-semibold">0%</div>
                      <div className="text-[12px] font-medium text-[#5C5B5B]">
                        03/11/2025 15:14
                      </div>
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
                      <div className="p-[10px] h-fit rounded-[6px] border-[1px] border-[#E2E2E2]">
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
                    <div className="w-fit h-fit flex gap-[6px]">
                      {dayOptions.map((item, idx) => {
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedDays(item)}
                            className={`cursor-pointer flex flex-col items-center justify-center font-semibold text-[14px] w-[56px] py-[10px] px-[20px] rounded-[8px] ${
                              selectedDays === item
                                ? "text-white bg-[#703AE6]"
                                : "text-black bg-white border-[1px] border-[#E2E2E2]"
                            }`}
                          >
                            {item}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            }
          >
            <div className="w-full h-full">
              {Object.keys(chartData).length > 0 ? (
                <ReusableChart
                  data={chartData}
                  gradientColors={[
                    "rgba(124, 53, 248, 0.3)",
                    "rgba(124, 53, 248, 0.05)",
                  ]}
                  lineColor="#7C35F8"
                  height={450}
                  showGrid={true}
                  formatYAxisLabel={formatYAxisLabel}
                />
              ) : (
                <div className={`w-full h-[450px] flex items-center justify-center text-gray-400 text-sm`}>
                  No data available
                </div>
              )}
            </div>
          </ExpandableModal>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className={`w-full ${containerHeight === "h-full" ? "flex-1 min-h-0" : ""}`}
        style={containerHeight !== "h-full" ? { height: height ? `${height}px` : "203px", minHeight: height ? `${height}px` : "203px" } : {}}
      >
        {Object.keys(chartData).length > 0 ? (
          <ReusableChart
            data={chartData}
            gradientColors={[
              "rgba(124, 53, 248, 0.3)",
              "rgba(124, 53, 248, 0.05)",
            ]}
            lineColor="#7C35F8"
            height={dynamicHeight}
            showGrid={true}
            formatYAxisLabel={formatYAxisLabel}
          />
        ) : (
          <div className={`w-full ${dynamicHeight?`h-[${dynamicHeight}px]` : "h-[393px]"} flex items-center justify-center text-gray-400 text-sm`}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
};
