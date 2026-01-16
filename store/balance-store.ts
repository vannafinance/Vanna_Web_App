import { create } from "zustand";
import {
  TOKEN_DECIMALS,
  tokenAddressByChain,
  SUPPORTED_TOKENS_BY_CHAIN,
} from "@/lib/utils/web3/token";
import { erc20Abi, formatUnits, PublicClient } from "viem";

type BalanceType = "WB" | "MB";

export interface AssetBalance {
  asset: string;
  type: BalanceType;
  amount: number;
}

interface BalanceStore {
  balances: AssetBalance[];

  refreshBalances: (params: {
    chainId: number;
    address: `0x${string}`;
    publicClient: PublicClient;
    marginAccount?: `0x${string}`;
  }) => Promise<void>;

  /** Access helpers */
  getBalance: (asset: string, type: BalanceType) => number;
  walletBalances: AssetBalance[];
  marginBalances: AssetBalance[];
}

export const useBalanceStore = create<BalanceStore>((set, get) => ({
  balances: [],
  walletBalances: [],
  marginBalances: [],

  refreshBalances: async ({ chainId, address, publicClient, marginAccount }) => {
    const supported = SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? [];
    const addrMap = tokenAddressByChain[chainId] ?? {};

    // ---- fetch WB ----
    const wbCalls = supported.map(async (token) => {
      if (token === "WETH" && !addrMap[token]) {
        const raw = await publicClient.getBalance({ address });
        return { asset: "WETH", type: "WB" as const, amount: Number(formatUnits(raw, 18)) };
      }

      const contract = addrMap[token];
      if (!contract) return { asset: token, type: "WB" as const, amount: 0 };

      const decimals = TOKEN_DECIMALS[token] ?? 18;
      const raw = await publicClient.readContract({
        address: contract,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
      return { asset: token, type: "WB" as const, amount: Number(formatUnits(raw, decimals)) };
    });

    const walletArr = await Promise.all(wbCalls);

    // ---- fetch MB ----
    let marginArr: AssetBalance[] = [];
    if (marginAccount) {
      const mbCalls = supported.map(async (token) => {
        const contract = addrMap[token];
        if (!contract) return { asset: token, type: "MB" as const, amount: 0 };

        const decimals = TOKEN_DECIMALS[token] ?? 18;
        const raw = await publicClient.readContract({
          address: contract,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [marginAccount],
        });
        return { asset: token, type: "MB" as const, amount: Number(formatUnits(raw, decimals)) };
      });
      marginArr = await Promise.all(mbCalls);
    }

    set({
      balances: [...walletArr, ...marginArr],
      walletBalances: walletArr,
      marginBalances: marginArr,
    });
  },

  getBalance: (asset, type) => {
    const b = get().balances.find((b) => b.asset === asset && b.type === type);
    return b?.amount ?? 0;
  },
}));
