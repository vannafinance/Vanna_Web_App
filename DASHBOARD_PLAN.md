# Vanna Finance — Risk Analytics Dashboard: Implementation Plan

## Architecture

- **Framework**: Next.js (App Router) — already in place
- **Data fetching**: wagmi v2 + viem (already configured) with multicall batching
- **Styling**: Tailwind CSS v4 (already configured) — dark glassmorphism theme
- **Charts**: chart.js + react-chartjs-2 (already installed), lightweight-charts for time-series
- **State**: Zustand stores + TanStack Query (via wagmi)
- **Multi-chain**: Base, Arbitrum, Optimism — parallel queries with partial failure handling

---

## Route Structure

```
app/risk/
├── layout.tsx          — Risk dashboard layout with sidebar nav
├── page.tsx            — Protocol Overview (Category 1, Sections 1.1-1.2)
├── liquidations/
│   └── page.tsx        — Liquidation Monitor (Section 1.3)
├── markets/
│   └── page.tsx        — Token Risk Matrix (Section 1.4)
├── rates/
│   └── page.tsx        — Interest Rate Monitor (Section 1.5)
├── oracle/
│   └── page.tsx        — Oracle Health (Section 1.6)
├── user/
│   └── page.tsx        — User Dashboard (Category 2, Sections 2.1-2.4)
└── simulator/
    └── page.tsx        — Risk Simulator (Section 2.3)
```

---

## Component Hierarchy

```
components/risk/
├── MetricCard.tsx           — Glassmorphism stat card
├── HealthFactorGauge.tsx    — Circular HF indicator with color
├── HealthFactorBadge.tsx    — Inline HF badge
├── RiskStatusDot.tsx        — Color-coded risk dot
├── UtilizationBar.tsx       — Progress bar for utilization
├── ChainBadge.tsx           — Chain indicator (Base/Arb/OP)
├── LiquidationTable.tsx     — Sortable at-risk wallets table
├── TokenRiskRow.tsx         — Per-token risk data row
├── PositionBreakdown.tsx    — User position table
├── PriceSimulator.tsx       — What-if price sliders
├── charts/
│   ├── TVLChart.tsx         — TVL over time (line)
│   ├── HealthFactorHistogram.tsx  — HF distribution (bar)
│   ├── InterestRateCurve.tsx      — Utilization vs rate (line)
│   ├── UtilizationDonut.tsx       — Supply vs borrow (doughnut)
│   └── BadDebtTrend.tsx           — Bad debt over time (area)
└── layout/
    ├── RiskSidebar.tsx      — Dashboard navigation sidebar
    └── RiskHeader.tsx       — Page header with chain selector
```

---

## Data Fetching Strategy

### Hooks

```
lib/hooks/risk/
├── useProtocolMetrics.ts    — TVL, utilization, totals per chain
├── useVTokenData.ts         — Per-pool supply/borrow/rates
├── useTokenPrices.ts        — Oracle prices for all tokens
├── useRateModelData.ts      — Interest rate curve parameters
├── useUserRiskPosition.ts   — Connected user's position & HF
├── useAllPositions.ts       — All positions for liquidation monitor
└── useMultichainRead.ts     — Parallel multi-chain contract reads
```

### Data Source Mapping

| Metric | Contract | Function | Chain | Refresh |
|--------|----------|----------|-------|---------|
| TVL per pool | VToken | `totalAssets()` | All 3 | 30s |
| Total borrowed | VToken | `getBorrows()` | All 3 | 30s |
| Utilization | VToken | `totalAssets()` + `getBorrows()` | All 3 | 30s |
| Token price | OracleFacade | `getPrice(token, account)` | All 3 | 15s |
| Borrow rate | LinearRateModel | `getBorrowRatePerSecond(liq, debt)` | All 3 | 60s |
| Rate params | LinearRateModel | `baseRate()`, `slope1()`, `slope2()`, `OPTIMAL_USAGE_RATIO()` | All 3 | 5min |
| User accounts | Registry | `accountsOwnedBy(user)` | All 3 | On connect |
| User collateral | RiskEngine | `getBalance(account)` | All 3 | 15s |
| User debt | RiskEngine | `getBorrows(account)` | All 3 | 15s |
| Account health | RiskEngine | `isAccountHealthy(account)` | All 3 | 15s |
| Account assets | Account | `getAssets()` | All 3 | 15s |
| Account borrows | Account | `getBorrows()` | All 3 | 15s |
| Per-token borrow | VToken | `getBorrowBalance(account)` | All 3 | 15s |

### Multicall Batching

All reads per chain are batched into a single `multicall3` call:
- Protocol overview: 6 calls per VToken × 3 tokens × 3 chains = 54 calls → 3 multicalls
- User position: ~10 calls per chain → 3 multicalls

---

## Implementation Order

### Phase 1: Foundation
1. Contract integration layer (`lib/risk/contracts.ts`) — ABIs + addresses
2. Multi-chain read hook (`useMultichainRead.ts`)
3. Risk dashboard layout + sidebar navigation

### Phase 2: Protocol Overview
4. MetricCard component
5. Protocol overview page — TVL cards, utilization, active markets
6. UtilizationBar, UtilizationDonut chart

### Phase 3: Liquidation Monitor
7. HealthFactorGauge + HealthFactorBadge components
8. HealthFactorHistogram chart (mock data initially, real data needs indexing)
9. LiquidationTable component

### Phase 4: Markets
10. TokenRiskRow component
11. Markets page — per-asset risk breakdown

### Phase 5: User Dashboard
12. User position hooks
13. User dashboard page — HF gauge, position breakdown, liquidation price

### Phase 6: Advanced
14. PriceSimulator (what-if tool)
15. InterestRateCurve chart + rates page
16. Oracle health page

### Phase 7: Polish
17. Loading states, error boundaries
18. Responsive design
19. Chain switching integration

---

## Design Tokens

```css
/* Colors */
--bg-primary: #0a0a0f        /* Deep navy/black */
--bg-card: rgba(255,255,255,0.03)
--border-card: rgba(255,255,255,0.08)
--text-primary: #ffffff
--text-secondary: #9ca3af     /* gray-400 */
--accent: #8b5cf6             /* Vanna purple */

/* Risk Colors */
--risk-safe: #22c55e
--risk-caution: #eab308
--risk-warning: #f97316
--risk-danger: #ef4444

/* Cards */
backdrop-blur: 12px
border-radius: 12px
border: 1px solid rgba(255,255,255,0.08)
```

---

## Notes

- **No fake data**: All metrics come from real contract reads. Where historical data isn't available on-chain, we show current state with a note about indexing needs.
- **Graceful degradation**: Each chain loads independently. If one chain's RPC is slow, others still render.
- **Existing code reuse**: Leverage `marginCalc` utilities from `lib/utils/margin/calculations.ts` for HF/LTV/leverage calculations.
- **Rate limiting**: Follow existing patterns (15s min fetch interval, 30s cache) to avoid RPC throttling.
