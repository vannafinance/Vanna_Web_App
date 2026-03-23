import createNewStore from "@/zustand/index";

export interface FarmPosition {
  id: string;
  poolName: string;
  assets: string[];
  depositedAmount: number;
  depositedAmountUSD: number;
  liquidityAmount: number;
  liquidityAmountUSD: number;
  earnedRewards: number;
  apr: number;
  entryTime: number;
  type: "single" | "multi";
}

export interface FarmSimulationState {
  // Simulated wallet balances per token (in token units)
  walletBalances: Record<string, number>;
  // Simulated token prices in USD
  tokenPrices: Record<string, number>;
  // Active farm positions
  positions: FarmPosition[];
  // Total deposited value across all positions
  totalDepositedUSD: number;
  // Total earned rewards
  totalEarnedUSD: number;
  // Transaction processing state
  isProcessing: boolean;
  // Last transaction hash (simulated)
  lastTxHash: string | null;
}

const initialState: FarmSimulationState = {
  walletBalances: {
    ETH: 2.5,
    USDC: 10000,
    USDT: 8000,
    HYPE: 5000,
    wstHYPE: 150,
    kHYPE: 200,
    USDe: 3000,
    PURSE: 50000,
    WETH: 1.8,
    WBTC: 0.15,
    DAI: 5000,
  },
  tokenPrices: {
    ETH: 3450.0,
    WETH: 3450.0,
    USDC: 1.0,
    USDT: 1.0,
    HYPE: 12.5,
    wstHYPE: 14.2,
    kHYPE: 13.8,
    USDe: 1.0,
    PURSE: 0.025,
    WBTC: 67500.0,
    DAI: 1.0,
  },
  positions: [],
  totalDepositedUSD: 0,
  totalEarnedUSD: 0,
  isProcessing: false,
  lastTxHash: null,
};

export const useFarmSimulationStore = createNewStore(initialState, {
  name: "farm-simulation-store",
  devTools: true,
  persist: true,
});

// Helper to generate a fake tx hash
export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Helper to generate a position ID
export function generatePositionId(): string {
  return `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
