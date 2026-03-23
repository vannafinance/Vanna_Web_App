/**
 * TEST SUITE: Token & Chain Configuration
 *
 * Validates that all token addresses, chain configs, and contract addresses
 * are correctly configured across supported chains (Arbitrum, Optimism, Base).
 *
 * Critical for auditing because misconfigured addresses can lead to:
 *  - Funds sent to wrong contracts
 *  - Failed transactions
 *  - Cross-chain mismatches
 */

import { describe, it, expect } from "vitest";
import {
  TOKEN_DECIMALS,
  TOKEN_OPTIONS,
  SUPPORTED_TOKENS_BY_CHAIN,
  tokenAddressByChain,
  vTokenAddressByChain,
  rateModelAddressByChain,
  riskEngineAddressByChain,
  brokerAddressByChain,
  accountManagerAddressByChain,
} from "@/lib/utils/web3/token";
import { ASSET_CODE } from "@/lib/utils/web3/assetCodes";
import { getAddressList } from "@/lib/utils/web3/addressList";
import {
  chains,
  networkOptions,
  arbAddressList,
  opAddressList,
  baseAddressList,
  arbTokensAddress,
  opTokensAddress,
  baseTokensAddress,
  codeToAsset,
  CollateralAssetCode,
} from "@/lib/web3Constants";

// ──────────────────────────────────────────────
// 1. Token Configuration
// ──────────────────────────────────────────────

describe("TOKEN_OPTIONS", () => {
  it("contains ETH, USDC, USDT", () => {
    expect(TOKEN_OPTIONS).toContain("ETH");
    expect(TOKEN_OPTIONS).toContain("USDC");
    expect(TOKEN_OPTIONS).toContain("USDT");
  });

  it("has exactly 3 tokens", () => {
    expect(TOKEN_OPTIONS).toHaveLength(3);
  });
});

describe("TOKEN_DECIMALS", () => {
  it("ETH has 18 decimals", () => {
    expect(TOKEN_DECIMALS["ETH"]).toBe(18);
  });

  it("USDC has 6 decimals", () => {
    expect(TOKEN_DECIMALS["USDC"]).toBe(6);
  });

  it("USDT has 6 decimals", () => {
    expect(TOKEN_DECIMALS["USDT"]).toBe(6);
  });
});

describe("ASSET_CODE mapping", () => {
  it("USDC maps to code 00", () => {
    expect(ASSET_CODE.USDC).toBe("00");
  });

  it("USDT maps to code 01", () => {
    expect(ASSET_CODE.USDT).toBe("01");
  });

  it("ETH maps to code 03", () => {
    expect(ASSET_CODE.ETH).toBe("03");
  });
});

describe("codeToAsset / CollateralAssetCode", () => {
  it("code 00 maps to USDC", () => {
    expect(codeToAsset["00"]).toBe("USDC");
  });

  it("code 01 maps to USDT", () => {
    expect(codeToAsset["01"]).toBe("USDT");
  });

  it("code 03 maps to ETH", () => {
    expect(codeToAsset["03"]).toBe("ETH");
  });

  it("CollateralAssetCode is inverse of codeToAsset", () => {
    expect(CollateralAssetCode["USDC"]).toBe("00");
    expect(CollateralAssetCode["USDT"]).toBe("01");
    expect(CollateralAssetCode["ETH"]).toBe("03");
  });
});

// ──────────────────────────────────────────────
// 2. Supported Chains
// ──────────────────────────────────────────────

describe("Supported Chains", () => {
  const SUPPORTED_CHAIN_IDS = [42161, 10, 8453]; // Arbitrum, Optimism, Base

  it("chains array includes all 3 mainnet chains", () => {
    const chainIds = chains.map((c) => c.id);
    for (const id of SUPPORTED_CHAIN_IDS) {
      expect(chainIds).toContain(id);
    }
  });

  it("all chains have valid RPC URLs", () => {
    for (const chain of chains) {
      expect(chain.rpcUrls.default.http.length).toBeGreaterThan(0);
      expect(chain.rpcUrls.default.http[0]).toMatch(/^https?:\/\//);
    }
  });

  it("all chains have block explorers", () => {
    for (const chain of chains) {
      expect(chain.blockExplorers?.default.url).toMatch(/^https?:\/\//);
    }
  });

  it("all chains have multicall3 address", () => {
    for (const chain of chains) {
      expect(chain.contracts?.multicall3?.address).toMatch(/^0x/);
    }
  });

  it("networkOptions has matching chainIds", () => {
    const optionIds = networkOptions.map((n) => n.chainId);
    expect(optionIds).toContain(8453);
    expect(optionIds).toContain(42161);
    expect(optionIds).toContain(10);
  });
});

// ──────────────────────────────────────────────
// 3. SUPPORTED_TOKENS_BY_CHAIN
// ──────────────────────────────────────────────

describe("SUPPORTED_TOKENS_BY_CHAIN", () => {
  it("Arbitrum (42161) supports ETH, USDC, USDT", () => {
    expect(SUPPORTED_TOKENS_BY_CHAIN[42161]).toEqual(["ETH", "USDC", "USDT"]);
  });

  it("Optimism (10) supports ETH, USDC, USDT", () => {
    expect(SUPPORTED_TOKENS_BY_CHAIN[10]).toEqual(["ETH", "USDC", "USDT"]);
  });

  it("Base (8453) supports ETH, USDC, USDT", () => {
    expect(SUPPORTED_TOKENS_BY_CHAIN[8453]).toContain("ETH");
    expect(SUPPORTED_TOKENS_BY_CHAIN[8453]).toContain("USDC");
    expect(SUPPORTED_TOKENS_BY_CHAIN[8453]).toContain("USDT");
  });
});

// ──────────────────────────────────────────────
// 4. Token Addresses (ERC20)
// ──────────────────────────────────────────────

describe("Token Addresses", () => {
  const CHAIN_IDS = [42161, 10, 8453];

  it("every chain has USDC and USDT addresses", () => {
    for (const chainId of CHAIN_IDS) {
      const tokens = tokenAddressByChain[chainId];
      expect(tokens).toBeDefined();
      expect(tokens["USDC"]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(tokens["USDT"]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("Arbitrum token addresses match web3Constants", () => {
    expect(tokenAddressByChain[42161]["USDC"]).toBe(arbTokensAddress.USDC);
    expect(tokenAddressByChain[42161]["USDT"]).toBe(arbTokensAddress.USDT);
  });

  it("Optimism token addresses match web3Constants", () => {
    expect(tokenAddressByChain[10]["USDC"]).toBe(opTokensAddress.USDC);
    expect(tokenAddressByChain[10]["USDT"]).toBe(opTokensAddress.USDT);
  });

  it("Base token addresses match web3Constants", () => {
    expect(tokenAddressByChain[8453]["USDC"]).toBe(baseTokensAddress.USDC);
    expect(tokenAddressByChain[8453]["USDT"]).toBe(baseTokensAddress.USDT);
  });
});

// ──────────────────────────────────────────────
// 5. vToken Addresses (Earn Vaults)
// ──────────────────────────────────────────────

describe("vToken Addresses", () => {
  const CHAIN_IDS = [42161, 10, 8453];

  it("every chain has vUSDC, vUSDT, vETH addresses", () => {
    for (const chainId of CHAIN_IDS) {
      const vTokens = vTokenAddressByChain[chainId];
      expect(vTokens).toBeDefined();
      expect(vTokens["USDC"]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(vTokens["USDT"]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(vTokens["ETH"]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("Arbitrum vToken addresses match web3Constants", () => {
    expect(vTokenAddressByChain[42161]["USDC"]).toBe(arbAddressList.vUSDCContractAddress);
    expect(vTokenAddressByChain[42161]["USDT"]).toBe(arbAddressList.vUSDTContractAddress);
    expect(vTokenAddressByChain[42161]["ETH"]).toBe(arbAddressList.vEtherContractAddress);
  });

  it("Optimism vToken addresses match web3Constants", () => {
    expect(vTokenAddressByChain[10]["USDC"]).toBe(opAddressList.vUSDCContractAddress);
    expect(vTokenAddressByChain[10]["USDT"]).toBe(opAddressList.vUSDTContractAddress);
    expect(vTokenAddressByChain[10]["ETH"]).toBe(opAddressList.vEtherContractAddress);
  });

  it("Base vToken addresses match web3Constants", () => {
    expect(vTokenAddressByChain[8453]["USDC"]).toBe(baseAddressList.vUSDCContractAddress);
    expect(vTokenAddressByChain[8453]["USDT"]).toBe(baseAddressList.vUSDTContractAddress);
    expect(vTokenAddressByChain[8453]["ETH"]).toBe(baseAddressList.vEtherContractAddress);
  });
});

// ──────────────────────────────────────────────
// 6. Contract Addresses (AccountManager, RateModel, RiskEngine, Broker)
// ──────────────────────────────────────────────

describe("Contract Addresses per Chain", () => {
  const CHAIN_IDS = [42161, 10, 8453];

  it("every chain has an AccountManager address", () => {
    for (const chainId of CHAIN_IDS) {
      expect(accountManagerAddressByChain[chainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("every chain has a RateModel address", () => {
    for (const chainId of CHAIN_IDS) {
      expect(rateModelAddressByChain[chainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("every chain has a RiskEngine address", () => {
    for (const chainId of CHAIN_IDS) {
      expect(riskEngineAddressByChain[chainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it("every chain has a Broker address", () => {
    for (const chainId of CHAIN_IDS) {
      expect(brokerAddressByChain[chainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });
});

// ──────────────────────────────────────────────
// 7. getAddressList helper
// ──────────────────────────────────────────────

describe("getAddressList", () => {
  it("returns arbAddressList for chainId 42161", () => {
    const list = getAddressList(42161);
    expect(list).toBe(arbAddressList);
  });

  it("returns opAddressList for chainId 10", () => {
    const list = getAddressList(10);
    expect(list).toBe(opAddressList);
  });

  it("returns baseAddressList for chainId 8453", () => {
    const list = getAddressList(8453);
    expect(list).toBe(baseAddressList);
  });

  it("returns null for unsupported chainId", () => {
    expect(getAddressList(999)).toBeNull();
  });

  it("returns null for undefined chainId", () => {
    expect(getAddressList(undefined)).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 8. Address List Completeness
// ──────────────────────────────────────────────

describe("Address List Completeness", () => {
  const addressLists = [
    { name: "Arbitrum", list: arbAddressList },
    { name: "Optimism", list: opAddressList },
    { name: "Base", list: baseAddressList },
  ];

  for (const { name, list } of addressLists) {
    describe(name, () => {
      it("has USDC token address", () => {
        expect(list.usdcTokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has USDT token address", () => {
        expect(list.usdtTokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has WETH token address", () => {
        expect(list.wethTokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has vUSDC contract address", () => {
        expect(list.vUSDCContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has vUSDT contract address", () => {
        expect(list.vUSDTContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has vEther contract address", () => {
        expect(list.vEtherContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has AccountManager contract address", () => {
        expect(list.accountManagerContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has Registry contract address", () => {
        expect(list.registryContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has RiskEngine contract address", () => {
        expect(list.riskEngineContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has RateModel contract address", () => {
        expect(list.rateModelContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });

      it("has Broker address", () => {
        expect(list.broker).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
  }
});

// ──────────────────────────────────────────────
// 9. No Duplicate Addresses (Security Check)
// ──────────────────────────────────────────────

describe("No Duplicate Contract Addresses (Security)", () => {
  it("vToken addresses are unique within each chain", () => {
    for (const chainId of [42161, 10, 8453]) {
      const vTokens = vTokenAddressByChain[chainId];
      const addresses = Object.values(vTokens);
      const unique = new Set(addresses.map((a) => a.toLowerCase()));
      expect(unique.size).toBe(addresses.length);
    }
  });

  it("token addresses differ from vToken addresses on same chain", () => {
    for (const chainId of [42161, 10, 8453]) {
      const tokens = tokenAddressByChain[chainId];
      const vTokens = vTokenAddressByChain[chainId];
      for (const symbol of ["USDC", "USDT"]) {
        expect(tokens[symbol]?.toLowerCase()).not.toBe(vTokens[symbol]?.toLowerCase());
      }
    }
  });
});
