# Vanna Finance — Protocol Analysis

## Overview

Vanna Finance is a DeFi lending protocol enabling undercollateralized leverage up to 10x without liquidation risk (from the user's perspective — the protocol manages risk internally). Deployed on **Base (8453)**, **Arbitrum (42161)**, and **Optimism (10)**.

---

## Core Architecture

### Contract Hierarchy

```
AccountManager (entry point)
  ├── AccountFactory → creates Account (BeaconProxy) instances
  ├── Registry → maps users → accounts, underlying → vTokens
  ├── RiskEngine → health checks, balance/borrow thresholds
  ├── OracleFacade → delegates to ChainlinkOracle / ArbiChainlinkOracle
  ├── VToken (ERC4626) → lending pool per asset (USDC, USDT)
  ├── VEther → lending pool for native ETH (wraps WETH)
  ├── ControllerFacade → whitelists external protocol interactions
  └── LinearRateModel / DefaultRateModel → interest rate curves
```

### How Positions Work

1. **Account Creation**: Users call `AccountManager.openAccount(owner)` which uses `AccountFactory` to deploy a `BeaconProxy` → `Account` instance.
2. **Deposits**: Collateral (USDC, USDT, ETH) is deposited into the user's `Account` contract via `AccountManager.deposit()`.
3. **Borrowing**: Users borrow from `VToken` pools. The `Account` contract tracks both `assets[]` (collateral) and `borrows[]` (debt tokens).
4. **Risk Check**: Every borrow/withdraw goes through `RiskEngine.isBorrowAllowed()` / `isWithdrawAllowed()` which checks `getBalance(account) >= getBorrows(account) * balanceToBorrowThreshold()`.

### Data Model

```
User (EOA wallet)
  └── Account[] (via Registry.accountsOwnedBy(user))
       ├── assets: address[]     — collateral tokens held
       ├── borrows: address[]    — tokens borrowed from VToken pools
       ├── getAssets() → address[]
       ├── getBorrows() → address[]
       └── hasNoDebt() → bool

VToken (per asset lending pool, ERC4626)
  ├── asset() → underlying token address
  ├── totalAssets() → total supplied liquidity
  ├── getBorrows() → total borrowed from pool
  ├── getBorrowBalance(account) → individual borrow
  ├── rateModel() → interest rate model contract
  ├── convertToAssets(shares) / convertToShares(assets)
  └── ERC20: totalSupply(), balanceOf() for share tracking
```

---

## Key Contracts & Functions for Dashboard

### 1. RiskEngine
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `getBalance(account)` | `uint256` — collateral value in ETH terms | User collateral valuation |
| `getBorrows(account)` | `uint256` — debt value in ETH terms | User debt valuation |
| `isAccountHealthy(account)` | `bool` | Quick health check |
| `balanceToBorrowThreshold()` | `uint256` | Protocol-wide collateral factor |
| `oracle()` | `address` | Oracle contract reference |

**Deployed addresses:**
- Base: `0x29133317047183c48a3DF2022bD89B089Fc4F97a`
- Arbitrum: `0x676fbE39A5a403b85474D155567e43D9b2b85922`
- Optimism: `0x6E7EA2E46e72ff84CeFfc5e11fB9c6e97B01c617`

### 2. AccountManager
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `accountsOwnedBy(user)` | `address[]` | Find user's margin accounts |
| `VTokenFor(underlying)` | `address` | Map token → lending pool |

**Deployed addresses:**
- Base: `0x6F5303D7277B100443A3AfCec9886774d7214e00`
- Arbitrum: `0x13da9e485D17c0F62f64F77aAbE7b6c048a2f33C`
- Optimism: `0x6A82847B5Dc8c3535eE370308D78D396228A0D3a`

### 3. Account (per-user proxy)
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `getAssets()` | `address[]` | List collateral tokens |
| `getBorrows()` | `address[]` | List borrowed tokens |
| `hasNoDebt()` | `bool` | Quick debt check |
| `hasAsset(token)` | `bool` | Token presence check |

### 4. VToken (ERC4626 Lending Pools)
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `totalAssets()` | `uint256` | Total supplied (TVL per pool) |
| `getBorrows()` | `uint256` | Total borrowed |
| `getBorrowBalance(account)` | `uint256` | Per-user borrow |
| `rateModel()` | `address` | Interest rate model |
| `asset()` | `address` | Underlying token |
| `totalSupply()` | `uint256` | Total shares |
| `convertToAssets(shares)` | `uint256` | Share → asset conversion |

**VToken Addresses:**

| Token | Base | Arbitrum | Optimism |
|-------|------|----------|----------|
| vUSDC | `0x22D4FB89834738714e6B4aDa414B900138148289` | `0xE17258A56F0da671a028F2276Ddeaa5C1ccF3bdb` | `0x010305302F7BFc12Ec2597Cef77AF2DE91a90Ee9` |
| vUSDT | `0x0c2b54eA439735E624986efaF4054AD92831Cd4f` | `0x615A1B9A30C0C0e3E2391c5b93210Ce96FD2F0ef` | `0x7e70816B257Be3AbC4f2acA8C7e42b7bde76AEC8` |
| vETH  | `0xA8A7Ae5C132524398FF29293C0bB00530d47cdA9` | `0xA1f41ad5e26167db20c722835A6DB33889c49Cd7` | `0xa66d23d6b0bF9283059E2a2938d67FEE9080659b` |

### 5. OracleFacade
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `getPrice(token, account)` | `uint256` — price in ETH | Token pricing |
| `oracle(token)` | `address` | Get specific oracle for token |

**Deployed:** Optimism: `0x61959f47e62A3F92F36B2391b0F4a111c659F042`

### 6. ChainlinkOracle / ArbiChainlinkOracle
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `getPrice(token, account)` | `uint256` | Price from Chainlink |
| `feed(token)` | `address` | Chainlink price feed address |
| `heartBeatOf(token)` | `uint256` | Staleness threshold (seconds) |

### 7. LinearRateModel
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `getBorrowRatePerSecond(liquidity, totalDebt)` | `uint256` | Current borrow rate |
| `baseRate()` | `uint256` | Base interest rate |
| `slope1()` | `uint256` | Pre-kink slope |
| `slope2()` | `uint256` | Post-kink slope |
| `OPTIMAL_USAGE_RATIO()` | `uint256` | Kink point (target utilization) |

**Rate Model Addresses:**
- Base: `0xe190EA24860f8521f8a97f1E897677335C81a23B`
- Arbitrum: `0xbfB65FA7cC024c3315c4Eb13891f41223906f364`
- Optimism: `0x687a9656ba10Ca157dDA7c55D64bd64b3212ABce`

### 8. Registry
| Function | Returns | Dashboard Use |
|----------|---------|---------------|
| `accountsOwnedBy(user)` | `address[]` | All accounts for a user |
| `VTokenFor(underlying)` | `address` | Token → pool mapping |

**Registry Addresses:**
- Base: `0xDfd5D412A9FB58aE12d6b1AC20Df97D038c3E32b`
- Arbitrum: `0x6DCD57f3C7CBc465832213646BEEf5501f63a3C4`
- Optimism: `0xFd4568C1d084e281BEAa0d55BB5CFc7Cd91B39a4`

---

## Risk Calculations

From existing codebase (`lib/utils/margin/calculations.ts`):

```
Health Factor (HF) = (Collateral_USD × COLLATERAL_FACTOR) / Debt_USD
  where COLLATERAL_FACTOR = 0.9 (90%)

LTV = Debt_USD / Collateral_USD

Leverage = Collateral_USD / (Collateral_USD - Debt_USD)

Liquidation Price = Debt_USD / (Collateral_Amount × COLLATERAL_FACTOR)

HF Status:
  > 1.5  → Safe (green)
  1.3–1.5 → Caution (yellow)
  1.1–1.3 → Warning (orange)
  1.0–1.1 → Danger (red)
  ≤ 1.0  → Liquidatable (red)
```

---

## Supported Tokens

| Token | Base Address | Arbitrum Address | Optimism Address | Decimals |
|-------|-------------|-----------------|-----------------|----------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` | 6 |
| USDT | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` | 6 |
| WETH | `0x4200000000000000000000000000000000000006` | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` | `0x4200000000000000000000000000000000000006` | 18 |

---

## Data Gaps & Indexing Needs

1. **Historical TVL / Bad Debt**: No on-chain function returns historical data. Needs a subgraph or backend cron indexing `Deposit`, `Borrow`, `Repay`, `Withdraw` events over time.
2. **All Active Positions**: No contract function enumerates all accounts globally. The `Registry` tracks per-user accounts, but iterating all users requires indexing `AccountCreated` events from `AccountFactory`.
3. **Liquidation Events**: Need to index events to build a liquidation history table.
4. **Oracle Update Timestamps**: Chainlink feeds provide `latestRoundData()` with timestamps, but the Vanna oracle wrapper doesn't expose this directly — need to call the underlying Chainlink feed.

---

## Multi-Chain Strategy

All three chains (Base, Arbitrum, Optimism) share the same contract architecture but have different deployed addresses. The dashboard should:
1. Query all three chains in parallel using `multicall3` (deployed at `0xcA11bde05977b3631167028862bE2a173976CA11` on all chains)
2. Aggregate TVL and metrics across chains
3. Allow chain-specific filtering
4. Handle partial failures gracefully (one chain's RPC being slow shouldn't block the others)
