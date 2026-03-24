"use client";

import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import {
  base,
} from "wagmi/chains";
import { fallback } from "viem";

// Use @privy-io/wagmi's createConfig to keep Privy & Wagmi wallet state in sync
const config = createConfig({
  chains: [
    base,
  ],

  transports: {
    [base.id]: fallback([
      http(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      ),
    ]),
  },
});

export default config;
