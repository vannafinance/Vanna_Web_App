import { poolsPlaceholder } from "@/lib/constants";
import { arbAddressList, arbTokensAddress, baseAddressList, baseTokensAddress, opAddressList, opTokensAddress } from "@/lib/web3Constants";

// DefaultRateModel contract address per chain (for on-chain APY calculation)
export const rateModelAddressByChain: Record<number, `0x${string}`> = {
  42161: arbAddressList.rateModelContractAddress as `0x${string}`,   // Arbitrum
  10:    opAddressList.rateModelContractAddress as `0x${string}`,    // Optimism
  8453:  baseAddressList.rateModelContractAddress as `0x${string}`,  // Base
};

// Risk Engine (Risk Curator) contract address per chain
export const riskEngineAddressByChain: Record<number, `0x${string}`> = {
  42161: arbAddressList.riskEngineContractAddress as `0x${string}`,  // Arbitrum
  10:    opAddressList.riskEngineContractAddress as `0x${string}`,   // Optimism
  8453:  baseAddressList.riskEngineContractAddress as `0x${string}`, // Base
};

// Broker (Fee Receiver) address per chain
export const brokerAddressByChain: Record<number, `0x${string}`> = {
  42161: arbAddressList.broker as `0x${string}`,  // Arbitrum
  10:    opAddressList.broker as `0x${string}`,    // Optimism
  8453:  baseAddressList.broker as `0x${string}`,  // Base
};

// Oracle router address per chain (where available)
export const oracleAddressByChain: Record<number, `0x${string}`> = {
  10: opAddressList.OracleFacade as `0x${string}`, // Optimism (only chain with oracle facade)
};

// AccountManager contract address per chain
export const accountManagerAddressByChain: Record<number, `0x${string}`> = {
  42161: arbAddressList.accountManagerContractAddress as `0x${string}`,  // Arbitrum
  10:    opAddressList.accountManagerContractAddress as `0x${string}`,   // Optimism
  8453:  baseAddressList.accountManagerContractAddress as `0x${string}`, // Base
};

export const TOKEN_OPTIONS = poolsPlaceholder.map(p=>p.name)  //["ETH", "USDC", "USDT"]



// BASE (8453)
// Token	Support	Notes
// WETH	✔	canonical
// WBTC	❌	no native WBTC
// USDC	✔	native USDC on Base
// USDT	✔	bridged USDT on Base (0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2)
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
  ETH: 18,
  USDC: 6,
  USDT: 6,
};


//ERC20 and ETH for WB 
export const tokenAddressByChain: Record<number, Record<string, `0x${string}`>> = {
  42161: arbTokensAddress as Record<string, `0x${string}`>,
  10: opTokensAddress as Record<string, `0x${string}`>,
  8453: baseTokensAddress as Record<string, `0x${string}`>,
};


export const SUPPORTED_TOKENS_BY_CHAIN: Record<number, TokenSymbol[]> = {
  42161: ["ETH", "USDC", "USDT"],  // Arbitrum - all supported
  10: ["ETH", "USDC", "USDT"],     // Optimism - all supported
  8453: ["ETH", "USDC",],   // Base - USDT now supported ✅
};


//MB + leveraged flow
export const vTokenAddressByChain: Record<number, Record<string, `0x${string}`>> = {
  42161: {
    USDC: arbAddressList.vUSDCContractAddress as `0x${string}`,
    USDT: arbAddressList.vUSDTContractAddress as `0x${string}`,
    ETH: arbAddressList.vEtherContractAddress as `0x${string}`,
  },

  10: {
    USDC: opAddressList.vUSDCContractAddress as `0x${string}`,
    USDT: opAddressList.vUSDTContractAddress as `0x${string}`,
    ETH: opAddressList.vEtherContractAddress as `0x${string}`,
  },

  8453: {
    USDC: baseAddressList.vUSDCContractAddress as `0x${string}`,
    USDT: baseAddressList.vUSDTContractAddress as `0x${string}`,
    ETH: baseAddressList.vEtherContractAddress as `0x${string}`,
  },
};
