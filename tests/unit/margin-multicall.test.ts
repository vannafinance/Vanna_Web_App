/**
 * TEST SUITE: Margin Account Multicall (Build & Parse)
 *
 * Tests the multicall batching for margin account data:
 *  - Building multicall contracts for account stats (collateral + borrows)
 *  - Building multicall contracts for borrowed asset metadata
 *  - Parsing multicall results with dust threshold and health factor
 *  - Index generation for dynamic account counts
 *  - Error handling for failed multicall results
 *
 * These tests are critical for auditing to ensure:
 *  - Correct contract addresses are used per chain
 *  - RiskEngine getBalance/getBorrows calls are properly structured
 *  - Dust threshold prevents false-positive positions ($0.01)
 *  - Health factor calculation matches collateral/borrow ratio
 */

import { describe, it, expect } from "vitest";
import {
  buildMarginAccountIndices,
  buildMarginAccountsMulticallContracts,
  buildBorrowedAssetsMulticallContracts,
  parseMarginAccountsMulticallResults,
  parseBorrowedAssetsMulticallResults,
} from "@/lib/utils/margin/marginMulticall";

// Test addresses
const ACCOUNT_1 = "0x1111111111111111111111111111111111111111" as `0x${string}`;
const ACCOUNT_2 = "0x2222222222222222222222222222222222222222" as `0x${string}`;
const ACCOUNT_3 = "0x3333333333333333333333333333333333333333" as `0x${string}`;
const TOKEN_ADDR_1 = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as `0x${string}`;
const TOKEN_ADDR_2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as `0x${string}`;

const CHAIN_ID_ARB = 42161;
const CHAIN_ID_BASE = 8453;
const CHAIN_ID_OP = 10;

// ──────────────────────────────────────────────
// 1. Multicall Indices
// ──────────────────────────────────────────────

describe("buildMarginAccountIndices", () => {
  it("generates correct indices for 1 account", () => {
    const indices = buildMarginAccountIndices(1);
    expect(indices["ACCOUNT_0_COLLATERAL"]).toBe(0);
    expect(indices["ACCOUNT_0_BORROWS"]).toBe(1);
  });

  it("generates correct indices for 3 accounts", () => {
    const indices = buildMarginAccountIndices(3);
    expect(indices["ACCOUNT_0_COLLATERAL"]).toBe(0);
    expect(indices["ACCOUNT_0_BORROWS"]).toBe(1);
    expect(indices["ACCOUNT_1_COLLATERAL"]).toBe(2);
    expect(indices["ACCOUNT_1_BORROWS"]).toBe(3);
    expect(indices["ACCOUNT_2_COLLATERAL"]).toBe(4);
    expect(indices["ACCOUNT_2_BORROWS"]).toBe(5);
  });

  it("returns empty object for 0 accounts", () => {
    const indices = buildMarginAccountIndices(0);
    expect(Object.keys(indices)).toHaveLength(0);
  });

  it("each account uses 2 indices (collateral + borrows)", () => {
    const count = 5;
    const indices = buildMarginAccountIndices(count);
    expect(Object.keys(indices)).toHaveLength(count * 2);
  });
});

// ──────────────────────────────────────────────
// 2. Build Margin Accounts Multicall Contracts
// ──────────────────────────────────────────────

describe("buildMarginAccountsMulticallContracts", () => {
  it("builds 2 contracts per account (getBalance + getBorrows)", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, [ACCOUNT_1]);
    expect(contracts).toHaveLength(2);
  });

  it("builds 6 contracts for 3 accounts", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, [
      ACCOUNT_1,
      ACCOUNT_2,
      ACCOUNT_3,
    ]);
    expect(contracts).toHaveLength(6);
  });

  it("first contract is getBalance (collateral), second is getBorrows", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_BASE, [ACCOUNT_1]);
    expect(contracts[0].functionName).toBe("getBalance");
    expect(contracts[0].args).toEqual([ACCOUNT_1]);
    expect(contracts[1].functionName).toBe("getBorrows");
    expect(contracts[1].args).toEqual([ACCOUNT_1]);
  });

  it("uses RiskEngine address from chain config", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, [ACCOUNT_1]);
    // All contracts should use the same RiskEngine address
    const riskEngineAddr = contracts[0].address;
    expect(riskEngineAddr).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(contracts[1].address).toBe(riskEngineAddr);
  });

  it("returns empty array for unsupported chain", () => {
    const contracts = buildMarginAccountsMulticallContracts(999, [ACCOUNT_1]);
    expect(contracts).toEqual([]);
  });

  it("returns empty array for empty accounts", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, []);
    expect(contracts).toHaveLength(0);
  });

  it("works for all supported chains", () => {
    for (const chainId of [CHAIN_ID_ARB, CHAIN_ID_BASE, CHAIN_ID_OP]) {
      const contracts = buildMarginAccountsMulticallContracts(chainId, [ACCOUNT_1]);
      expect(contracts).toHaveLength(2);
      expect(contracts[0].address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });
});

// ──────────────────────────────────────────────
// 3. Build Borrowed Assets Multicall Contracts
// ──────────────────────────────────────────────

describe("buildBorrowedAssetsMulticallContracts", () => {
  it("builds 2 contracts per token (symbol + decimals)", () => {
    const contracts = buildBorrowedAssetsMulticallContracts([TOKEN_ADDR_1]);
    expect(contracts).toHaveLength(2);
  });

  it("builds 4 contracts for 2 tokens", () => {
    const contracts = buildBorrowedAssetsMulticallContracts([TOKEN_ADDR_1, TOKEN_ADDR_2]);
    expect(contracts).toHaveLength(4);
  });

  it("first contract fetches symbol, second fetches decimals", () => {
    const contracts = buildBorrowedAssetsMulticallContracts([TOKEN_ADDR_1]);
    expect(contracts[0].functionName).toBe("symbol");
    expect(contracts[0].address).toBe(TOKEN_ADDR_1);
    expect(contracts[1].functionName).toBe("decimals");
    expect(contracts[1].address).toBe(TOKEN_ADDR_1);
  });

  it("uses ERC-20 ABI", () => {
    const contracts = buildBorrowedAssetsMulticallContracts([TOKEN_ADDR_1]);
    // Should use erc20Abi which has symbol and decimals
    expect(contracts[0].abi).toBeDefined();
    expect(contracts[1].abi).toBeDefined();
  });

  it("returns empty for no addresses", () => {
    const contracts = buildBorrowedAssetsMulticallContracts([]);
    expect(contracts).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// 4. Parse Margin Accounts Multicall Results
// ──────────────────────────────────────────────

describe("parseMarginAccountsMulticallResults", () => {
  it("parses successful results with correct USD values", () => {
    const results = [
      { status: "success", result: BigInt("5000000000000000000000") }, // $5000 collateral (18 decimals)
      { status: "success", result: BigInt("2000000000000000000000") }, // $2000 borrows
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].accountAddress).toBe(ACCOUNT_1);
    expect(parsed[0].collateralUsd).toBeCloseTo(5000, 0);
    expect(parsed[0].borrowUsd).toBeCloseTo(2000, 0);
  });

  it("calculates health factor as collateral / borrow", () => {
    const results = [
      { status: "success", result: BigInt("4000000000000000000000") }, // $4000
      { status: "success", result: BigInt("2000000000000000000000") }, // $2000
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1]);
    expect(parsed[0].healthFactor).toBeCloseTo(2.0, 5);
  });

  it("returns Infinity health factor when no borrows", () => {
    const results = [
      { status: "success", result: BigInt("1000000000000000000000") }, // $1000
      { status: "success", result: BigInt(0) },                        // $0 borrows
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1]);
    expect(parsed[0].healthFactor).toBe(Infinity);
  });

  it("applies dust threshold ($0.01) - zeroes out tiny values", () => {
    const results = [
      { status: "success", result: BigInt("5000000000000000") },  // $0.005 (below dust)
      { status: "success", result: BigInt("3000000000000000") },  // $0.003 (below dust)
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1]);
    expect(parsed[0].collateralUsd).toBe(0);
    expect(parsed[0].borrowUsd).toBe(0);
  });

  it("skips accounts with failed results", () => {
    const results = [
      { status: "failure", result: null },
      { status: "failure", result: null },
      { status: "success", result: BigInt("1000000000000000000000") },
      { status: "success", result: BigInt("500000000000000000000") },
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1, ACCOUNT_2]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].accountAddress).toBe(ACCOUNT_2);
  });

  it("parses multiple accounts correctly", () => {
    const results = [
      { status: "success", result: BigInt("10000000000000000000000") }, // Account 1: $10K coll
      { status: "success", result: BigInt("5000000000000000000000") },  // Account 1: $5K borrows
      { status: "success", result: BigInt("3000000000000000000000") },  // Account 2: $3K coll
      { status: "success", result: BigInt("1000000000000000000000") },  // Account 2: $1K borrows
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1, ACCOUNT_2]);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].collateralUsd).toBeCloseTo(10000, 0);
    expect(parsed[0].borrowUsd).toBeCloseTo(5000, 0);
    expect(parsed[1].collateralUsd).toBeCloseTo(3000, 0);
    expect(parsed[1].borrowUsd).toBeCloseTo(1000, 0);
  });

  it("initializes borrowedAssets as empty array", () => {
    const results = [
      { status: "success", result: BigInt("1000000000000000000000") },
      { status: "success", result: BigInt("500000000000000000000") },
    ];

    const parsed = parseMarginAccountsMulticallResults(results, [ACCOUNT_1]);
    expect(parsed[0].borrowedAssets).toEqual([]);
  });
});

// ──────────────────────────────────────────────
// 5. Parse Borrowed Assets Multicall Results
// ──────────────────────────────────────────────

describe("parseBorrowedAssetsMulticallResults", () => {
  it("parses symbol and decimals correctly", () => {
    const results = [
      { status: "success", result: "USDC" },
      { status: "success", result: 6 },
      { status: "success", result: "WETH" },
      { status: "success", result: 18 },
    ];

    const assets = parseBorrowedAssetsMulticallResults(results, [TOKEN_ADDR_1, TOKEN_ADDR_2]);
    expect(assets).toHaveLength(2);
    expect(assets[0].symbol).toBe("USDC");
    expect(assets[0].decimals).toBe(6);
    expect(assets[0].address).toBe(TOKEN_ADDR_1);
    expect(assets[1].symbol).toBe("WETH");
    expect(assets[1].decimals).toBe(18);
    expect(assets[1].address).toBe(TOKEN_ADDR_2);
  });

  it("skips tokens with failed results", () => {
    const results = [
      { status: "failure", result: null },  // symbol failed
      { status: "success", result: 6 },      // decimals ok but symbol failed
      { status: "success", result: "USDT" },
      { status: "success", result: 6 },
    ];

    const assets = parseBorrowedAssetsMulticallResults(results, [TOKEN_ADDR_1, TOKEN_ADDR_2]);
    expect(assets).toHaveLength(1);
    expect(assets[0].symbol).toBe("USDT");
  });

  it("handles empty results", () => {
    const assets = parseBorrowedAssetsMulticallResults([], []);
    expect(assets).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// 6. Contract Address Validation
// ──────────────────────────────────────────────

describe("Contract Address Consistency", () => {
  it("uses same RiskEngine address for all calls on same chain", () => {
    const contracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, [
      ACCOUNT_1,
      ACCOUNT_2,
    ]);
    const addresses = contracts.map((c) => c.address);
    const unique = new Set(addresses);
    expect(unique.size).toBe(1); // All calls go to same RiskEngine
  });

  it("different chains use different RiskEngine addresses", () => {
    const arbContracts = buildMarginAccountsMulticallContracts(CHAIN_ID_ARB, [ACCOUNT_1]);
    const baseContracts = buildMarginAccountsMulticallContracts(CHAIN_ID_BASE, [ACCOUNT_1]);
    const opContracts = buildMarginAccountsMulticallContracts(CHAIN_ID_OP, [ACCOUNT_1]);

    const addresses = new Set([
      arbContracts[0].address,
      baseContracts[0].address,
      opContracts[0].address,
    ]);
    expect(addresses.size).toBe(3); // Each chain has unique RiskEngine
  });
});
