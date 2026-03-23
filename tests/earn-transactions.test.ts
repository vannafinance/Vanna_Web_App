/**
 * TEST SUITE: Earn Vault Transactions (Supply & Withdraw)
 *
 * Tests the transaction logic for supplying/withdrawing from ERC-4626 vaults.
 * Uses mocked walletClient/publicClient to verify:
 *  - Correct contract calls (addresses, ABIs, function names, args)
 *  - ERC-20 approval flow (check allowance → approve if needed → deposit)
 *  - ETH native deposit flow (depositEth with value)
 *  - Withdraw/redeem flow for both ETH and ERC-20
 *  - Error handling and result structure
 *
 * These tests are critical for auditing to ensure:
 *  - Approval is requested before deposit (prevents reverts)
 *  - Correct decimal handling (6 for USDC/USDT, 18 for ETH)
 *  - Transaction receipts are awaited before returning success
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVTokenAddress,
  getTokenAddress,
  supplyEth,
  supplyToken,
  withdrawEth,
  withdrawToken,
  supply,
  withdraw,
} from "@/lib/utils/earn/transactions";

// ──────────────────────────────────────────────
// Mock clients
// ──────────────────────────────────────────────

const mockTxHash = "0xabc123" as `0x${string}`;
const mockReceipt = { status: "success", transactionHash: mockTxHash };

const createMockWalletClient = () => ({
  writeContract: vi.fn().mockResolvedValue(mockTxHash),
});

const createMockPublicClient = (allowance: bigint = BigInt(0)) => ({
  readContract: vi.fn().mockResolvedValue(allowance),
  waitForTransactionReceipt: vi.fn().mockResolvedValue(mockReceipt),
});

const USER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;
const CHAIN_ID_BASE = 8453;
const CHAIN_ID_ARB = 42161;

// ──────────────────────────────────────────────
// 1. Address Helpers
// ──────────────────────────────────────────────

describe("getVTokenAddress", () => {
  it("returns vETH address for Base", () => {
    const addr = getVTokenAddress(CHAIN_ID_BASE, "ETH");
    expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns vUSDC address for Arbitrum", () => {
    const addr = getVTokenAddress(CHAIN_ID_ARB, "USDC");
    expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("throws for unsupported chain", () => {
    expect(() => getVTokenAddress(999, "ETH")).toThrow("vToken address not found");
  });
});

describe("getTokenAddress", () => {
  it("returns USDC address for Base", () => {
    const addr = getTokenAddress(CHAIN_ID_BASE, "USDC");
    expect(addr).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("throws for unsupported chain", () => {
    expect(() => getTokenAddress(999, "USDC")).toThrow("Token address not found");
  });
});

// ──────────────────────────────────────────────
// 2. Supply ETH
// ──────────────────────────────────────────────

describe("supplyEth", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
  });

  it("calls depositEth with correct value", async () => {
    const result = await supplyEth({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      amount: "1.5",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);
    expect(result.txHash).toBe(mockTxHash);
    expect(walletClient.writeContract).toHaveBeenCalledOnce();

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("depositEth");
    expect(call.value).toBeDefined();
    // 1.5 ETH = 1500000000000000000n
    expect(call.value).toBe(1500000000000000000n);
  });

  it("waits for transaction receipt", async () => {
    await supplyEth({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      amount: "1",
      userAddress: USER_ADDRESS,
    });

    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockTxHash,
    });
  });

  it("returns error on failure", async () => {
    walletClient.writeContract.mockRejectedValueOnce(new Error("User rejected"));

    const result = await supplyEth({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      amount: "1",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("User rejected");
  });
});

// ──────────────────────────────────────────────
// 3. Supply Token (USDC/USDT)
// ──────────────────────────────────────────────

describe("supplyToken", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
  });

  it("approves then deposits when allowance is insufficient", async () => {
    publicClient = createMockPublicClient(BigInt(0)); // zero allowance

    const result = await supplyToken({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDC",
      amount: "1000",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);

    // Should have called writeContract twice: approve + deposit
    expect(walletClient.writeContract).toHaveBeenCalledTimes(2);

    // First call should be approve
    const approveCall = walletClient.writeContract.mock.calls[0][0];
    expect(approveCall.functionName).toBe("approve");

    // Second call should be deposit
    const depositCall = walletClient.writeContract.mock.calls[1][0];
    expect(depositCall.functionName).toBe("deposit");
    expect(depositCall.args[1]).toBe(USER_ADDRESS); // receiver
  });

  it("skips approval when allowance is sufficient", async () => {
    // Set allowance to max
    publicClient = createMockPublicClient(BigInt("999999999999999999999"));

    const result = await supplyToken({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDC",
      amount: "100",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);

    // Should have called writeContract only once (deposit, no approve)
    expect(walletClient.writeContract).toHaveBeenCalledOnce();
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("deposit");
  });

  it("parses USDC amount with 6 decimals correctly", async () => {
    publicClient = createMockPublicClient(BigInt("999999999999999999999"));

    await supplyToken({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDC",
      amount: "1000",
      userAddress: USER_ADDRESS,
    });

    const depositCall = walletClient.writeContract.mock.calls[0][0];
    // 1000 USDC = 1000 * 10^6 = 1000000000n
    expect(depositCall.args[0]).toBe(1000000000n);
  });

  it("returns error on failure", async () => {
    publicClient = createMockPublicClient(BigInt("999999999999999999999"));
    walletClient.writeContract.mockRejectedValueOnce(new Error("Tx failed"));

    const result = await supplyToken({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDT",
      amount: "500",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tx failed");
  });
});

// ──────────────────────────────────────────────
// 4. Withdraw ETH
// ──────────────────────────────────────────────

describe("withdrawEth", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
  });

  it("calls redeemEth with correct shares", async () => {
    const result = await withdrawEth({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      shares: "0.5",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("redeemEth");
    // 0.5 shares = 500000000000000000n (18 decimals)
    expect(call.args[0]).toBe(500000000000000000n);
  });

  it("returns error on failure", async () => {
    walletClient.writeContract.mockRejectedValueOnce(new Error("Insufficient shares"));

    const result = await withdrawEth({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      shares: "100",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient shares");
  });
});

// ──────────────────────────────────────────────
// 5. Withdraw Token (USDC/USDT)
// ──────────────────────────────────────────────

describe("withdrawToken", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
  });

  it("calls redeem with correct args (shares, receiver, owner)", async () => {
    const result = await withdrawToken({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      asset: "USDC",
      shares: "500",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("redeem");
    expect(call.args[1]).toBe(USER_ADDRESS); // receiver
    expect(call.args[2]).toBe(USER_ADDRESS); // owner
  });
});

// ──────────────────────────────────────────────
// 6. Unified supply() / withdraw()
// ──────────────────────────────────────────────

describe("Unified supply()", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient(BigInt("999999999999999999999"));
  });

  it("routes ETH to supplyEth", async () => {
    const result = await supply({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "ETH",
      amount: "1",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("depositEth");
  });

  it("routes USDC to supplyToken", async () => {
    const result = await supply({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDC",
      amount: "500",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("deposit");
  });
});

describe("Unified withdraw()", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
  });

  it("routes ETH to withdrawEth", async () => {
    const result = await withdraw({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "ETH",
      shares: "1",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("redeemEth");
  });

  it("routes USDT to withdrawToken", async () => {
    const result = await withdraw({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      asset: "USDT",
      shares: "100",
      userAddress: USER_ADDRESS,
    });

    expect(result.success).toBe(true);
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("redeem");
  });
});
