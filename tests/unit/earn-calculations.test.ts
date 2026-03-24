/**
 * TEST SUITE: Earn Vault Calculations
 *
 * Tests the pure math functions used across the Vanna Earn protocol.
 * These calculations are critical for:
 *  - Displaying correct APY/APR to users
 *  - Computing exchange rates between vTokens and underlying assets
 *  - Projecting earnings for depositors
 *  - Determining pool utilization and available liquidity
 *
 * All functions are deterministic (no blockchain calls), so no mocking needed.
 */

import { describe, it, expect } from "vitest";
import earnCalc from "@/lib/utils/earn/calculations";

// ──────────────────────────────────────────────
// 1. Exchange Rate
// ──────────────────────────────────────────────

describe("Exchange Rate", () => {
  it("returns 1:1 when totalSupply is 0 (initial vault)", () => {
    expect(earnCalc.calcExchangeRate(0, 0)).toBe(1);
  });

  it("returns correct rate when totalAssets > totalSupply (interest accrued)", () => {
    // 1050 assets / 1000 shares = 1.05 exchange rate
    expect(earnCalc.calcExchangeRate(1050, 1000)).toBeCloseTo(1.05);
  });

  it("returns 1:1 when totalAssets equals totalSupply", () => {
    expect(earnCalc.calcExchangeRate(1000, 1000)).toBe(1);
  });

  it("handles large values without precision loss", () => {
    const rate = earnCalc.calcExchangeRate(1_000_000_000, 999_000_000);
    expect(rate).toBeGreaterThan(1);
    expect(rate).toBeLessThan(1.01);
  });
});

describe("Inverse Exchange Rate", () => {
  it("returns 1 when totalAssets is 0", () => {
    expect(earnCalc.calcInverseExchangeRate(0, 1000)).toBe(1);
  });

  it("returns correct inverse rate", () => {
    // 1000 shares / 1050 assets ≈ 0.9524
    const rate = earnCalc.calcInverseExchangeRate(1050, 1000);
    expect(rate).toBeCloseTo(0.9524, 3);
  });
});

// ──────────────────────────────────────────────
// 2. Utilization Rate
// ──────────────────────────────────────────────

describe("Utilization Rate", () => {
  it("returns 0 when no supply", () => {
    expect(earnCalc.calcUtilizationRate(100, 0)).toBe(0);
  });

  it("returns 0 when nothing is borrowed", () => {
    expect(earnCalc.calcUtilizationRate(0, 1000)).toBe(0);
  });

  it("returns correct utilization", () => {
    // 800 borrowed / 1000 supply = 0.8
    expect(earnCalc.calcUtilizationRate(800, 1000)).toBeCloseTo(0.8);
  });

  it("caps at 100% when borrowed exceeds supply", () => {
    expect(earnCalc.calcUtilizationRate(1200, 1000)).toBe(1);
  });

  it("calcUtilizationPercent returns percentage", () => {
    expect(earnCalc.calcUtilizationPercent(750, 1000)).toBeCloseTo(75);
  });
});

// ──────────────────────────────────────────────
// 3. APY Calculations (Client-Side Rate Model)
// ──────────────────────────────────────────────

describe("Borrow APY (Kinked Rate Model)", () => {
  it("returns BASE_RATE when utilization is 0", () => {
    expect(earnCalc.calcBorrowAPY(0)).toBeCloseTo(earnCalc.RATE_MODEL.BASE_RATE);
  });

  it("increases linearly below kink (80%)", () => {
    const apy40 = earnCalc.calcBorrowAPY(0.4);
    const apy60 = earnCalc.calcBorrowAPY(0.6);
    expect(apy60).toBeGreaterThan(apy40);
  });

  it("rate at kink matches expected formula", () => {
    const atKink = earnCalc.calcBorrowAPY(0.8);
    const expected = earnCalc.RATE_MODEL.BASE_RATE + (0.8 * earnCalc.RATE_MODEL.SLOPE1);
    expect(atKink).toBeCloseTo(expected);
  });

  it("increases steeply above kink", () => {
    const atKink = earnCalc.calcBorrowAPY(0.8);
    const at90 = earnCalc.calcBorrowAPY(0.9);
    const at100 = earnCalc.calcBorrowAPY(1.0);

    // Steep increase above kink
    expect(at90 - atKink).toBeGreaterThan(atKink - earnCalc.calcBorrowAPY(0.7));
    expect(at100).toBeGreaterThan(at90);
  });

  it("at 100% utilization matches full formula", () => {
    const apy = earnCalc.calcBorrowAPY(1.0);
    const rateAtKink = earnCalc.RATE_MODEL.BASE_RATE + (earnCalc.RATE_MODEL.KINK * earnCalc.RATE_MODEL.SLOPE1);
    const expected = rateAtKink + ((1.0 - earnCalc.RATE_MODEL.KINK) * earnCalc.RATE_MODEL.SLOPE2);
    expect(apy).toBeCloseTo(expected);
  });
});

describe("Supply APY", () => {
  it("returns 0 when utilization is 0 (no borrowers)", () => {
    expect(earnCalc.calcSupplyAPY(0)).toBe(0);
  });

  it("supply APY is always less than borrow APY (protocol takes fee)", () => {
    const util = 0.5;
    const supplyAPY = earnCalc.calcSupplyAPY(util);
    const borrowAPY = earnCalc.calcBorrowAPY(util);
    expect(supplyAPY).toBeLessThan(borrowAPY);
  });

  it("supply APY increases with utilization", () => {
    const apy40 = earnCalc.calcSupplyAPY(0.4);
    const apy70 = earnCalc.calcSupplyAPY(0.7);
    expect(apy70).toBeGreaterThan(apy40);
  });

  it("respects protocol fee parameter", () => {
    const util = 0.6;
    const noFee = earnCalc.calcSupplyAPY(util, 0);
    const withFee = earnCalc.calcSupplyAPY(util, 0.1);
    expect(noFee).toBeGreaterThan(withFee);
  });

  it("calcSupplyAPYPercent returns percentage", () => {
    const pct = earnCalc.calcSupplyAPYPercent(0.5);
    const dec = earnCalc.calcSupplyAPY(0.5);
    expect(pct).toBeCloseTo(dec * 100);
  });
});

// ──────────────────────────────────────────────
// 4. On-Chain Rate Model APY
// ──────────────────────────────────────────────

describe("On-Chain APY from Rate", () => {
  it("calcBorrowAPYFromRate returns 0 for zero rate", () => {
    expect(earnCalc.calcBorrowAPYFromRate(0)).toBe(0);
  });

  it("calcBorrowAPYFromRate converts per-second rate to annual", () => {
    const ratePerSecond = 1e-10; // tiny rate
    const apy = earnCalc.calcBorrowAPYFromRate(ratePerSecond);
    expect(apy).toBeCloseTo(ratePerSecond * earnCalc.SECONDS_PER_YEAR);
  });

  it("calcSupplyAPYFromRate applies protocol fee", () => {
    const borrowAPY = 0.05;
    const supplyAPY = earnCalc.calcSupplyAPYFromRate(borrowAPY);
    expect(supplyAPY).toBeCloseTo(borrowAPY * (1 - earnCalc.ON_CHAIN_PROTOCOL_FEE));
  });

  it("calcAPYFromRate uses compound interest formula", () => {
    const ratePerSecond = 1e-10;
    const apy = earnCalc.calcAPYFromRate(ratePerSecond);
    const expected = Math.pow(1 + ratePerSecond, earnCalc.SECONDS_PER_YEAR) - 1;
    expect(apy).toBeCloseTo(expected);
  });

  it("calcAPRFromRate uses simple interest", () => {
    const ratePerSecond = 1e-10;
    const apr = earnCalc.calcAPRFromRate(ratePerSecond);
    expect(apr).toBeCloseTo(ratePerSecond * earnCalc.SECONDS_PER_YEAR);
  });
});

// ──────────────────────────────────────────────
// 5. Projected Earnings
// ──────────────────────────────────────────────

describe("Projected Earnings", () => {
  it("returns 0 for zero principal", () => {
    expect(earnCalc.calcProjectedEarnings(0, 0.05, 86400)).toBe(0);
  });

  it("returns 0 for zero APY", () => {
    expect(earnCalc.calcProjectedEarnings(1000, 0, 86400)).toBe(0);
  });

  it("calculates correct yearly earnings", () => {
    const principal = 10000;
    const apy = 0.05; // 5%
    const yearly = earnCalc.calcYearlyEarnings(principal, apy);
    // Simple interest: 10000 * 0.05 = 500
    expect(yearly).toBeCloseTo(500, 0);
  });

  it("monthly earnings are approximately 1/12 of yearly", () => {
    const principal = 10000;
    const apy = 0.06;
    const monthly = earnCalc.calcMonthlyEarnings(principal, apy);
    const yearly = earnCalc.calcYearlyEarnings(principal, apy);
    expect(monthly).toBeCloseTo(yearly / 12, -1); // rough approximation
  });
});

// ──────────────────────────────────────────────
// 6. Share/Asset Conversions
// ──────────────────────────────────────────────

describe("Share/Asset Conversions", () => {
  it("deposit: 1:1 when exchangeRate is 0 or 1", () => {
    expect(earnCalc.calcSharesForDeposit(100, 0)).toBe(100);
    expect(earnCalc.calcSharesForDeposit(100, 1)).toBe(100);
  });

  it("deposit: fewer shares when rate > 1 (interest accrued)", () => {
    // rate = 1.05 means 1 share = 1.05 assets
    const shares = earnCalc.calcSharesForDeposit(100, 1.05);
    expect(shares).toBeCloseTo(95.238, 2);
  });

  it("withdraw: correct assets for given shares", () => {
    const assets = earnCalc.calcAssetsForWithdraw(100, 1.05);
    expect(assets).toBeCloseTo(105);
  });

  it("deposit then withdraw round-trips correctly", () => {
    const depositAmount = 1000;
    const rate = 1.03;
    const shares = earnCalc.calcSharesForDeposit(depositAmount, rate);
    const withdrawAmount = earnCalc.calcAssetsForWithdraw(shares, rate);
    expect(withdrawAmount).toBeCloseTo(depositAmount, 5);
  });
});

// ──────────────────────────────────────────────
// 7. Available Liquidity
// ──────────────────────────────────────────────

describe("Available Liquidity", () => {
  it("available = supply - borrowed", () => {
    expect(earnCalc.calcAvailableLiquidity(1000, 400)).toBe(600);
  });

  it("returns 0 when borrowed >= supply", () => {
    expect(earnCalc.calcAvailableLiquidity(1000, 1200)).toBe(0);
  });

  it("canWithdraw returns true when liquidity is sufficient", () => {
    expect(earnCalc.canWithdraw(500, 1000, 400)).toBe(true);
  });

  it("canWithdraw returns false when liquidity is insufficient", () => {
    expect(earnCalc.canWithdraw(700, 1000, 400)).toBe(false);
  });

  it("canWithdraw returns true for exact available amount", () => {
    expect(earnCalc.canWithdraw(600, 1000, 400)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 8. USD Value Calculations
// ──────────────────────────────────────────────

describe("USD Value Calculations", () => {
  it("calcUsdValue multiplies correctly", () => {
    expect(earnCalc.calcUsdValue(1.5, 3000)).toBe(4500);
  });

  it("calcTokenAmount divides correctly", () => {
    expect(earnCalc.calcTokenAmount(3000, 3000)).toBe(1);
  });

  it("calcTokenAmount returns 0 for zero price", () => {
    expect(earnCalc.calcTokenAmount(1000, 0)).toBe(0);
  });
});

// ──────────────────────────────────────────────
// 9. Formatting
// ──────────────────────────────────────────────

describe("Formatting", () => {
  it("formatAPY converts decimal to percentage string", () => {
    expect(earnCalc.formatAPY(0.0525)).toBe("5.25%");
  });

  it("formatAPY respects decimal places", () => {
    expect(earnCalc.formatAPY(0.05, 0)).toBe("5%");
    expect(earnCalc.formatAPY(0.05, 4)).toBe("5.0000%");
  });

  it("formatExchangeRate formats correctly", () => {
    expect(earnCalc.formatExchangeRate(1.0523)).toBe("1.0523");
  });

  it("formatExchangeRate respects decimal places", () => {
    expect(earnCalc.formatExchangeRate(1.0523, 2)).toBe("1.05");
  });
});

// ──────────────────────────────────────────────
// 10. Constants Validation
// ──────────────────────────────────────────────

describe("Constants", () => {
  it("SECONDS_PER_YEAR matches expected value", () => {
    expect(earnCalc.SECONDS_PER_YEAR).toBe(31556952);
  });

  it("RATE_MODEL kink is 80%", () => {
    expect(earnCalc.RATE_MODEL.KINK).toBe(0.8);
  });

  it("ON_CHAIN_PROTOCOL_FEE is 1%", () => {
    expect(earnCalc.ON_CHAIN_PROTOCOL_FEE).toBe(0.01);
  });
});
