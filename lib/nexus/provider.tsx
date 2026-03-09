"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount, useConnectorClient, useAccountEffect } from "wagmi";
import type { NexusSDK, EthereumProvider } from "@avail-project/nexus-core";
import {
  getNexusSDK,
  initializeNexusSDK,
  deinitializeNexusSDK,
} from "./sdk";

// ─── Types ─────────────────────────────────────────────

export interface NexusBalance {
  symbol: string;
  decimals: number;
  balance: string;
  balanceInFiat?: number;
  icon?: string;
  breakdown?: {
    balance: string;
    balanceInFiat: number;
    chain: { id: number; logo: string; name: string };
    contractAddress: `0x${string}`;
  }[];
}

interface NexusContextValue {
  sdk: NexusSDK | null;
  loading: boolean;
  initialized: boolean;

  // Balances
  bridgeBalances: NexusBalance[];
  swapBalances: NexusBalance[];
  fetchBridgeBalances: () => Promise<void>;
  fetchSwapBalances: () => Promise<void>;

  // Hook refs (for intent/allowance/swapIntent confirmation UI)
  intentRef: React.MutableRefObject<any>;
  allowanceRef: React.MutableRefObject<any>;
  swapIntentRef: React.MutableRefObject<any>;

  // Supported chains/tokens
  supportedChains: any[];
  swapSupportedChains: any[];
}

const NexusContext = createContext<NexusContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────

export function NexusProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<NexusSDK | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [bridgeBalances, setBridgeBalances] = useState<NexusBalance[]>([]);
  const [swapBalances, setSwapBalances] = useState<NexusBalance[]>([]);
  const [supportedChains, setSupportedChains] = useState<any[]>([]);
  const [swapSupportedChains, setSwapSupportedChains] = useState<any[]>([]);

  const intentRef = useRef<any>(null);
  const allowanceRef = useRef<any>(null);
  const swapIntentRef = useRef<any>(null);

  const { status, connector } = useAccount();
  const { data: walletClient } = useConnectorClient();

  // ─── Initialize on wallet connect ────────────────────

  const handleInit = useCallback(async () => {
    if (loading || initialized) return;
    if (status !== "connected") return;

    setLoading(true);
    try {
      // Resolve EIP-1193 provider from wagmi
      const mobileProvider = walletClient
        ? ({
            request: (args: unknown) => walletClient.request(args as never),
          } as EthereumProvider)
        : undefined;
      const desktopProvider = await connector?.getProvider();
      const provider =
        mobileProvider ?? (desktopProvider as EthereumProvider | undefined);

      if (!provider || typeof provider.request !== "function") return;

      const instance = await initializeNexusSDK(provider);
      setSdk(instance);
      setInitialized(true);

      // Attach hooks
      instance.setOnIntentHook((data: any) => {
        intentRef.current = data;
      });
      instance.setOnAllowanceHook((data: any) => {
        allowanceRef.current = data;
      });
      instance.setOnSwapIntentHook((data: any) => {
        swapIntentRef.current = data;
      });

      // Preload supported chains
      try {
        const chains = await instance.utils.getSupportedChains();
        setSupportedChains(chains);
      } catch { /* non-critical */ }

      try {
        const swapChains =
          await instance.utils.getSwapSupportedChainsAndTokens();
        setSwapSupportedChains(swapChains);
      } catch { /* non-critical */ }
    } catch (err) {
      console.error("[Nexus] Init failed:", err);
    } finally {
      setLoading(false);
    }
  }, [status, connector, walletClient, loading, initialized]);

  useEffect(() => {
    if (status === "connected" && !initialized && !loading) {
      handleInit();
    }
  }, [status, initialized, loading, handleInit]);

  // ─── Deinitialize on wallet disconnect ───────────────

  useAccountEffect({
    onDisconnect: () => {
      deinitializeNexusSDK();
      setSdk(null);
      setInitialized(false);
      setBridgeBalances([]);
      setSwapBalances([]);
      setSupportedChains([]);
      setSwapSupportedChains([]);
      intentRef.current = null;
      allowanceRef.current = null;
      swapIntentRef.current = null;
    },
  });

  // ─── Balance fetchers ────────────────────────────────

  const fetchBridgeBalances = useCallback(async () => {
    if (!sdk || !initialized) return;
    try {
      const balances = await sdk.getBalancesForBridge();
      console.log("[Nexus] Bridge balances raw:", JSON.stringify(balances, null, 2));
      setBridgeBalances(balances as NexusBalance[]);
    } catch (err) {
      console.error("[Nexus] Bridge balances fetch failed:", err);
    }
  }, [sdk, initialized]);

  const fetchSwapBalances = useCallback(async () => {
    if (!sdk || !initialized) return;
    try {
      const balances = await sdk.getBalancesForSwap();
      setSwapBalances(balances as any);
    } catch (err) {
      console.error("[Nexus] Swap balances fetch failed:", err);
    }
  }, [sdk, initialized]);

  // Auto-fetch balances once initialized
  useEffect(() => {
    if (initialized && sdk) {
      fetchBridgeBalances();
      fetchSwapBalances();
    }
  }, [initialized, sdk, fetchBridgeBalances, fetchSwapBalances]);

  return (
    <NexusContext.Provider
      value={{
        sdk,
        loading,
        initialized,
        bridgeBalances,
        swapBalances,
        fetchBridgeBalances,
        fetchSwapBalances,
        intentRef,
        allowanceRef,
        swapIntentRef,
        supportedChains,
        swapSupportedChains,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────

export function useNexus() {
  const ctx = useContext(NexusContext);
  if (!ctx) {
    throw new Error("useNexus must be used within a <NexusProvider>");
  }
  return ctx;
}
