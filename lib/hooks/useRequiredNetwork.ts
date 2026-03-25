import { useAccount } from "wagmi";
import { useSwitchChain } from "wagmi";
import { useWallets } from "@privy-io/react-auth";
import { useState } from "react";

export const REQUIRED_CHAIN_ID = 8453; // Base mainnet

export function useRequiredNetwork() {
  // useAccount().chainId = the WALLET's actual chain (e.g. Ethereum 1, BNB 56)
  // useChainId() = wagmi's configured default (always Base 8453) — WRONG for detection
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { wallets } = useWallets();
  const [isSwitching, setIsSwitching] = useState(false);

  // Wrong if wallet is on a different chain OR chain is undefined (not connected)
  const isWrongNetwork = !!chainId && chainId !== REQUIRED_CHAIN_ID;

  const switchToBase = async () => {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      // Privy wallet.switchChain — directly controls Rabby/MetaMask/embedded wallets
      const activeWallet = wallets[0];
      if (activeWallet) {
        await activeWallet.switchChain(REQUIRED_CHAIN_ID);
        return;
      }

      // Fallback: wagmi's switchChain (EIP-3326)
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (err) {
      console.warn("Network switch failed:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  return { isWrongNetwork, switchToBase, isSwitching, chainId };
}
