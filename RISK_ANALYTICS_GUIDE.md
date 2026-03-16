# Vanna Finance — Risk Analytics Dashboard: Comprehensive Guide

> **Purpose**: This document serves as the master reference for building and iterating on Vanna Finance's Risk Analytics Dashboard. It analyses leading DeFi risk monitoring SaaS services, maps their features to Vanna's protocol architecture, and provides a clear reimplementation plan.

---

## Table of Contents

1. [DeFi Risk Monitoring SaaS Landscape](#1-defi-risk-monitoring-saas-landscape)
2. [Feature Matrix — What Each Service Offers](#2-feature-matrix)
3. [Vanna Protocol Context](#3-vanna-protocol-context)
4. [Feature Mapping — What Applies to Vanna](#4-feature-mapping)
5. [Dashboard Architecture & Sections](#5-dashboard-architecture)
6. [Implementation Priorities](#6-implementation-priorities)

---

## 1. DeFi Risk Monitoring SaaS Landscape

### Tier 1 — Dedicated Risk Management Platforms

#### 1.1 Chaos Labs (chaoslabs.xyz)
**What they do**: Industry-leading risk management, economic security, and incentive optimization for DeFi protocols.

**Key Features**:
- **Risk Explorer / Exposure Simulator**: Simulate asset price drops (e.g., "What if ETH drops 20%?") and see protocol-wide impact — wallets eligible for liquidation (HF < 1), wallets at risk (HF 1–1.2), bad debt exposure
- **Real-time Risk Oracles**: On-chain risk parameter updates (supply/borrow caps, LTV, liquidation thresholds) that react to market conditions in real time
- **Markets Table**: Cross-chain market overview — chain, market name, collateral assets, borrow assets, total supply
- **Alerts System**: Severity-based (HIGH/LOW) alerts for whale movements, liquidity events, borrow concentration risk
- **Bad Debt Tracking**: Aggregate and per-wallet bad debt with total protocol value context
- **Time-Series Charts**: Total Supply Over Time, Utilization Rate, Borrow Rate — all per-chain

**Notable Clients**: Aave, Benqi, Venus, GMX, dYdX, Jupiter, Lido
**Pricing**: Enterprise — custom per protocol

**Design Inspiration**: Dark theme (#0D0F17 backgrounds), clean card layouts, gradient CTAs, SVG line charts with gradient fills, minimal borders, compact metric cards with arrow indicators.

---

#### 1.2 Gauntlet (gauntlet.xyz)
**What they do**: Simulation-driven risk modeling, parameter optimization, and quantitative DeFi research.

**Key Features**:
- **Agent-Based Simulations**: Thousands of daily simulations modeling catastrophic market scenarios
- **Parameter Optimization**: Automated selection of borrow/liquidation collateral factors, supply caps, interest rate curves
- **Risk Dashboards**: Public dashboards showing Value at Risk (VaR), Liquidations at Risk (LaR), Mint Usage (MU)
- **Slippage Curves**: Visual models of liquidity depth and execution cost
- **VaultBook**: Vault details, curation methodologies, yield optimization strategies
- **Multi-chain**: Ethereum, Base, Optimism, Arbitrum

**Notable Clients**: Morpho, Pendle, Compound, Aave (former), Synthetix
**Pricing**: Enterprise — custom per protocol

**Key Metrics**:
- VaR (Value at Risk): Capital at risk due to insolvencies under market stress
- LaR (Liquidations at Risk): Capital at risk due to liquidations under market stress
- MU (Mint Usage): Protocol utilization efficiency

---

#### 1.3 Block Analitica (blockanalitica.com)
**What they do**: Risk intelligence for DeFi — custom dashboards, risk monitoring, modeling & simulations.

**Key Features**:
- **Custom Protocol Dashboards**: Surface protocol health, risk parameters, governance-critical data
- **Risk Monitoring & Advisory**: Asset onboarding evaluation, parameter setting, market shift response
- **Stress Tests & Simulations**: Evaluate risk scenarios before they materialize
- **Asset Risk Engine**: Designed for unsecured credit lines — models yields and proposes optimal LTV ratios
- **Sphere Risk Scores**: Framework for comparing risk-adjusted yields
- **Agent Sphere**: AI-powered risk analyst

**Notable Clients**: Sky/MakerDAO, Spark, Compound, Morpho, Ajna, eBTC, HyperLend
**Securing**: $17B+ in on-chain assets
**Pricing**: Enterprise — custom

---

#### 1.4 LlamaRisk (llamarisk.com)
**What they do**: Comprehensive risk management — analytics, research, and LlamaGuard for DeFi protocols.

**Key Features**:
- **LlamaGuard**: Next-gen oracle operationalizing risk methodologies — smart price feeds, proof-of-reserves, protocol insights dashboards
- **Real-time Analytics**: Cross-chain monitoring with risk scoring dashboards
- **Research**: Quantitative analysis focused on stablecoins, pegged assets, and RWAs
- **Observability**: Real-time dashboards with proof-of-reserves verification
- **Automation**: Proactive monitoring systems responding to emerging risks
- **Legal & Regulatory**: Compliance support and regulatory framework guidance

**Notable Clients**: Aave, Curve, Ethena, Chainlink
**Pricing**: Enterprise — custom

---

#### 1.5 Risk DAO (riskdao.org)
**What they do**: Open-source risk assessment framework for DeFi lending/borrowing protocols.

**Key Features**:
- **Bad Debt Dashboard** (bad-debt.riskdao.org): Periodically scans ALL user debt vs collateral — tracks insolvencies in real time
  - Full user scan weekly, active user scan hourly
  - Uses Krystal price feed API for real-time prices
  - Open source (GitHub: Risk-DAO/bad-debt-frontend)
- **Protocol Coverage**: 8+ lending platforms across multiple chains
- **Compound-Compatible**: Works with Compound-fork protocols natively

**Notable Coverage**: Aave V3 (Arbitrum, Avalanche, Optimism, Polygon), Compound, various Compound forks
**Pricing**: Free / Open Source

---

### Tier 2 — Security & Threat Detection

#### 1.6 Hypernative (hypernative.io)
**What they do**: Real-time Web3 security and threat detection.

**Key Features**:
- Real-time threat prevention and anomaly detection
- Liquidity pool toxicity monitoring
- Customizable risk thresholds and compliance tools
- Pre/during/post-execution visibility

**Notable Clients**: Wintermute, institutional DeFi participants

---

#### 1.7 Forta (forta.org)
**What they do**: AI-powered protocol monitoring and on-chain alert network.

**Key Features**:
- Forta Firewall: Prevents 99%+ of hacks
- Detection bots for anomaly identification
- Protocol and rollup integration
- Community-driven bot marketplace

---

### Tier 3 — Analytics & Monitoring Platforms

#### 1.8 DeFi Saver (defisaver.com)
**What they do**: All-in-one DeFi lending dashboard with automated protection.

**Key Features**:
- Automated liquidation protection (24/7 position monitoring)
- Multi-protocol lending management (Aave, Compound, MakerDAO)
- Position adjustment automation
- Health factor monitoring with auto-repay/boost

---

#### 1.9 DeFiSafety (defisafety.com)
**What they do**: Independent quality and ratings organization for DeFi products.

**Key Features**:
- Transparent security scoring methodology
- Protocol quality evaluation
- Risk assessment reports

---

#### 1.10 General Analytics
- **DefiLlama** (defillama.com) — TVL tracking, yield aggregation, protocol comparisons
- **Dune Analytics** (dune.com) — Custom SQL dashboards, on-chain data
- **Nansen** — Wallet labeling, smart money tracking, flow analysis
- **DeBank** — Portfolio tracking, DeFi position management

---

## 2. Feature Matrix

| Feature | Chaos Labs | Gauntlet | Block Analitica | LlamaRisk | Risk DAO | Relevance to Vanna |
|---------|-----------|----------|-----------------|-----------|----------|-------------------|
| Risk Explorer / Price Simulator | ✅ Core | ✅ Simulation | ⬜ Advisory | ⬜ | ⬜ | **HIGH** — ETH price simulation |
| Bad Debt Dashboard | ✅ | ⬜ | ⬜ | ⬜ | ✅ Core | **HIGH** — Track underwater positions |
| Wallet List by HF Range | ✅ | ⬜ | ⬜ | ⬜ | ✅ | **HIGH** — Expandable address lists |
| Liquidation Monitor | ✅ | ✅ LaR | ✅ | ⬜ | ⬜ | **HIGH** — HF distribution |
| Markets Table | ✅ | ⬜ | ✅ | ⬜ | ⬜ | **HIGH** — Per-asset stats |
| Time-Series Charts | ✅ | ✅ | ✅ | ✅ | ⬜ | **HIGH** — Supply, util, rate history |
| Interest Rate Model Curve | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | **HIGH** — Already implemented |
| Alerts (Whale/Liquidity) | ✅ | ⬜ | ⬜ | ✅ Auto | ⬜ | **MEDIUM** — Needs indexer/event listener |
| Parameter Optimization | ⬜ | ✅ Core | ✅ | ⬜ | ⬜ | **LOW** — Governance-level feature |
| VaR / LaR Metrics | ⬜ | ✅ Core | ⬜ | ⬜ | ⬜ | **MEDIUM** — Requires simulation engine |
| Risk Oracles | ✅ Core | ⬜ | ⬜ | ✅ LlamaGuard | ⬜ | **LOW** — On-chain oracle system |
| Proof of Reserves | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | **LOW** — Not needed for lending |
| Position Simulator | ✅ | ✅ | ⬜ | ⬜ | ⬜ | **HIGH** — Already implemented |

---

## 3. Vanna Protocol Context

### Supported Tokens (ONLY these exist in the project)
| Token | Symbol | Decimals | Type | Simulatable |
|-------|--------|----------|------|-------------|
| Ethereum | ETH/WETH | 18 | Volatile | **YES** — only volatile asset |
| USD Coin | USDC | 6 | Stablecoin | NO — pegged to $1 |
| Tether USD | USDT | 6 | Stablecoin | NO — pegged to $1 |

### Supported Chains
| Chain | ID | Color |
|-------|----|-------|
| Base | 8453 | #0052FF |
| Arbitrum | 42161 | #28A0F0 |
| Optimism | 10 | #FF0420 |

### Protocol Architecture
- **Lending Model**: Undercollateralized leverage up to 10x, no liquidation risk (unique to Vanna)
- **Health Factor**: `HF = (Collateral × 0.9) / Debt`
- **Collateral Factor**: 90% (0.9)
- **vTokens**: ERC-4626 yield-bearing tokens (vUSDC, vUSDT, vETH)
- **Rate Model**: LinearRateModel with base rate, slope1, slope2, optimal utilization kink
- **Data Access**: Direct on-chain reads via viem `readContract`

### Key Contracts per Chain
- RiskEngine — `getBalance()`, `getBorrows()`, `isAccountHealthy()`
- VToken (ERC-4626) — `totalAssets()`, `getBorrows()`, `rateModel()`
- Registry — `accountsOwnedBy()`, `VTokenFor()`
- OracleFacade — `getPrice()`
- LinearRateModel — `getBorrowRatePerSecond()`, `baseRate()`, `slope1()`, `slope2()`, `OPTIMAL_USAGE_RATIO()`

### Data Limitations
- **No global position enumeration**: Registry only looks up by owner address. To list ALL positions, an indexer (subgraph/event scanning) is needed.
- **No historical data on-chain**: Time-series charts require an indexer or archive node queries.
- **Dummy data fills these gaps** until indexer infrastructure is built.

---

## 4. Feature Mapping — What Applies to Vanna

### MUST HAVE (Currently Implemented)
1. **Protocol Overview** — TVL, supplied, borrowed, utilization (on-chain)
2. **Lending Pools Table** — Per-token stats with utilization bars
3. **Risk Explorer** — ETH-only price simulator (ETH is the ONLY volatile asset)
4. **Eligible for Liquidations** (HF < 1) — Value, wallet count, bad debt (dummy)
5. **Risk for Liquidations** (HF 1-1.2) — Value, wallet count (dummy)
6. **Wallet Lists by HF Range** — Expandable accordion with address tables (<1, 1-1.1, 1.1-1.2, 1.2-1.5, >1.5)
7. **Bad Debt Monitor** — Total bad debt, ratio, reserve fund, per-asset breakdown
8. **Market Stats** — Per-token cards with supply, borrow, utilization, wallet count, risk tier
9. **Interest Rate Model** — Borrow rate vs utilization curve with kink visualization
10. **Time-Series Charts** — Supply, utilization, borrow rate, bad debt over time (dummy)
11. **Position Simulator** — Custom position stress testing
12. **My Position** — Connected wallet health (on-chain)
13. **HF Distribution** — Bar chart showing position distribution across HF ranges

### NICE TO HAVE (Future)
- Alerts system (whale movements, liquidity events) — requires event indexing
- VaR / LaR metrics — requires Monte Carlo simulation
- Historical data — requires indexer/subgraph
- Risk scoring per asset — requires broader market data

---

## 5. Dashboard Architecture

### Section Order
1. **Overview** — High-level protocol metrics + time-series charts
2. **Risk Explorer** — ETH price simulation with liquidation impact
3. **Markets** — Per-token market statistics
4. **Bad Debt** — Bad debt analysis with history chart
5. **Liquidations** — HF distribution + wallet lists by range
6. **Rates** — Interest rate model visualization
7. **My Position** — Connected wallet position
8. **Simulator** — Hypothetical position stress test

### Design System (Vanna Brand)
- **Dark mode**: #0D0D12 page, #141419 cards, #1E1E26 borders
- **Light mode**: #F7F7F7 page, #FFFFFF cards, #E5E7EB borders
- **Brand Colors**: Violet-500 (#703AE6), Rose-500 (#FF007A), Imperial Red (#FC5457), Electric Blue (#32EEE2)
- **Gradient CTA**: `linear-gradient(135deg, #FC5457 10%, #703AE6 80%)`
- **Font**: Plus Jakarta Sans (system)
- **HF Colors**: Safe (#32EEE2), Caution (#703AE6), Warning (#FF007A), Danger (#FC5457)

### Data Strategy
| Data Point | Source | Status |
|-----------|--------|--------|
| TVL, Supply, Borrow | On-chain (vToken.totalAssets, getBorrows) | ✅ Live |
| Utilization | Computed from supply/borrow | ✅ Live |
| Interest Rates | On-chain (LinearRateModel) | ✅ Live |
| Rate Model Parameters | On-chain (baseRate, slope1, slope2) | ✅ Live |
| User Positions | On-chain (Registry + RiskEngine) | ✅ Live |
| Token Prices | On-chain (OracleFacade) or API | ⚠️ Partial |
| All Wallet Positions | Needs indexer | 🔴 Dummy |
| Historical Time-Series | Needs indexer | 🔴 Dummy |
| Bad Debt Tracking | Needs position scanning | 🔴 Dummy |
| Wallet HF Breakdown | Needs indexer | 🔴 Dummy |

---

## 6. Implementation Priorities

### Phase 1 — Current (Dummy Data) ✅
- Full dashboard with all sections
- Realistic dummy data for wallet positions
- ETH-only simulator (no WBTC, no stablecoins in dropdown)
- Per-chain data filtering via wagmi `useChainId()`
- Light/dark mode support

### Phase 2 — Live Data Integration
- Replace dummy wallet positions with subgraph/indexer data
- Replace dummy time-series with historical indexed data
- Integrate real-time oracle prices for ETH
- Add WebSocket/polling for live updates

### Phase 3 — Advanced Features
- Whale alert system (monitor large transfers/withdrawals)
- Monte Carlo VaR simulation
- Risk scoring model per asset
- Governance parameter recommendation engine

---

## Sources

- [Chaos Labs](https://chaoslabs.xyz/) — Risk management, Risk Oracles, analytics
- [Chaos Labs Analytics](https://chaoslabs.xyz/analytics) — Dashboard reference
- [Gauntlet](https://www.gauntlet.xyz/) — Simulation-driven risk modeling
- [Block Analitica](https://blockanalitica.com/) — Risk intelligence, custom dashboards
- [LlamaRisk](https://www.llamarisk.com/) — LlamaGuard, analytics, research
- [Risk DAO Bad Debt Dashboard](https://bad-debt.riskdao.org/) — Open-source bad debt tracking
- [Risk DAO GitHub](https://github.com/Risk-DAO/bad-debt-frontend) — Bad debt dashboard source
- [Hypernative](https://www.hypernative.io/) — Real-time threat detection
- [Forta](https://forta.org/) — AI-powered protocol monitoring
- [DeFi Saver](https://defisaver.com/) — Automated liquidation protection
- [DeFiSafety](https://www.defisafety.com/) — Protocol quality ratings
- [DefiLlama](https://defillama.com/) — TVL and protocol analytics
