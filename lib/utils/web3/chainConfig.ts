import { arbAddressList, arbTokensAddress, baseAddressList, baseTokensAddress, opAddressList, opTokensAddress } from "@/lib/web3Constants";




//Central address for Our existing  token addresses 
export const CHAIN_CONFIG = {
  42161: {
    tokens: arbTokensAddress,
    contracts: arbAddressList,
  },
  10: {
    tokens: opTokensAddress,
    contracts: opAddressList,
  },
  8453: {
    tokens: baseTokensAddress,
    contracts: baseAddressList,
  },
} as const;
