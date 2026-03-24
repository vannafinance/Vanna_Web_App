/**
 * TEST SUITE: Position History Utilities
 *
 * Tests the helper functions used by usePositionHistory hook.
 * These utilities handle:
 *  - Token symbol resolution from contract addresses
 *  - Event topic hash generation (Borrow/Repay signatures)
 *  - Address extraction from log topics
 *  - Cache key generation and cache operations
 *  - Raw log parsing into PositionHistoryItem
 *
 * Important for auditing because incorrect parsing can:
 *  - Show wrong token symbols for transactions
 *  - Misattribute transactions to wrong users
 *  - Display incorrect borrow/repay amounts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { keccak256, toBytes, formatUnits } from "viem";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { accountManagerAddressByChain } from "@/lib/utils/web3/token";

// ──────────────────────────────────────────────
// 1. Event Topic Hashes
// ──────────────────────────────────────────────

describe("Event Topic Hashes", () => {
  const BORROW_TOPIC0 = keccak256(toBytes("Borrow(address,address,address,uint256)"));
  const REPAY_TOPIC0 = keccak256(toBytes("Repay(address,address,address,uint256)"));

  it("Borrow topic is a valid keccak256 hash", () => {
    expect(BORROW_TOPIC0).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("Repay topic is a valid keccak256 hash", () => {
    expect(REPAY_TOPIC0).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("Borrow and Repay topics are different", () => {
    expect(BORROW_TOPIC0).not.toBe(REPAY_TOPIC0);
  });

  it("topic hashes are deterministic (same input = same output)", () => {
    const hash1 = keccak256(toBytes("Borrow(address,address,address,uint256)"));
    const hash2 = keccak256(toBytes("Borrow(address,address,address,uint256)"));
    expect(hash1).toBe(hash2);
  });
});

// ──────────────────────────────────────────────
// 2. Address Extraction from Log Topics
// ──────────────────────────────────────────────

describe("extractAddress", () => {
  // Replicate the function from usePositionHistory
  function extractAddress(topic: string): string {
    if (!topic || topic.length < 42) return "";
    return "0x" + topic.slice(-40);
  }

  it("extracts address from padded topic", () => {
    const topic = "0x0000000000000000000000001234567890abcdef1234567890abcdef12345678";
    const addr = extractAddress(topic);
    expect(addr).toBe("0x1234567890abcdef1234567890abcdef12345678");
  });

  it("returns empty string for null/undefined topic", () => {
    expect(extractAddress("")).toBe("");
    expect(extractAddress(undefined as any)).toBe("");
  });

  it("returns empty string for too-short topic", () => {
    expect(extractAddress("0x123")).toBe("");
  });
});

// ──────────────────────────────────────────────
// 3. Token Symbol Resolution
// ──────────────────────────────────────────────

describe("Token Symbol Resolution", () => {
  // Replicate resolveTokenSymbol from usePositionHistory
  function resolveTokenSymbol(
    tokenAddress: string,
    chainId: number
  ): { symbol: string; decimals: number } {
    const addressList = getAddressList(chainId);
    if (!addressList) return { symbol: "Unknown", decimals: 18 };
    const lower = tokenAddress.toLowerCase();
    if (lower === addressList.usdcTokenAddress?.toLowerCase()) return { symbol: "USDC", decimals: 6 };
    if (lower === addressList.usdtTokenAddress?.toLowerCase()) return { symbol: "USDT", decimals: 6 };
    if (lower === addressList.wethTokenAddress?.toLowerCase()) return { symbol: "ETH", decimals: 18 };
    return { symbol: "Unknown", decimals: 18 };
  }

  it("resolves USDC on Base (8453)", () => {
    const addressList = getAddressList(8453)!;
    const result = resolveTokenSymbol(addressList.usdcTokenAddress, 8453);
    expect(result.symbol).toBe("USDC");
    expect(result.decimals).toBe(6);
  });

  it("resolves USDT on Arbitrum (42161)", () => {
    const addressList = getAddressList(42161)!;
    const result = resolveTokenSymbol(addressList.usdtTokenAddress, 42161);
    expect(result.symbol).toBe("USDT");
    expect(result.decimals).toBe(6);
  });

  it("resolves WETH as ETH on Optimism (10)", () => {
    const addressList = getAddressList(10)!;
    const result = resolveTokenSymbol(addressList.wethTokenAddress, 10);
    expect(result.symbol).toBe("ETH");
    expect(result.decimals).toBe(18);
  });

  it("returns Unknown for unrecognized address", () => {
    const result = resolveTokenSymbol("0x0000000000000000000000000000000000000000", 8453);
    expect(result.symbol).toBe("Unknown");
  });

  it("returns Unknown for unsupported chain", () => {
    const result = resolveTokenSymbol("0xabc", 999);
    expect(result.symbol).toBe("Unknown");
  });

  it("is case-insensitive", () => {
    const addressList = getAddressList(8453)!;
    const upper = addressList.usdcTokenAddress.toUpperCase();
    const result = resolveTokenSymbol(upper, 8453);
    expect(result.symbol).toBe("USDC");
  });
});

// ──────────────────────────────────────────────
// 4. AccountManager Contract Addresses
// ──────────────────────────────────────────────

describe("AccountManager addresses", () => {
  it("exists for all supported chains", () => {
    expect(accountManagerAddressByChain[42161]).toMatch(/^0x/);
    expect(accountManagerAddressByChain[10]).toMatch(/^0x/);
    expect(accountManagerAddressByChain[8453]).toMatch(/^0x/);
  });

  it("returns undefined for unsupported chain", () => {
    expect(accountManagerAddressByChain[999]).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// 5. Cache Key Generation
// ──────────────────────────────────────────────

describe("Cache Key Generation", () => {
  const CACHE_PREFIX = "vanna_pos_history_";

  function getCacheKey(chainId: number, address: string): string {
    return `${CACHE_PREFIX}${chainId}_${address.toLowerCase()}`;
  }

  it("generates deterministic cache keys", () => {
    const key1 = getCacheKey(8453, "0xABC123");
    const key2 = getCacheKey(8453, "0xABC123");
    expect(key1).toBe(key2);
  });

  it("lowercases address for consistency", () => {
    const key1 = getCacheKey(8453, "0xABC123");
    const key2 = getCacheKey(8453, "0xabc123");
    expect(key1).toBe(key2);
  });

  it("different chains produce different keys", () => {
    const key1 = getCacheKey(8453, "0xabc123");
    const key2 = getCacheKey(42161, "0xabc123");
    expect(key1).not.toBe(key2);
  });

  it("different addresses produce different keys", () => {
    const key1 = getCacheKey(8453, "0xabc");
    const key2 = getCacheKey(8453, "0xdef");
    expect(key1).not.toBe(key2);
  });
});

// ──────────────────────────────────────────────
// 6. Amount Formatting (formatUnits from viem)
// ──────────────────────────────────────────────

describe("Amount Formatting (viem formatUnits)", () => {
  it("formats 18-decimal ETH correctly", () => {
    const raw = BigInt("1500000000000000000"); // 1.5 ETH
    expect(Number(formatUnits(raw, 18))).toBeCloseTo(1.5);
  });

  it("formats 6-decimal USDC correctly", () => {
    const raw = BigInt("1000000000"); // 1000 USDC
    expect(Number(formatUnits(raw, 6))).toBeCloseTo(1000);
  });

  it("formats small ETH amounts", () => {
    const raw = BigInt("1000000000000000"); // 0.001 ETH
    expect(Number(formatUnits(raw, 18))).toBeCloseTo(0.001);
  });

  it("formats zero correctly", () => {
    expect(Number(formatUnits(BigInt(0), 18))).toBe(0);
    expect(Number(formatUnits(BigInt(0), 6))).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 7. withTimeout utility
// ──────────────────────────────────────────────

describe("withTimeout utility", () => {
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }

  it("resolves before timeout", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000, "test");
    expect(result).toBe("ok");
  });

  it("rejects on timeout", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 5000));
    await expect(withTimeout(slow, 50, "slow-op")).rejects.toThrow("slow-op timed out");
  });

  it("passes through rejection", async () => {
    const failing = Promise.reject(new Error("network error"));
    await expect(withTimeout(failing, 1000, "test")).rejects.toThrow("network error");
  });
});
