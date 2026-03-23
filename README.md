# Vanna Finance

Vanna Finance is a DeFi derivatives trading protocol providing perpetual futures, spot trading, yield farming, and margin lending on EVM-compatible chains.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth & Wallets**: Privy (email, social, wallet login + embedded smart wallets)
- **Web3**: wagmi v2, viem
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Lightweight Charts, Chart.js
- **Cross-chain**: Avail Nexus SDK

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

The production build uses webpack (`--webpack` flag) for full compatibility with Privy, WalletConnect, and other Web3 packages on all platforms.

## Project Structure

```
app/                    # Next.js App Router pages
  earn/                 # Lending/Yield vaults
  farm/                 # Liquidity farming
  margin/               # Margin trading
  trade/
    perps/[pair]/       # Perpetual futures
    spot/               # Spot swap
  portfolio/            # Portfolio dashboard
  api/                  # API routes
components/
  auth/                 # Login & wallet connection
  earn/                 # Earn page components
  farm/                 # Farm page components
  margin/               # Margin trading components
  perps/                # Perpetuals trading components
  spot/                 # Spot trading components
  ui/                   # Shared UI components
lib/
  constants/            # App constants & config
  hooks/                # Custom React hooks
  utils/                # Utilities (web3, formatting, etc.)
store/                  # Zustand stores
Provider/               # Context providers (Privy, wagmi, theme)
```

## Supported Chains

- Arbitrum
- Optimism
- Base

## Deployment

Deployed on **Vercel**. Pushes to `main` trigger automatic deployments.

Build command: `npm run build`
Output directory: `.next`

## License

Proprietary - Vanna Finance
