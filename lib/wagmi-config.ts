"use client";

import { createConfig } from "@privy-io/wagmi";
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
import { fallback } from "viem";

// Use @privy-io/wagmi's createConfig to keep Privy & Wagmi wallet state in sync
const config = createConfig({
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
    [base.id]: fallback([
      http(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      ),
    ]),
    [bsc.id]: http(),
    [fantom.id]: http(),
    [gnosis.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [zora.id]: http(),
  },
});

export default config;
