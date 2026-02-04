# Rate Limiting Fix - 429 Error Prevention

## Problem

Getting **HTTP 429 (Too Many Requests)** errors from Base RPC endpoint:
```
Error: HTTP request failed. Status: 429
URL: https://mainnet.base.org
```

This happens when:
- Refreshing too frequently
- Multiple components trigger reloads simultaneously
- Network/wallet changes cause rapid successive requests

## Solutions Implemented

### 1. **Request Cooldown (5 Second Minimum)**

Added a minimum 5-second interval between margin state reloads:

```typescript
const MIN_FETCH_INTERVAL = 5000; // 5 seconds

// Rate limiting check
if (!forceRefresh && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
  const waitTime = Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000);
  set({
    lastError: `Please wait ${waitTime} seconds before refreshing again`,
  });
  return state.marginState; // Return cached state
}
```

**Benefits:**
- Prevents spam requests
- Shows user-friendly countdown message
- Returns cached data during cooldown

### 2. **Duplicate Request Prevention**

Prevents multiple simultaneous requests:

```typescript
// Prevent duplicate simultaneous requests
if (isLoading && !forceRefresh) {
  console.log("Already loading, skipping duplicate request");
  return state.marginState;
}
```

**Prevents:**
- Multiple components calling reload at once
- Race conditions
- Wasted network bandwidth

### 3. **Debounced Network/Wallet Changes**

Increased debounce delay from 100ms to 500ms:

```typescript
useEffect(() => {
  if (!publicClient || !chainId || !address) return;

  // Debounce: Wait 500ms after last change before reloading
  const timer = setTimeout(() => {
    console.log('Reloading margin state due to wallet/network change');
    reloadMarginState();
  }, 500);

  return () => clearTimeout(timer);
}, [publicClient, chainId, address, reloadMarginState]);
```

**Prevents:**
- Rapid-fire requests during network switches
- Multiple requests when wallet reconnects
- Race conditions during initialization

### 4. **Better Error Messages**

User-friendly error messages with visual indicators:

| Error Type | Message | Banner Color |
|------------|---------|--------------|
| Rate Limit | "Rate limit exceeded. Please wait a moment and try again." | Yellow (warning) |
| Cooldown | "Please wait X seconds before refreshing again" | Yellow (warning) |
| Network | "Network error. Please check your connection." | Red (error) |
| Generic | Original error message | Red (error) |

**Visual Design:**
- Yellow banner with clock icon for rate limit/cooldown
- Red banner with X icon for actual errors
- Dismissible with X button

### 5. **Last Fetch Timestamp Tracking**

Store tracks when last successful fetch occurred:

```typescript
interface MarginStore {
  lastFetchTime: number;  // ✅ New
  // ...
}

// Update on every fetch attempt
set({ lastFetchTime: Date.now() });
```

## Usage

### Automatic Protection

Rate limiting is **automatic** - no code changes needed:

1. User loads page → ✅ Fetches immediately
2. User refreshes < 5s → ⚠️ Shows "Please wait X seconds" message
3. User refreshes > 5s → ✅ Fetches fresh data
4. Network changes → ⏱️ Debounced 500ms, then fetches

### For Developers

Force refresh (bypass cooldown):
```typescript
reloadMarginState(true);  // forceRefresh = true
```

## Files Modified

1. **store/margin-account-state.ts**
   - Added `lastFetchTime` state
   - Added `MIN_FETCH_INTERVAL` constant
   - Added cooldown check in `reloadMarginState()`
   - Added duplicate request prevention
   - Improved error messages

2. **components/margin/leverage-assets-tab.tsx**
   - Increased debounce from 100ms → 500ms
   - Added console logging for debugging

3. **app/margin/page.tsx**
   - Yellow warning banner for rate limit/cooldown
   - Clock icon for cooldown messages
   - Better error message layout

## Testing Checklist

- [ ] Load page → Data loads successfully
- [ ] Refresh immediately → Shows "Please wait X seconds"
- [ ] Wait 5 seconds → Can refresh again
- [ ] Switch networks rapidly → Only one request sent
- [ ] Multiple tabs → Each respects 5s cooldown
- [ ] Yellow banner for cooldown messages
- [ ] Red banner for actual errors

## Configuration

Adjust cooldown period in `store/margin-account-state.ts`:

```typescript
// Change from 5 seconds to 10 seconds
const MIN_FETCH_INTERVAL = 10000;

// Or reduce to 3 seconds (not recommended)
const MIN_FETCH_INTERVAL = 3000;
```

## Long-Term Solutions

If rate limiting persists, consider:

### Option 1: Use Alchemy/Infura API

```typescript
// In wagmi-config.ts or similar
import { http } from 'viem'
import { base } from 'viem/chains'

const transport = http('https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY')

// Or Infura
const transport = http('https://base-mainnet.infura.io/v3/YOUR_API_KEY')
```

**Benefits:**
- Higher rate limits (free tier: 300 req/sec for Alchemy)
- More reliable
- Better performance

### Option 2: Implement Request Caching

Cache RPC responses for 30-60 seconds:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

const getCached = (key: string, maxAge: number) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }
  return null;
};
```

### Option 3: Batch Multiple Calls

Use Multicall contract to batch multiple `eth_call` requests into one:

```typescript
// Instead of 3 separate calls
const [balance, borrows, collateral] = await Promise.all([...]);

// Use multicall
const results = await multicall.aggregate([
  { target: riskEngine, callData: getBalanceCalldata },
  { target: riskEngine, callData: getBorrowsCalldata },
  // ...
]);
```

## Monitoring

Check console for rate limit warnings:
```
MarginStore: Rate limited. Please wait Xs before refreshing
Already loading, skipping duplicate request
Reloading margin state due to wallet/network change
```

## Summary

**Before:**
- 429 errors frequent
- No cooldown protection
- Rapid successive requests
- Generic error messages

**After:**
- ✅ 5-second cooldown between requests
- ✅ Duplicate request prevention
- ✅ 500ms debounce for changes
- ✅ User-friendly error messages
- ✅ Visual feedback (yellow/red banners)
- ✅ Cached data returned during cooldown

The borrowed balance will now load reliably without hitting rate limits!
