/**
 * TEST SUITE: Zustand Stores (Balance, Margin Account, Collateral-Borrow)
 *
 * Tests the state management stores that hold critical financial data.
 * Validates:
 *  - Initial state values
 *  - Store reset behavior
 *  - Balance lookup by asset and type (WB/MB)
 *  - Margin account info structure
 *  - Collateral/borrow initial configuration
 *
 * These stores drive the margin and earn UI, so incorrect state = wrong data shown to users.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useBalanceStore } from "@/store/balance-store";
import { useMarginAccountInfoStore } from "@/store/margin-account-info-store";
import { useCollateralBorrowStore } from "@/store/collateral-borrow-store";

// ──────────────────────────────────────────────
// 1. Balance Store
// ──────────────────────────────────────────────

describe("Balance Store", () => {
  beforeEach(() => {
    useBalanceStore.getState().reset();
  });

  it("initializes with empty balances", () => {
    const state = useBalanceStore.getState();
    expect(state.balances).toEqual([]);
    expect(state.walletBalances).toEqual([]);
    expect(state.marginBalances).toEqual([]);
  });

  it("getBalance returns 0 for non-existent balance", () => {
    const balance = useBalanceStore.getState().getBalance("ETH", "WB");
    expect(balance).toBe(0);
  });

  it("reset clears all balances", () => {
    const store = useBalanceStore.getState();

    // Manually set some state to test reset
    useBalanceStore.setState({
      balances: [{ asset: "ETH", type: "WB", amount: 1.5 }],
      walletBalances: [{ asset: "ETH", type: "WB", amount: 1.5 }],
    });

    store.reset();

    const after = useBalanceStore.getState();
    expect(after.balances).toEqual([]);
    expect(after.walletBalances).toEqual([]);
  });

  it("getBalance finds correct balance by asset and type", () => {
    useBalanceStore.setState({
      balances: [
        { asset: "ETH", type: "WB", amount: 2.5 },
        { asset: "USDC", type: "WB", amount: 1000 },
        { asset: "ETH", type: "MB", amount: 0.5 },
        { asset: "USDC", type: "MB", amount: 500 },
      ],
    });

    const store = useBalanceStore.getState();
    expect(store.getBalance("ETH", "WB")).toBe(2.5);
    expect(store.getBalance("USDC", "WB")).toBe(1000);
    expect(store.getBalance("ETH", "MB")).toBe(0.5);
    expect(store.getBalance("USDC", "MB")).toBe(500);
    expect(store.getBalance("USDT", "WB")).toBe(0); // not set
  });
});

// ──────────────────────────────────────────────
// 2. Margin Account Info Store
// ──────────────────────────────────────────────

describe("Margin Account Info Store", () => {
  it("initializes with default values", () => {
    const state = useMarginAccountInfoStore.getState();

    expect(state.totalBorrowedValue).toBeDefined();
    expect(state.totalCollateralValue).toBeDefined();
    expect(state.hasMarginAccount).toBe(false);
    expect(state.totalValue).toBe(0);
    expect(state.avgHealthFactor).toBe(0);
  });

  it("has all required fields for margin display", () => {
    const state = useMarginAccountInfoStore.getState();

    // These fields are read by the margin UI components
    expect(state).toHaveProperty("totalBorrowedValue");
    expect(state).toHaveProperty("totalCollateralValue");
    expect(state).toHaveProperty("avgHealthFactor");
    expect(state).toHaveProperty("timeToLiquidation");
    expect(state).toHaveProperty("borrowRate");
    expect(state).toHaveProperty("liquidationPremium");
    expect(state).toHaveProperty("liquidationFee");
    expect(state).toHaveProperty("debtLimit");
    expect(state).toHaveProperty("minDebt");
    expect(state).toHaveProperty("maxDebt");
    expect(state).toHaveProperty("hasMarginAccount");
  });

  it("set() updates specific fields via deep merge", () => {
    const store = useMarginAccountInfoStore.getState();
    store.set({ hasMarginAccount: true, totalCollateralValue: 5000 });

    const updated = useMarginAccountInfoStore.getState();
    expect(updated.hasMarginAccount).toBe(true);
    expect(updated.totalCollateralValue).toBe(5000);
  });

  it("reset() restores initial state", () => {
    const store = useMarginAccountInfoStore.getState();
    store.set({ hasMarginAccount: true, totalCollateralValue: 9999 });
    store.reset();

    const after = useMarginAccountInfoStore.getState();
    expect(after.hasMarginAccount).toBe(false);
    expect(after.totalCollateralValue).toBe(1000); // initial
  });
});

// ──────────────────────────────────────────────
// 3. Collateral Borrow Store
// ──────────────────────────────────────────────

describe("Collateral Borrow Store", () => {
  it("initializes with 3 collateral entries", () => {
    const state = useCollateralBorrowStore.getState();
    expect(state.collaterals).toHaveLength(3);
  });

  it("collateral entries have correct structure", () => {
    const state = useCollateralBorrowStore.getState();
    for (const collateral of state.collaterals) {
      expect(collateral).toHaveProperty("asset");
      expect(collateral).toHaveProperty("amount");
      expect(collateral).toHaveProperty("amountInUsd");
      expect(collateral).toHaveProperty("balanceType");
      expect(collateral).toHaveProperty("unifiedBalance");
    }
  });

  it("collateral includes USDT, USDC, ETH", () => {
    const state = useCollateralBorrowStore.getState();
    const assets = state.collaterals.map((c) => c.asset);
    expect(assets).toContain("USDT");
    expect(assets).toContain("USDC");
    expect(assets).toContain("ETH");
  });

  it("initializes with 2 borrow items", () => {
    const state = useCollateralBorrowStore.getState();
    expect(state.borrowItems).toHaveLength(2);
  });

  it("borrow items have correct structure", () => {
    const state = useCollateralBorrowStore.getState();
    for (const borrow of state.borrowItems) {
      expect(borrow).toHaveProperty("assetData");
      expect(borrow.assetData).toHaveProperty("asset");
      expect(borrow.assetData).toHaveProperty("amount");
      expect(borrow).toHaveProperty("percentage");
      expect(borrow).toHaveProperty("usdValue");
    }
  });

  it("borrow percentages sum to 100", () => {
    const state = useCollateralBorrowStore.getState();
    const total = state.borrowItems.reduce((sum, b) => sum + b.percentage, 0);
    expect(total).toBe(100);
  });

  it("positions array is initialized", () => {
    const state = useCollateralBorrowStore.getState();
    expect(state.position).toBeDefined();
    expect(Array.isArray(state.position)).toBe(true);
  });

  it("set() deep merges collateral updates", () => {
    const store = useCollateralBorrowStore.getState();
    store.set({
      collaterals: [
        { asset: "ETH", amount: 5, amountInUsd: 15000, balanceType: "wb", unifiedBalance: 15000 },
      ],
    });

    const updated = useCollateralBorrowStore.getState();
    // Deep merge should have updated the first collateral
    expect(updated.collaterals[0].amount).toBe(5);
  });
});
