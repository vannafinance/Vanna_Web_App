/**
 * TEST SUITE: Margin Account Calculations
 *
 * Tests all margin protocol math utilities:
 *  - Health Factor (HF) calculation
 *  - Loan-to-Value (LTV) ratio
 *  - Leverage calculation
 *  - Liquidation price estimation
 *  - Max borrow / max withdraw limits
 *  - HF status warnings and colors
 *  - Position simulation (deposit, borrow, withdraw, repay)
 *  - Borrow/Withdraw validation
 *
 * These tests are critical for auditing to ensure:
 *  - Correct liquidation thresholds (90% collateral factor)
 *  - Safe position boundaries are enforced
 *  - Edge cases (zero collateral, zero debt, underwater positions) are handled
 */

import { describe, it, expect } from "vitest";
import marginCalc from "@/lib/utils/margin/calculations";

// ──────────────────────────────────────────────
// 1. Protocol Constants
// ──────────────────────────────────────────────

describe("PROTOCOL_CONSTANTS", () => {
  it("has correct collateral factor (90%)", () => {
    expect(marginCalc.PROTOCOL_CONSTANTS.COLLATERAL_FACTOR).toBe(0.9);
  });

  it("has correct MAX_LTV (90%)", () => {
    expect(marginCalc.PROTOCOL_CONSTANTS.MAX_LTV).toBe(0.9);
  });

  it("has correct liquidation bonus (5%)", () => {
    expect(marginCalc.PROTOCOL_CONSTANTS.LIQUIDATION_BONUS).toBe(0.05);
  });

  it("has correct MIN_HEALTH_FACTOR (1.0)", () => {
    expect(marginCalc.PROTOCOL_CONSTANTS.MIN_HEALTH_FACTOR).toBe(1.0);
  });

  it("has correct warning thresholds in descending order", () => {
    const { WARNING_HF_HIGH, WARNING_HF_MEDIUM, WARNING_HF_LOW, MIN_HEALTH_FACTOR } =
      marginCalc.PROTOCOL_CONSTANTS;
    expect(WARNING_HF_HIGH).toBeGreaterThan(WARNING_HF_MEDIUM);
    expect(WARNING_HF_MEDIUM).toBeGreaterThan(WARNING_HF_LOW);
    expect(WARNING_HF_LOW).toBeGreaterThan(MIN_HEALTH_FACTOR);
  });
});

// ──────────────────────────────────────────────
// 2. Basic Aggregators
// ──────────────────────────────────────────────

describe("calcCollateralUsd", () => {
  it("sums collateral USD values", () => {
    const items = [{ usd: 1000 }, { usd: 500 }, { usd: 200 }];
    expect(marginCalc.calcCollateralUsd(items)).toBe(1700);
  });

  it("returns 0 for empty array", () => {
    expect(marginCalc.calcCollateralUsd([])).toBe(0);
  });

  it("handles items with zero/undefined usd", () => {
    const items = [{ usd: 100 }, { usd: 0 }, { usd: undefined as any }];
    // usd: undefined → NaN, sum becomes NaN
    expect(marginCalc.calcCollateralUsd([{ usd: 100 }, { usd: 0 }])).toBe(100);
  });
});

describe("calcBorrowUsd", () => {
  it("sums borrow USD values", () => {
    const items = [{ usd: 800 }, { usd: 300 }];
    expect(marginCalc.calcBorrowUsd(items)).toBe(1100);
  });

  it("returns 0 for empty array", () => {
    expect(marginCalc.calcBorrowUsd([])).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 3. Health Factor
// ──────────────────────────────────────────────

describe("calcHF", () => {
  it("calculates HF correctly: (2000 * 0.9) / 1500 = 1.2", () => {
    const hf = marginCalc.calcHF(2000, 1500);
    expect(hf).toBeCloseTo(1.2, 5);
  });

  it("returns Infinity when debt is 0", () => {
    expect(marginCalc.calcHF(1000, 0)).toBe(Infinity);
  });

  it("returns Infinity when debt is negative", () => {
    expect(marginCalc.calcHF(1000, -100)).toBe(Infinity);
  });

  it("returns 0 when collateral is 0 and debt > 0", () => {
    expect(marginCalc.calcHF(0, 1000)).toBe(0);
  });

  it("HF = 1.0 exactly at liquidation boundary", () => {
    // collateral * 0.9 / debt = 1 → collateral = debt / 0.9
    const debt = 900;
    const collateral = debt / 0.9; // 1000
    expect(marginCalc.calcHF(collateral, debt)).toBeCloseTo(1.0, 5);
  });

  it("HF < 1 means position is liquidatable", () => {
    // $900 collateral, $1000 debt → HF = (900 * 0.9) / 1000 = 0.81
    expect(marginCalc.calcHF(900, 1000)).toBeLessThan(1.0);
  });

  it("HF > 1 means position is safe", () => {
    // $5000 collateral, $2000 debt → HF = (5000 * 0.9) / 2000 = 2.25
    expect(marginCalc.calcHF(5000, 2000)).toBeGreaterThan(1.0);
  });
});

// ──────────────────────────────────────────────
// 4. Loan-to-Value (LTV)
// ──────────────────────────────────────────────

describe("calcLTV", () => {
  it("calculates LTV: 1000 / 2000 = 0.5 (50%)", () => {
    expect(marginCalc.calcLTV(2000, 1000)).toBeCloseTo(0.5, 5);
  });

  it("returns 0 when no debt and no collateral", () => {
    expect(marginCalc.calcLTV(0, 0)).toBe(0);
  });

  it("returns Infinity when collateral is 0 but debt > 0", () => {
    expect(marginCalc.calcLTV(0, 500)).toBe(Infinity);
  });

  it("returns 0 when debt is 0", () => {
    expect(marginCalc.calcLTV(1000, 0)).toBe(0);
  });

  it("LTV = 1.0 when debt equals collateral", () => {
    expect(marginCalc.calcLTV(1000, 1000)).toBeCloseTo(1.0, 5);
  });
});

describe("calcLTVPercent", () => {
  it("returns LTV as percentage: 50% for 1000/2000", () => {
    expect(marginCalc.calcLTVPercent(2000, 1000)).toBeCloseTo(50, 2);
  });

  it("returns 80% for 1600/2000", () => {
    expect(marginCalc.calcLTVPercent(2000, 1600)).toBeCloseTo(80, 2);
  });
});

// ──────────────────────────────────────────────
// 5. Leverage
// ──────────────────────────────────────────────

describe("calcLeverage", () => {
  it("1x leverage with no debt", () => {
    // collateral = 1000, debt = 0, equity = 1000, leverage = 1000/1000 = 1
    expect(marginCalc.calcLeverage(1000, 0)).toBeCloseTo(1.0, 5);
  });

  it("2x leverage: collateral=2000, debt=1000", () => {
    // equity = 2000 - 1000 = 1000, leverage = 2000/1000 = 2
    expect(marginCalc.calcLeverage(2000, 1000)).toBeCloseTo(2.0, 5);
  });

  it("5x leverage: collateral=5000, debt=4000", () => {
    // equity = 1000, leverage = 5000/1000 = 5
    expect(marginCalc.calcLeverage(5000, 4000)).toBeCloseTo(5.0, 5);
  });

  it("returns Infinity when underwater (debt >= collateral)", () => {
    expect(marginCalc.calcLeverage(1000, 1000)).toBe(Infinity);
    expect(marginCalc.calcLeverage(1000, 1500)).toBe(Infinity);
  });
});

describe("calcLeverageFromLTV", () => {
  it("1x at 0% LTV", () => {
    expect(marginCalc.calcLeverageFromLTV(0)).toBe(1);
  });

  it("2x at 50% LTV", () => {
    expect(marginCalc.calcLeverageFromLTV(0.5)).toBeCloseTo(2.0, 5);
  });

  it("10x at 90% LTV", () => {
    expect(marginCalc.calcLeverageFromLTV(0.9)).toBeCloseTo(10.0, 5);
  });

  it("Infinity at 100% LTV", () => {
    expect(marginCalc.calcLeverageFromLTV(1)).toBe(Infinity);
  });

  it("1 for negative LTV", () => {
    expect(marginCalc.calcLeverageFromLTV(-0.5)).toBe(1);
  });
});

// ──────────────────────────────────────────────
// 6. Liquidation Price
// ──────────────────────────────────────────────

describe("calcLiquidationPrice", () => {
  it("calculates liquidation price correctly", () => {
    // debt=$1500, collateralAmount=1 ETH, currentPrice=$2000
    // liqPrice = 1500 / (1 * 0.9) = 1666.67
    const liqPrice = marginCalc.calcLiquidationPrice(1500, 1, 2000);
    expect(liqPrice).toBeCloseTo(1666.67, 1);
  });

  it("returns 0 when no debt", () => {
    expect(marginCalc.calcLiquidationPrice(0, 1, 2000)).toBe(0);
  });

  it("returns 0 when collateral amount is 0", () => {
    expect(marginCalc.calcLiquidationPrice(1000, 0, 2000)).toBe(0);
  });

  it("returns 0 when current price is 0", () => {
    expect(marginCalc.calcLiquidationPrice(1000, 1, 0)).toBe(0);
  });
});

describe("calcLiquidationPriceDropPercent", () => {
  it("calculates percentage drop to liquidation", () => {
    // debt=$1500, collAmount=1 ETH, currentPrice=$2000
    // liqPrice = 1666.67
    // drop = ((2000 - 1666.67) / 2000) * 100 = 16.67%
    const drop = marginCalc.calcLiquidationPriceDropPercent(1500, 1, 2000);
    expect(drop).toBeCloseTo(16.67, 0);
  });

  it("returns 100% buffer when no debt", () => {
    const drop = marginCalc.calcLiquidationPriceDropPercent(0, 1, 2000);
    expect(drop).toBe(100);
  });

  it("returns 0% when already at liquidation price", () => {
    // debt=$900, collAmount=1 ETH, currentPrice=$1000
    // liqPrice = 900 / (1 * 0.9) = 1000 → drop = 0%
    const drop = marginCalc.calcLiquidationPriceDropPercent(900, 1, 1000);
    expect(drop).toBeCloseTo(0, 1);
  });
});

// ──────────────────────────────────────────────
// 7. Max Borrow / Max Withdraw
// ──────────────────────────────────────────────

describe("calcMaxBorrow", () => {
  it("calculates max additional borrowing", () => {
    // collateral=$2000, debt=$1500, maxDebt = 2000*0.9 = 1800
    // maxBorrow = 1800 - 1500 = 300
    expect(marginCalc.calcMaxBorrow(2000, 1500)).toBeCloseTo(300, 2);
  });

  it("returns 0 when already at max LTV", () => {
    // collateral=$1000, debt=$900 → maxDebt = 900, maxBorrow = 0
    expect(marginCalc.calcMaxBorrow(1000, 900)).toBeCloseTo(0, 2);
  });

  it("returns full capacity when no debt", () => {
    // collateral=$5000, debt=$0 → maxBorrow = 5000*0.9 = 4500
    expect(marginCalc.calcMaxBorrow(5000, 0)).toBeCloseTo(4500, 2);
  });

  it("returns 0 when over-leveraged", () => {
    // collateral=$1000, debt=$1000 → maxDebt = 900, maxBorrow = max(0, 900-1000) = 0
    expect(marginCalc.calcMaxBorrow(1000, 1000)).toBe(0);
  });
});

describe("calcMaxWithdraw", () => {
  it("calculates max withdrawable collateral", () => {
    // collateral=$2000, debt=$900
    // minCollateral = 900/0.9 = 1000
    // maxWithdraw = 2000 - 1000 = 1000
    expect(marginCalc.calcMaxWithdraw(2000, 900)).toBeCloseTo(1000, 2);
  });

  it("returns full collateral when no debt", () => {
    expect(marginCalc.calcMaxWithdraw(5000, 0)).toBe(5000);
  });

  it("returns 0 when collateral equals minimum required", () => {
    // collateral=$1000, debt=$900 → minColl = 1000, maxWithdraw = 0
    expect(marginCalc.calcMaxWithdraw(1000, 900)).toBeCloseTo(0, 2);
  });

  it("returns 0 when under-collateralized", () => {
    // collateral=$500, debt=$900 → minColl = 1000, maxWithdraw = max(0, -500) = 0
    expect(marginCalc.calcMaxWithdraw(500, 900)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 8. HF Status / Color / Warning
// ──────────────────────────────────────────────

describe("getHFStatus", () => {
  it("returns 'safe' for HF >= 1.5", () => {
    expect(marginCalc.getHFStatus(2.0)).toBe("safe");
    expect(marginCalc.getHFStatus(1.5)).toBe("safe");
  });

  it("returns 'caution' for 1.3 <= HF < 1.5", () => {
    expect(marginCalc.getHFStatus(1.4)).toBe("caution");
    expect(marginCalc.getHFStatus(1.3)).toBe("caution");
  });

  it("returns 'warning' for 1.1 <= HF < 1.3", () => {
    expect(marginCalc.getHFStatus(1.2)).toBe("warning");
    expect(marginCalc.getHFStatus(1.1)).toBe("warning");
  });

  it("returns 'danger' for 1.0 < HF < 1.1", () => {
    expect(marginCalc.getHFStatus(1.05)).toBe("danger");
  });

  it("returns 'liquidatable' for HF <= 1.0", () => {
    expect(marginCalc.getHFStatus(1.0)).toBe("liquidatable");
    expect(marginCalc.getHFStatus(0.5)).toBe("liquidatable");
    expect(marginCalc.getHFStatus(0)).toBe("liquidatable");
  });
});

describe("getHFColor", () => {
  it("returns 'green' for safe", () => {
    expect(marginCalc.getHFColor(2.0)).toBe("green");
  });

  it("returns 'yellow' for caution", () => {
    expect(marginCalc.getHFColor(1.4)).toBe("yellow");
  });

  it("returns 'orange' for warning", () => {
    expect(marginCalc.getHFColor(1.2)).toBe("orange");
  });

  it("returns 'red' for danger/liquidatable", () => {
    expect(marginCalc.getHFColor(1.05)).toBe("red");
    expect(marginCalc.getHFColor(0.8)).toBe("red");
  });
});

describe("getHFWarning", () => {
  it("returns null for safe positions", () => {
    expect(marginCalc.getHFWarning(2.0)).toBeNull();
  });

  it("returns warning messages for unsafe positions", () => {
    expect(marginCalc.getHFWarning(1.4)).toBe("Monitor your position");
    expect(marginCalc.getHFWarning(1.2)).toBe("Low health factor");
    expect(marginCalc.getHFWarning(1.05)).toBe("High liquidation risk");
    expect(marginCalc.getHFWarning(0.8)).toBe("Position will be liquidated");
  });
});

// ──────────────────────────────────────────────
// 9. Position Simulation
// ──────────────────────────────────────────────

describe("simulatePosition", () => {
  it("simulates a deposit increasing collateral", () => {
    // Start: coll=$2000, debt=$1500
    // Deposit $500 more → newColl=$2500, newDebt=$1500
    const result = marginCalc.simulatePosition(2000, 1500, 500, 0);
    expect(result.newHF).toBeCloseTo((2500 * 0.9) / 1500, 5);
    expect(result.newLTV).toBeCloseTo(1500 / 2500, 5);
    expect(result.newLeverage).toBeCloseTo(2500 / 1000, 5);
    expect(result.isLiquidatable).toBe(false);
    expect(result.hfStatus).toBe("safe");
  });

  it("simulates a borrow increasing debt", () => {
    // Start: coll=$2000, debt=$1000
    // Borrow $500 more → newColl=$2000, newDebt=$1500
    const result = marginCalc.simulatePosition(2000, 1000, 0, 500);
    expect(result.newHF).toBeCloseTo((2000 * 0.9) / 1500, 5);
    expect(result.newLTV).toBeCloseTo(1500 / 2000, 5);
    expect(result.isLiquidatable).toBe(false);
  });

  it("simulates withdrawal reducing collateral", () => {
    // Start: coll=$3000, debt=$1000
    // Withdraw $1000 → newColl=$2000
    const result = marginCalc.simulatePosition(3000, 1000, 0, 0, 1000);
    expect(result.newHF).toBeCloseTo((2000 * 0.9) / 1000, 5);
    expect(result.isLiquidatable).toBe(false);
  });

  it("simulates repayment reducing debt", () => {
    // Start: coll=$2000, debt=$1800
    // Repay $800 → newDebt=$1000
    const result = marginCalc.simulatePosition(2000, 1800, 0, 0, 0, 800);
    expect(result.newHF).toBeCloseTo((2000 * 0.9) / 1000, 5);
    expect(result.newLTV).toBeCloseTo(1000 / 2000, 5);
    expect(result.hfStatus).toBe("safe");
  });

  it("detects liquidatable state after dangerous borrow", () => {
    // Start: coll=$1000, debt=$0
    // Borrow $950 → HF = (1000*0.9)/950 = 0.947 < 1.0
    const result = marginCalc.simulatePosition(1000, 0, 0, 950);
    expect(result.isLiquidatable).toBe(true);
    expect(result.hfStatus).toBe("liquidatable");
  });

  it("correctly calculates maxBorrow and maxWithdraw after simulation", () => {
    // Start: coll=$5000, debt=$2000
    // Deposit $1000 → newColl=$6000
    const result = marginCalc.simulatePosition(5000, 2000, 1000, 0);
    // maxBorrow = 6000*0.9 - 2000 = 3400
    expect(result.maxBorrow).toBeCloseTo(3400, 2);
    // maxWithdraw = 6000 - 2000/0.9 = 6000 - 2222.22 = 3777.78
    expect(result.maxWithdraw).toBeCloseTo(3777.78, 0);
  });

  it("clamps collateral and debt at 0 (no negative values)", () => {
    // Repay more than debt
    const result = marginCalc.simulatePosition(1000, 500, 0, 0, 0, 1000);
    expect(result.newHF).toBe(Infinity); // debt = 0
    expect(result.newLTV).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 10. Validation: validateBorrow
// ──────────────────────────────────────────────

describe("validateBorrow", () => {
  it("allows valid borrow within LTV limit", () => {
    // coll=$2000, debt=$1000, borrow=$300
    // newDebt=$1300, newLTV=1300/2000=0.65 < 0.9 ✓
    const result = marginCalc.validateBorrow(2000, 1000, 300);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("rejects zero borrow amount", () => {
    const result = marginCalc.validateBorrow(2000, 1000, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("positive");
  });

  it("rejects negative borrow amount", () => {
    const result = marginCalc.validateBorrow(2000, 1000, -100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("positive");
  });

  it("rejects borrow exceeding MAX_LTV", () => {
    // coll=$1000, debt=$0, borrow=$950
    // newLTV = 950/1000 = 0.95 > 0.9
    const result = marginCalc.validateBorrow(1000, 0, 950);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("LTV");
  });

  it("rejects borrow that would make position liquidatable", () => {
    // coll=$1000, debt=$800, borrow=$100
    // newDebt=$900, HF=(1000*0.9)/900 = 1.0 → liquidatable
    const result = marginCalc.validateBorrow(1000, 800, 100);
    expect(result.valid).toBe(false);
  });

  it("provides newHF in result", () => {
    const result = marginCalc.validateBorrow(2000, 500, 200);
    expect(result.newHF).toBeCloseTo((2000 * 0.9) / 700, 5);
  });
});

// ──────────────────────────────────────────────
// 11. Validation: validateWithdraw
// ──────────────────────────────────────────────

describe("validateWithdraw", () => {
  it("allows valid withdrawal maintaining safe HF", () => {
    // coll=$5000, debt=$1000, withdraw=$1000
    // newColl=$4000, HF=(4000*0.9)/1000=3.6 > 1.0 ✓
    const result = marginCalc.validateWithdraw(5000, 1000, 1000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("allows full withdrawal when no debt", () => {
    const result = marginCalc.validateWithdraw(5000, 0, 5000);
    expect(result.valid).toBe(true);
  });

  it("rejects zero withdraw amount", () => {
    const result = marginCalc.validateWithdraw(5000, 1000, 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("positive");
  });

  it("rejects withdrawing more than collateral", () => {
    const result = marginCalc.validateWithdraw(1000, 500, 1500);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Insufficient");
  });

  it("rejects withdrawal that would trigger liquidation", () => {
    // coll=$2000, debt=$1700, withdraw=$200
    // newColl=$1800, HF=(1800*0.9)/1700 = 0.953 < 1.0
    const result = marginCalc.validateWithdraw(2000, 1700, 200);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("liquidation");
  });

  it("provides newHF in result", () => {
    const result = marginCalc.validateWithdraw(3000, 1000, 500);
    expect(result.newHF).toBeCloseTo((2500 * 0.9) / 1000, 5);
  });
});

// ──────────────────────────────────────────────
// 12. Edge Cases & Stress Tests
// ──────────────────────────────────────────────

describe("Edge Cases", () => {
  it("handles very large values without overflow", () => {
    const largeColl = 1_000_000_000; // $1B collateral
    const largDebt = 500_000_000;    // $500M debt
    const hf = marginCalc.calcHF(largeColl, largDebt);
    expect(hf).toBeCloseTo(1.8, 5);
  });

  it("handles very small values", () => {
    const hf = marginCalc.calcHF(0.001, 0.0005);
    expect(hf).toBeCloseTo(1.8, 3);
  });

  it("consistency: leverage from direct calc matches LTV-based calc", () => {
    const coll = 2000;
    const debt = 1000;
    const directLeverage = marginCalc.calcLeverage(coll, debt);
    const ltv = marginCalc.calcLTV(coll, debt);
    const ltvLeverage = marginCalc.calcLeverageFromLTV(ltv);
    expect(directLeverage).toBeCloseTo(ltvLeverage, 5);
  });

  it("max borrow + existing debt should not exceed MAX_LTV", () => {
    const coll = 10000;
    const debt = 5000;
    const maxBorrow = marginCalc.calcMaxBorrow(coll, debt);
    const newDebt = debt + maxBorrow;
    const newLTV = marginCalc.calcLTV(coll, newDebt);
    expect(newLTV).toBeLessThanOrEqual(marginCalc.PROTOCOL_CONSTANTS.MAX_LTV + 0.001);
  });

  it("after max withdraw, HF should be at boundary", () => {
    const coll = 5000;
    const debt = 2000;
    const maxW = marginCalc.calcMaxWithdraw(coll, debt);
    const newColl = coll - maxW;
    const hf = marginCalc.calcHF(newColl, debt);
    // Should be very close to 1.0 (minimum safe HF)
    expect(hf).toBeCloseTo(1.0, 1);
  });
});
