# Vanna Protocol — Spot Swap UI Architecture

### Static Frontend Blueprint v1.0

---

## Table of Contents

1. [UI Analysis of Existing Protocols](#1-ui-analysis-of-existing-protocols)
2. [Common UI Patterns Across AMM Interfaces](#2-common-ui-patterns-across-amm-interfaces)
3. [Vanna Spot Page Layout](#3-vanna-spot-page-layout)
4. [Swap Card Design](#4-swap-card-design)
5. [Static UI Components](#5-static-ui-components)
6. [Component Hierarchy](#6-component-hierarchy)
7. [Suggested Folder Structure](#7-suggested-folder-structure)
8. [UI State Design (Frontend Only)](#8-ui-state-design-frontend-only)
9. [Swap Page Wireframe](#9-swap-page-wireframe)
10. [UI States](#10-ui-states)

---

## 1. UI Analysis of Existing Protocols

---

### 1.1 Uniswap — Deep UI Analysis

**Context:** Uniswap is the gold standard AMM UI. It runs on EVM chains (Ethereum, Base, Arbitrum, Polygon, Unichain) and pioneered most of the swap UI patterns that every other DEX copies today.

---

#### Page Layout

Uniswap's swap page is a **centered single-column layout** with the swap card positioned in the vertical and horizontal center of the viewport. The background uses a subtle gradient with animated color blobs to give depth. The page does NOT have a left sidebar. Everything is card-centric.

```
[ Top Navigation Bar ]
  Logo | Swap | Explore | Pool | Positions    [ Connect Wallet ]  [ Settings ]

[ Page Background — gradient / animated blobs ]

  [ Swap Mode Tabs ]
      Swap | Limit | Send | Buy

  [ Swap Card — center ]

[ Footer — minimal ]
```

---

#### Navigation Bar

- Protocol logo on the far left
- Navigation links: **Swap**, **Explore**, **Pool**, **Positions**
- Right side: Chain selector dropdown + Connect Wallet button + Settings gear icon
- Settings gear opens a popover, NOT a full modal

---

#### Swap Mode Tabs

Uniswap now shows a **tab bar above the swap card** with four modes:

- `Swap` — standard spot swap (default)
- `Limit` — limit order
- `Send` — send tokens directly
- `Buy` — on-ramp fiat purchase

This means the swap card is actually wrapped inside a tabbed interface. The tabs visually look like pill-shaped tab buttons.

---

#### Swap Card Structure (Uniswap)

The card is a **rounded rectangle with a grey/dark background**. Internal padding is generous (~16–20px). Card width is fixed (~480px on desktop). It does NOT stretch full width.

```
┌─────────────────────────────────────────────┐
│  Sell                                [ETH ▼] │  ← From Token Row
│  [  amount input field          ]  Balance: 2.5 │
├─────────────────────────────────────────────┤
│              [↕ flip button]                │  ← Direction Button
├─────────────────────────────────────────────┤
│  Buy                               [USDC ▼] │  ← To Token Row
│  [  output amount (read-only)  ]  Balance: 100 │
├─────────────────────────────────────────────┤
│  1 ETH = 2,312.45 USDC  [↻ refresh]         │  ← Price Line
│  ▼ Show route / details                     │
├─────────────────────────────────────────────┤
│  [ Connect Wallet ] or [ Swap ]             │  ← CTA Button
└─────────────────────────────────────────────┘
```

---

#### Token Selector Button (Uniswap)

The token selector is a **pill-shaped button** displaying:

- Token logo (circular, 24px)
- Token symbol (e.g., ETH)
- Dropdown chevron icon (▼)

When no token is selected: Shows "Select token" text in the button.

The button changes background when hovered (subtle highlight).

---

#### Token Search Modal (Uniswap)

Opens as a **full modal with a dark overlay**:

```
┌────────────────────────────────────────┐
│  Select a token                    [✕] │
│  ┌──────────────────────────────────┐  │
│  │ 🔍  Search name or paste address │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Common tokens                         │
│  [ETH] [USDC] [USDT] [WBTC] [DAI]     │
│                                        │
│  ──────────── Token List ────────────  │
│  🪙 Ethereum          ETH    2.5       │
│  🪙 USD Coin          USDC   100.0     │
│  🪙 Wrapped Bitcoin   WBTC   0.012     │
│  ...                                   │
└────────────────────────────────────────┘
```

Key details:

- Search input is **auto-focused** when modal opens
- "Popular tokens" shown as quick-select chips above the list
- Token rows show: **Logo + Name + Symbol + Balance** (if wallet connected)
- Each row is clickable and closes the modal on selection
- List is virtualized (scrollable, not paginated)

---

#### Amount Input (Uniswap)

- Large numeric input field (font-size ~36px)
- Right-aligned numbers (looks cleaner for finance)
- USD value shown below the amount in smaller grey text
- "MAX" quick-fill button next to the balance
- The output field (Buy) is **read-only** — it shows the computed quote

---

#### Swap Direction Button (Uniswap)

- Centered between the two token sections
- Circular button with two vertical arrows (↕ icon)
- On hover: subtle background color change
- On click: animates the flip (tokens and amounts swap positions)
- Sometimes shows a "down arrow" (↓) not bidirectional (depending on trade direction)

---

#### Price Info / Swap Details (Uniswap)

Below the token input sections, a collapsible panel shows:

```
1 ETH = 2,312.45 USDC  [⟳ refresh price]
▼  (click to expand)

  Price Impact           < 0.01%
  Max. Slippage          0.5%
  Minimum Received       2,300.75 USDC
  Network Fee            ~$3.20
  Route                  ETH → USDC (via V3 0.05%)
```

This section is **collapsed by default** and expands on click.

---

#### Route Display (Uniswap)

When expanded, shows a visual route:

```
ETH ──[Uniswap V3 0.05%]──▶ USDC
```

For multi-hop routes:

```
ETH ──[V3 0.3%]──▶ WBTC ──[V3 0.05%]──▶ USDC
```

Shown as a horizontal chain of token logos connected by arrows and pool labels.

---

#### Settings Panel (Uniswap)

Opens as a **popover/dropdown from the settings gear** icon in the navbar. Contains:

1. **Max Slippage**
   - "Auto" (recommended) selected by default
   - Or custom percentage input field
2. **Transaction Deadline** — minutes input
3. **Frontrunning Protection** toggle
4. **Expert Mode** toggle (hidden behind warning confirmation)

---

#### Swap Button States (Uniswap)

| State                | Button Label               | Style                         |
| -------------------- | -------------------------- | ----------------------------- |
| Wallet not connected | "Connect Wallet"           | Blue/Purple filled            |
| Token not selected   | "Select a token"           | Grey disabled                 |
| Amount not entered   | "Enter an amount"          | Grey disabled                 |
| Loading quote        | "Fetching best price..."   | Grey with spinner             |
| Insufficient balance | "Insufficient ETH balance" | Red/disabled                  |
| Ready to swap        | "Swap"                     | Blue/Purple filled, clickable |
| Approval needed      | "Approve USDC"             | Two-step: Approve first       |

---

#### Unique Uniswap UI Patterns

1. **Exact Input vs Exact Output** — User can type in either the "Sell" or "Buy" field. Whichever field the user types in becomes the "exact" side. The other side auto-fills with the quote.
2. **Price refresh timer** — A small refresh icon with a countdown appears when a quote is stale
3. **Price Impact warnings** — Yellow warning at 1–5%, Red warning + confirmation modal above 5%
4. **Permit2 approval flow** — Single signature approval instead of per-token approvals (EIP-2612)
5. **Chain selector** — Inline dropdown in the header to switch chains without leaving the swap page

---

### 1.2 Aerodrome — Deep UI Analysis

**Context:** Aerodrome is a ve(3,3) AMM on Base (L2). It was forked from Velodrome. The UI is visually dark-themed and more compact than Uniswap, with a focus on stability and speed (2-second confirmation times on Base).

---

#### Page Layout

Aerodrome uses a **dark theme** with a sidebar-less layout. The background is deep dark navy/black. A prominent navigation bar runs across the top.

```
[ Navigation Bar ]
  Logo | Swap | Liquidity | Rewards | Governance | Launchpad
                                            [ Connect Wallet ]

[ Page Content ]
  [ Swap Card — centered ]
  [ Pool stats strip below card ]
```

---

#### Swap Card Structure (Aerodrome)

Aerodrome's card is more **compact and dense** than Uniswap. It uses less white space and fits more information in a tighter area.

```
┌─────────────────────────────────────────────┐
│  From                                       │
│  [ETH logo] ETH  ▼      [     1.0      ]   │
│                         Balance: 2.5 ETH   │
│                         ≈ $2,312.00        │
├──────────────[ ↕ flip ]─────────────────────┤
│  To                                         │
│  [USDC logo] USDC ▼     [   2,300.50   ]   │
│                         Balance: 100 USDC  │
│                         ≈ $2,300.50        │
├─────────────────────────────────────────────┤
│  Route:  ETH → USDC (Volatile Pool 0.3%)   │
│  Rate:   1 ETH = 2,300.50 USDC             │
├─────────────────────────────────────────────┤
│  Exchange rate found...       [Refresh]     │
│  0.5% slippage applied...     [Adjust]      │
│  Min received: 2,288.99 USDC               │
│  Price impact: 0.04%                       │
├─────────────────────────────────────────────┤
│  [        Swap        ]                     │
└─────────────────────────────────────────────┘
```

---

#### Unique Aerodrome Features

**Pool Type Routing:**
Aerodrome distinguishes between **Stable Pools** and **Volatile Pools** in the route display:

- `Stable Pool (sAMM-USDC/DAI)` — correlated assets, low slippage formula
- `Volatile Pool (vAMM-ETH/USDC)` — standard x\*y=k AMM
- `Concentrated Liquidity Pool (CL-X)` — Uniswap v3-style tick-based

The route display shows the pool type, which helps users understand why they got a specific rate.

**Swap Details (Numbered List Style):**
Aerodrome shows swap details as a **numbered checklist**:

```
1. Exchange rate found...    ✓  [Refresh icon]
2. 0.5% slippage applied...  ✓  [Adjust link]
3. Minimum received: 2,288 USDC
4. Price impact: 0.04%
5. Allow USDC  (if approval needed)
```

This is a distinct pattern — it presents the swap pipeline as sequential steps, not just a key-value info panel.

**Unsafe Swap Toggle:**
Aerodrome has an "Unsafe swaps" toggle (hidden in settings). When enabled, it allows swaps with >5% price impact. This creates a distinct UI state where the swap button shows a red warning.

**Token Selector:**

- No "common tokens" quick-select chips
- Search by name or contract address
- Shows token logo, symbol, name, and balance

---

#### Settings Panel (Aerodrome)

Accessed via a gear icon near the swap card (not in global nav):

- **Slippage Tolerance** — input field + preset chips (0.1%, 0.5%, 1%)
- **Transaction Deadline** — minutes
- **Unsafe Swaps** toggle

---

### 1.3 Soroswap — Deep UI Analysis

**Context:** Soroswap is the **first DEX and DEX aggregator on Stellar/Soroban**. It runs on a completely different blockchain paradigm than EVM chains. Stellar uses a native DEX (SDEX) and Soroban smart contracts. Soroswap aggregates across Soroswap AMM, Phoenix, Aquarius, and SDEX.

---

#### Page Layout

Soroswap uses a **clean light/dark hybrid theme** with a simple top navigation. The UI is notably **simpler and more minimal** than Uniswap — appropriate for the Stellar ecosystem which is newer to DeFi.

```
[ Navigation Bar ]
  Logo  |  Swap  |  Liquidity  |  Bridge          [ Connect Wallet ]

[ Swap Card — centered on page ]

[ Route visualization below card ]
```

---

#### Swap Card Structure (Soroswap)

```
┌─────────────────────────────────────────────┐
│  You Pay                                    │
│  [XLM logo] XLM ▼          [   10.00   ]  │
│                             Balance: 250.0 │
├──────────────[ ↕ ]──────────────────────────┤
│  You Receive                                │
│  [USDC logo] USDC ▼        [    1.247  ]  │
│                             Balance: 0.0   │
├─────────────────────────────────────────────┤
│  Protocol: [ Soroswap ▼ ] (aggregator sel)  │
├─────────────────────────────────────────────┤
│  ▼ Details                                  │
│  Exchange Rate: 1 XLM = 0.1247 USDC        │
│  Min Received: 1.234 USDC                  │
│  Price Impact: 0.12%                       │
│  Network Fee: 0.0001 XLM (Stellar)         │
├─────────────────────────────────────────────┤
│  [  Connect Freighter  ] or [  Swap  ]      │
└─────────────────────────────────────────────┘
```

---

#### Unique Soroswap Features

**Stellar Wallet Connect:**

- Soroswap uses **Freighter** wallet (Stellar's MetaMask equivalent)
- Wallet connect button shows Freighter-specific copy
- No EVM wallet support (no MetaMask, WalletConnect)

**Aggregator Protocol Selector:**
Soroswap acts as an aggregator — the user (or the system) can select which underlying protocol to route through:

- Soroswap AMM
- Phoenix Protocol
- Aquarius AMM
- SDEX (Stellar DEX native orderbook)

This is a **DEX selector dropdown** directly on the swap card — a very unique pattern not seen on Uniswap.

**Route Visualization:**
Shows a multi-hop route diagram below the swap card:

```
XLM ──[Soroswap]──▶ yXLM ──[Phoenix]──▶ USDC
```

**Token Identification (Stellar-specific):**
Stellar tokens have a unique `CODE:ISSUER` format (e.g., `AQUA:GBNZ...AQUA`). Soroswap's token list shows:

- Token code (e.g., `USDC`)
- Issuer truncated (e.g., `GA5Z...89FF`)
- The token logo from metadata
- A "verified" badge for trusted assets

This issuer display is unique to Stellar and requires special UI handling.

**Transaction Type:**
Stellar has a concept of "path payments" for multi-hop swaps. Soroswap's UI indicates whether it's a direct swap or a path payment route.

---

#### Soroswap Token Search Modal

```
┌────────────────────────────────────────┐
│  Select Asset                      [✕] │
│  ┌──────────────────────────────────┐  │
│  │ 🔍  Search by name or code       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Popular Assets                        │
│  [XLM] [USDC] [AQUA] [yXLM] [BTC]    │
│                                        │
│  ✅ Verified        📋 All             │
│                                        │
│  🌟 XLM        Stellar Lumens  250.0   │
│  💵 USDC       Centre USDC     0.0     │
│  💧 AQUA       Aquarius        500     │
└────────────────────────────────────────┘
```

Notable: A "Verified / All" **tab filter** to show only trusted vs all Stellar assets.

---

### 1.4 Aquarius — Deep UI Analysis

**Context:** Aquarius (`aqua.network`) is Stellar's DeFi hub. It started as a **liquidity incentive layer** on top of Stellar's native SDEX and evolved into its own AMM (Soroban-based CPMM and StableSwap pools). The UI emphasizes governance, voting, and rewards alongside swapping.

---

#### Page Layout

Aquarius uses a **dark purple/indigo theme** with a more structured layout that includes navigation for multiple features (Swap, Pools, Vote, Governance):

```
[ Navigation Bar ]
  Logo  | Swap | Pools | Vote | Governance | Rewards    [ Connect Wallet ]

[ Swap Page ]
  [ Swap Card ]
  [ Pool Selector / Best Route Panel ]
  [ Market stats / rewards banner ]
```

---

#### Swap Card Structure (Aquarius)

The Aquarius swap URL format (`/swap/native/AQUA:GBNZ.../`) reveals that tokens are embedded in the route path — unique to Stellar's asset model.

```
┌─────────────────────────────────────────────┐
│  From                                       │
│  [ XLM (native) ▼ ]      [    10.00    ]  │
│                           ≈ $1.24          │
│                           Balance: 250 XLM │
├──────────────[ ⇅ ]──────────────────────────┤
│  To                                         │
│  [ AQUA:GBNZ...AQUA ▼ ]  [  11,235.0  ]  │
│                           ≈ $1.24          │
│                           Balance: 0       │
├─────────────────────────────────────────────┤
│  Best Rate via:  Aquarius AMM (StableSwap) │
│  Also available: SDEX Orderbook            │
│                                             │
│  Rate:  1 XLM = 1,123.5 AQUA              │
│  Fee:   0.3%                               │
│  Price Impact: 0.02%                       │
│  Min Received: 11,122.0 AQUA              │
│  Slippage: 0.5%                  [Edit]   │
├─────────────────────────────────────────────┤
│  [ Connect Wallet ] or [ Swap Now ]         │
└─────────────────────────────────────────────┘
```

---

#### Unique Aquarius Features

**Stellar Asset Format in URL:**
The URL structure `/swap/native/AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA/` means the full asset identifier (code + issuer) is part of the URL. The UI must parse and display this correctly — showing just "AQUA" in the UI while storing the full issuer in state.

**Multi-source Route Display:**
Aquarius aggregates from:

1. Aquarius CPMM Pools (volatile)
2. Aquarius StableSwap Pools
3. Stellar SDEX (native orderbook)

The UI shows which source gives the best rate, with a secondary option visible. Users can manually switch between sources.

**AQUA Rewards Banner:**
A special banner near the swap card shows if swapping this pair earns AQUA rewards. Example:

```
🎁  This pair earns AQUA rewards: +45 AQUA estimated
```

**Governance Voting Banner:**
Prominent links to vote for this pair's liquidity incentives.

**Token Selector — Issuer Awareness:**
When multiple assets have the same `CODE` but different issuers (e.g., two different USDC issuers on Stellar), Aquarius shows the full issuer in the token list with a disambiguation UI. This is a critical Stellar-specific pattern.

---

#### Aquarius Settings Panel

- Slippage tolerance input
- Toggle between AMM / SDEX routing
- Path payment max hops selection (Stellar-specific)

---

## 2. Common UI Patterns Across AMM Interfaces

After deep analysis of Uniswap, Aerodrome, Soroswap, and Aquarius, the following **universal UI patterns** emerge:

---

### Pattern 1: The Dual-Token Input Card

Every AMM uses a card with two token input sections — "From" and "To" — separated by a flip button. This is the fundamental atomic unit of a swap UI. The card:

- Has a fixed width (~440–520px)
- Is centered on the page
- Has rounded corners and a distinct background from the page

### Pattern 2: Token Selector as Pill Button

All protocols show the selected token as a pill-shaped button containing: `[Logo] [Symbol] [▼]`. When no token is selected, the button shows "Select token" or "Select asset".

### Pattern 3: One Editable + One Derived Field

The "From" amount is editable; the "To" amount is derived (read-only, shows the quote). Some advanced interfaces (Uniswap) allow editing either field. The derived field typically shows a loading skeleton while fetching a quote.

### Pattern 4: The Token Search Modal

All protocols use a modal (dialog overlay) for token selection containing:

1. Search input (auto-focused)
2. Popular/pinned tokens as quick-select chips
3. Scrollable token list with logo, name, symbol, balance

### Pattern 5: Inline Swap Details Panel

All protocols show a collapsible or always-visible panel below the inputs showing:

- Exchange rate
- Price impact
- Slippage tolerance
- Minimum received amount
- Fee estimate

### Pattern 6: The Swap CTA Button

A single full-width button at the bottom of the card. It is the primary CTA. Its label and disabled state change based on the current UI state. This button handles multiple states: connect wallet → approve token → execute swap.

### Pattern 7: Settings as Gear Icon

A ⚙️ icon opens a settings panel. All protocols follow this pattern. The settings always include slippage control.

### Pattern 8: Price Impact Color Coding

All protocols use a traffic light system for price impact:

- Green / neutral: < 1%
- Yellow warning: 1–5%
- Red warning / blocking: > 5%

### Pattern 9: Token Balance Display with MAX

User's token balance is shown near the input field. A "MAX" button allows one-click fill of the full balance.

### Pattern 10: DEX / Protocol Selector (Aggregators)

Soroswap and Aquarius add a protocol/DEX selector — allowing users to choose which underlying AMM to route through, or showing which one was automatically selected as best.

---

## 3. Vanna Spot Page Layout

Vanna Protocol's swap page is designed to be **protocol-agnostic** — it can support any AMM backend (Uniswap, Aerodrome, Soroswap, Aquarius) without UI changes. The layout is clean, dark-themed, and modern.

---

### Overall Page Sections

```
┌─────────────────────────────────────────────────────────┐
│                     HEADER / NAVBAR                     │
│  Logo | Swap | Pools | Analytics    [Chain] [Wallet]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   DEX SELECTOR STRIP                    │
│         [ All ] [ Uniswap ] [ Aerodrome ] [ Soroswap ]  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                     SWAP CARD AREA                      │
│                                                         │
│                  ┌──────────────┐                       │
│                  │  SWAP CARD   │                       │
│                  └──────────────┘                       │
│                                                         │
│                  ┌──────────────┐                       │
│                  │  PRICE INFO  │                       │
│                  └──────────────┘                       │
│                                                         │
│                  ┌──────────────┐                       │
│                  │  ROUTE INFO  │                       │
│                  └──────────────┘                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                        FOOTER                           │
└─────────────────────────────────────────────────────────┘
```

---

### Section Descriptions

#### Header / Navbar

- Protocol logo + name ("Vanna")
- Navigation links: Swap, Pools, Analytics
- Right side: Chain selector dropdown + Wallet connect button + Settings gear
- Sticky on scroll

#### DEX Selector Strip

- A horizontal tab/chip row below the navbar
- Options: "Best Rate" (default, auto-selects best) + individual DEX tabs
- Shows the selected DEX's branding color subtly
- Hidden when only one DEX is configured for a chain
- Protocol-agnostic: new DEXes can be added by just adding a new chip

#### Swap Card Area

- Centered, max-width ~480px
- Vertically centered in the available viewport
- Three stacked cards: Swap Card → Price Info → Route Info

#### Footer

- Legal links, docs, socials
- Minimal and unobtrusive

---

## 4. Swap Card Design

The Vanna swap card is the core UI component. It is a **self-contained, stateless UI shell** — all data is passed in as props; no blockchain calls are made inside.

---

### Full Card Structure

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  FROM TOKEN SECTION                         │   │
│  │                                             │   │
│  │  [ Token Selector Button ]   [ Amount Input ]  │  │
│  │  [Logo] ETH ▼               [   1.0000    ]   │  │
│  │                                             │   │
│  │  Balance: 2.541 ETH              [MAX]      │   │
│  │  ≈ $2,312.45                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                  [ ↕ SwapDirectionButton ]          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  TO TOKEN SECTION                           │   │
│  │                                             │   │
│  │  [ Token Selector Button ]   [ Amount Output] │  │
│  │  [Logo] USDC ▼              [  2,300.00   ]   │  │
│  │                                             │   │
│  │  Balance: 0.00 USDC                         │   │
│  │  ≈ $2,300.00                                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  SWAP DETAILS (collapsible)                 │   │
│  │  1 ETH = 2,300.45 USDC  [⟳]  ▼             │   │
│  │                                             │   │
│  │  Price Impact       0.04%                   │   │
│  │  Slippage           0.5%            [Edit]  │   │
│  │  Min. Received      2,288.94 USDC           │   │
│  │  Fee                0.3%                    │   │
│  │  Network Cost       ~$1.20                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ ─────────────────── SWAP BUTTON ─────────────── ] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### Sub-sections Breakdown

#### From Token Section

- Top row: `TokenSelector` component (left) + `AmountInput` component (right)
- Bottom row: `TokenBalance` (left) + `UsdValue` (right) + `MaxButton`
- Background: slightly lighter than the card background to differentiate the input zone

#### Swap Direction Button

- Centered between From and To sections
- Fixed height zone (~48px) with the button in the center
- The button itself is circular (~40px diameter)

#### To Token Section

- Same layout as From Token Section
- The amount field is **read-only** (shows computed quote)
- Shows a loading skeleton when fetching quote

#### Swap Details (Collapsible)

- Header row: exchange rate + refresh button + expand/collapse chevron
- Expanded content: price impact, slippage, min received, fee, network cost
- Entire section is optional — hidden when no quote loaded

#### Swap Button

- Full width
- Single source of truth for all action states

---

## 5. Static UI Components

All components below are **purely presentational** — they receive data as props and emit events (callbacks). Zero blockchain logic.

---

### 5.1 Swap Components (`components/swap/`)

---

#### `SwapCard`

**Purpose:** The main container for the entire swap interaction area.

**Props:**

```typescript
interface SwapCardProps {
  children: React.ReactNode;
  className?: string;
}
```

**Renders:**

- `FromTokenSection` (SwapInput for sell side)
- `SwapDirectionButton`
- `ToTokenSection` (SwapInput for buy side)
- `SwapDetails` (collapsible)
- `SwapButton`

**Notes:** This component only controls layout. No state logic.

---

#### `SwapInput`

**Purpose:** A single token input section (used for both From and To).

**Props:**

```typescript
interface SwapInputProps {
  label: string; // "From" | "To" | "You Pay" | "You Receive"
  token: Token | null;
  amount: string;
  amountUsd: string | null;
  balance: string | null;
  isReadOnly?: boolean; // true for the "To" field
  isLoading?: boolean; // true when fetching quote
  onTokenSelect: () => void; // opens TokenSearchModal
  onAmountChange?: (val: string) => void;
  onMaxClick?: () => void;
  showMax?: boolean;
}
```

**Internal sub-components:** `TokenSelector`, `AmountInput`, `TokenBalance`, `UsdValue`, `MaxButton`

---

#### `TokenSelector`

**Purpose:** The pill-shaped button that shows the selected token and opens the search modal.

**Props:**

```typescript
interface TokenSelectorProps {
  token: Token | null;
  onClick: () => void;
  disabled?: boolean;
}
```

**Renders:**

- If `token` is null: "Select token" text in a pill button
- If `token` is set: Token logo + symbol + dropdown chevron

**Sizes:** default (`md`) and compact (`sm`)

---

#### `TokenSearchModal`

**Purpose:** The modal overlay for token search and selection.

**Props:**

```typescript
interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  tokens: Token[];
  popularTokens: Token[];
  balances?: Record<string, string>; // tokenAddress -> balance string
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading?: boolean;
}
```

**Renders:**

- Modal overlay + panel
- Search input (auto-focused)
- Popular tokens chip row
- `TokenList` component
- Loading skeleton when `isLoading` is true

---

#### `TokenList`

**Purpose:** The scrollable list of tokens inside the search modal.

**Props:**

```typescript
interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  balances?: Record<string, string>;
  emptyMessage?: string;
}
```

**Renders:**

- Maps `tokens` array to `TokenRow` components
- Shows empty state when `tokens.length === 0`
- Handles virtualization for large lists (via `react-window` or similar)

---

#### `TokenRow`

**Purpose:** A single row in the token list.

**Props:**

```typescript
interface TokenRowProps {
  token: Token;
  balance?: string;
  onClick: (token: Token) => void;
  isSelected?: boolean;
}
```

**Renders:**

```
[ Token Logo ]  [ Name ]      [ Symbol ]    [ Balance ]
  (32px circle)  (grey, small)  (white, bold)  (right-aligned)
```

---

#### `AmountInput`

**Purpose:** The large numeric input for token amounts.

**Props:**

```typescript
interface AmountInputProps {
  value: string;
  onChange?: (val: string) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  max?: string;
}
```

**Notes:**

- Only allows numeric input (decimals allowed)
- Prevents negative numbers and non-numeric characters
- Shows a shimmer/skeleton when `isLoading` is true
- Font size: large (2rem) for readability
- Right-aligned text

---

#### `SwapDirectionButton`

**Purpose:** The flip button between the two token inputs.

**Props:**

```typescript
interface SwapDirectionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isAnimating?: boolean;
}
```

**Renders:**

- Circular button with ↕ or ↓ arrow icon
- Hover state: background highlight
- Active/click state: rotation animation

---

#### `SwapDetails`

**Purpose:** The collapsible information panel showing quote details.

**Props:**

```typescript
interface SwapDetailsProps {
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  exchangeRate: string | null; // "1 ETH = 2,300.45 USDC"
  priceImpact: string | null; // "0.04%"
  priceImpactLevel: "low" | "medium" | "high" | null;
  slippage: string; // "0.5%"
  minReceived: string | null; // "2,288.94 USDC"
  fee: string | null; // "0.3%"
  networkCost: string | null; // "~$1.20"
  onRefreshRate: () => void;
  isRefreshing?: boolean;
}
```

**Renders:**

- Summary row (rate + refresh button + expand chevron)
- Expandable detail rows (price impact, slippage, min received, fee, cost)

---

#### `PriceInfo`

**Purpose:** A standalone card below the swap card showing detailed price information.

**Props:**

```typescript
interface PriceInfoProps {
  tokenIn: Token | null;
  tokenOut: Token | null;
  rate: string | null;
  rateInverse: string | null;
  priceImpact: string | null;
  priceImpactLevel: "low" | "medium" | "high" | null;
  isLoading?: boolean;
}
```

---

#### `RouteInfo`

**Purpose:** A standalone card showing the routing path of the swap.

**Props:**

```typescript
interface RouteInfoProps {
  route: RouteStep[] | null;
  isLoading?: boolean;
  dex: string | null;
}

interface RouteStep {
  tokenIn: Token;
  tokenOut: Token;
  protocol: string; // "Uniswap V3" | "Aerodrome" | "Soroswap" | "Aquarius"
  poolFee?: string; // "0.3%"
  poolType?: string; // "Volatile" | "Stable" | "Concentrated"
  percentage?: number; // for split routes, e.g. 60%
}
```

**Renders:**

- Horizontal token chain: `[TokenLogo → Protocol Badge → TokenLogo → ...]`
- For split routes: shows multiple paths with percentages
- Empty/loading states

---

#### `DexSelector`

**Purpose:** The DEX selection strip (tabs or chips) above the swap card.

**Props:**

```typescript
interface DexSelectorProps {
  dexes: DexOption[];
  selectedDex: string; // dex id or "auto"
  onChange: (dexId: string) => void;
}

interface DexOption {
  id: string;
  name: string;
  logo?: string;
  isAvailable?: boolean;
  tag?: string; // "Best Rate" | "Lowest Fee" | null
}
```

**Renders:**

- Horizontal pill/chip group
- First chip is always "Best Rate" (auto)
- Each chip shows logo + name + optional tag badge
- Active chip is highlighted

---

#### `SwapSettings`

**Purpose:** The settings panel (popover or modal) for swap configuration.

**Props:**

```typescript
interface SwapSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: string;
  onSlippageChange: (val: string) => void;
  slippageMode: "auto" | "custom";
  onSlippageModeChange: (mode: "auto" | "custom") => void;
  deadline?: number;
  onDeadlineChange?: (minutes: number) => void;
}
```

---

#### `SlippageSelector`

**Purpose:** The slippage input within settings (also reusable inline).

**Props:**

```typescript
interface SlippageSelectorProps {
  value: string;
  mode: "auto" | "custom";
  onValueChange: (val: string) => void;
  onModeChange: (mode: "auto" | "custom") => void;
  presets?: string[]; // default: ["0.1", "0.5", "1.0"]
  warningThreshold?: number; // default: 1.0 (>1% shows yellow warning)
  dangerThreshold?: number; // default: 5.0 (>5% shows red warning)
}
```

**Renders:**

- "Auto" toggle button
- Preset chips (0.1%, 0.5%, 1.0%)
- Custom input field
- Warning text when slippage is high

---

#### `SwapButton`

**Purpose:** The primary action button at the bottom of the swap card.

**Props:**

```typescript
type SwapButtonState =
  | "connect_wallet"
  | "select_token"
  | "enter_amount"
  | "loading_quote"
  | "insufficient_balance"
  | "approve_token"
  | "ready"
  | "disabled";

interface SwapButtonProps {
  state: SwapButtonState;
  onClick: () => void;
  tokenSymbol?: string; // used in "Approve {tokenSymbol}" label
  isLoading?: boolean;
}
```

**Label Map:**

```typescript
const BUTTON_LABELS: Record<SwapButtonState, string> = {
  connect_wallet: "Connect Wallet",
  select_token: "Select a Token",
  enter_amount: "Enter an Amount",
  loading_quote: "Fetching Best Price...",
  insufficient_balance: "Insufficient Balance",
  approve_token: `Approve ${tokenSymbol}`,
  ready: "Swap",
  disabled: "Swap",
};
```

---

### 5.2 UI Primitives (`components/ui/`)

---

#### `Button`

General-purpose button with variants: `primary`, `secondary`, `ghost`, `danger`, `outline`.

**Props:** `variant`, `size`, `disabled`, `isLoading`, `leftIcon`, `rightIcon`, `onClick`, `children`

---

#### `Card`

Container component with consistent border radius, background, and padding.

**Props:** `className`, `padding`, `children`

---

#### `Input`

Text/number input with label, error state, helper text support.

**Props:** `value`, `onChange`, `placeholder`, `label`, `error`, `helperText`, `rightElement`, `isDisabled`

---

#### `Modal`

Accessible modal dialog with overlay, close button, animation.

**Props:** `isOpen`, `onClose`, `title`, `children`, `size`

---

#### `Tabs`

Tab group component for mode switching (Swap / Limit / etc.)

**Props:** `tabs`, `activeTab`, `onChange`

---

#### `Dropdown`

Generic dropdown/select component.

**Props:** `options`, `value`, `onChange`, `placeholder`, `disabled`

---

#### `Badge`

Small inline label for status/tags (e.g., "Best Rate", "Verified").

**Props:** `children`, `variant` (`success`, `warning`, `danger`, `info`, `neutral`)

---

#### `Skeleton`

Loading placeholder that mimics content shape.

**Props:** `width`, `height`, `borderRadius`, `variant` (`text` | `circle` | `rect`)

---

#### `Tooltip`

Hover tooltip for additional context on complex UI elements.

**Props:** `content`, `children`, `placement`

---

#### `TokenLogo`

Circular token logo with fallback to initials when image unavailable.

**Props:** `src`, `symbol`, `size` (`sm` | `md` | `lg`)

---

#### `IconButton`

Circular icon-only button (used for settings gear, refresh, flip).

**Props:** `icon`, `onClick`, `size`, `variant`, `aria-label`, `isLoading`

---

#### `Chip`

Pill-shaped selectable chip (used in DEX selector, popular tokens).

**Props:** `label`, `isSelected`, `onClick`, `leftIcon`, `badge`

---

## 8. UI State Design (Frontend Only)

This section defines all **UI-layer state variables**. No blockchain calls. No SDK. Just what the interface needs to render correctly.

---

### Core Swap State

```typescript
interface SwapUIState {
  // ─── Token Selection ──────────────────────────────────
  tokenIn: Token | null; // The token user is selling
  tokenOut: Token | null; // The token user is buying

  // ─── Amounts ──────────────────────────────────────────
  amountIn: string; // Raw string from user input ("1.5")
  amountOut: string; // Computed quote result ("3,450.25")
  amountInUsd: string | null; // USD equivalent of amountIn
  amountOutUsd: string | null; // USD equivalent of amountOut

  // ─── Quote / Price Data ───────────────────────────────
  exchangeRate: string | null; // "1 ETH = 2,300.45 USDC"
  exchangeRateInverse: string | null; // "1 USDC = 0.000434 ETH"
  priceImpact: string | null; // "0.04%"
  priceImpactLevel: "low" | "medium" | "high" | null;
  minReceived: string | null; // "2,288.94 USDC"
  fee: string | null; // "0.3%"
  networkCost: string | null; // "~$1.20"

  // ─── Route ────────────────────────────────────────────
  route: RouteStep[] | null; // The computed swap route

  // ─── DEX Selection ────────────────────────────────────
  selectedDex: string; // "auto" | "uniswap" | "aerodrome" etc.
  availableDexes: DexOption[]; // All DEXes available for this chain

  // ─── Settings ─────────────────────────────────────────
  slippage: string; // "0.5"
  slippageMode: "auto" | "custom";
  deadline: number; // minutes (e.g. 20)

  // ─── Wallet ───────────────────────────────────────────
  isWalletConnected: boolean;
  walletAddress: string | null;
  tokenInBalance: string | null; // User's balance of tokenIn
  tokenOutBalance: string | null; // User's balance of tokenOut

  // ─── Loading States ───────────────────────────────────
  isQuoteLoading: boolean; // Fetching price quote
  isQuoteStale: boolean; // Quote is old, refresh recommended

  // ─── UI Visibility States ─────────────────────────────
  isTokenInModalOpen: boolean; // Token search modal for "From"
  isTokenOutModalOpen: boolean; // Token search modal for "To"
  isSettingsOpen: boolean; // Settings panel open
  isDetailsExpanded: boolean; // SwapDetails panel expanded

  // ─── Error State ──────────────────────────────────────
  errorMessage: string | null; // Human-readable error for the UI
  errorType: SwapErrorType | null;

  // ─── Token Search ─────────────────────────────────────
  tokenSearchQuery: string; // Search input value in modal
}
```

---

### Token Type

```typescript
interface Token {
  id: string; // Unique identifier (address on EVM, code:issuer on Stellar)
  symbol: string; // "ETH", "USDC", "AQUA"
  name: string; // "Ethereum", "USD Coin", "Aquarius"
  logo: string | null; // Image URL or null
  decimals: number; // 18 for EVM, 7 for Stellar
  chain: string; // "ethereum" | "base" | "stellar"

  // Optional Stellar-specific fields
  issuer?: string; // Stellar asset issuer address
  isNative?: boolean; // true for XLM / ETH native assets
  isVerified?: boolean; // community-verified flag
}
```

---

### Route Step Type

```typescript
interface RouteStep {
  tokenIn: Token;
  tokenOut: Token;
  protocol: string; // "Uniswap V3" | "Aerodrome" | "Soroswap" | "Aquarius CPMM"
  poolType?: string; // "Volatile" | "Stable" | "Concentrated" | "StableSwap"
  poolFee?: string; // "0.3%" | "0.05%"
  percentage?: number; // for split routes: 60 means 60% goes through this path
}
```

---

### Error Types

```typescript
type SwapErrorType =
  | "NO_ROUTE_FOUND" // No liquidity path exists
  | "PRICE_IMPACT_TOO_HIGH" // Price impact exceeds safe threshold
  | "INSUFFICIENT_LIQUIDITY" // Not enough liquidity in the pool
  | "INVALID_AMOUNT" // Amount entered is not valid
  | "NETWORK_ERROR" // API or RPC call failed
  | "QUOTE_EXPIRED" // Quote timed out
  | "SLIPPAGE_EXCEEDED"; // Simulated slippage exceeds tolerance
```

---

### SwapButton State Derivation (Pure UI Logic)

```typescript
function deriveSwapButtonState(state: SwapUIState): SwapButtonState {
  if (!state.isWalletConnected) return "connect_wallet";
  if (!state.tokenIn || !state.tokenOut) return "select_token";
  if (!state.amountIn || state.amountIn === "0") return "enter_amount";
  if (state.isQuoteLoading) return "loading_quote";
  if (state.errorType === "INSUFFICIENT_LIQUIDITY") return "disabled";
  if (
    state.tokenInBalance !== null &&
    parseFloat(state.amountIn) > parseFloat(state.tokenInBalance)
  )
    return "insufficient_balance";
  if (!state.amountOut) return "disabled";
  return "ready";
}
```

This function is **pure** — it derives the button state from UI state only. No blockchain calls.

---

## 9. Swap Page Wireframe

### Desktop Layout (1280px)

```
┌───────────────────────────────────────────────────────────────────────┐
│  🔷 VANNA         Swap   Pools   Analytics        [Ethereum ▼] [Connect Wallet] ⚙️  │
└───────────────────────────────────────────────────────────────────────┘

      ┌────────────────────────────────────────────────────────────┐
      │  [✨ Best Rate]  [🦄 Uniswap]  [🚀 Aerodrome]  [⭐ Soroswap] │
      └────────────────────────────────────────────────────────────┘

      ┌────────────────────────────────────────────────────────────┐
      │           [ Swap ]   [ Limit ]   [ Send ]                  │  ← Mode Tabs
      ├────────────────────────────────────────────────────────────┤
      │  ┌────────────────────────────────────────────────────┐   │
      │  │  From                                              │   │
      │  │  ┌──────────────┐    ┌──────────────────────────┐ │   │
      │  │  │ [●] ETH  ▼   │    │      1.000000            │ │   │
      │  │  └──────────────┘    └──────────────────────────┘ │   │
      │  │  Balance: 2.541 ETH                    [MAX]        │   │
      │  │  ≈ $2,312.45                                        │   │
      │  └────────────────────────────────────────────────────┘   │
      │                         [  ↕  ]                            │
      │  ┌────────────────────────────────────────────────────┐   │
      │  │  To                                                │   │
      │  │  ┌──────────────┐    ┌──────────────────────────┐ │   │
      │  │  │ [●] USDC ▼   │    │      2,300.45  ⟳         │ │   │
      │  │  └──────────────┘    └──────────────────────────┘ │   │
      │  │  Balance: 0.00 USDC                                │   │
      │  │  ≈ $2,300.45                                       │   │
      │  └────────────────────────────────────────────────────┘   │
      │                                                            │
      │  1 ETH = 2,300.45 USDC  [⟳]                         ▼   │  ← SwapDetails
      │  ─────────────────────────────────────────────────────    │
      │  Price Impact     │  0.04% ● Low                          │
      │  Slippage         │  0.5%            [Edit]               │
      │  Min. Received    │  2,288.94 USDC                        │
      │  Fee              │  0.3%                                  │
      │  Network Cost     │  ~$1.20                               │
      │  ─────────────────────────────────────────────────────    │
      │  ┌────────────────────────────────────────────────────┐   │
      │  │                    Swap                            │   │  ← SwapButton
      │  └────────────────────────────────────────────────────┘   │
      └────────────────────────────────────────────────────────────┘

      ┌────────────────────────────────────────────────────────────┐
      │  Price Info                                               │  ← PriceInfo Card
      │  1 ETH = $2,312.45  ●  1 USDC = $1.00                   │
      │  24h Change: ETH -1.2%    Price Impact: 0.04% (Low ✅)   │
      └────────────────────────────────────────────────────────────┘

      ┌────────────────────────────────────────────────────────────┐
      │  Route                                                    │  ← RouteInfo Card
      │  [ETH logo] ──── [Uniswap V3 · 0.3%] ──── [USDC logo]   │
      └────────────────────────────────────────────────────────────┘
```

---

### Token Search Modal Wireframe

```
    ┌──────────────────────────────────────────────────────┐
    │  Select a Token                                  [✕] │
    ├──────────────────────────────────────────────────────┤
    │  ┌────────────────────────────────────────────────┐  │
    │  │  🔍  Search by name or contract address        │  │
    │  └────────────────────────────────────────────────┘  │
    │                                                      │
    │  Popular                                             │
    │  [ ETH ] [ USDC ] [ USDT ] [ WBTC ] [ DAI ]         │
    │                                                      │
    ├──────────────────────────────────────────────────────┤
    │  [●] Ethereum         ETH       2.541 ETH ↑          │
    │  [●] USD Coin         USDC      0.00 USDC            │
    │  [●] Wrapped BTC      WBTC      0.00 WBTC            │
    │  [●] DAI Stablecoin   DAI       50.00 DAI            │
    │  [●] Uniswap          UNI       0.00 UNI             │
    │  ...                                                  │
    └──────────────────────────────────────────────────────┘
```

---

### Settings Panel Wireframe

```
    ┌─────────────────────────────────────┐
    │  Swap Settings                  [✕] │
    ├─────────────────────────────────────┤
    │  Slippage Tolerance                 │
    │                                     │
    │  ○ Auto    ● Custom                 │
    │  [ 0.1% ] [ 0.5% ] [ 1.0% ]        │
    │  ┌────────────────────┐             │
    │  │  0.5             % │             │
    │  └────────────────────┘             │
    │                                     │
    │  Transaction Deadline               │
    │  ┌───────────────┐                  │
    │  │  20       min │                  │
    │  └───────────────┘                  │
    └─────────────────────────────────────┘
```

---

### Mobile Layout (375px)

```
┌───────────────────────────┐
│  🔷 VANNA       [Wallet]  │  ← Navbar (condensed)
├───────────────────────────┤
│ [Best] [Uni] [Aero] [Soro]│  ← DexSelector (scrollable)
├───────────────────────────┤
│  [Swap] [Limit] [Send]    │  ← Mode tabs
│                           │
│  ┌──────────────────────┐ │
│  │ From                 │ │
│  │ [ETH ▼]  [ 1.0000 ] │ │
│  │ Bal: 2.54  [MAX]     │ │
│  └──────────────────────┘ │
│          [ ↕ ]            │
│  ┌──────────────────────┐ │
│  │ To                   │ │
│  │ [USDC▼]  [2,300.45]  │ │
│  │ Bal: 0.00 USDC       │ │
│  └──────────────────────┘ │
│                           │
│  1 ETH = 2,300.45 USDC ▼  │
│                           │
│  ┌──────────────────────┐ │
│  │       Swap           │ │
│  └──────────────────────┘ │
└───────────────────────────┘
```

---

## 10. UI States

---

### State 1: Wallet Not Connected

**Trigger:** `isWalletConnected === false`

**UI Behavior:**

- Token selectors are still interactive (user can browse tokens)
- Amount input is interactive (user can type amounts)
- Token balances show as `--` or are hidden
- USD values may still show if price data is available
- SwapButton shows `"Connect Wallet"` (blue, active/clickable)
- SwapDetails panel is hidden or shows placeholder rates only

**Visual:**

```
Balance: --                    (token balance hidden)
[  Connect Wallet  ]           (CTA button)
```

---

### State 2: Token Not Selected

**Trigger:** `tokenIn === null || tokenOut === null`

**UI Behavior:**

- TokenSelector shows "Select token" in grey pill button
- Amount input is still interactive
- SwapButton shows `"Select a Token"` (grey, disabled)
- SwapDetails, PriceInfo, RouteInfo are hidden

**Visual:**

```
[ Select token ▼ ]             (grey pill)
[  Select a Token  ]           (disabled button)
```

---

### State 3: Amount Not Entered

**Trigger:** `tokenIn !== null && tokenOut !== null && (!amountIn || amountIn === '0')`

**UI Behavior:**

- Both tokens selected, but amount field is empty or zero
- SwapButton shows `"Enter an Amount"` (grey, disabled)
- SwapDetails, PriceInfo, RouteInfo are hidden
- Output field shows placeholder (`0` or empty)

---

### State 4: Loading Quote

**Trigger:** `isQuoteLoading === true`

**UI Behavior:**

- Output amount field shows a **shimmer/skeleton animation** instead of a number
- SwapButton shows `"Fetching Best Price..."` with a spinner icon
- SwapDetails rows show skeleton placeholders
- PriceInfo and RouteInfo show skeleton states
- User can still edit `amountIn` (debounced, triggers a new quote request)

**Visual:**

```
[  ████████████  ]             (shimmer on output field)
[  Fetching Best Price... ◌  ]  (button with spinner)
```

---

### State 5: Insufficient Balance

**Trigger:** `parseFloat(amountIn) > parseFloat(tokenInBalance)`

**UI Behavior:**

- Input amount field turns red (border color change)
- A small red error text appears below: `"Insufficient ETH balance"`
- SwapButton shows `"Insufficient Balance"` (red, disabled)
- SwapDetails still visible (so user can see the rate)
- MAX button remains available as a quick fix

**Visual:**

```
[ 10.0 ] (red border input)
⚠ Insufficient ETH balance
[  Insufficient Balance  ]     (red disabled button)
```

---

### State 6: Swap Disabled (Error States)

**Covers:** No route found, price impact too high (unacknowledged), network error

**Trigger:** `errorType !== null`

**UI Behaviors by Error:**

| Error Type               | Button Label              | Additional UI             |
| ------------------------ | ------------------------- | ------------------------- |
| `NO_ROUTE_FOUND`         | "No Route Found"          | Orange/red inline message |
| `PRICE_IMPACT_TOO_HIGH`  | "Price Impact Too High"   | Red warning banner        |
| `INSUFFICIENT_LIQUIDITY` | "Insufficient Liquidity"  | Inline message            |
| `NETWORK_ERROR`          | "Error — Retry"           | Retry button visible      |
| `QUOTE_EXPIRED`          | "Quote Expired — Refresh" | Refresh icon in button    |

**Price Impact Warning Banner (special case):**

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Price impact is high: 6.5%                    │
│  You may receive significantly less than expected.  │
│  [ Cancel ]              [ Swap Anyway ]            │
└─────────────────────────────────────────────────────┘
```

This is a **confirmation modal or inline warning** that appears before allowing a high-impact swap.

---

### State 7: Swap Ready

**Trigger:** All conditions met — wallet connected, tokens selected, amount entered, quote loaded, no errors, sufficient balance

**UI Behavior:**

- All fields populated correctly
- SwapButton shows `"Swap"` (primary color, fully active and clickable)
- SwapDetails panel visible with all data
- PriceInfo and RouteInfo cards fully populated
- Optional: a small countdown indicator showing quote freshness

**Visual:**

```
[  ETH  ▼]   [  1.000000            ]
Balance: 2.541 ETH                [MAX]
≈ $2,312.45

          [ ↕ ]

[  USDC  ▼]  [  2,300.45            ]
Balance: 0.00 USDC
≈ $2,300.45

1 ETH = 2,300.45 USDC  [⟳ 25s]        ▼

[          Swap          ]   ← blue, active
```

---

### State 8: Approve Token Required (EVM-specific)

**Trigger:** Token requires allowance approval before the swap (e.g., USDC on EVM chains)

**UI Behavior:**

- SwapButton shows `"Approve USDC"` (primary color, clickable)
- After clicking, a loading state is shown: `"Approving USDC..."`
- Once approval is confirmed: button transitions to `"Swap"` state automatically
- Optional two-step progress indicator above the button:
  ```
  ①  Approve USDC  →  ②  Swap
  ```

---

### Summary Table of All UI States

| #   | State                | Button Label           | Button Style     | Input State       |
| --- | -------------------- | ---------------------- | ---------------- | ----------------- |
| 1   | Wallet Not Connected | Connect Wallet         | Blue, active     | Normal            |
| 2   | Token Not Selected   | Select a Token         | Grey, disabled   | Normal            |
| 3   | Amount Not Entered   | Enter an Amount        | Grey, disabled   | Normal            |
| 4   | Loading Quote        | Fetching Best Price... | Grey + spinner   | Output: skeleton  |
| 5   | Insufficient Balance | Insufficient Balance   | Red, disabled    | Input: red border |
| 6a  | No Route Found       | No Route Found         | Orange, disabled | Normal            |
| 6b  | Price Impact High    | Price Impact Too High  | Red, disabled    | Warning banner    |
| 6c  | Network Error        | Error — Retry          | Red, clickable   | Error message     |
| 6d  | Quote Expired        | Quote Expired          | Grey, refresh    | Stale indicator   |
| 7   | Swap Ready           | Swap                   | Blue, active     | Normal            |
| 8   | Approve Token        | Approve [Symbol]       | Blue, active     | Two-step shown    |

---

## Appendix: Protocol-Agnostic Design Principles

The Vanna swap UI is designed around **protocol-agnosticism**. Here is how each design decision supports adding new AMMs without UI changes:

1. **DexSelector is data-driven** — new DEXes appear by adding an entry to `availableDexes` data, no component changes needed.

2. **Token type is universal** — the `Token` interface supports both EVM tokens (address-based) and Stellar assets (code+issuer) via the same structure with optional fields.

3. **RouteStep is protocol-aware via string** — the `protocol` field is a string, so any new protocol name can be added without changing the type.

4. **SwapButton uses a state enum** — adding new button states only requires adding to `SwapButtonState` type and the label map.

5. **SwapDetails receives plain strings** — the component doesn't care if fees came from Uniswap V3 or Aerodrome Stable Pool; it just displays the provided string.

6. **No protocol logos hardcoded** — the `DexOption` type includes a `logo` field, allowing logos to be supplied at runtime.

7. **Error types are enumerable** — the `SwapErrorType` type can be extended with protocol-specific errors without breaking the UI.

---

_Document version: 1.0 | Prepared for: Vanna Protocol Frontend Team_
_Scope: Static UI Architecture Only — No blockchain interactions, SDK integrations, or protocol adapters included._
