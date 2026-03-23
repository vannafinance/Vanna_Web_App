/**
 * TEST SUITE: Earn Multicall (Optimized RPC Batching)
 *
 * Tests the multicall builders and parsers that batch multiple contract reads
 * into single RPC calls. This is the performance backbone of the Earn page.
 *
 * Validates:
 *  - Correct multicall contract array construction
 *  - Result parsing with error handling (allowFailure)
 *  - Rate model multicall for on-chain APY
 *  - Index calculations for multi-asset batches
 *  - User position multicall construction
 */

import { describe, it, expect } from "vitest";
import {
  EARN_TOKEN_CONFIG,
  MULTICALL_INDICES,
  buildVaultMulticallContracts,
  parseVaultMulticallResults,
  buildRateModelMulticallContracts,
  buildUserPositionMulticallContracts,
} from "@/lib/utils/earn/earnMulticall";
import { vTokenAddressByChain } from "@/lib/utils/web3/token";

const CHAIN_ID_BASE = 8453;
const CHAIN_ID_ARB = 42161;
const USER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;

// ──────────────────────────────────────────────
// 1. Token Configuration
// ──────────────────────────────────────────────

describe("EARN_TOKEN_CONFIG", () => {
  it("has 3 tokens: ETH, USDC, USDT", () => {
    expect(EARN_TOKEN_CONFIG).toHaveLength(3);
    expect(EARN_TOKEN_CONFIG.map((c) => c.asset)).toEqual(["ETH", "USDC", "USDT"]);
  });

  it("ETH uses 18 decimals", () => {
    const ethConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "ETH");
    expect(ethConfig?.decimals).toBe(18);
  });

  it("USDC and USDT use 6 decimals", () => {
    const usdcConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "USDC");
    const usdtConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "USDT");
    expect(usdcConfig?.decimals).toBe(6);
    expect(usdtConfig?.decimals).toBe(6);
  });
});

// ──────────────────────────────────────────────
// 2. Multicall Indices
// ──────────────────────────────────────────────

describe("MULTICALL_INDICES", () => {
  it("ETH indices are 0, 1, 2", () => {
    expect(MULTICALL_INDICES.ETH_TOTAL_ASSETS).toBe(0);
    expect(MULTICALL_INDICES.ETH_TOTAL_SUPPLY).toBe(1);
    expect(MULTICALL_INDICES.ETH_TOTAL_BORROWS).toBe(2);
  });

  it("USDC indices are 3, 4, 5", () => {
    expect(MULTICALL_INDICES.USDC_TOTAL_ASSETS).toBe(3);
    expect(MULTICALL_INDICES.USDC_TOTAL_SUPPLY).toBe(4);
    expect(MULTICALL_INDICES.USDC_TOTAL_BORROWS).toBe(5);
  });

  it("USDT indices are 6, 7, 8", () => {
    expect(MULTICALL_INDICES.USDT_TOTAL_ASSETS).toBe(6);
    expect(MULTICALL_INDICES.USDT_TOTAL_SUPPLY).toBe(7);
    expect(MULTICALL_INDICES.USDT_TOTAL_BORROWS).toBe(8);
  });
});

// ──────────────────────────────────────────────
// 3. buildVaultMulticallContracts
// ──────────────────────────────────────────────

describe("buildVaultMulticallContracts", () => {
  it("builds 9 contracts for 3 assets (3 calls each)", () => {
    const contracts = buildVaultMulticallContracts(CHAIN_ID_BASE);
    expect(contracts).toHaveLength(9);
  });

  it("each contract has address, abi, functionName", () => {
    const contracts = buildVaultMulticallContracts(CHAIN_ID_BASE);
    for (const contract of contracts) {
      expect(contract.address).toMatch(/^0x/);
      expect(contract.abi).toBeDefined();
      expect(contract.functionName).toBeDefined();
    }
  });

  it("function names cycle: totalAssets, totalSupply, getBorrows", () => {
    const contracts = buildVaultMulticallContracts(CHAIN_ID_BASE);
    for (let i = 0; i < contracts.length; i += 3) {
      expect(contracts[i].functionName).toBe("totalAssets");
      expect(contracts[i + 1].functionName).toBe("totalSupply");
      expect(contracts[i + 2].functionName).toBe("getBorrows");
    }
  });

  it("uses correct vToken addresses for each asset", () => {
    const contracts = buildVaultMulticallContracts(CHAIN_ID_BASE);
    const vTokens = vTokenAddressByChain[CHAIN_ID_BASE];

    // ETH contracts (indices 0-2) should use vETH address
    expect(contracts[0].address).toBe(vTokens["ETH"]);
    // USDC contracts (indices 3-5) should use vUSDC address
    expect(contracts[3].address).toBe(vTokens["USDC"]);
    // USDT contracts (indices 6-8) should use vUSDT address
    expect(contracts[6].address).toBe(vTokens["USDT"]);
  });

  it("builds only requested assets", () => {
    const contracts = buildVaultMulticallContracts(CHAIN_ID_BASE, ["ETH", "USDC"]);
    expect(contracts).toHaveLength(6); // 2 assets × 3 calls
  });

  it("returns empty array for unsupported chain", () => {
    const contracts = buildVaultMulticallContracts(999);
    expect(contracts).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// 4. parseVaultMulticallResults
// ──────────────────────────────────────────────

describe("parseVaultMulticallResults", () => {
  const mockResults = [
    // ETH: totalAssets=10 ETH, totalSupply=9.5 vETH, borrows=2 ETH
    { status: "success", result: BigInt("10000000000000000000") },  // 10 ETH
    { status: "success", result: BigInt("9500000000000000000") },   // 9.5 vETH
    { status: "success", result: BigInt("2000000000000000000") },   // 2 ETH borrows
    // USDC: totalAssets=50000, totalSupply=48000, borrows=15000
    { status: "success", result: BigInt("50000000000") },    // 50000 USDC (6 dec)
    { status: "success", result: BigInt("48000000000") },    // 48000 vUSDC
    { status: "success", result: BigInt("15000000000") },    // 15000 USDC borrows
    // USDT: totalAssets=30000, totalSupply=29000, borrows=10000
    { status: "success", result: BigInt("30000000000") },    // 30000 USDT
    { status: "success", result: BigInt("29000000000") },    // 29000 vUSDT
    { status: "success", result: BigInt("10000000000") },    // 10000 USDT borrows
  ];

  it("parses all 3 vaults successfully", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    expect(stats.ETH).not.toBeNull();
    expect(stats.USDC).not.toBeNull();
    expect(stats.USDT).not.toBeNull();
  });

  it("calculates correct formatted values for ETH", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    expect(stats.ETH!.totalAssetsFormatted).toBeCloseTo(10);
    expect(stats.ETH!.totalSupplyFormatted).toBeCloseTo(9.5);
    expect(stats.ETH!.totalBorrowsFormatted).toBeCloseTo(2);
  });

  it("calculates correct formatted values for USDC (6 decimals)", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    expect(stats.USDC!.totalAssetsFormatted).toBeCloseTo(50000);
    expect(stats.USDC!.totalBorrowsFormatted).toBeCloseTo(15000);
  });

  it("calculates utilization rate correctly", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    // ETH: 2/10 = 0.2
    expect(stats.ETH!.utilizationRate).toBeCloseTo(0.2);
    // USDC: 15000/50000 = 0.3
    expect(stats.USDC!.utilizationRate).toBeCloseTo(0.3);
  });

  it("calculates exchange rate correctly", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    // ETH: 10/9.5 ≈ 1.0526
    expect(stats.ETH!.exchangeRate).toBeCloseTo(10 / 9.5, 3);
  });

  it("calculates available liquidity correctly", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    // ETH: 10 - 2 = 8
    expect(stats.ETH!.availableLiquidity).toBeCloseTo(8);
    // USDC: 50000 - 15000 = 35000
    expect(stats.USDC!.availableLiquidity).toBeCloseTo(35000);
  });

  it("calculates supply and borrow APY", () => {
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE);
    expect(stats.ETH!.supplyAPY).toBeGreaterThanOrEqual(0);
    expect(stats.ETH!.borrowAPY).toBeGreaterThanOrEqual(0);
    expect(stats.ETH!.borrowAPY).toBeGreaterThan(stats.ETH!.supplyAPY);
  });

  it("uses on-chain rates when provided", () => {
    const onChainRates = { ETH: 1e-10, USDC: 5e-11, USDT: 3e-11 };
    const stats = parseVaultMulticallResults(mockResults, CHAIN_ID_BASE, undefined, onChainRates);
    // With on-chain rates, APY should be based on the provided rate
    expect(stats.ETH!.borrowAPY).toBeGreaterThan(0);
  });

  it("handles failed results gracefully", () => {
    const failedResults = [
      { status: "failure", error: "reverted" },
      { status: "failure", error: "reverted" },
      { status: "failure", error: "reverted" },
      ...mockResults.slice(3), // USDC and USDT still succeed
    ];
    const stats = parseVaultMulticallResults(failedResults, CHAIN_ID_BASE);
    expect(stats.ETH).toBeNull();
    expect(stats.USDC).not.toBeNull();
  });
});

// ──────────────────────────────────────────────
// 5. buildRateModelMulticallContracts
// ──────────────────────────────────────────────

describe("buildRateModelMulticallContracts", () => {
  const mockVaultResults = [
    { status: "success", result: BigInt("10000000000000000000") },
    { status: "success", result: BigInt("9500000000000000000") },
    { status: "success", result: BigInt("2000000000000000000") },
    { status: "success", result: BigInt("50000000000") },
    { status: "success", result: BigInt("48000000000") },
    { status: "success", result: BigInt("15000000000") },
    { status: "success", result: BigInt("30000000000") },
    { status: "success", result: BigInt("29000000000") },
    { status: "success", result: BigInt("10000000000") },
  ];

  it("builds rate model calls for chains with rate model", () => {
    const { contracts, orderedAssets } = buildRateModelMulticallContracts(
      CHAIN_ID_BASE,
      mockVaultResults
    );
    expect(contracts.length).toBeGreaterThan(0);
    expect(orderedAssets.length).toBe(contracts.length);
  });

  it("all calls use getBorrowRatePerSecond", () => {
    const { contracts } = buildRateModelMulticallContracts(
      CHAIN_ID_BASE,
      mockVaultResults
    );
    for (const contract of contracts) {
      expect(contract.functionName).toBe("getBorrowRatePerSecond");
    }
  });

  it("returns empty for chain without rate model", () => {
    const { contracts } = buildRateModelMulticallContracts(999, mockVaultResults);
    expect(contracts).toHaveLength(0);
  });

  it("skips assets with failed vault data", () => {
    const partialFail = [
      { status: "failure", error: "reverted" }, // ETH totalAssets failed
      { status: "success", result: BigInt("9500000000000000000") },
      { status: "failure", error: "reverted" }, // ETH borrows failed
      ...mockVaultResults.slice(3),
    ];
    const { orderedAssets } = buildRateModelMulticallContracts(CHAIN_ID_BASE, partialFail);
    expect(orderedAssets).not.toContain("ETH");
  });
});

// ──────────────────────────────────────────────
// 6. buildUserPositionMulticallContracts
// ──────────────────────────────────────────────

describe("buildUserPositionMulticallContracts", () => {
  it("builds 3 calls for 3 assets (balanceOf each)", () => {
    const contracts = buildUserPositionMulticallContracts(CHAIN_ID_BASE, USER_ADDRESS);
    expect(contracts).toHaveLength(3);
  });

  it("all calls use balanceOf with user address", () => {
    const contracts = buildUserPositionMulticallContracts(CHAIN_ID_BASE, USER_ADDRESS);
    for (const contract of contracts) {
      expect(contract.functionName).toBe("balanceOf");
      expect(contract.args[0]).toBe(USER_ADDRESS);
    }
  });

  it("builds only requested assets", () => {
    const contracts = buildUserPositionMulticallContracts(
      CHAIN_ID_BASE,
      USER_ADDRESS,
      ["ETH"]
    );
    expect(contracts).toHaveLength(1);
  });
});
