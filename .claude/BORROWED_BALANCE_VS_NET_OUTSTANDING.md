# Borrowed Balance vs Net Outstanding Amount to Repay

## Quick Answer

| Term | Value | Source |
|------|-------|--------|
| **Net Outstanding Amount to Repay** | Total USD value of ALL borrowed assets | `RiskEngine.getBorrows(account)` |
| **Borrowed Balance** | Token amount of SELECTED asset only | `vToken.getBorrowBalance(account)` |

## Detailed Explanation

### 1. Net Outstanding Amount to Repay

**Location:** `components/margin/repay-loan-tab.tsx:128`

```typescript
const repayStats = useMemo(() => ({
  netOutstandingAmountToPay: marginState?.borrowUsd || 0,  // ← Total USD debt
  availableBalance: getBorrowedAmount(selectedRepayCurrency),
  frozenBalance: marginState?.collateralUsd || 0,
}), [marginState, getBorrowedAmount, selectedRepayCurrency]);
```

**Formula:**
```
Net Outstanding Amount = RiskEngine.getBorrows(account) / 1e18

```

**What it represents:**
- **Total USD value** of ALL borrowed assets combined
- Includes USDC, USDT, ETH, WETH - everything you've borrowed
- Used for calculating Health Factor and LTV
- This is your **total debt**

**Example:**
```
If you borrowed:
- 1000 USDC ($1000)
- 0.5 ETH ($1500 at $3000/ETH)

Net Outstanding Amount = $2500 USD
```

### 2. Borrowed Balance (Available Balance)

**Location:** `components/margin/repay-loan-tab.tsx:129`

```typescript
availableBalance: getBorrowedAmount(selectedRepayCurrency),
```

**Function:** `components/margin/repay-loan-tab.tsx:121-124`
```typescript
const getBorrowedAmount = useCallback((asset: string): number => {
  const position = borrowPositions.find(
    p => p.asset === asset || (p.asset === "WETH" && asset === "ETH")
  );
  return position ? Number(position.amount) : 0;
}, [borrowPositions]);
```

**Data Source:** `lib/utils/margin/marginFetchers.ts:95-148`
```typescript
// Step 1: Get list of borrowed assets from Margin Account
const borrowedAddresses = await Account.getBorrows();

// Step 2: For each asset, get actual borrowed amount
const rawBalance = await vToken.getBorrowBalance(marginAccount);
const amount = formatUnits(rawBalance, decimals);
```

**Formula:**
```
Borrowed Balance = vToken.getBorrowBalance(account, selectedAsset) / 10^decimals
```

**What it represents:**
- **Token amount** of the SELECTED asset only (not USD)
- Changes when you switch the dropdown (USDC → ETH → USDT)
- This is what you can repay for that specific asset
- Displayed in **token units** (e.g., "1000 USDC" or "0.5 ETH")

**Example:**
```
If you borrowed:
- 1000 USDC
- 0.5 ETH

When USDC selected:
  Borrowed Balance = 1000 USDC

When ETH selected:
  Borrowed Balance = 0.5 ETH

When USDT selected:
  Borrowed Balance = 0 USDT (you didn't borrow USDT)
```

## Why They're Different

### Scenario 1: Single Asset Borrowed

```
You borrowed: 1000 USDC only
USDC Price: $1.00

Net Outstanding Amount to Repay: $1000 USD (total debt)
Borrowed Balance (USDC selected): 1000 USDC (this asset)
```

✅ They appear similar but one is USD, one is token amount

### Scenario 2: Multiple Assets Borrowed

```
You borrowed:
- 1000 USDC ($1000)
- 0.5 ETH ($1500 at $3000/ETH)

Net Outstanding Amount to Repay: $2500 USD (total debt)

When dropdown = USDC:
  Borrowed Balance: 1000 USDC

When dropdown = ETH:
  Borrowed Balance: 0.5 ETH
```

✅ Net Outstanding stays same, Borrowed Balance changes with dropdown

### Scenario 3: Price Changes

```
You borrowed:
- 1000 USDC
- 0.5 ETH

ETH price increases: $3000 → $4000

Net Outstanding Amount to Repay:
  Before: $2500 USD
  After: $2500 USD (debt doesn't change with price)

Borrowed Balance:
  Before: 0.5 ETH (when ETH selected)
  After: 0.5 ETH (amount borrowed doesn't change)
```

✅ Both stay the same! Your debt is in token amounts, not USD.

**Wait, correction:** RiskEngine actually tracks debt in USD value, so if interest accrues or oracle prices update, the `borrowUsd` might reflect current value. Let me clarify:

## How Debt is Tracked

### On-Chain Reality

1. **vToken (Debt Token)**
   - Tracks borrowed **token amounts** (1000 USDC, 0.5 ETH)
   - Accrues interest over time
   - Formula: `borrowBalance[account] * borrowIndex`

2. **RiskEngine**
   - Converts token amounts → USD using oracle prices
   - Returns **current USD value** of all debts combined
   - Used for health checks (HF, LTV)

### Example with Interest

```
Time 0: Borrow 1000 USDC
- vToken shows: 1000 USDC
- RiskEngine shows: $1000 USD

Time 1 (1 year later, 5% APY):
- vToken shows: 1050 USDC (with interest)
- RiskEngine shows: $1050 USD (with interest)

Net Outstanding Amount = $1050 USD (total debt including interest)
Borrowed Balance (USDC) = 1050 USDC (specific asset including interest)
```

## UI Display

### In Repay Loan Tab

```
┌──────────────────────────────────────────┐
│ Repay Statistics                         │
├──────────────────────────────────────────┤
│ Net Outstanding Amount to Repay: $2,500  │  ← Total USD debt
│ Borrowed Balance: 1,000 USDC             │  ← Selected asset only
│ Frozen Balance: $5,000                   │  ← Total collateral
└──────────────────────────────────────────┘

Select Asset: [USDC ▼]  ← Changes Borrowed Balance
```

### User Workflow

1. User selects asset to repay (USDC, ETH, USDT)
2. **Borrowed Balance** updates to show how much of THAT asset is borrowed
3. User enters repayment amount (up to Borrowed Balance)
4. **Net Outstanding Amount** decreases by the USD value of repayment

## Code Flow

```typescript
// 1. Fetch total debt (all assets in USD)
const borrowUsd = await RiskEngine.getBorrows(account); // $2500
marginState.borrowUsd = borrowUsd / 1e18;

// 2. Fetch per-asset debt (specific tokens)
const borrowPositions = await fetchBorrowPositions(account);
// Returns: [
//   { asset: "USDC", amount: "1000" },
//   { asset: "ETH", amount: "0.5" }
// ]

// 3. UI displays based on selection
const repayStats = {
  netOutstandingAmountToPay: marginState.borrowUsd,  // $2500
  availableBalance: getBorrowedAmount("USDC"),        // 1000 USDC
};
```

## Summary Table

| Aspect | Net Outstanding Amount | Borrowed Balance |
|--------|----------------------|------------------|
| **Unit** | USD | Token (USDC, ETH, etc.) |
| **Scope** | All borrowed assets | Selected asset only |
| **Source** | `RiskEngine.getBorrows()` | `vToken.getBorrowBalance()` |
| **Changes when** | Borrow/Repay any asset | Borrow/Repay selected asset |
| **Dropdown affects?** | ❌ No (always total) | ✅ Yes (per asset) |
| **Used for** | Health Factor, LTV | Repayment UI |
| **Example** | $2,500 USD | 1,000 USDC |

## Why Both Are Needed

1. **Net Outstanding Amount** → Shows total debt health (risk management)
2. **Borrowed Balance** → Shows what you can repay per asset (user action)

You need to know:
- **Total debt** to understand your position risk
- **Per-asset debt** to know how much of each token to repay

## Common Confusion

❌ **Misconception:** "Borrowed Balance should equal Net Outstanding Amount"

✅ **Reality:** They measure different things!
- One is total USD debt
- One is specific token amount

It's like asking:
- "How much do I owe?" → $2500 (Net Outstanding)
- "How much USDC did I borrow?" → 1000 USDC (Borrowed Balance)

Both answers are correct but measure different aspects of your debt!
