import { poolsPlaceholder } from "@/lib/constants";
import { arbAddressList, arbTokensAddress, baseAddressList, baseTokensAddress, opAddressList, opTokensAddress } from "@/lib/web3Constants";

export const TOKEN_OPTIONS = poolsPlaceholder.map(p=>p.name)  //["WETH", "WBTC", "USDC", "USDT", "DAI"]



// BASE (8453)
// Token	Support	Notes
// WETH	✔	canonical
// WBTC	❌	no native WBTC
// USDC	✔	native USDC on Base
// USDT	❌	not deployed yet
// DAI	❌	not canonical


// ARBITRUM (42161)
// Token	Support
// WETH	✔
// WBTC	✔
// USDC	✔ (bridged / new native USDC.e depends)
// USDT	✔
// DAI	✔


// OPTIMISM (10)
// Token	Support
// WETH	✔
// WBTC	✔
// USDC	✔
// USDT	✔
// DAI	✔

export type TokenSymbol = (typeof TOKEN_OPTIONS)[number];


// This is for ERC-20 token 
export const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
  WETH: 18,
  WBTC: 8,
  USDC: 6,
  USDT: 6,
  DAI: 18,
};


//ERC20 and ETH for WB 
export const tokenAddressByChain: Record<number, Record<string, `0x${string}`>> = {
  42161: arbTokensAddress as Record<string, `0x${string}`>,
  10: opTokensAddress as Record<string, `0x${string}`>,
  8453: baseTokensAddress as Record<string, `0x${string}`>,
};


export const SUPPORTED_TOKENS_BY_CHAIN: Record<number, TokenSymbol[]> = {
  42161: ["ETH","WETH", "WBTC", "USDC", "USDT", "DAI"],
  10:    ["ETH","WETH", "WBTC", "USDC", "USDT", "DAI"],
  8453:  ["ETH","WETH", "WBTC", "USDC", "USDT", "DAI"],
};


//MB + leveraged flow
export const vTokenAddressByChain: Record<number, Record<string, `0x${string}`>> = {
  42161: {
    USDC: arbAddressList.vUSDCContractAddress as `0x${string}`,
    USDT: arbAddressList.vUSDTContractAddress  as `0x${string}`,
    DAI:  arbAddressList.vDaiContractAddress  as `0x${string}`,
    WETH: arbAddressList.vEtherContractAddress  as `0x${string}`,
    WBTC: arbAddressList.vWBTCContractAddress  as `0x${string}`,
  },

  10: {
    USDC: opAddressList.vUSDCContractAddress  as `0x${string}`,
    USDT: opAddressList.vUSDTContractAddress  as `0x${string}`,
    DAI:  opAddressList.vDaiContractAddress  as `0x${string}`,
    WETH: opAddressList.vEtherContractAddress  as `0x${string}`,
    WBTC: opAddressList.vWBTCContractAddress  as `0x${string}`,
  },

  8453: {
    USDC: baseAddressList.vUSDCContractAddress  as `0x${string}`,
    USDT: baseAddressList.vUSDTContractAddress  as `0x${string}`,
    DAI:  baseAddressList.vDaiContractAddress  as `0x${string}`,
    WETH: baseAddressList.vEtherContractAddress  as `0x${string}`,
    WBTC: baseAddressList.vWBTCContractAddress  as `0x${string}`,
  },
};
