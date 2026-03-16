export interface PoolData {
  chainId: number;
  symbol: string;
  vTokenAddress: string;
  tokenAddress: string;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  utilization: number;        // 0-100
  borrowRatePerSecond: bigint;
  borrowAPY: number;          // annualized %
  supplyAPY: number;          // annualized %
  decimals: number;
}

export interface ProtocolMetrics {
  totalTVL: number;           // USD
  totalSupplied: number;      // USD
  totalBorrowed: number;      // USD
  utilization: number;        // 0-100
  activeMarkets: number;
  perChain: Record<number, {
    tvl: number;
    supplied: number;
    borrowed: number;
    utilization: number;
  }>;
  pools: PoolData[];
}

export interface TokenRisk {
  symbol: string;
  name: string;
  chainId: number;
  totalSupplied: number;      // USD
  totalBorrowed: number;      // USD
  utilization: number;        // 0-100
  supplyAPY: number;
  borrowAPY: number;
  concentrationPct: number;   // % of total TVL
  riskTier: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface UserPosition {
  chainId: number;
  accountAddress: string;
  collateralUsd: number;
  debtUsd: number;
  healthFactor: number;
  ltv: number;
  leverage: number;
  hfStatus: 'safe' | 'caution' | 'warning' | 'danger' | 'liquidatable';
  assets: { symbol: string; amount: number; usd: number }[];
  borrows: { symbol: string; amount: number; usd: number }[];
}

export interface RateModelParams {
  chainId: number;
  baseRate: number;
  slope1: number;
  slope2: number;
  optimalUsageRatio: number;
  maxExcessUsageRatio: number;
}

export type ChainLoadingState = Record<number, {
  loading: boolean;
  error: string | null;
}>;
