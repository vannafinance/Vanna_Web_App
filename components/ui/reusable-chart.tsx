"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType, AreaSeries } from "lightweight-charts";

interface ReusableChartProps {
  /**
   * Data in object format: {xAxis: yAxis}
   * Example: {"2025-10-01": 1250, "2025-10-05": 1380}
   */
  data: Record<string, number>;
  /**
   * Gradient colors for the area fill
   * Array of color stops: [topColor, bottomColor]
   * Example: ["rgba(124, 53, 248, 0.3)", "rgba(124, 53, 248, 0.05)"]
   */
  gradientColors?: [string, string];
  /**
   * Color for the line
   * Example: "#7C35F8"
   */
  lineColor?: string;
  /**
   * Height of the chart in pixels
   */
  height?: number;
  /**
   * Show grid lines
   */
  showGrid?: boolean;
  /**
   * Format function for Y-axis labels
   */
  formatYAxisLabel?: (value: number) => string;
  /**
   * Text color for labels and coordinates
   */
  textColor?: string;
}

export const ReusableChart = ({
  data,
  gradientColors = ["rgba(124, 53, 248, 0.3)", "rgba(124, 53, 248, 0.05)"],
  lineColor = "#7C35F8",
  height = 300,
  showGrid = true,
  formatYAxisLabel,
  textColor = "#181822",
}: ReusableChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const formatYAxisLabelRef = useRef(formatYAxisLabel);

  // Create chart only once when container is ready
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColor,
        fontSize: 12,
      },
      grid: {
        vertLines: {
          visible: showGrid,
          color: "rgba(226, 226, 226, 0.5)",
        },
        horzLines: {
          visible: showGrid,
          color: "rgba(226, 226, 226, 0.5)",
        },
      },
      rightPriceScale: {
        visible: true,
        borderColor: "transparent",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        ...(formatYAxisLabelRef.current && {
          priceFormat: {
            type: "custom" as const,
            formatter: (price: number) => formatYAxisLabelRef.current!(price),
          },
        }),
      },
      timeScale: {
        visible: true,
        borderColor: "transparent",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    // Add area series
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: gradientColors[0],
      bottomColor: gradientColors[1],
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Set initial data if available
    if (data && Object.keys(data).length > 0) {
      const chartData = Object.entries(data)
        .map(([dateStr, value]) => ({
          time: dateStr as any,
          value: value,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      if (chartData.length > 0) {
        areaSeries.setData(chartData);
        chart.timeScale().fitContent();
      }
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update chart options when they change (without recreating chart)
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        textColor: textColor,
      },
      grid: {
        vertLines: {
          visible: showGrid,
        },
        horzLines: {
          visible: showGrid,
        },
      },
      height: height,
    });

    if (chartContainerRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    }
  }, [textColor, showGrid, height]);

  // Update formatYAxisLabel ref when it changes
  useEffect(() => {
    formatYAxisLabelRef.current = formatYAxisLabel;
  }, [formatYAxisLabel]);

  // Update series colors when they change
  useEffect(() => {
    if (!seriesRef.current) return;

    seriesRef.current.applyOptions({
      lineColor: lineColor,
      topColor: gradientColors[0],
      bottomColor: gradientColors[1],
    });
  }, [lineColor, gradientColors]);

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !data || Object.keys(data).length === 0) return;

    // Convert data object to array format {time, value}
    // Lightweight Charts accepts time as string in YYYY-MM-DD format
    const chartData = Object.entries(data)
      .map(([dateStr, value]) => {
        return {
          time: dateStr as any, // Use date string directly (YYYY-MM-DD format)
          value: value,
        };
      })
      .sort((a, b) => {
        // Sort by date string
        return a.time.localeCompare(b.time);
      });

    if (chartData.length > 0) {
      seriesRef.current.setData(chartData);

      // Fit content to show all data
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
};

