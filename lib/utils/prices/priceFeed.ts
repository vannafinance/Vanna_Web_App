// Price feed utilities for getting real-time asset prices
import { useCallback, useState, useEffect } from "react";

/**
 * Price feeds for different networks
 * Using CoinGecko API as fallback (free tier, no API key needed)
 */

export type PriceData = {
  usd: number;
  usd_24h_change: number;
};

const COINGECKO_IDS = {
  ETH: "ethereum",
  USDC: "usd-coin",
  USDT: "tether",
} as const;

/**
 * Fetch current prices from Next.js API route (bypasses CORS)
 * Uses MUX Network API with server-side caching
 */
export const fetchPrices = async (
  assets: string[]
): Promise<Record<string, PriceData>> => {
  try {
    // Use Next.js API route instead of direct CoinGecko call
    const response = await fetch("/api/prices", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();

    // Map to expected format
    const prices: Record<string, PriceData> = {};
    assets.forEach((asset) => {
      if (data[asset] !== undefined) {
        prices[asset] = {
          usd: data[asset],
          usd_24h_change: 0, // MUX API doesn't provide 24h change
        };
      }
    });

    return prices;
  } catch (error) {
    console.error("Error fetching prices:", error);
    // Return fallback prices
    return {
      ETH: { usd: 3000, usd_24h_change: 0 },
      USDC: { usd: 1, usd_24h_change: 0 },
      USDT: { usd: 1, usd_24h_change: 0 },
    };
  }
};

/**
 * Hook to fetch and cache prices
 */
export const usePrices = (assets: string[]) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create stable string key from assets array to prevent infinite loops
  const assetsKey = assets.sort().join(',');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const priceData = await fetchPrices(assets);
      setPrices(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey]); // Use stable string instead of array reference

  useEffect(() => {
    fetchData();

    // Refresh prices every 5 minutes to reduce API calls
    // The API route has 60s cache, so more frequent calls don't help
    const interval = setInterval(fetchData, 300000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { prices, loading, error, refetch: fetchData };
};

/**
 * Calculate USD value
 */
export const calculateUsdValue = (
  amount: number,
  asset: string,
  prices: Record<string, PriceData>
): number => {
  const price = prices[asset]?.usd || 0;
  return amount * price;
};

/**
 * Format USD value for display
 */
export const formatUsdValue = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};
