"use client";

import React, { useEffect, useRef, memo } from "react";
import { useTheme } from "@/contexts/theme-context";

function TradingViewChart() {
  const container = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    const chartConfig = {
      autosize: true,
      symbol: "COINBASE:BTCUSD",
      interval: "D",
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    };

    script.innerHTML = JSON.stringify(chartConfig);

    container.current.innerHTML = "";
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [theme]);

  return (
    <div
      ref={container}
      className="tradingview-widget-container h-full w-full "
    >
      <div className="tradingview-widget-container__widget h-full w-full" />
    </div>
  );
}

export default memo(TradingViewChart);
