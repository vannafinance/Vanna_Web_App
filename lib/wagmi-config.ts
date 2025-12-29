import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { mainnet, base, optimism, arbitrum } from "wagmi/chains";  // Keep if using
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const config = getDefaultConfig({
  appName: "Vanna",
  projectId: "f22dfa1f5a575e7a9ca23001ebc6bec8",
  chains: [mainnet, base, optimism, arbitrum],  // Add arbitrum here if you want it supported
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),  // Remove this line if not adding to chains
  }
});

export default config;