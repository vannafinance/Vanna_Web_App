"use client";

/**
 * useWalletConnection
 *
 * Single source of truth for wallet connection state.
 * Reads from wagmi (EOA wallets) AND Privy (embedded/social wallets).
 * Does NOT rely on the persisted Zustand user-store, which can be stale
 * after disconnect/logout because of `persist: true`.
 *
 * Rules:
 * - Privy must be `ready` before we trust any auth state.
 * - Connected = wagmi connected OR Privy authenticated with a wallet.
 * - If Privy is not ready yet → treat as disconnected (avoids flash of stale data).
 */

import { useAccount } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface WalletConnectionState {
  isConnected: boolean;         // true only when actually connected
  address: string | null;       // resolved address (wagmi preferred, then Privy)
  privyReady: boolean;          // Privy SDK initialised
  login: () => void;            // open Privy login modal
}

export function useWalletConnection(): WalletConnectionState {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected, address } = useAccount();

  // Don't trust any state until Privy finishes initialising
  if (!ready) {
    return { isConnected: false, address: null, privyReady: false, login };
  }

  const wagmiConnected = isConnected && !!address;
  const privyConnected = authenticated && wallets.length > 0;

  const isActuallyConnected = wagmiConnected || privyConnected;
  const resolvedAddress = address ?? wallets[0]?.address ?? null;

  return {
    isConnected: isActuallyConnected,
    address: isActuallyConnected ? resolvedAddress : null,
    privyReady: true,
    login,
  };
}
