import type { PrivyClientConfig } from "@privy-io/react-auth";
import {
  base,
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
    base,
  ],
  walletConnectCloudProjectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
};
