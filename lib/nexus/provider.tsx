"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useAccount, useConnectorClient, useAccountEffect } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { NexusSDK, EthereumProvider } from "@avail-project/nexus-core";
import {
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
  fetchBridgeBalances: (force?: boolean) => Promise<void>;
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
// Fast-mode balances: only chains requested for instant UX.
const FAST_BALANCE_CHAIN_IDS = [42161, 10, 8453] as const; // Arbitrum, Optimism, Base

function filterBalancesToChains(
  balances: NexusBalance[],
  allowedChainIds: number[]
): NexusBalance[] {
  return balances
    .map((asset) => {
      const filteredBreakdown = (asset.breakdown ?? []).filter((b) =>
        allowedChainIds.includes(b.chain.id)
      );
      if (filteredBreakdown.length === 0) return null;
      const totalBalance = filteredBreakdown.reduce(
        (sum, b) => sum + Number(b.balance || "0"),
        0
      );
      const totalFiat = filteredBreakdown.reduce(
        (sum, b) => sum + Number(b.balanceInFiat || 0),
        0
      );
      return {
        ...asset,
        balance: String(totalBalance),
        balanceInFiat: totalFiat,
        breakdown: filteredBreakdown,
      };
    })
    .filter(Boolean) as NexusBalance[];
}

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
  const lastBridgeFetchRef = useRef<number>(0);
  const bridgeFetchPromiseRef = useRef<Promise<void> | null>(null);
  const bridgeFetchBlockedRef = useRef(false);
  const { status, connector, address } = useAccount();
  const { data: walletClient } = useConnectorClient();
  const { wallets: privyWallets } = useWallets();
  const { authenticated } = usePrivy();
  const CACHE_KEY = useMemo(
    () => `nexus_bridge_balances_v2_${(address ?? "anon").toLowerCase()}`,
    [address]
  );
  const CACHE_TTL_MS = 60_000; // 60 seconds
  const BRIDGE_FETCH_TIMEOUT_MS = 4_000;

  // ─── Initialize on wallet connect ────────────────────

  const handleInit = useCallback(async () => {
    if (loading || initialized) return;
    if (status !== "connected" && !authenticated) return;

    setLoading(true);
    try {
      // Resolve EIP-1193 provider: try Privy wallets first, then wagmi connector
      let provider: EthereumProvider | undefined;

      // Try Privy embedded wallet provider first
      const privyWallet = privyWallets.find(
        (w) => w.walletClientType === "privy"
      );
      if (privyWallet) {
        try {
          provider = await privyWallet.getEthereumProvider() as EthereumProvider;
        } catch { /* fall through to wagmi */ }
      }

      // Fallback to wagmi connector client / desktop provider
      if (!provider) {
        const mobileProvider = walletClient
          ? ({
              request: (args: unknown) => walletClient.request(args as never),
            } as EthereumProvider)
          : undefined;
        const desktopProvider = await connector?.getProvider();
        provider =
          mobileProvider ?? (desktopProvider as EthereumProvider | undefined);
      }

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
  }, [status, authenticated, connector, walletClient, privyWallets, loading, initialized]);

  useEffect(() => {
    if ((status === "connected" || authenticated) && !initialized && !loading) {
      handleInit();
    }
  }, [status, authenticated, initialized, loading, handleInit]);

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
      lastBridgeFetchRef.current = 0;
      bridgeFetchBlockedRef.current = false;
      // Keep cached balances to render instantly on reconnect.
    },
  });

  // ─── Load cached balances immediately on mount ───────

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const { balances, ts } = JSON.parse(raw);
        if (balances?.length && Date.now() - ts < 5 * 60_000) {
          // Show cached data right away (up to 5 min stale is fine for display)
          setBridgeBalances(balances);
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CACHE_KEY]);

  // ─── Balance fetchers ────────────────────────────────

  const fetchBridgeBalances = useCallback(async (force = false) => {
    if (!sdk || !initialized) return;
    if (bridgeFetchBlockedRef.current) return;
    const now = Date.now();
    if (bridgeFetchPromiseRef.current) {
      await bridgeFetchPromiseRef.current;
      return;
    }
    // Skip if fetched less than CACHE_TTL_MS ago (unless forced)
    if (!force && now - lastBridgeFetchRef.current < CACHE_TTL_MS) return;
    lastBridgeFetchRef.current = now;
    bridgeFetchPromiseRef.current = (async () => {
      try {
        // Try limiting to fast chains first (Base, Arbitrum, Optimism).
        // Some SDK versions may ignore this argument; we still guard fallback below.
        const balancesPromise = (
          sdk as any
        ).getBalancesForBridge({
          sourceChains: [...FAST_BALANCE_CHAIN_IDS],
        }) as Promise<NexusBalance[]>;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Bridge balances fetch timed out, keeping cached balances")
              ),
            BRIDGE_FETCH_TIMEOUT_MS
          )
        );
        const balances = await Promise.race([balancesPromise, timeoutPromise]);
        const filteredBalances = filterBalancesToChains(
          balances,
          FAST_BALANCE_CHAIN_IDS
        );
        setBridgeBalances(filteredBalances);
        // Persist to localStorage for instant display next open
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ balances: filteredBalances, ts: now })
          );
        } catch {
          /* ignore quota errors */
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Privy embedded provider does not support wallet_addEthereumChain.
        // Stop repeated retries to avoid buffering loops and keep cached UI.
        if (
          msg.includes("wallet_addEthereumChain") ||
          msg.includes("Unsupported method")
        ) {
          bridgeFetchBlockedRef.current = true;
        }
        console.warn("[Nexus] Bridge balances fetch fallback:", err);
      } finally {
        bridgeFetchPromiseRef.current = null;
      }
    })();
    await bridgeFetchPromiseRef.current;
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

  // Auto-fetch once initialized (bridge balances cached; swap on demand)
  useEffect(() => {
    if (initialized && sdk) {
      fetchBridgeBalances();
    }
  }, [initialized, sdk, fetchBridgeBalances]);

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
