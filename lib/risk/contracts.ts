// Contract ABIs and addresses for the Risk Analytics Dashboard
// All ABIs are minimal — only the view/read functions needed for the dashboard

import { type Address } from 'viem';

// ============================================
// MINIMAL ABIs
// ============================================

export const riskEngineAbi = [
  // These are nonpayable on-chain but we call via eth_call (read-only), so mark as view for viem typing
  { type: 'function', name: 'getBalance', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getBorrows', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'isAccountHealthy', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceToBorrowThreshold', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'oracle', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'registry', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const;

export const vTokenAbi = [
  { type: 'function', name: 'totalAssets', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getBorrows', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getBorrowBalance', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'asset', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'rateModel', inputs: [], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'convertToAssets', inputs: [{ name: 'shares', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
] as const;

export const accountAbi = [
  { type: 'function', name: 'getAssets', inputs: [], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' },
  { type: 'function', name: 'getBorrows', inputs: [], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' },
  { type: 'function', name: 'hasNoDebt', inputs: [], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'hasAsset', inputs: [{ name: 'token', type: 'address' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'activationBlock', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const;

export const registryAbi = [
  { type: 'function', name: 'accountsOwnedBy', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' },
  { type: 'function', name: 'VTokenFor', inputs: [{ name: 'underlying', type: 'address' }], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const;

export const oracleFacadeAbi = [
  // Note: getPrice is nonpayable on-chain but we call via eth_call (read-only), so mark as view for viem typing
  { type: 'function', name: 'getPrice', inputs: [{ name: 'token', type: 'address' }, { name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'oracle', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const;

export const linearRateModelAbi = [
  { type: 'function', name: 'getBorrowRatePerSecond', inputs: [{ name: 'liquidity', type: 'uint256' }, { name: 'totalDebt', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'baseRate', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'slope1', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'slope2', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'OPTIMAL_USAGE_RATIO', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_EXCESS_USAGE_RATIO', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
] as const;

export const erc20Abi = [
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'name', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
] as const;

export const accountManagerAbi = [
  { type: 'function', name: 'accountsOwnedBy', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }], stateMutability: 'view' },
  { type: 'function', name: 'VTokenFor', inputs: [{ name: 'underlying', type: 'address' }], outputs: [{ name: '', type: 'address' }], stateMutability: 'view' },
] as const;

// ============================================
// CHAIN-SPECIFIC ADDRESSES
// ============================================

export interface ChainContracts {
  riskEngine: Address;
  accountManager: Address;
  registry: Address;
  rateModel: Address;
  multicall: Address;
  vTokens: {
    vUSDC: Address;
    vUSDT: Address;
    vETH: Address;
  };
  tokens: {
    USDC: Address;
    USDT: Address;
    WETH: Address;
  };
  oracleFacade?: Address;
}

export const CHAIN_CONTRACTS: Record<number, ChainContracts> = {
  // Base
  8453: {
    riskEngine: '0x29133317047183c48a3DF2022bD89B089Fc4F97a',
    accountManager: '0x6F5303D7277B100443A3AfCec9886774d7214e00',
    registry: '0xDfd5D412A9FB58aE12d6b1AC20Df97D038c3E32b',
    rateModel: '0xe190EA24860f8521f8a97f1E897677335C81a23B',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    vTokens: {
      vUSDC: '0x22D4FB89834738714e6B4aDa414B900138148289',
      vUSDT: '0x0c2b54eA439735E624986efaF4054AD92831Cd4f',
      vETH: '0xA8A7Ae5C132524398FF29293C0bB00530d47cdA9',
    },
    tokens: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      WETH: '0x4200000000000000000000000000000000000006',
    },
  },
  // Arbitrum
  42161: {
    riskEngine: '0x676fbE39A5a403b85474D155567e43D9b2b85922',
    accountManager: '0x13da9e485D17c0F62f64F77aAbE7b6c048a2f33C',
    registry: '0x6DCD57f3C7CBc465832213646BEEf5501f63a3C4',
    rateModel: '0xbfB65FA7ccc024c3315c4Eb13891f41223906f364',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    vTokens: {
      vUSDC: '0xE17258A56F0da671a028F2276Ddeaa5C1ccF3bdb',
      vUSDT: '0x615A1B9A30C0C0e3E2391c5b93210Ce96FD2F0ef',
      vETH: '0xA1f41ad5e26167db20c722835A6DB33889c49Cd7',
    },
    tokens: {
      USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
  },
  // Optimism
  10: {
    riskEngine: '0x6E7EA2E46e72ff84CeFfc5e11fB9c6e97B01c617',
    accountManager: '0x6A82847B5Dc8c3535eE370308D78D396228A0D3a',
    registry: '0xFd4568C1d084e281BEAa0d55BB5CFc7Cd91B39a4',
    rateModel: '0x687a9656ba10Ca157dDA7c55D64bd64b3212ABce',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    oracleFacade: '0x61959f47e62A3F92F36B2391b0F4a111c659F042',
    vTokens: {
      vUSDC: '0x010305302F7BFc12Ec2597Cef77AF2DE91a90Ee9',
      vUSDT: '0x7e70816B257Be3AbC4f2acA8C7e42b7bde76AEC8',
      vETH: '0xa66d23d6b0bF9283059E2a2938d67FEE9080659b',
    },
    tokens: {
      USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      WETH: '0x4200000000000000000000000000000000000006',
    },
  },
};

export const SUPPORTED_CHAINS = [8453, 42161, 10] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number];

export const CHAIN_NAMES: Record<number, string> = {
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism',
};

export const CHAIN_COLORS: Record<number, string> = {
  8453: '#0052FF',
  42161: '#28A0F0',
  10: '#FF0420',
};

// Token metadata
export interface TokenMeta {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  vTokenKey: 'vUSDC' | 'vUSDT' | 'vETH';
  tokenKey: 'USDC' | 'USDT' | 'WETH';
}

export const TOKEN_LIST: TokenMeta[] = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: '/icons/usdc.svg', vTokenKey: 'vUSDC', tokenKey: 'USDC' },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6, icon: '/icons/usdt.svg', vTokenKey: 'vUSDT', tokenKey: 'USDT' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: '/icons/eth.svg', vTokenKey: 'vETH', tokenKey: 'WETH' },
];

// Seconds per year (used for APY calculations)
export const SECS_PER_YEAR = 31556952;
