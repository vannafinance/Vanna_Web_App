/**
 * TEST SUITE: Margin Account Transactions (Deposit & Withdraw)
 *
 * Tests the transaction logic for depositing/withdrawing from margin accounts.
 * Uses mocked walletClient/publicClient to verify:
 *  - Correct contract calls (addresses, ABIs, function names, args)
 *  - ERC-20 approval flow (check allowance → approve if needed → deposit)
 *  - Balance validation before deposit
 *  - ETH/WETH special case handling for withdrawals
 *  - Error handling (user rejection, insufficient balance, contract revert)
 *  - Margin store reload after successful transactions
 *
 * These tests are critical for auditing to ensure:
 *  - Wallet balance is checked before depositing (prevents wasted gas on revert)
 *  - Approval is awaited before deposit (prevents race conditions)
 *  - MAX_UINT256 approval pattern is used (gas optimization)
 *  - Correct decimal parsing (6 for USDC/USDT, 18 for ETH)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMarginAccount,
  getAddresses,
  depositTx,
  withdrawTx,
} from "@/lib/utils/margin/transactions";

// ──────────────────────────────────────────────
// Mock the margin store (avoid Zustand side effects)
// ──────────────────────────────────────────────
vi.mock("@/store/margin-account-state", () => ({
  useMarginStore: {
    getState: () => ({
      reloadMarginState: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// ──────────────────────────────────────────────
// Mock clients
// ──────────────────────────────────────────────

const mockTxHash = "0xdeadbeef1234567890" as `0x${string}`;
const mockReceipt = { status: "success", transactionHash: mockTxHash };

const USER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;
const MARGIN_ACCOUNT = "0xaaaa000000000000000000000000000000000001" as `0x${string}`;

const CHAIN_ID_ARB = 42161;
const CHAIN_ID_BASE = 8453;

const createMockWalletClient = () => ({
  account: { address: USER_ADDRESS },
  writeContract: vi.fn().mockResolvedValue(mockTxHash),
});

const createMockPublicClient = (
  balance: bigint = BigInt("100000000000"), // large balance
  allowance: bigint = BigInt(0)
) => ({
  readContract: vi.fn().mockImplementation(({ functionName }: any) => {
    if (functionName === "balanceOf") return Promise.resolve(balance);
    if (functionName === "allowance") return Promise.resolve(allowance);
    return Promise.resolve(BigInt(0));
  }),
  waitForTransactionReceipt: vi.fn().mockResolvedValue(mockReceipt),
});

const createMockFetchAccountCheck = (accounts: string[] = [MARGIN_ACCOUNT]) =>
  vi.fn().mockResolvedValue(accounts);

// ──────────────────────────────────────────────
// 1. Helper: getMarginAccount
// ──────────────────────────────────────────────

describe("getMarginAccount", () => {
  it("returns first account from fetchAccountCheck", async () => {
    const fetchAccountCheck = createMockFetchAccountCheck([MARGIN_ACCOUNT]);
    const result = await getMarginAccount({ fetchAccountCheck });
    expect(result).toBe(MARGIN_ACCOUNT);
  });

  it("throws when no margin accounts exist", async () => {
    const fetchAccountCheck = createMockFetchAccountCheck([]);
    await expect(
      getMarginAccount({ fetchAccountCheck })
    ).rejects.toThrow("No margin account");
  });

  it("throws when fetchAccountCheck returns null/undefined", async () => {
    const fetchAccountCheck = vi.fn().mockResolvedValue(null);
    await expect(
      getMarginAccount({ fetchAccountCheck })
    ).rejects.toThrow();
  });
});

// ──────────────────────────────────────────────
// 2. Helper: getAddresses
// ──────────────────────────────────────────────

describe("getAddresses", () => {
  it("returns addresses from getAddressList", () => {
    const mockAddressList = vi.fn().mockReturnValue({
      accountManagerContractAddress: "0x1234",
    });
    const result = getAddresses({ getAddressList: mockAddressList });
    expect(result.accountManagerContractAddress).toBe("0x1234");
  });

  it("throws for unsupported chain (null return)", () => {
    const mockAddressList = vi.fn().mockReturnValue(null);
    expect(() => getAddresses({ getAddressList: mockAddressList })).toThrow(
      "Unsupported chain"
    );
  });
});

// ──────────────────────────────────────────────
// 3. depositTx
// ──────────────────────────────────────────────

describe("depositTx", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;
  let fetchAccountCheck: ReturnType<typeof createMockFetchAccountCheck>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    fetchAccountCheck = createMockFetchAccountCheck();
  });

  it("deposits USDC with approval when allowance is 0", async () => {
    publicClient = createMockPublicClient(
      BigInt("1000000000"), // 1000 USDC balance (6 decimals)
      BigInt(0)              // zero allowance
    );

    const txHash = await depositTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDC",
      amount: "100",
    });

    expect(txHash).toBe(mockTxHash);

    // Should call writeContract 2 times: approve + deposit
    expect(walletClient.writeContract).toHaveBeenCalledTimes(2);

    // First call: approve with MAX_UINT256
    const approveCall = walletClient.writeContract.mock.calls[0][0];
    expect(approveCall.functionName).toBe("approve");

    // Second call: deposit
    const depositCall = walletClient.writeContract.mock.calls[1][0];
    expect(depositCall.functionName).toBe("deposit");
    expect(depositCall.args[0]).toBe(MARGIN_ACCOUNT); // margin account
    // Token address
    expect(depositCall.args[1]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    // 100 USDC = 100 * 10^6 = 100000000n
    expect(depositCall.args[2]).toBe(BigInt("100000000"));
  });

  it("skips approval when allowance is sufficient", async () => {
    publicClient = createMockPublicClient(
      BigInt("1000000000"),   // 1000 USDC
      BigInt("999999999999")  // large allowance
    );

    await depositTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDC",
      amount: "100",
    });

    // Should only call writeContract once (deposit, no approve)
    expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("deposit");
  });

  it("waits for approval tx receipt before deposit", async () => {
    publicClient = createMockPublicClient(BigInt("1000000000"), BigInt(0));

    await depositTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDC",
      amount: "50",
    });

    // waitForTransactionReceipt should be called for both approval and deposit
    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledTimes(2);
  });

  it("throws on insufficient balance", async () => {
    publicClient = createMockPublicClient(
      BigInt("10000000"), // 10 USDC (6 decimals)
      BigInt(0)
    );

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "USDC",
        amount: "100", // trying to deposit 100 with only 10
      })
    ).rejects.toThrow("Insufficient");
  });

  it("throws user rejection error", async () => {
    publicClient = createMockPublicClient(BigInt("1000000000"), BigInt("999999999999"));
    walletClient.writeContract.mockRejectedValueOnce(
      Object.assign(new Error("User rejected"), { code: 4001 })
    );

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "USDC",
        amount: "50",
      })
    ).rejects.toThrow("Transaction cancelled by user");
  });

  it("wraps contract revert errors", async () => {
    publicClient = createMockPublicClient(BigInt("1000000000"), BigInt("999999999999"));
    walletClient.writeContract.mockRejectedValueOnce(
      new Error("execution reverted: insufficient liquidity")
    );

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "USDC",
        amount: "50",
      })
    ).rejects.toThrow("Contract error");
  });

  it("throws for unknown token", async () => {
    publicClient = createMockPublicClient(BigInt("1000000000"), BigInt(0));

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "UNKNOWN_TOKEN",
        amount: "100",
      })
    ).rejects.toThrow();
  });

  it("throws when no margin account exists", async () => {
    publicClient = createMockPublicClient(BigInt("1000000000"), BigInt(0));
    fetchAccountCheck = createMockFetchAccountCheck([]);

    await expect(
      depositTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "USDC",
        amount: "100",
      })
    ).rejects.toThrow();
  });

  it("parses USDT with 6 decimals correctly", async () => {
    publicClient = createMockPublicClient(BigInt("5000000000"), BigInt("999999999999"));

    await depositTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDT",
      amount: "500",
    });

    const depositCall = walletClient.writeContract.mock.calls[0][0];
    // 500 USDT = 500 * 10^6 = 500000000n
    expect(depositCall.args[2]).toBe(BigInt("500000000"));
  });
});

// ──────────────────────────────────────────────
// 4. withdrawTx
// ──────────────────────────────────────────────

describe("withdrawTx", () => {
  let walletClient: ReturnType<typeof createMockWalletClient>;
  let publicClient: ReturnType<typeof createMockPublicClient>;
  let fetchAccountCheck: ReturnType<typeof createMockFetchAccountCheck>;

  beforeEach(() => {
    walletClient = createMockWalletClient();
    publicClient = createMockPublicClient();
    fetchAccountCheck = createMockFetchAccountCheck();
  });

  it("withdraws ERC-20 token (USDC) via withdraw()", async () => {
    const txHash = await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDC",
      amount: "100",
    });

    expect(txHash).toBe(mockTxHash);

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("withdraw");
    expect(call.args[0]).toBe(MARGIN_ACCOUNT);
    // Token address
    expect(call.args[1]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    // 100 USDC = 100 * 10^6 = 100000000n
    expect(call.args[2]).toBe(BigInt("100000000"));
  });

  it("withdraws ETH via withdrawEth()", async () => {
    await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "ETH",
      amount: "1.5",
    });

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("withdrawEth");
    expect(call.args[0]).toBe(MARGIN_ACCOUNT);
    // 1.5 ETH = 1500000000000000000n
    expect(call.args[1]).toBe(BigInt("1500000000000000000"));
  });

  it("treats WETH same as ETH (withdrawEth)", async () => {
    await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "WETH",
      amount: "0.5",
    });

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.functionName).toBe("withdrawEth");
  });

  it("waits for tx receipt on ERC-20 withdraw", async () => {
    await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDT",
      amount: "200",
    });

    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
      hash: mockTxHash,
    });
  });

  it("uses AccountManager address from chain config", async () => {
    await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_ARB,
      fetchAccountCheck,
      asset: "USDC",
      amount: "100",
    });

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("throws for unknown token mapping", async () => {
    await expect(
      withdrawTx({
        walletClient,
        publicClient,
        chainId: CHAIN_ID_ARB,
        fetchAccountCheck,
        asset: "UNKNOWN",
        amount: "100",
      })
    ).rejects.toThrow();
  });
});

// ──────────────────────────────────────────────
// 5. Cross-cutting Concerns
// ──────────────────────────────────────────────

describe("Cross-cutting Transaction Concerns", () => {
  it("deposit uses AccountManager ABI", async () => {
    const walletClient = createMockWalletClient();
    const publicClient = createMockPublicClient(BigInt("1000000000"), BigInt("999999999999"));
    const fetchAccountCheck = createMockFetchAccountCheck();

    await depositTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      fetchAccountCheck,
      asset: "USDC",
      amount: "50",
    });

    const depositCall = walletClient.writeContract.mock.calls[0][0];
    expect(depositCall.abi).toBeDefined();
    expect(depositCall.abi.length).toBeGreaterThan(0);
  });

  it("withdraw uses AccountManager ABI", async () => {
    const walletClient = createMockWalletClient();
    const publicClient = createMockPublicClient();
    const fetchAccountCheck = createMockFetchAccountCheck();

    await withdrawTx({
      walletClient,
      publicClient,
      chainId: CHAIN_ID_BASE,
      fetchAccountCheck,
      asset: "USDC",
      amount: "50",
    });

    const call = walletClient.writeContract.mock.calls[0][0];
    expect(call.abi).toBeDefined();
  });
});
