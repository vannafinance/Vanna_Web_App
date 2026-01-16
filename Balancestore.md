# Centralized Balance Management Guide for Vanna DeFi Margin App

## Overview

This guide explains how to refactor your margin and wallet balance fetching logic for optimal performance, maintainability, and instant UI updates.  
It is based on your requirements and current code structure.

---







## Step 1: Centralize Balance Fetching in a Zustand Store

**Create:**  
`/store/balance-store.ts`

**Purpose:**  
- Store all wallet (WB) and margin (MB) balances for all tokens.
- Expose functions to refresh balances (fetch from chain) and read balances (from memory).

**Example:**
```typescript
import { create } from "zustand";
import { TOKEN_OPTIONS, TOKEN_DECIMALS, tokenAddressByChain } from "@/lib/utils/web3/token";
import { erc20Abi, formatUnits } from "viem";
import { PublicClient } from "viem";

type BalanceType = "WB" | "MB";
export interface AssetBalance {
  asset: string;
  type: BalanceType;
  amount: number;
}

interface BalanceStore {
  balances: AssetBalance[];
  refreshBalances: (params: {
    chainId: number;
    address: `0x${string}`;
    publicClient: PublicClient;
    marginAccount: `0x${string}`;
  }) => Promise<void>;
  fetchBalance: (asset: string, type: BalanceType) => number;
}

export const useBalanceStore = create<BalanceStore>((set, get) => ({
  balances: [],
  refreshBalances: async ({ chainId, address, publicClient, marginAccount }) => {
    // Fetch WB (wallet) balances
    const wbPromises = TOKEN_OPTIONS.map(async (asset) => {
      if (asset === "ETH") {
        const raw = await publicClient.getBalance({ address });
        return { asset, type: "WB", amount: Number(formatUnits(raw, 18)) };
      }
      const token = tokenAddressByChain[chainId]?.[asset];
      if (!token) return { asset, type: "WB", amount: 0 };
      const decimals = TOKEN_DECIMALS[asset] ?? 18;
      const raw = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      return { asset, type: "WB", amount: Number(formatUnits(raw, decimals)) };
    });

    // Fetch MB (margin) balances using multicall
    const addressMap = tokenAddressByChain[chainId] ?? {};
    const erc20Tokens = TOKEN_OPTIONS.filter((t) => t !== "ETH");
    const erc20Calls = erc20Tokens.map((token) => ({
      address: addressMap[token],
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [marginAccount],
    }));

    const [ethBalanceRaw, erc20Results, wbResults] = await Promise.all([
      publicClient.getBalance({ address: marginAccount }),
      erc20Calls.length > 0 ? publicClient.multicall({ contracts: erc20Calls }) : Promise.resolve([]),
      Promise.all(wbPromises),
    ]);

    const mbBalances: AssetBalance[] = [];
    mbBalances.push({ asset: "ETH", type: "MB", amount: Number(formatUnits(ethBalanceRaw, 18)) });
    erc20Tokens.forEach((token, i) => {
      const entry = erc20Results[i];
      if (!entry || entry.status === "failure") return;
      const raw = entry.result as bigint;
      const decimals = TOKEN_DECIMALS[token] ?? 18;
      mbBalances.push({ asset: token, type: "MB", amount: Number(formatUnits(raw, decimals)) });
    });

    set({ balances: [...wbResults, ...mbBalances] });
  },
  fetchBalance: (asset, type) => {
    const found = get().balances.find((b) => b.asset === asset && b.type === type);
    return found ? found.amount : 0;
  },
}));
```

---

## Step 2: Remove Per-Component Fetch Logic

- Delete any functions like `fetchWalletBalance`, `fetchMarginBalances`, and `fetchBalance` from your UI components (`leverage-assets-tab.tsx`, `collateral-box.tsx`, etc.).
- Replace all direct balance fetching with the store selectors.

---

## Step 3: Use the Store in Your Components

**Import the store:**
```typescript
import { useBalanceStore } from "@/store/balance-store";
```

**Read balances instantly:**
```typescript
// For a single token
const walletUsdc = useBalanceStore(s => s.fetchBalance("USDC", "WB"));
const marginEth = useBalanceStore(s => s.fetchBalance("ETH", "MB"));

// For all tokens (for lists/tables)
const allBalances = useBalanceStore(s => s.balances);
const walletBalances = allBalances.filter(b => b.type === "WB");
const marginBalances = allBalances.filter(b => b.type === "MB");
```

---

## Step 4: Trigger Balance Refresh Only When Needed

- After deposit, withdraw, borrow, repay, etc.:
  ```typescript
  await useBalanceStore.getState().refreshBalances({
    chainId,
    address,
    publicClient,
    marginAccount,
  });
  ```
- On initial load (after wallet/chain ready):
  ```typescript
  useEffect(() => {
    if (chainId && address && publicClient && marginAccount) {
      useBalanceStore.getState().refreshBalances({
        chainId,
        address,
        publicClient,
        marginAccount,
      });
    }
  }, [chainId, address, publicClient, marginAccount]);
  ```
- Do NOT call on every token switch in the UI.

---

## Step 5: Show All Margin Balances in the UI

**Example Table:**
```tsx
const marginBalances = useBalanceStore(s => s.balances.filter(b => b.type === "MB"));

<table>
  <thead>
    <tr>
      <th>Asset</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    {marginBalances.map(b => (
      <tr key={b.asset}>
        <td>{b.asset}</td>
        <td>{b.amount}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Step 6: Token Switching

- When user switches token in dropdown, just filter the balances from the store.
- No new RPC call is triggered.

---

## Step 7: Benefits

- Reduced RPC calls (batched + multicall)
- Instant UI updates (token switching is fast)
- Centralized state management
- Easy to extend (add price, health factor, etc.)
- No duplicated fetch logic

---

## Summary Table

| Step | What to do | Why |
|------|------------|-----|
| 1 | Create `/store/balance-store.ts` | Centralize all balance logic |
| 2 | Remove per-component fetchers | No duplication, clean code |
| 3 | Use selectors in UI | Instant, RPC-free reads |
| 4 | Refresh only after tx or on load | Efficient, no wasted calls |
| 5 | Use arrays for UI | Fast, easy token switching |
| 6 | Remove old fetch logic | Maintainable, scalable |
| 7 | Enjoy benefits | Fast, robust, future-proof |

---

## Example: How to Use in leverage-assets-tab.tsx

```typescript
import { useBalanceStore } from "@/store/balance-store";

// Show all margin balances in a list/table
const marginBalances = useBalanceStore(s => s.balances.filter(b => b.type === "MB"));

return (
  <div>
    <h3>Margin Account Balances</h3>
    <table>
      <thead>
        <tr>
          <th>Asset</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {marginBalances.map(b => (
          <tr key={b.asset}>
            <td>{b.asset}</td>
            <td>{b.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

---

**Copy this guide into your notes.  
Follow these steps to refactor your app for optimal balance management and instant UI updates!**