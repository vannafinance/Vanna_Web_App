import type { PrivyClientConfig } from "@privy-io/react-auth";
import {
  mainnet,
  arbitrum,
  avalanche,
  base,
  bsc,
  fantom,
  gnosis,
  optimism,
  polygon,
  zora,
} from "wagmi/chains";

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    accentColor: "#703AE6",
    logo: "/logos/vanna-white.png",
    showWalletLoginFirst: false,
  },
  loginMethods: ["email", "google", "twitter", "apple", "wallet"],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users",
    },
  },
  defaultChain: base,
  supportedChains: [
    mainnet,
    arbitrum,
    avalanche,
    base,
    bsc,
    fantom,
    gnosis,
    optimism,
    polygon,
    zora,
  ],
  walletConnectCloudProjectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
};
