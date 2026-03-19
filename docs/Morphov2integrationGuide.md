# Morpho Protocol — Technical Integration Guide (Base Chain)

**Purpose:** Farm/Lending integration for Vanna Finance — Supply, Borrow, Repay, Withdraw
**Chain:** Base (Chain ID: 8453)
**Protocol Type:** Permissionless Lending Protocol (2 layers)

---

## 1. Architecture — 2 Layers

Morpho has two layers. This is critical to understand:

### Layer 1: Morpho Blue (Core Lending)

- Singleton contract — one contract handles ALL markets
- Users directly supply, borrow, repay, withdraw
- Each market = `(loanToken, collateralToken, oracle, IRM, LLTV)`
- Positions tracked internally (**NO ERC20 token minted**)
- **Use this for borrowing**

### Layer 2: Morpho Vault V2 (Meta-Vault, ERC4626)

- Vaults built ON TOP of Morpho Blue
- Users deposit assets → receive ERC4626 vault shares (ERC20 token)
- Curators manage which Morpho Blue markets the vault lends to
- Vaults **ONLY lend**. They **NEVER borrow**.
- **Use this for passive lending/earning yield**

```
User deposits USDC → Vault V2 (ERC4626) → Allocates to Morpho Blue Markets → Earns Interest
User borrows USDC → Directly on Morpho Blue (supply collateral first)
```

---

## 2. Deployed Contract Addresses (Base)

### Morpho Core (Blue)

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| Morpho Blue      | `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` |
| Adaptive Curve IRM | `0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC` |
| Public Allocator | `0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D` |
| Bundler3         | `0x6566194141eefa99Af43Bb5Aa71460Ca2Dc90245` |

### Morpho Vault V2

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| VaultV2Factory             | `0xA1D94F746dEfa1928926b84fB2596c06926C0405` |
| MetaMorpho Factory V1.1    | `0x1897A8997241C1cD4bD0698647e4EB7213535c24` |

### MORPHO Token

| Contract | Address                                      |
| -------- | -------------------------------------------- |
| MORPHO   | `0x58D97B57BB95320F9a05dC918Aef65434969c2B2` |

### Asset Addresses (4 Required Tokens)

| Token | Address                                      | Decimals |
| ----- | -------------------------------------------- | -------- |
| USDC  | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| USDT  | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6        |
| WETH  | `0x4200000000000000000000000000000000000006` | 18       |
| cbBTC | `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8        |

---

## 3. Key Structs

```solidity
// Defines a unique market
struct MarketParams {
    address loanToken;          // Token being lent/borrowed (e.g., USDC)
    address collateralToken;    // Token used as collateral (e.g., WETH)
    address oracle;             // Price oracle
    address irm;                // Interest rate model
    uint256 lltv;               // Liquidation LTV (e.g., 0.86e18 = 86%)
}

// User's position in a market
struct Position {
    uint256 supplyShares;       // Internal lending shares
    uint128 borrowShares;       // Internal borrow shares
    uint128 collateral;         // Collateral amount deposited
}

// Market state
struct Market {
    uint128 totalSupplyAssets;
    uint128 totalSupplyShares;
    uint128 totalBorrowAssets;
    uint128 totalBorrowShares;
    uint128 lastUpdate;
    uint128 fee;
}
```

> **Market ID** = `keccak256(abi.encode(marketParams))`

---

## 4. ACTION: supply() / lend()

Two ways to lend:

1. **Via Morpho Blue directly** → get internal shares (no ERC20)
2. **Via Vault V2** → get ERC4626 vault shares (ERC20) ← **Recommended for passive lending**

### Option A: Via Morpho Blue (Direct)

**Contract:** Morpho Blue (`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`)

```solidity
function supply(
    MarketParams memory marketParams,
    uint256 assets,       // Amount to supply (set 0 if using shares)
    uint256 shares,       // Supply shares to mint (set 0 if using assets)
    address onBehalf,     // Who owns the position
    bytes memory data     // "" for normal use
) external returns (
    uint256 assetsSupplied,
    uint256 sharesSupplied
);
```

**LP Token?** → No ERC20 token. Position is tracked internally.

**Position Tracking:**

```solidity
Position memory pos = morpho.position(marketId, userAddress);
// pos.supplyShares = your lending shares

// Convert shares to actual asset value:
Market memory m = morpho.market(marketId);
uint256 myAssets = (pos.supplyShares * m.totalSupplyAssets) / m.totalSupplyShares;
```

### Option B: Via Vault V2 (Recommended for Farm Page)

**Contract:** Any Morpho Vault (e.g., USDC Vault on Base)

```solidity
// Standard ERC4626 deposit
function deposit(
    uint256 assets,       // Amount of underlying token (e.g., USDC)
    address onBehalf      // Who receives vault shares
) external returns (
    uint256 shares        // Vault shares minted (ERC20!)
);
```

**LP Token?** → ERC4626 Vault Shares (ERC20 token)

- Standard ERC20 with `balanceOf`, `transfer`, `approve`
- Share price increases over time as interest accrues

**Position Tracking:**

```solidity
// 1. Check vault share balance
uint256 myShares = vault.balanceOf(userAddress);

// 2. Convert to underlying asset value
uint256 myValue = vault.convertToAssets(myShares);

// 3. Get total vault assets
uint256 totalAssets = vault.totalAssets();
```

### Integration Flow — Lend USDC via Vault V2

1. `USDC.approve(vaultAddress, amount)`
2. `vault.deposit(amount, userAddress)`
3. User receives ERC4626 vault shares (ERC20)
4. Track: `vault.balanceOf(user)` → `vault.convertToAssets(shares)` = current value

---

## 5. ACTION: borrow()

> Borrowing is **ONLY** on Morpho Blue directly. Vaults don't borrow.

**Contract:** Morpho Blue (`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`)

### Step 1: Supply Collateral First

```solidity
function supplyCollateral(
    MarketParams memory marketParams,
    uint256 assets,       // Amount of collateral token
    address onBehalf,     // Who owns the collateral
    bytes memory data     // "" for normal use
) external;
```

### Step 2: Borrow

```solidity
function borrow(
    MarketParams memory marketParams,
    uint256 assets,       // Amount to borrow (set 0 if using shares)
    uint256 shares,       // Borrow shares to mint (set 0 if using assets)
    address onBehalf,     // Who owns the borrow position
    address receiver      // Who receives the borrowed tokens
) external returns (
    uint256 assetsBorrowed,
    uint256 sharesBorrowed
);
```

> **Health Check:** `collateral * oraclePrice * LLTV >= borrowAmount`

### Integration Flow — Borrow USDC against WETH collateral

1. `WETH.approve(MorphoBlue, collateralAmount)`
2. `morpho.supplyCollateral(marketParams, collateralAmount, userAddress, "")`
3. `morpho.borrow(marketParams, borrowAmount, 0, userAddress, userAddress)`
4. User receives USDC (borrowed)

### Track Borrow Position

```solidity
Position memory pos = morpho.position(marketId, userAddress);
// pos.borrowShares = your borrow shares
// pos.collateral = your collateral amount

// Convert borrow shares to actual debt:
Market memory m = morpho.market(marketId);
uint256 myDebt = (pos.borrowShares * m.totalBorrowAssets) / m.totalBorrowShares;
```

---

## 6. ACTION: repay()

**Contract:** Morpho Blue

```solidity
function repay(
    MarketParams memory marketParams,
    uint256 assets,       // Amount to repay (set 0 if using shares)
    uint256 shares,       // Borrow shares to burn (set 0 if using assets)
    address onBehalf,     // Whose debt is being repaid
    bytes memory data     // "" for normal use
) external returns (
    uint256 assetsRepaid,
    uint256 sharesRepaid
);
```

> **Tip:** For full repayment, use `shares` parameter with user's full `borrowShares` to avoid rounding issues.

### Integration Flow — Repay USDC Loan

1. `USDC.approve(MorphoBlue, repayAmount)`
2. `morpho.repay(marketParams, 0, userBorrowShares, userAddress, "")` — Use shares for full repay
3. Debt reduced/cleared

---

## 7. ACTION: withdraw()

Two ways to withdraw (matching how you supplied):

### Option A: Withdraw from Morpho Blue (Direct)

```solidity
function withdraw(
    MarketParams memory marketParams,
    uint256 assets,       // Amount to withdraw (set 0 if using shares)
    uint256 shares,       // Supply shares to burn (set 0 if using assets)
    address onBehalf,     // Whose supply position is reduced
    address receiver      // Who receives the tokens
) external returns (
    uint256 assetsWithdrawn,
    uint256 sharesWithdrawn
);
```

### Option B: Withdraw from Vault V2

```solidity
// Withdraw exact asset amount
function withdraw(
    uint256 assets,       // Exact amount of underlying to get back
    address receiver,     // Who receives the tokens
    address onBehalf      // Whose shares are burned
) external returns (uint256 shares);

// OR redeem exact shares (recommended for full withdrawal)
function redeem(
    uint256 shares,       // Exact shares to burn
    address receiver,     // Who receives the tokens
    address onBehalf      // Whose shares are burned
) external returns (uint256 assets);
```

### Integration Flow — Withdraw from Vault V2

1. `vault.redeem(myShares, userAddress, userAddress)` — Full withdrawal
   OR: `vault.withdraw(amount, userAddress, userAddress)` — Partial withdrawal
2. User receives USDC back (with interest earned!)

### Withdraw Collateral (after repaying borrow)

```solidity
function withdrawCollateral(
    MarketParams memory marketParams,
    uint256 assets,       // Collateral amount to withdraw
    address onBehalf,     // Whose collateral
    address receiver      // Who receives it
) external;
```

1. `morpho.repay(...)` — Repay debt first
2. `morpho.withdrawCollateral(marketParams, collateralAmount, userAddress, userAddress)`
3. User receives WETH collateral back

---

## 8. Position Tracking Summary

### For Lending (Vault V2 — ERC4626)

| What to Check      | How                              |
| ------------------- | -------------------------------- |
| Share balance        | `vault.balanceOf(user)`          |
| Underlying value     | `vault.convertToAssets(shares)`  |
| Total vault assets   | `vault.totalAssets()`            |
| Preview deposit      | `vault.previewDeposit(assets)`   |
| Preview withdraw     | `vault.previewWithdraw(assets)`  |

### For Lending (Morpho Blue Direct)

| What to Check | How                                                        |
| -------------- | ---------------------------------------------------------- |
| Supply shares  | `morpho.position(marketId, user).supplyShares`             |
| Asset value    | `supplyShares * totalSupplyAssets / totalSupplyShares`      |

### For Borrowing (Morpho Blue)

| What to Check        | How                                                    |
| --------------------- | ------------------------------------------------------ |
| Borrow shares         | `morpho.position(marketId, user).borrowShares`         |
| Debt value            | `borrowShares * totalBorrowAssets / totalBorrowShares` |
| Collateral deposited  | `morpho.position(marketId, user).collateral`           |
| Health factor         | Calculate: `(collateral * price * LLTV) / debt`       |

---

## 9. Summary Table

| Action       | Contract    | Function                         | Token In                  | Token Out / Received              | Position Token             |
| ------------ | ----------- | -------------------------------- | ------------------------- | --------------------------------- | -------------------------- |
| Lend/Supply  | Vault V2    | `deposit()`                      | USDC/USDT/WETH/cbBTC     | ERC4626 vault shares (ERC20)      | Vault shares (ERC20)       |
| Lend/Supply  | Morpho Blue | `supply()`                       | loanToken                 | Internal shares (no ERC20)        | Internal supplyShares      |
| Borrow       | Morpho Blue | `supplyCollateral()` → `borrow()` | Collateral + nothing      | Borrowed loanToken                | Internal borrowShares      |
| Repay        | Morpho Blue | `repay()`                        | loanToken                 | Debt reduced                      | borrowShares decrease      |
| Withdraw     | Vault V2    | `redeem()` / `withdraw()`       | Vault shares              | Underlying asset + interest       | Shares burned              |
| Withdraw     | Morpho Blue | `withdraw()`                     | Internal shares           | loanToken back                    | supplyShares decrease      |

---

## 10. Key Differences from Aerodrome

| Aspect           | Aerodrome (AMM)            | Morpho (Lending)                    |
| ---------------- | -------------------------- | ----------------------------------- |
| Type             | DEX / AMM                  | Lending Protocol                    |
| LP Token         | ERC20 pool token           | ERC4626 vault shares OR internal    |
| Revenue          | Trading fees + AERO        | Interest from borrowers             |
| Risk             | Impermanent loss           | Liquidation risk (borrowers)        |
| Borrow possible? | No                         | Yes (via Morpho Blue)               |
| Use in Vanna     | AMM / Swap page            | Farm / Lending page                 |
