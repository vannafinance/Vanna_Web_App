"use client";

import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base, arbitrum, optimism } from "wagmi/chains";
import { fallback } from "viem";

// Use @privy-io/wagmi's createConfig to keep Privy & Wagmi wallet state in sync
const config = createConfig({
  chains: [base, arbitrum, optimism],

  transports: {
    [base.id]: fallback([
      http(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      ),
      http("https://mainnet.base.org"),
    ]),
    [arbitrum.id]: fallback([
      http(
        `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      ),
      http("https://arb1.arbitrum.io/rpc"),
    ]),
    [optimism.id]: fallback([
      http(
        `https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      ),
      http("https://mainnet.optimism.io"),
    ]),
  },
});

export default config;
