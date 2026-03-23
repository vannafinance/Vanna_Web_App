# Vanna Finance — Test Suite Documentation

## Overview

The test suite validates the **core financial logic, state management, and blockchain integration** used across the Vanna protocol. All tests run with [Vitest](https://vitest.dev/) in a `jsdom` environment.

---

## Quick Start

```bash
# Run all tests
npx vitest

# Run tests in watch mode
npx vitest --watch

# Run a specific test file
npx vitest tests/earn-calculations.test.ts

# Run with coverage report
npx vitest --coverage
```

---

## Test Files

| File | Module Under Test | Description |
|------|-------------------|-------------|
| `earn-calculations.test.ts` | `lib/utils/earn/calculations` | Pure math: exchange rates, utilization, APY/APR (kinked rate model), projected earnings, share/asset conversions, available liquidity, USD value calculations, formatting helpers, and protocol constants. |
| `token-config.test.ts` | `lib/utils/web3/token`, `lib/web3Constants` | Token configuration (decimals, asset codes), supported chains (Arbitrum, Optimism, Base), token/vToken/contract addresses per chain, `getAddressList` helper, address list completeness, and duplicate-address security checks. |
| `earn-transactions.test.ts` | `lib/utils/earn/transactions` | Supply & withdraw transaction logic: ERC-20 approval flow (check allowance → approve → deposit), ETH native deposit (`depositEth`), token withdraw/redeem, decimal parsing (6 vs 18), and unified `supply()`/`withdraw()` routing. Uses mocked wallet/public clients. |
| `earn-multicall.test.ts` | `lib/utils/earn/earnMulticall` | Multicall RPC batching: vault multicall construction (9 contracts for 3 assets), result parsing with error handling, rate model multicall for on-chain APY, user position multicall, and index calculations for multi-asset batches. |
| `price-feed.test.ts` | `lib/utils/prices/priceFeed` | USD value formatting ($, $K, $M thresholds), `calculateUsdValue` with price map, API `/api/prices` response structure validation, and stablecoin peg assertions. |
| `stores.test.ts` | `store/balance-store`, `store/margin-account-info-store`, `store/collateral-borrow-store` | Zustand store state management: initial state, reset behavior, balance lookup by asset/type (WB/MB), margin account info structure, collateral/borrow initialization, deep merge updates, and borrow percentage sum validation. |
| `position-history.test.ts` | `usePositionHistory` utilities | Position history helpers: event topic hashes (Borrow/Repay keccak256), address extraction from log topics, token symbol resolution from contract addresses, cache key generation, amount formatting via `viem.formatUnits`, and `withTimeout` utility. |
| `zustand-helpers.test.ts` | `zustand/index` (createNewStore, deepmerge) | Foundational Zustand utilities: `isObject` type guard, `deepmerge` for nested state updates, `createNewStore` factory with `get`/`set`/`reset` actions, persistence config, and devtools integration. |

---

## Test Infrastructure

### Configuration — `vitest.config.ts`

- **Environment:** `jsdom` (browser-like globals for DOM/localStorage)
- **Setup file:** `tests/setup.ts` — mocks `localStorage` and `globalThis.fetch`
- **Path alias:** `@/` maps to project root
- **Coverage provider:** `v8` with `text`, `html`, and `json-summary` reporters

### Setup — `tests/setup.ts`

- Provides an in-memory `localStorage` mock (required by Zustand persist middleware)
- Stubs `globalThis.fetch` via `vi.fn()` for API tests

---

## Conventions

1. **Sections** — Each test file is organized into numbered `describe` blocks separated by visual dividers (`// ─────`).
2. **Pure vs Mocked** — Calculation tests (`earn-calculations`) require no mocking. Transaction tests (`earn-transactions`) use mocked `walletClient`/`publicClient`. Store tests use real Zustand stores with `beforeEach` resets.
3. **Naming** — `it("description")` reads as a sentence: *"returns 1:1 when totalSupply is 0"*.
4. **Assertions** — `toBeCloseTo` for floating-point math, `toMatch(/^0x/)` for addresses, `toBe` for exact values.
5. **Security checks** — `token-config.test.ts` includes duplicate-address detection and cross-reference validation between token/vToken addresses.

---

## Coverage Targets

Coverage is configured for the following source files:

```
lib/utils/earn/calculations.ts
lib/utils/earn/transactions.ts
lib/utils/earn/earnMulticall.ts
lib/utils/web3/**/*.ts
lib/utils/prices/priceFeed.ts
store/**/*.ts
app/api/prices/route.ts
```

Run `npx vitest --coverage` to generate the report. HTML output is saved to `/coverage/`.

---

## Adding New Tests

1. Create a new file in `tests/` following the naming convention: `<module-name>.test.ts`
2. Import from `vitest`: `import { describe, it, expect } from "vitest"`
3. Use the `@/` alias for project imports
4. Add the source file to the `coverage.include` array in `vitest.config.ts` if coverage tracking is needed
