import { Chart } from "./chart";

export const AnalyticsTab = () => {
  return (
    <section className="w-full flex-1 min-h-0" aria-label="Analytics Dashboard">
      <figure className="w-full h-full">
        <Chart 
          type="deposit-apy" 
          currencyTab={true} 
          height={393} 
          containerWidth="w-full" 
          containerHeight="h-full" 
        />
      </figure>
    </section>
  );
};