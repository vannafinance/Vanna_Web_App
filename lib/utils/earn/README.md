# Advanced Earn Fetchers Documentation

## Overview

The advanced earnFetchers system provides real-time vault statistics, APY calculations, and comprehensive data fetching for the Vanna Earn protocol. This system is designed to be used across all earn-related components for consistent, up-to-date blockchain data.

## Architecture

```
earnFetchers.ts          # Main fetcher hooks with real-time data
calculations.ts          # APY and rate calculations
transactions.ts          # Transaction handlers
```

## Key Features

### ✅ Real-Time Data Updates
- Auto-refresh every 30 seconds
- Immediate updates after transactions
- Parallel data fetching for optimal performance

### ✅ Advanced Statistics
- Complete vault metrics (totalAssets, totalBorrows, utilization)
- Dynamic APY calculations based on utilization
- Exchange rate tracking
- Liquidity and health metrics

### ✅ Multi-Asset Support
- ETH, USDC, USDT vaults
- Chain-specific asset isolation
- Automatic ABI selection (VEther vs VToken)

## Fetcher Hooks

### Basic Fetchers

#### `useFetchVaultData`
Fetches basic vault statistics (totalAssets, totalSupply, exchangeRate)

```typescript
const fetchVaultData = useFetchVaultData(chainId, asset, publicClient);
const data = await fetchVaultData();
// Returns: { totalAssets, totalSupply, exchangeRate, ... }
```

#### `useFetchUserVaultPosition`
Gets user's position in a vault (shares, current value)

```typescript
const fetchUserPosition = useFetchUserVaultPosition(
  chainId,
  asset,
  userAddress,
  publicClient,
  priceUsd
);
const position = await fetchUserPosition();
// Returns: { shares, sharesFormatted, assetsValue, assetsValueUsd }
```

#### `useFetchUserWalletBalance`
Gets user's wallet balance for underlying token

```typescript
const fetchBalance = useFetchUserWalletBalance(chainId, asset, userAddress, publicClient);
const balance = await fetchBalance();
// Returns: { balance, balanceFormatted }
```

#### `useFetchConvertToShares`
Preview shares for a deposit amount

```typescript
const fetchConvertToShares = useFetchConvertToShares(chainId, asset, publicClient);
const preview = await fetchConvertToShares("100"); // amount as string
// Returns: { shares, sharesFormatted }
```

#### `useFetchConvertToAssets`
Preview assets for a withdrawal amount

```typescript
const fetchConvertToAssets = useFetchConvertToAssets(chainId, asset, publicClient);
const preview = await fetchConvertToAssets("50"); // shares as string
// Returns: { assets, assetsFormatted }
```

### Advanced Fetchers

#### `useFetchCompleteVaultStats` 🌟
**Most comprehensive vault data** - includes borrows, APY, utilization

```typescript
const fetchCompleteStats = useFetchCompleteVaultStats(chainId, asset, publicClient);
const stats = await fetchCompleteStats();

// Returns:
{
  totalAssets: bigint,
  totalAssetsFormatted: number,
  totalSupply: bigint,
  totalSupplyFormatted: number,
  totalBorrows: bigint,              // 🔥 NEW
  totalBorrowsFormatted: number,      // 🔥 NEW
  availableLiquidity: number,         // 🔥 NEW
  utilizationRate: number,            // 🔥 NEW
  exchangeRate: number,
  supplyAPY: number,                  // 🔥 NEW - Calculated
  borrowAPY: number                   // 🔥 NEW - Calculated
}
```

#### `useFetchAllVaultsData`
Fetch stats for all vaults (ETH, USDC, USDT) in parallel

```typescript
const fetchAllVaults = useFetchAllVaultsData(chainId, publicClient, includeAdvancedStats);
const allStats = await fetchAllVaults();

// Returns:
{
  ETH: VaultStats | null,
  USDC: VaultStats | null,
  USDT: VaultStats | null
}
```

**Parameters:**
- `includeAdvancedStats`: boolean - If true, includes borrow data and APY calculations

#### `useFetchUserCompletePosition`
User's complete position with APY and earnings tracking

```typescript
const fetchCompletePosition = useFetchUserCompletePosition(
  chainId,
  asset,
  userAddress,
  publicClient,
  priceUsd
);
const position = await fetchCompletePosition();

// Returns:
{
  shares: bigint,
  sharesFormatted: number,
  currentValue: bigint,
  currentValueFormatted: number,
  initialDeposit: number,         // Requires event tracking
  earnedInterest: number,         // Calculated
  earnedInterestUsd: number,
  currentAPY: number              // 🔥 Current APY
}
```

#### `useFetchVaultHealthMetrics`
Health and risk metrics for a vault

```typescript
const fetchHealthMetrics = useFetchVaultHealthMetrics(chainId, asset, publicClient);
const health = await fetchHealthMetrics();

// Returns:
{
  utilizationRate: number,
  utilizationPercent: number,
  availableLiquidity: number,
  liquidityRatio: number,
  riskLevel: "low" | "medium" | "high",
  canWithdraw: (amount: number) => boolean
}
```

## Usage Examples

### Example 1: Details Tab (Real-Time Stats)

```typescript
import { useFetchCompleteVaultStats } from "@/lib/utils/earn/earnFetchers";

export const Details = ({ selectedAsset = "ETH" }) => {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const fetchVaultStats = useFetchCompleteVaultStats(chainId, selectedAsset, publicClient);

  const [vaultStats, setVaultStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const stats = await fetchVaultStats();
      setVaultStats(stats);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [chainId, selectedAsset]);

  return (
    <div>
      <p>Supply APY: {(vaultStats?.supplyAPY * 100).toFixed(2)}%</p>
      <p>Borrow APY: {(vaultStats?.borrowAPY * 100).toFixed(2)}%</p>
      <p>Utilization: {(vaultStats?.utilizationRate * 100).toFixed(2)}%</p>
      <p>Available: {vaultStats?.availableLiquidity.toFixed(2)} {selectedAsset}</p>
    </div>
  );
};
```

### Example 2: Supply Liquidity (With Auto-Refresh)

```typescript
import {
  useFetchUserWalletBalance,
  useFetchConvertToShares,
  useFetchVaultData
} from "@/lib/utils/earn/earnFetchers";

export const SupplyLiquidity = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [selectedAsset, setSelectedAsset] = useState("ETH");

  const fetchBalance = useFetchUserWalletBalance(chainId, selectedAsset, address, publicClient);
  const fetchConvertToShares = useFetchConvertToShares(chainId, selectedAsset, publicClient);
  const fetchVaultData = useFetchVaultData(chainId, selectedAsset, publicClient);

  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [sharesPreview, setSharesPreview] = useState(0);

  // Load balance and vault data
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      const balance = await fetchBalance();
      if (balance) setWalletBalance(balance.balanceFormatted);

      const vaultData = await fetchVaultData();
      // Use vaultData.exchangeRate, etc.
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedAsset, address]);

  // Preview shares
  useEffect(() => {
    const preview = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setSharesPreview(0);
        return;
      }
      const result = await fetchConvertToShares(amount);
      if (result) setSharesPreview(result.sharesFormatted);
    };
    preview();
  }, [amount]);

  return (
    <div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
      />
      <p>You will receive: {sharesPreview.toFixed(4)} v{selectedAsset}</p>
      <p>Your balance: {walletBalance.toFixed(4)} {selectedAsset}</p>
    </div>
  );
};
```

### Example 3: Withdraw Liquidity (With Post-Transaction Update)

```typescript
import {
  useFetchUserVaultPosition,
  useFetchConvertToAssets
} from "@/lib/utils/earn/earnFetchers";
import { withdraw } from "@/lib/utils/earn/transactions";

export const WithdrawLiquidity = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const fetchUserPosition = useFetchUserVaultPosition(chainId, "ETH", address, publicClient);
  const fetchConvertToAssets = useFetchConvertToAssets(chainId, "ETH", publicClient);

  const [vTokenBalance, setVTokenBalance] = useState(0);
  const [shares, setShares] = useState("");

  const handleWithdraw = async () => {
    const result = await withdraw({
      walletClient,
      publicClient,
      chainId,
      asset: "ETH",
      shares,
      userAddress: address,
    });

    if (result.success) {
      // Reload balance after transaction (with delay for blockchain confirmation)
      setTimeout(async () => {
        const position = await fetchUserPosition();
        if (position) setVTokenBalance(position.sharesFormatted);
      }, 2000);
    }
  };

  return (
    <div>
      <input
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        placeholder="Enter vETH amount"
      />
      <button onClick={handleWithdraw}>Withdraw</button>
    </div>
  );
};
```

### Example 4: Table Data (All Vaults)

```typescript
import { useFetchAllVaultsData } from "@/lib/utils/earn/earnFetchers";
import { usePrices } from "@/lib/utils/prices/priceFeed";

export const EarnTable = () => {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const fetchAllVaults = useFetchAllVaultsData(chainId, publicClient, true); // Include advanced stats
  const { prices } = usePrices(["ETH", "USDC", "USDT"]);

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const stats = await fetchAllVaults();

      const rows = Object.entries(stats).map(([asset, vaultStats]) => {
        if (!vaultStats) return null;

        return {
          asset,
          totalSupply: vaultStats.totalAssetsFormatted,
          supplyAPY: (vaultStats.supplyAPY * 100).toFixed(2),
          borrowAPY: (vaultStats.borrowAPY * 100).toFixed(2),
          utilization: (vaultStats.utilizationRate * 100).toFixed(2),
        };
      }).filter(Boolean);

      setTableData(rows);
    };

    loadData();
  }, [chainId]);

  return (
    <table>
      {tableData.map(row => (
        <tr key={row.asset}>
          <td>{row.asset}</td>
          <td>{row.totalSupply}</td>
          <td>{row.supplyAPY}%</td>
          <td>{row.borrowAPY}%</td>
          <td>{row.utilization}%</td>
        </tr>
      ))}
    </table>
  );
};
```

## Best Practices

### 1. Auto-Refresh Pattern
```typescript
useEffect(() => {
  const loadData = async () => { /* fetch data */ };

  loadData(); // Initial load
  const interval = setInterval(loadData, 30000); // Refresh every 30s
  return () => clearInterval(interval); // Cleanup
}, [dependencies]);
```

### 2. Post-Transaction Updates
```typescript
// Wait 2 seconds for blockchain confirmation before refetching
setTimeout(async () => {
  const data = await fetchData();
  updateState(data);
}, 2000);
```

### 3. Error Handling
```typescript
try {
  const data = await fetchData();
  if (data) {
    // Use data
  } else {
    // Handle null (network error, invalid chain, etc.)
  }
} catch (error) {
  console.error("Error fetching data:", error);
}
```

### 4. Loading States
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const data = await fetchData();
    setVaultData(data);
    setLoading(false);
  };
  loadData();
}, []);

return loading ? <Spinner /> : <DataDisplay data={vaultData} />;
```

## APY Calculation Details

APY is calculated using the **kinked rate model**:

```typescript
// Below kink (80% utilization):
borrowAPY = BASE_RATE + (utilization * SLOPE1)

// Above kink:
borrowAPY = BASE_RATE + (KINK * SLOPE1) + ((utilization - KINK) * SLOPE2)

// Supply APY:
supplyAPY = borrowAPY × utilization × (1 - protocolFee)
```

**Default Parameters:**
- BASE_RATE: 2%
- SLOPE1: 4%
- SLOPE2: 75%
- KINK: 80%
- Protocol Fee: 10%

## Component Integration Matrix

| Component | Fetchers Used | Auto-Refresh | Post-Tx Update |
|-----------|---------------|--------------|----------------|
| Details Tab | `useFetchCompleteVaultStats` | ✅ 30s | N/A |
| Supply Liquidity | `useFetchUserWalletBalance`, `useFetchConvertToShares`, `useFetchVaultData` | ✅ 30s | ✅ 2s delay |
| Withdraw Liquidity | `useFetchUserVaultPosition`, `useFetchConvertToAssets`, `useFetchVaultData` | ✅ 30s | ✅ 2s delay |
| Earn Table | `useFetchAllVaultsData` | ❌ Manual | N/A |
| Your Positions | `useFetchUserVaultPosition` | ✅ 30s | ✅ 2s delay |

## Performance Considerations

### Parallel Fetching
All vault data is fetched in parallel using `Promise.all()`:
```typescript
const [totalAssets, totalSupply, totalBorrows] = await Promise.all([...]);
```

### Conditional Advanced Stats
Use `includeAdvancedStats` parameter to avoid unnecessary borrow data fetches:
```typescript
const fetchAllVaults = useFetchAllVaultsData(chainId, publicClient, false); // Basic only
```

### Memoization
Use `useMemo` to prevent unnecessary recalculations:
```typescript
const items = useMemo(() => {
  // Calculate stats items
}, [vaultStats, selectedAsset, prices]);
```

## Future Enhancements

1. **Event Tracking**: Track initial deposits via events to calculate true earned interest
2. **Historical APY**: Store and display historical APY trends
3. **Batch Multicall**: Use multicall contracts for even faster parallel fetching
4. **WebSocket Updates**: Real-time block-by-block updates instead of polling
5. **Caching Layer**: Redis/IndexedDB caching for faster load times

## Troubleshooting

### Issue: Data not updating
- Check that auto-refresh interval is set up correctly
- Verify `publicClient` and `chainId` are available
- Check browser console for errors

### Issue: Incorrect APY
- Verify rate model parameters in `calculations.ts`
- Ensure `getBorrows()` function exists in vault contract
- Check that utilization rate calculation is correct

### Issue: Transaction not updating UI
- Ensure post-transaction delay (2s) is in place
- Check that fetcher callbacks are called after transaction
- Verify wallet is still connected

## Support

For issues or questions, check:
- `earnFetchers.ts` - Main fetcher implementations
- `calculations.ts` - APY calculation logic
- `transactions.ts` - Transaction handlers
