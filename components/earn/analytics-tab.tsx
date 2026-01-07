import { Chart } from "./chart";

export const AnalyticsTab = () => {
  return (
    <div className="w-full flex-1 min-h-0">
            <Chart type="deposit-apy" currencyTab={true} height={393} containerWidth="w-full" containerHeight="h-full" />
        </div>
    
  );
};