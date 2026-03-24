/**
 * INTEGRATION TEST SUITE: End-to-End Smart Contract Flows
 *
 * Tests complete user journeys combining multiple contract interactions:
 *  1. Earn Flow: Supply → Check Vault State → Withdraw
 *  2. Margin Flow: Deposit → Borrow Validation → Withdraw
 *  3. Cross-Module: Earn supply + Margin deposit in same session
 *  4. Multicall Data Consistency: Earn + Margin multicall results together
 *  5. Error Recovery: Transaction failures and retry scenarios
 *  6. Multi-Chain: Same flow across Arbitrum, Base, Optimism
 *
 * These integration tests verify:
 *  - Correct sequencing of approval → transaction → receipt → state reload
 *  - Decimal consistency across earn (ERC-4626) and margin (AccountManager)
 *  - Health factor validation before/after margin operations
 *  - Cross-chain address resolution works for all supported chains
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseUnits, formatUnits } from "viem";

// Earn utilities
import {
  supply,
  withdraw,
  getVTokenAddress,
  getTokenAddress,
} from "@/lib/utils/earn/transactions";

// Earn multicall
import {
  buildVaultMulticallContracts,
  parseVaultMulticallResults,
  EARN_TOKEN_CONFIG,
} from "@/lib/utils/earn/earnMulticall";

// Margin utilities
import marginCalc from "@/lib/utils/margin/calculations";
import {
  buildMarginAccountsMulticallContracts,
  parseMarginAccountsMulticallResults,
  buildBorrowedAssetsMulticallContracts,
  parseBorrowedAssetsMulticallResults,
} from "@/lib/utils/margin/marginMulticall";
import {
  getMarginAccount,
  depositTx,
  withdrawTx,
} from "@/lib/utils/margin/transactions";

// Token config
import {
  TOKEN_DECIMALS,
  TOKEN_OPTIONS,
  SUPPORTED_TOKENS_BY_CHAIN,
  tokenAddressByChain,
  vTokenAddressByChain,
} from "@/lib/utils/web3/token";
import { getAddressList } from "@/lib/utils/web3/addressList";

// ──────────────────────────────────────────────
// Mock margin store
// ──────────────────────────────────────────────
vi.mock("@/store/margin-account-state", () => ({
  useMarginStore: {
    getState: () => ({
      reloadMarginState: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// ──────────────────────────────────────────────
// Shared mock factories
// ──────────────────────────────────────────────

const USER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;
const MARGIN_ACCOUNT = "0xaaaa000000000000000000000000000000000001" as `0x${string}`;
const mockTxHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as `0x${string}`;

const SUPPORTED_CHAINS = [42161, 8453, 10];

const createMockWalletClient = () => ({
  account: { address: USER_ADDRESS },
  writeContract: vi.fn().mockResolvedValue(mockTxHash),
});

const createMockPublicClient = (overrides: {
  balance?: bigint;
  allowance?: bigint;
} = {}) => ({
  account: { address: USER_ADDRESS },
  readContract: vi.fn().mockImplementation(({ functionName }: any) => {
    if (functionName === "balanceOf") return Promise.resolve(overrides.balance ?? BigInt("100000000000"));
    if (functionName === "allowance") return Promise.resolve(overrides.allowance ?? BigInt("999999999999999"));
    return Promise.resolve(BigInt(0));
  }),
  waitForTransactionReceipt: vi.fn().mockResolvedValue({
    status: "success",
    transactionHash: mockTxHash,
  }),
  multicall: vi.fn().mockResolvedValue([]),
  getBalance: vi.fn().mockResolvedValue(BigInt("5000000000000000000")), // 5 ETH
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 1: Earn Supply → Vault State → Withdraw
// ══════════════════════════════════════════════

describe("Integration: Earn Vault Full Lifecycle", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
  });

  it("supply USDC → check vault state via multicall → withdraw shares", async () => {
    const chainId = 8453; // Base

    // Step 1: Supply 1000 USDC
    const supplyResult = await supply({
      walletClient,
      publicClient,
      chainId,
      asset: "USDC",
      amount: "1000",
      userAddress: USER_ADDRESS,
    });
    expect(supplyResult.success).toBe(true);

    // Step 2: Build multicall to check vault state
    const vaultContracts = buildVaultMulticallContracts(chainId);
    expect(vaultContracts.length).toBeGreaterThan(0);

    // Step 3: Parse simulated vault results (totalAssets, totalSupply, getBorrows per asset)
    // Simulate: ETH vault has 100 ETH assets, 95 shares, 50 ETH borrowed
    // USDC vault has 1M USDC assets, 950K shares, 500K borrowed
    // USDT vault has 500K USDT assets, 480K shares, 200K borrowed
    const mockVaultResults = [
      // ETH: totalAssets, totalSupply, getBorrows
      { status: "success", result: parseUnits("100", 18) },
      { status: "success", result: parseUnits("95", 18) },
      { status: "success", result: parseUnits("50", 18) },
      // USDC: totalAssets, totalSupply, getBorrows
      { status: "success", result: parseUnits("1000000", 6) },
      { status: "success", result: parseUnits("950000", 6) },
      { status: "success", result: parseUnits("500000", 6) },
      // USDT: totalAssets, totalSupply, getBorrows
      { status: "success", result: parseUnits("500000", 6) },
      { status: "success", result: parseUnits("480000", 6) },
      { status: "success", result: parseUnits("200000", 6) },
    ];

    const vaultData = parseVaultMulticallResults(mockVaultResults, chainId);
    expect(vaultData).toBeDefined();

    // Verify each asset has data
    for (const token of ["ETH", "USDC", "USDT"]) {
      expect(vaultData[token]).toBeDefined();
      expect(vaultData[token].totalAssets).toBeGreaterThan(0);
      expect(vaultData[token].totalSupply).toBeGreaterThan(0);
    }

    // Step 4: Withdraw
    const withdrawResult = await withdraw({
      walletClient,
      publicClient,
      chainId,
      asset: "USDC",
      shares: "500",
      userAddress: USER_ADDRESS,
    });
    expect(withdrawResult.success).toBe(true);
  });

  it("supply ETH → withdraw ETH (native flow)", async () => {
    const chainId = 42161; // Arbitrum

    // Supply
    const supplyResult = await supply({
      walletClient,
      publicClient,
      chainId,
      asset: "ETH",
      amount: "2.5",
      userAddress: USER_ADDRESS,
    });
    expect(supplyResult.success).toBe(true);

    // Verify depositEth was called
    const supplyCall = walletClient.writeContract.mock.calls[0][0];
    expect(supplyCall.functionName).toBe("depositEth");
    expect(supplyCall.value).toBe(parseUnits("2.5", 18));

    // Withdraw
    walletClient.writeContract.mockClear();
    const withdrawResult = await withdraw({
      walletClient,
      publicClient,
      chainId,
      asset: "ETH",
      shares: "1.0",
      userAddress: USER_ADDRESS,
    });
    expect(withdrawResult.success).toBe(true);

    const withdrawCall = walletClient.writeContract.mock.calls[0][0];
    expect(withdrawCall.functionName).toBe("redeemEth");
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 2: Margin Deposit → Validate → Withdraw
// ══════════════════════════════════════════════

describe("Integration: Margin Account Full Lifecycle", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;
  const fetchAccountCheck = vi.fn().mockResolvedValue([MARGIN_ACCOUNT]);

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
    fetchAccountCheck.mockClear();
  });

  it("deposit USDC → check health factor → validate borrow → withdraw", async () => {
    const chainId = 42161;

    // Step 1: Deposit 5000 USDC as collateral
    const depositHash = await depositTx({
      walletClient,
      publicClient,
      chainId,
      fetchAccountCheck,
      asset: "USDC",
      amount: "5000",
    });
    expect(depositHash).toBe(mockTxHash);

    // Step 2: Simulate current margin state from multicall
    // Collateral = $5000, Borrows = $2000
    const collateralUsd = 5000;
    const borrowUsd = 2000;

    // Step 3: Check health factor
    const hf = marginCalc.calcHF(collateralUsd, borrowUsd);
    expect(hf).toBeCloseTo(2.25, 2); // (5000 * 0.9) / 2000

    const status = marginCalc.getHFStatus(hf);
    expect(status).toBe("safe");

    // Step 4: Validate additional borrow of $1000
    const borrowValidation = marginCalc.validateBorrow(collateralUsd, borrowUsd, 1000);
    expect(borrowValidation.valid).toBe(true);

    // Step 5: Validate borrow that would exceed LTV
    const badBorrow = marginCalc.validateBorrow(collateralUsd, borrowUsd, 3000);
    expect(badBorrow.valid).toBe(false);

    // Step 6: Withdraw some collateral
    walletClient.writeContract.mockClear();
    const withdrawHash = await withdrawTx({
      walletClient,
      publicClient,
      chainId,
      fetchAccountCheck,
      asset: "USDC",
      amount: "1000",
    });
    expect(withdrawHash).toBe(mockTxHash);
  });

  it("deposit → simulate position → validate withdrawal safety", async () => {
    const chainId = 8453;

    // Deposit
    await depositTx({
      walletClient,
      publicClient,
      chainId,
      fetchAccountCheck,
      asset: "USDT",
      amount: "3000",
    });

    // Current state: $3000 collateral, $1500 debt
    const currentColl = 3000;
    const currentDebt = 1500;

    // Simulate withdrawing $500
    const sim = marginCalc.simulatePosition(currentColl, currentDebt, 0, 0, 500);
    expect(sim.newHF).toBeCloseTo((2500 * 0.9) / 1500, 2);
    expect(sim.isLiquidatable).toBe(false);
    expect(sim.hfStatus).toBe("safe");

    // Validate the withdrawal
    const validation = marginCalc.validateWithdraw(currentColl, currentDebt, 500);
    expect(validation.valid).toBe(true);

    // Simulate dangerous withdrawal
    const dangerousSim = marginCalc.simulatePosition(currentColl, currentDebt, 0, 0, 1500);
    expect(dangerousSim.isLiquidatable).toBe(true);
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 3: Cross-Module (Earn + Margin)
// ══════════════════════════════════════════════

describe("Integration: Earn + Margin Combined Session", () => {
  it("user supplies to earn vault AND deposits to margin in same session", async () => {
    const chainId = 42161;
    const walletClient = createMockWalletClient();
    const publicClient = createMockPublicClient();
    const fetchAccountCheck = vi.fn().mockResolvedValue([MARGIN_ACCOUNT]);

    // Action 1: Supply 500 USDC to earn vault
    const earnResult = await supply({
      walletClient,
      publicClient,
      chainId,
      asset: "USDC",
      amount: "500",
      userAddress: USER_ADDRESS,
    });
    expect(earnResult.success).toBe(true);

    // Action 2: Deposit 1000 USDC to margin account
    walletClient.writeContract.mockClear();
    const marginResult = await depositTx({
      walletClient,
      publicClient,
      chainId,
      fetchAccountCheck,
      asset: "USDC",
      amount: "1000",
    });
    expect(marginResult).toBe(mockTxHash);

    // Both operations used the same chainId's token address
    const earnTokenAddr = getTokenAddress(chainId, "USDC");
    const marginTokenAddr = tokenAddressByChain[chainId]?.["USDC"];
    expect(earnTokenAddr.toLowerCase()).toBe(marginTokenAddr?.toLowerCase());
  });

  it("earn vault vToken addresses match margin vToken addresses", () => {
    for (const chainId of SUPPORTED_CHAINS) {
      for (const token of ["ETH", "USDC", "USDT"]) {
        const earnVToken = getVTokenAddress(chainId, token);
        const marginVToken = vTokenAddressByChain[chainId]?.[token];
        expect(earnVToken.toLowerCase()).toBe(marginVToken?.toLowerCase());
      }
    }
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 4: Multicall Data Consistency
// ══════════════════════════════════════════════

describe("Integration: Multicall Data Consistency", () => {
  it("earn and margin multicall use correct addresses per chain", () => {
    for (const chainId of SUPPORTED_CHAINS) {
      // Earn vault multicall
      const earnContracts = buildVaultMulticallContracts(chainId);
      expect(earnContracts.length).toBe(9); // 3 assets × 3 calls

      // Margin account multicall
      const marginContracts = buildMarginAccountsMulticallContracts(chainId, [
        MARGIN_ACCOUNT,
      ]);
      expect(marginContracts.length).toBe(2); // 1 account × 2 calls

      // All addresses should be valid hex
      for (const c of [...earnContracts, ...marginContracts]) {
        expect(c.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    }
  });

  it("parsing earn results + margin results gives consistent token decimals", () => {
    // EARN_TOKEN_CONFIG is an array — find each asset by name
    const ethConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "ETH");
    const usdcConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "USDC");
    const usdtConfig = EARN_TOKEN_CONFIG.find((c) => c.asset === "USDT");

    expect(ethConfig!.decimals).toBe(TOKEN_DECIMALS["ETH"]);
    expect(usdcConfig!.decimals).toBe(TOKEN_DECIMALS["USDC"]);
    expect(usdtConfig!.decimals).toBe(TOKEN_DECIMALS["USDT"]);
  });

  it("margin multicall results feed into health factor calculation correctly", () => {
    // Simulate multicall returning $10K collateral, $5K borrows
    const results = [
      { status: "success", result: BigInt("10000000000000000000000") }, // $10K
      { status: "success", result: BigInt("5000000000000000000000") },  // $5K
    ];

    const accounts = parseMarginAccountsMulticallResults(results, [MARGIN_ACCOUNT]);
    expect(accounts).toHaveLength(1);

    // marginCalc.calcHF applies collateral factor (0.9), multicall parser uses raw ratio
    // These are intentionally different: calcHF is for risk assessment, parser HF is raw
    const calcHF = marginCalc.calcHF(accounts[0].collateralUsd, accounts[0].borrowUsd);
    expect(calcHF).toBeCloseTo(1.8, 2); // (10000 * 0.9) / 5000

    // HF from multicall parse uses raw collateral/borrow ratio (no collateral factor)
    const rawHF = accounts[0].collateralUsd / accounts[0].borrowUsd;
    expect(accounts[0].healthFactor).toBeCloseTo(rawHF, 5); // 10000/5000 = 2.0
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 5: Error Recovery
// ══════════════════════════════════════════════

describe("Integration: Error Recovery Scenarios", () => {
  it("earn supply fails → user retries → succeeds", async () => {
    const walletClient = createMockWalletClient();
    const publicClient = createMockPublicClient();
    const chainId = 8453;

    // First attempt: fails
    walletClient.writeContract.mockRejectedValueOnce(new Error("network error"));

    const result1 = await supply({
      walletClient,
      publicClient,
      chainId,
      asset: "USDC",
      amount: "100",
      userAddress: USER_ADDRESS,
    });
    expect(result1.success).toBe(false);

    // Second attempt: succeeds
    const result2 = await supply({
      walletClient,
      publicClient,
      chainId,
      asset: "USDC",
      amount: "100",
      userAddress: USER_ADDRESS,
    });
    expect(result2.success).toBe(true);
  });

  it("margin deposit approval fails → does not proceed to deposit", async () => {
    const walletClient = createMockWalletClient();
    const publicClient = createMockPublicClient({
      balance: BigInt("1000000000"),
      allowance: BigInt(0), // needs approval
    });
    const fetchAccountCheck = vi.fn().mockResolvedValue([MARGIN_ACCOUNT]);

    // Approval will fail
    walletClient.writeContract.mockRejectedValueOnce(
      Object.assign(new Error("User rejected"), { code: 4001 })
    );

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: 42161,
        fetchAccountCheck,
        asset: "USDC",
        amount: "100",
      })
    ).rejects.toThrow("Transaction cancelled");

    // writeContract was called once (approve attempt), not twice
    expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
  });

  it("handles multicall partial failures gracefully", () => {
    // Account 1: success, Account 2: failure
    const results = [
      { status: "success", result: BigInt("3000000000000000000000") },
      { status: "success", result: BigInt("1000000000000000000000") },
      { status: "failure", result: null },
      { status: "failure", result: null },
    ];

    const accounts = parseMarginAccountsMulticallResults(results, [
      "0x1111111111111111111111111111111111111111" as `0x${string}`,
      "0x2222222222222222222222222222222222222222" as `0x${string}`,
    ]);

    // Only successful account should be parsed
    expect(accounts).toHaveLength(1);
    expect(accounts[0].collateralUsd).toBeCloseTo(3000, 0);
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 6: Multi-Chain Consistency
// ══════════════════════════════════════════════

describe("Integration: Multi-Chain Support", () => {
  it("all supported chains have complete address configs", () => {
    for (const chainId of SUPPORTED_CHAINS) {
      // Address list exists
      const addresses = getAddressList(chainId);
      expect(addresses).not.toBeNull();
      expect(addresses!.accountManagerContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addresses!.riskEngineContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addresses!.registryContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addresses!.rateModelContractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Token addresses exist for all supported tokens
      const supportedTokens = SUPPORTED_TOKENS_BY_CHAIN[chainId];
      expect(supportedTokens).toBeDefined();
      expect(supportedTokens.length).toBeGreaterThanOrEqual(2);

      // vToken addresses exist
      for (const token of supportedTokens) {
        const vToken = vTokenAddressByChain[chainId]?.[token];
        expect(vToken).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    }
  });

  it("earn supply works across all chains", async () => {
    for (const chainId of SUPPORTED_CHAINS) {
      const walletClient = createMockWalletClient();
      const publicClient = createMockPublicClient();

      const result = await supply({
        walletClient,
        publicClient,
        chainId,
        asset: "USDC",
        amount: "100",
        userAddress: USER_ADDRESS,
      });

      expect(result.success).toBe(true);
    }
  });

  it("margin multicall works across all chains", () => {
    for (const chainId of SUPPORTED_CHAINS) {
      const contracts = buildMarginAccountsMulticallContracts(chainId, [MARGIN_ACCOUNT]);
      expect(contracts).toHaveLength(2);
      expect(contracts[0].functionName).toBe("getBalance");
      expect(contracts[1].functionName).toBe("getBorrows");
    }
  });

  it("token decimals are consistent across all chains", () => {
    // ETH is always 18 decimals, USDC/USDT always 6
    for (const chainId of SUPPORTED_CHAINS) {
      const supported = SUPPORTED_TOKENS_BY_CHAIN[chainId];
      for (const token of supported) {
        const expectedDecimals = token === "ETH" ? 18 : 6;
        expect(TOKEN_DECIMALS[token]).toBe(expectedDecimals);
      }
    }
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 7: Decimal Precision Across Modules
// ══════════════════════════════════════════════

describe("Integration: Decimal Precision", () => {
  it("USDC amounts parse identically in earn and margin (6 decimals)", () => {
    const amount = "1000.50";
    const parsed = parseUnits(amount, TOKEN_DECIMALS["USDC"]);
    expect(parsed).toBe(BigInt("1000500000")); // 1000.50 * 10^6

    // Roundtrip
    const formatted = formatUnits(parsed, TOKEN_DECIMALS["USDC"]);
    expect(formatted).toBe("1000.5");
  });

  it("ETH amounts parse with 18 decimals", () => {
    const amount = "2.5";
    const parsed = parseUnits(amount, TOKEN_DECIMALS["ETH"]);
    expect(parsed).toBe(BigInt("2500000000000000000"));
  });

  it("large USDC amount does not lose precision", () => {
    const amount = "999999.999999"; // max 6 decimal places for USDC
    const parsed = parseUnits(amount, 6);
    const formatted = formatUnits(parsed, 6);
    expect(formatted).toBe("999999.999999");
  });

  it("margin health factor precision: very close to 1.0", () => {
    // $1111.11 collateral, $1000 debt → HF = (1111.11 * 0.9) / 1000 = 0.99999
    const hf = marginCalc.calcHF(1111.12, 1000);
    expect(hf).toBeCloseTo(1.0, 2);

    // Just barely safe
    const hf2 = marginCalc.calcHF(1112, 1000);
    expect(hf2).toBeGreaterThan(1.0);
    expect(marginCalc.getHFStatus(hf2)).not.toBe("liquidatable");
  });
});

// ══════════════════════════════════════════════
// INTEGRATION TEST 8: Position Lifecycle Simulation
// ══════════════════════════════════════════════

describe("Integration: Complete Position Lifecycle", () => {
  it("simulates full margin position lifecycle", () => {
    // Step 1: Initial deposit of $5000
    let coll = 5000;
    let debt = 0;

    // Step 2: Borrow $2000
    const borrow1 = marginCalc.validateBorrow(coll, debt, 2000);
    expect(borrow1.valid).toBe(true);
    debt += 2000;

    // Step 3: Check position health
    let hf = marginCalc.calcHF(coll, debt);
    expect(hf).toBeCloseTo(2.25, 2);
    expect(marginCalc.getHFStatus(hf)).toBe("safe");

    // Step 4: Borrow more ($1500)
    const borrow2 = marginCalc.validateBorrow(coll, debt, 1500);
    expect(borrow2.valid).toBe(true);
    debt += 1500;

    // Step 5: Check updated health
    hf = marginCalc.calcHF(coll, debt);
    expect(hf).toBeCloseTo((5000 * 0.9) / 3500, 2);
    expect(marginCalc.getHFStatus(hf)).toBe("warning"); // ~1.286

    // Step 6: Try to borrow too much
    const badBorrow = marginCalc.validateBorrow(coll, debt, 2000);
    expect(badBorrow.valid).toBe(false);

    // Step 7: Deposit more collateral ($3000)
    const sim = marginCalc.simulatePosition(coll, debt, 3000, 0);
    expect(sim.hfStatus).toBe("safe");
    coll += 3000;

    // Step 8: Repay $1000
    debt -= 1000;
    hf = marginCalc.calcHF(coll, debt);
    expect(marginCalc.getHFStatus(hf)).toBe("safe");

    // Step 9: Withdraw near-max (maxWithdraw puts HF exactly at 1.0 which is liquidatable boundary)
    const maxW = marginCalc.calcMaxWithdraw(coll, debt);
    expect(maxW).toBeGreaterThan(0);

    // Withdraw slightly less than max to stay above HF=1.0
    const safeWithdraw = maxW * 0.99;
    const withdrawValidation = marginCalc.validateWithdraw(coll, debt, safeWithdraw);
    expect(withdrawValidation.valid).toBe(true);

    // Step 10: Full repay and withdraw
    debt = 0;
    const fullWithdraw = marginCalc.calcMaxWithdraw(coll, debt);
    expect(fullWithdraw).toBe(coll); // Can withdraw everything
  });

  it("tracks leverage through position changes", () => {
    const coll = 10000;
    let debt = 0;

    // No debt → 1x leverage
    expect(marginCalc.calcLeverage(coll, debt)).toBeCloseTo(1, 5);

    // Borrow $5000 → 2x leverage
    debt = 5000;
    expect(marginCalc.calcLeverage(coll, debt)).toBeCloseTo(2, 5);

    // Borrow more to $8000 → 5x leverage
    debt = 8000;
    expect(marginCalc.calcLeverage(coll, debt)).toBeCloseTo(5, 5);

    // LTV-based leverage should match
    const ltv = marginCalc.calcLTV(coll, debt);
    const ltvLeverage = marginCalc.calcLeverageFromLTV(ltv);
    expect(ltvLeverage).toBeCloseTo(5, 5);
  });
});
