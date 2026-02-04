// calculations.ts - Margin calculation utilities
// All formulas follow DeFi lending protocol standards

// ============================================
// CONFIGURABLE CONSTANTS
// ============================================
// TODO: These should be fetched from RiskEngine contract
const PROTOCOL_CONSTANTS = {
  COLLATERAL_FACTOR: 0.9,      // 90% - Liquidation threshold
  MAX_LTV: 0.9,                // 90% - Maximum Loan-to-Value ratio
  LIQUIDATION_BONUS: 0.05,    // 5% - Liquidator incentive
  MIN_HEALTH_FACTOR: 1.0,     // Below this = liquidatable
  WARNING_HF_HIGH: 1.5,       // Safe zone threshold
  WARNING_HF_MEDIUM: 1.3,     // Caution zone threshold
  WARNING_HF_LOW: 1.1,        // Danger zone threshold
};

// ============================================
// BASIC AGGREGATORS
// ============================================
const calcCollateralUsd = (c: { usd: number }[]): number =>
  c.reduce((sum, item) => sum + (item.usd || 0), 0);

const calcBorrowUsd = (b: { usd: number }[]): number =>
  b.reduce((sum, item) => sum + (item.usd || 0), 0);

// ============================================
// HEALTH FACTOR
// ============================================
// Formula: HF = (Collateral × Collateral Factor) / Debt
// HF > 1 = Safe, HF <= 1 = Liquidatable
// User-1 :- 
  //  2000 (collatral)
  // liquidation threshold 90%=0.9
  // debt = 1500
// HF = (2000 * 0.9) / 1500 = 1.2 (safe)


const calcHF = (collUsd: number, debtUsd: number): number => {
  if (debtUsd <= 0) return Infinity;
  if (collUsd <= 0) return 0;
  return (collUsd * PROTOCOL_CONSTANTS.COLLATERAL_FACTOR) / debtUsd;
};

// ============================================
// LOAN-TO-VALUE (LTV)
// ============================================
// Formula: LTV = Debt / Collateral
// Returns ratio (0.5 = 50% LTV)

// 1600 / 2000 = 0.8 (80% LTV)
// 1000/2000 = 0.5 (50% LTV)
// 1800/1800 = 1 (100% LTV)


const calcLTV = (collUsd: number, debtUsd: number): number => {
  if (collUsd <= 0) return debtUsd > 0 ? Infinity : 0;
  return debtUsd / collUsd;
};



// LTV as percentage (0-100)
const calcLTVPercent = (collUsd: number, debtUsd: number): number => {
  return calcLTV(collUsd, debtUsd) * 100;
};

// ============================================
// LEVERAGE
// ============================================


// Formula: Leverage = Total Position / Equity
// Where: Equity = Collateral - Debt
// Alternative: Leverage = 1 / (1 - LTV)


const calcLeverage = (collUsd: number, debtUsd: number): number => {
  const equity = collUsd - debtUsd;
  if (equity <= 0) return Infinity; // Over-leveraged or underwater
  return collUsd / equity;
};

// Calculate leverage from LTV ratio
const calcLeverageFromLTV = (ltv: number): number => {
  if (ltv >= 1) return Infinity;
  if (ltv <= 0) return 1;
  return 1 / (1 - ltv);
};

// ============================================
// LIQUIDATION PRICE
// ============================================
// Formula: Liquidation Price = (Debt × Liquidation Threshold) / Collateral Amount
// This calculates at what price the collateral would trigger liquidation



// 1600/ (2000 * 0.9) = 0.8888 (88.88% of current price
// If current price = $100, liquidation price = $88.88

const calcLiquidationPrice = (
  debtUsd: number,
  collateralAmount: number,
  currentPrice: number
): number => {
  if (collateralAmount <= 0 || currentPrice <= 0) return 0;
  if (debtUsd <= 0) return 0; // No debt = no liquidation risk

  // Price at which HF = 1 (liquidation threshold)
  // HF = (collAmount × price × CF) / debt = 1
  // price = debt / (collAmount × CF)
  const liqPrice = debtUsd / (collateralAmount * PROTOCOL_CONSTANTS.COLLATERAL_FACTOR);
  return liqPrice;
};



const calcLiquidationPriceDropPercent = (
  debtUsd: number,
  collateralAmount: number,
  currentPrice: number
): number => {
  const liqPrice = calcLiquidationPrice(debtUsd, collateralAmount, currentPrice);
  if (liqPrice <= 0 || currentPrice <= 0) return 100; // 100% buffer (no risk)

  const dropPercent = ((currentPrice - liqPrice) / currentPrice) * 100;
  return Math.max(0, dropPercent);
};

// ============================================
// MAX BORROW / WITHDRAW
// ============================================
// Max additional borrowing while staying under LTV limit

// 2000 * 0.9 = 1800 max debt
// current debt = 1500
// max borrow = 1800 - 1500 = 300

const calcMaxBorrow = (collUsd: number, debtUsd: number): number => {
  const maxDebt = collUsd * PROTOCOL_CONSTANTS.MAX_LTV;
  return Math.max(0, maxDebt - debtUsd);
};

// 1800 / 0.9 = 2000 (collateral needed to cover 1800 debt at 90% LTV)
// current collateral = 2000
// max withdraw = 2000 - 2000 = 0


// Max withdrawable collateral while maintaining safe position
const calcMaxWithdraw = (collUsd: number, debtUsd: number): number => {
  if (debtUsd <= 0) return collUsd;
  // Minimum collateral needed = debt / MAX_LTV

  const minCollateral = debtUsd / PROTOCOL_CONSTANTS.MAX_LTV;
  return Math.max(0, collUsd - minCollateral);
};

// ============================================
// HEALTH FACTOR WARNINGS
// ============================================
type HFStatus = 'safe' | 'caution' | 'warning' | 'danger' | 'liquidatable';

const getHFStatus = (hf: number): HFStatus => {
  if (hf <= PROTOCOL_CONSTANTS.MIN_HEALTH_FACTOR) return 'liquidatable';
  if (hf < PROTOCOL_CONSTANTS.WARNING_HF_LOW) return 'danger';
  if (hf < PROTOCOL_CONSTANTS.WARNING_HF_MEDIUM) return 'warning';
  if (hf < PROTOCOL_CONSTANTS.WARNING_HF_HIGH) return 'caution';
  return 'safe';
};

const getHFColor = (hf: number): string => {
  const status = getHFStatus(hf);
  switch (status) {
    case 'safe': return 'green';
    case 'caution': return 'yellow';
    case 'warning': return 'orange';
    case 'danger':
    case 'liquidatable': return 'red';
    default: return 'gray';
  }
};

const getHFWarning = (hf: number): string | null => {
  const status = getHFStatus(hf);
  switch (status) {
    case 'liquidatable': return 'Position will be liquidated';
    case 'danger': return 'High liquidation risk';
    case 'warning': return 'Low health factor';
    case 'caution': return 'Monitor your position';
    default: return null;
  }
};

// SIMULATION HELPERS

interface SimulationResult {
  newHF: number;
  newLTV: number;
  newLeverage: number;
  maxBorrow: number;
  maxWithdraw: number;
  isLiquidatable: boolean;
  hfStatus: HFStatus;
}

const simulatePosition = (
  currentCollUsd: number,
  currentDebtUsd: number,
  depositUsd: number,
  borrowUsd: number,
  withdrawUsd: number = 0,
  repayUsd: number = 0
): SimulationResult => {
  const newCollUsd = Math.max(0, currentCollUsd + depositUsd - withdrawUsd);
  const newDebtUsd = Math.max(0, currentDebtUsd + borrowUsd - repayUsd);

  const newHF = calcHF(newCollUsd, newDebtUsd);
  const newLTV = calcLTV(newCollUsd, newDebtUsd);
  const newLeverage = calcLeverage(newCollUsd, newDebtUsd);

  return {
    newHF,
    newLTV,
    newLeverage,
    maxBorrow: calcMaxBorrow(newCollUsd, newDebtUsd),
    maxWithdraw: calcMaxWithdraw(newCollUsd, newDebtUsd),
    isLiquidatable: newHF <= PROTOCOL_CONSTANTS.MIN_HEALTH_FACTOR,
    hfStatus: getHFStatus(newHF),
  };
};

// ============================================
// VALIDATION HELPERS
// ============================================



const validateBorrow = (
  collUsd: number,
  currentDebtUsd: number,
  borrowAmountUsd: number
): { valid: boolean; error: string | null; newHF: number } => {
  const newDebt = currentDebtUsd + borrowAmountUsd;
  const newHF = calcHF(collUsd, newDebt);
  const newLTV = calcLTV(collUsd, newDebt);

  if (borrowAmountUsd <= 0) {
    return { valid: false, error: 'Borrow amount must be positive', newHF };
  }

  if (newLTV > PROTOCOL_CONSTANTS.MAX_LTV) {
    return { valid: false, error: `Exceeds maximum LTV of ${PROTOCOL_CONSTANTS.MAX_LTV * 100}%`, newHF };
  }

  if (newHF <= PROTOCOL_CONSTANTS.MIN_HEALTH_FACTOR) {
    return { valid: false, error: 'Position would be immediately liquidatable', newHF };
  }

  return { valid: true, error: null, newHF };
};

const validateWithdraw = (
  collUsd: number,
  debtUsd: number,
  withdrawAmountUsd: number
): { valid: boolean; error: string | null; newHF: number } => {
  const newColl = collUsd - withdrawAmountUsd;
  const newHF = calcHF(newColl, debtUsd);

  if (withdrawAmountUsd <= 0) {
    return { valid: false, error: 'Withdraw amount must be positive', newHF };
  }

  if (withdrawAmountUsd > collUsd) {
    return { valid: false, error: 'Insufficient collateral balance', newHF };
  }

  if (debtUsd > 0 && newHF <= PROTOCOL_CONSTANTS.MIN_HEALTH_FACTOR) {
    return { valid: false, error: 'Withdrawal would trigger liquidation', newHF };
  }

  return { valid: true, error: null, newHF };
};

// ============================================
// EXPORTS
// ============================================
const marginCalc = {
  // Constants
  PROTOCOL_CONSTANTS,

  // Basic aggregators
  calcCollateralUsd,
  calcBorrowUsd,

  // Core calculations
  calcHF,
  calcLTV,
  calcLTVPercent,
  calcLeverage,
  calcLeverageFromLTV,
  calcLiquidationPrice,
  calcLiquidationPriceDropPercent,
  calcMaxBorrow,
  calcMaxWithdraw,

  // Status helpers
  getHFStatus,
  getHFColor,
  getHFWarning,

  // Simulation
  simulatePosition,

  // Validation
  validateBorrow,
  validateWithdraw,
};

export default marginCalc;
