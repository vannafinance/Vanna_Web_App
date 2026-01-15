// calculations.ts (HF, LTV, max borrow/withdraw, simulations)

const calcCollateralUsd = (c: { usd: number }[]) =>
  c.reduce((s, x) => s + x.usd, 0);

const calcBorrowUsd = (b: { usd: number }[]) =>
  b.reduce((s, x) => s + x.usd, 0);

const calcHF = (collUsd: number, debtUsd: number) => {
  if (debtUsd <= 0) return Infinity;
  const CF = 0.9;
  return (collUsd * CF) / debtUsd;
};

const calcLTV = (collUsd: number, debtUsd: number) => {
  if (collUsd <= 0) return 0;
  return debtUsd / collUsd;
};

const calcMaxBorrow = (collUsd: number, debtUsd: number) => {
  const LTV_LIMIT = 0.9;
  return Math.max(0, collUsd * LTV_LIMIT - debtUsd);
};

const calcMaxWithdraw = (collUsd: number, debtUsd: number) => {
  const LTV_LIMIT = 0.9;
  if (debtUsd <= 0) return collUsd;
  return Math.max(0, collUsd - debtUsd / LTV_LIMIT);
};


const marginCalc ={ 
  calcCollateralUsd,
  calcBorrowUsd,
  calcHF,
  calcLTV,
  calcMaxBorrow,
  calcMaxWithdraw,

}

export default marginCalc  ;