import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

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


const config = getDefaultConfig({
  appName: "Vanna",
  projectId: "f22dfa1f5a575e7a9ca23001ebc6bec8",

  // ✅ All supported chains
  chains: [
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

  transports: {
     [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [fantom.id]: http(),
    [gnosis.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [zora.id]: http(),
  },

  // ⭐ IMPORTANT
  enableUnsupportedChains: true,
});

export default config;
