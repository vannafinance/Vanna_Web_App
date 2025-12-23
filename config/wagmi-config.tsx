// config/wagmi-config.ts
import { createConfig, http } from "wagmi";
import { mainnet, sepolia, base, arbitrum, optimism } from "wagmi/chains";
import { getDefaultWallets, connectorsForWallets } from "@rainbow-me/rainbowkit";

const projectId = "f22dfa1f5a575e7a9ca23001ebc6bec8";

// 👇 SINGLE SOURCE OF TRUTH
export const chains = [mainnet, sepolia, base, arbitrum, optimism];

const { wallets } = getDefaultWallets({
  appName: "Vanna",
  projectId,
});

const connectors = connectorsForWallets(wallets, {
  appName: "Vanna",
  projectId,
});

export const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});
