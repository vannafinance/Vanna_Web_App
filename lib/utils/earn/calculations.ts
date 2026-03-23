// Calculation utilities for Earn vaults (ETH, USDC, USDT)


const SECONDS_PER_YEAR = 31556952; // 365.2425 days (matches on-chain DefaultRateModel)
const SECONDS_PER_MONTH = 2628000; // ~30.4 days

// Rate model parameters (should match on-chain RateModel contract)
// These are typical values - adjust based on your protocol's rate model

const RATE_MODEL = {
  BASE_RATE: 0.02,           // 2% base rate
  SLOPE1: 0.04,              // 4% slope below kink
  SLOPE2: 0.75,              // 75% slope above kink (steep)
  KINK: 0.8,                 // 80% utilization kink point
};

// ============================================
// EXCHANGE RATE
// ============================================

/**
 * @notice Calculate exchange rate (underlying assets per vToken share)
 * @dev Rate = totalAssets / totalSupply
 * @param totalAssets Total underlying assets in vault
 * @param totalSupply Total vToken shares minted
 * @returns Exchange rate (e.g., 1.05 means 1 vETH = 1.05 ETH)
 */
const calcExchangeRate = (totalAssets: number, totalSupply: number): number => {
  if (totalSupply <= 0) return 1; // Initial rate is 1:1
  return totalAssets / totalSupply;
};

/**
 * @notice Calculate inverse exchange rate (vToken shares per underlying asset)
 * @param totalAssets Total underlying assets in vault
 * @param totalSupply Total vToken shares minted
 * @returns Inverse rate (e.g., 0.95 means 1 ETH = 0.95 vETH)
 */
const calcInverseExchangeRate = (totalAssets: number, totalSupply: number): number => {
  if (totalAssets <= 0) return 1;
  return totalSupply / totalAssets;
};

// ============================================
// UTILIZATION RATE
// ============================================

/**
 * @notice Calculate pool utilization rate
 * @dev Utilization = totalBorrowed / totalSupply
 * @param totalBorrowed Total assets borrowed from pool
 * @param totalSupply Total assets supplied to pool
 * @returns Utilization as decimal (0.75 = 75%)
 */
const calcUtilizationRate = (totalBorrowed: number, totalSupply: number): number => {
  if (totalSupply <= 0) return 0;
  return Math.min(1, totalBorrowed / totalSupply); // Cap at 100%
};

/**
 * @notice Calculate utilization as percentage
 * @param totalBorrowed Total assets borrowed from pool
 * @param totalSupply Total assets supplied to pool
 * @returns Utilization percentage (0-100)
 */
const calcUtilizationPercent = (totalBorrowed: number, totalSupply: number): number => {
  return calcUtilizationRate(totalBorrowed, totalSupply) * 100;
};

// ============================================
// APY CALCULATIONS
// ============================================

/**
 * @notice Calculate borrow APY based on utilization (rate model)
 * @dev Uses kinked rate model: low rate below kink, steep above
 * @param utilization Utilization rate as decimal (0-1)
 * @returns Borrow APY as decimal (0.05 = 5%)
 */
const calcBorrowAPY = (utilization: number): number => {
  if (utilization <= RATE_MODEL.KINK) {
    // Below kink: BASE_RATE + utilization * SLOPE1
    return RATE_MODEL.BASE_RATE + (utilization * RATE_MODEL.SLOPE1);
  }
  // Above kink: BASE_RATE + KINK * SLOPE1 + (utilization - KINK) * SLOPE2
  const rateAtKink = RATE_MODEL.BASE_RATE + (RATE_MODEL.KINK * RATE_MODEL.SLOPE1);
  return rateAtKink + ((utilization - RATE_MODEL.KINK) * RATE_MODEL.SLOPE2);
};

/**
 * @notice Calculate supply APY based on utilization
 * @dev Supply APY = Borrow APY × Utilization × (1 - Protocol Fee)
 * @param utilization Utilization rate as decimal (0-1)
 * @param protocolFee Protocol fee as decimal (default 0.1 = 10%)
 * @returns Supply APY as decimal (0.03 = 3%)
 */
const calcSupplyAPY = (utilization: number, protocolFee: number = 0.1): number => {
  const borrowAPY = calcBorrowAPY(utilization);
  // Suppliers earn: borrowAPY × utilization × (1 - fee)
  return borrowAPY * utilization * (1 - protocolFee);
};

/**
 * @notice Calculate supply APY as percentage
 * @param utilization Utilization rate as decimal
 * @param protocolFee Protocol fee as decimal
 * @returns Supply APY percentage (3.5 = 3.5%)
 */
const calcSupplyAPYPercent = (utilization: number, protocolFee: number = 0.1): number => {
  return calcSupplyAPY(utilization, protocolFee) * 100;
};

/**
 * @notice Calculate APY from per-second rate (from contract)
 * @dev APY = (1 + ratePerSecond)^SECONDS_PER_YEAR - 1
 * @param ratePerSecond Rate per second from contract
 * @returns APY as decimal
 */
const calcAPYFromRate = (ratePerSecond: number): number => {
  if (ratePerSecond <= 0) return 0;
  // Compound interest formula
  return Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1;
};

/**
 * @notice Calculate APR from per-second rate (simple interest)
 * @param ratePerSecond Rate per second from contract
 * @returns APR as decimal
 */
const calcAPRFromRate = (ratePerSecond: number): number => {
  return ratePerSecond * SECONDS_PER_YEAR;
};

// ============================================
// ON-CHAIN RATE MODEL APY (DefaultRateModel)
// ============================================

// Protocol fee: 1% of borrow interest goes to protocol (matches on-chain)
const ON_CHAIN_PROTOCOL_FEE = 0.01;

/**
 * @notice Calculate borrow APY from on-chain getBorrowRatePerSecond result
 * @dev Matches old codebase formula: parseFloat(formatUnits(rate)) * SECS_PER_YEAR * 100
 * @param ratePerSecond The raw rate from formatUnits(getBorrowRatePerSecond result)
 * @returns Borrow APY as decimal (0.05 = 5%)
 */
const calcBorrowAPYFromRate = (ratePerSecond: number): number => {
  if (ratePerSecond <= 0) return 0;
  // Simple APR: rate * seconds_per_year (matches on-chain derivation)
  return ratePerSecond * SECONDS_PER_YEAR;
};

/**
 * @notice Calculate supply APY from on-chain borrow APY
 * @dev Matches old codebase: supplyApy = borrowApy - (borrowApy * FEES)
 * @param borrowAPY Borrow APY as decimal (from calcBorrowAPYFromRate)
 * @param protocolFee Protocol fee as decimal (default 0.01 = 1%)
 * @returns Supply APY as decimal
 */
const calcSupplyAPYFromRate = (borrowAPY: number, protocolFee: number = ON_CHAIN_PROTOCOL_FEE): number => {
  return borrowAPY * (1 - protocolFee);
};

// ============================================
// PROJECTED EARNINGS
// ============================================

/**
 * @notice Calculate projected earnings for a supply amount
 * @param principal Amount supplied
 * @param apyDecimal APY as decimal (0.05 = 5%)
 * @param timeInSeconds Time period in seconds
 * @returns Projected earnings
 */
const calcProjectedEarnings = (
  principal: number,
  apyDecimal: number,
  timeInSeconds: number
): number => {
  if (principal <= 0 || apyDecimal <= 0) return 0;
  // Simple interest for estimation: principal × rate × time
  const ratePerSecond = apyDecimal / SECONDS_PER_YEAR;
  return principal * ratePerSecond * timeInSeconds;
};

/**
 * @notice Calculate projected monthly earnings
 * @param principal Amount supplied
 * @param apyDecimal APY as decimal
 * @returns Monthly earnings estimate
 */
const calcMonthlyEarnings = (principal: number, apyDecimal: number): number => {
  return calcProjectedEarnings(principal, apyDecimal, SECONDS_PER_MONTH);
};

/**
 * @notice Calculate projected yearly earnings
 * @param principal Amount supplied
 * @param apyDecimal APY as decimal
 * @returns Yearly earnings estimate
 */
const calcYearlyEarnings = (principal: number, apyDecimal: number): number => {
  return calcProjectedEarnings(principal, apyDecimal, SECONDS_PER_YEAR);
};

// ============================================
// SHARE/ASSET CONVERSIONS
// ============================================

/**
 * @notice Calculate vToken shares user will receive for deposit
 * @param depositAmount Amount of underlying to deposit
 * @param exchangeRate Current exchange rate (assets per share)
 * @returns Number of vToken shares
 */
const calcSharesForDeposit = (depositAmount: number, exchangeRate: number): number => {
  if (exchangeRate <= 0) return depositAmount; // 1:1 if no rate
  return depositAmount / exchangeRate;
};

/**
 * @notice Calculate underlying assets user will receive for withdrawal
 * @param shares Number of vToken shares to redeem
 * @param exchangeRate Current exchange rate (assets per share)
 * @returns Amount of underlying assets
 */
const calcAssetsForWithdraw = (shares: number, exchangeRate: number): number => {
  return shares * exchangeRate;
};

// ============================================
// AVAILABLE LIQUIDITY
// ============================================

/**
 * @notice Calculate available liquidity in pool
 * @dev Available = totalSupply - totalBorrowed
 * @param totalSupply Total assets supplied
 * @param totalBorrowed Total assets borrowed
 * @returns Available liquidity
 */
const calcAvailableLiquidity = (totalSupply: number, totalBorrowed: number): number => {
  return Math.max(0, totalSupply - totalBorrowed);
};

/**
 * @notice Check if withdrawal amount is available
 * @param withdrawAmount Amount to withdraw
 * @param totalSupply Total assets supplied
 * @param totalBorrowed Total assets borrowed
 * @returns Whether withdrawal is possible
 */
const canWithdraw = (
  withdrawAmount: number,
  totalSupply: number,
  totalBorrowed: number
): boolean => {
  const available = calcAvailableLiquidity(totalSupply, totalBorrowed);
  return withdrawAmount <= available;
};

// ============================================
// USD VALUE CALCULATIONS
// ============================================

/**
 * @notice Calculate USD value of an amount
 * @param amount Token amount
 * @param priceUsd Token price in USD
 * @returns USD value
 */
const calcUsdValue = (amount: number, priceUsd: number): number => {
  return amount * priceUsd;
};

/**
 * @notice Calculate token amount from USD value
 * @param usdValue Value in USD
 * @param priceUsd Token price in USD
 * @returns Token amount
 */
const calcTokenAmount = (usdValue: number, priceUsd: number): number => {
  if (priceUsd <= 0) return 0;
  return usdValue / priceUsd;
};

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * @notice Format APY for display
 * @param apyDecimal APY as decimal
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "5.25%")
 */
const formatAPY = (apyDecimal: number, decimals: number = 2): string => {
  return `${(apyDecimal * 100).toFixed(decimals)}%`;
};

/**
 * @notice Format exchange rate for display
 * @param rate Exchange rate
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "1.0523")
 */
const formatExchangeRate = (rate: number, decimals: number = 4): string => {
  return rate.toFixed(decimals);
};

// ============================================
// EXPORTS
// ============================================

const earnCalc = {
  // Constants
  SECONDS_PER_YEAR,
  SECONDS_PER_MONTH,
  RATE_MODEL,

  // Exchange rate
  calcExchangeRate,
  calcInverseExchangeRate,

  // Utilization
  calcUtilizationRate,
  calcUtilizationPercent,

  // APY (client-side fallback)
  calcBorrowAPY,
  calcSupplyAPY,
  calcSupplyAPYPercent,
  calcAPYFromRate,
  calcAPRFromRate,

  // APY (on-chain DefaultRateModel — preferred)
  calcBorrowAPYFromRate,
  calcSupplyAPYFromRate,
  ON_CHAIN_PROTOCOL_FEE,

  // Earnings
  calcProjectedEarnings,
  calcMonthlyEarnings,
  calcYearlyEarnings,

  // Conversions
  calcSharesForDeposit,
  calcAssetsForWithdraw,

  // Liquidity
  calcAvailableLiquidity,
  canWithdraw,

  // USD
  calcUsdValue,
  calcTokenAmount,

  // Formatting
  formatAPY,
  formatExchangeRate,
};

export default earnCalc;
