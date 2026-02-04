# Borrowed Balance Loading Fix - Summary

## Issues Fixed

### 1. **Race Condition in Fetcher Registration**
**Problem**: The `reloadMarginState()` was being called in parallel with fetcher registration, causing it to execute before fetchers were available.

**Solution**:
- Added a 100ms delay before calling `reloadMarginState()` to ensure fetchers are registered first
- Added `fetchersReady` flag in the store to track when fetchers are available
- Enhanced error handling to catch and report when fetchers aren't ready

**Files Changed**:
- `store/margin-account-state.ts` - Added `fetchersReady` flag
- `components/margin/leverage-assets-tab.tsx` - Added timeout delay

### 2. **Missing Reload Triggers**
**Problem**: Borrowed balance wasn't reloading when:
- User switches browser tabs and returns
- User focuses the window
- Network changes

**Solution**: Added three new event listeners:
1. **Visibility Change Listener** - Reloads when tab becomes visible
2. **Window Focus Listener** - Reloads when window is focused
3. **Existing Effect** - Already handles network (chainId) changes

**Files Changed**:
- `components/margin/leverage-assets-tab.tsx` (lines 1142-1166)

### 3. **Silent Failure Handling**
**Problem**: When fetchers weren't ready, the
 store would silently fail with only a console warning.

**Solution**:
- Added `isLoading` state to track loading status
- Added `lastError` state to capture error messages
- Added `clearError()` method to dismiss errors
- Enhanced try-catch blocks with proper error messages

**Files Changed**:
- `store/margin-account-state.ts` - Added loading/error states
- `app/margin/page.tsx` - Display loading and error states

### 4. **UI Feedback Issues**
**Problem**: Users had no visual feedback when:
- Data was loading
- Errors occurred
- No margin account exists

**Solution**:
- Added "Loading..." text in account stats during fetch
- Added error banner at top of page with dismiss button
- Show "-" for empty/zero values
- Properly handle `isLoadingMargin` state throughout the UI

**Files Changed**:
- `app/margin/page.tsx` - Added loading states and error banner

## How the Borrowed Balance is Fetched

### Formula
```typescript
Borrowed Balance (USD) = RiskEngine.getBorrows(account) / 1e18
```

### Data Flow
1. **Component Mount** (`leverage-assets-tab.tsx`)
   - Initialize fetcher functions with `useFetchBorrowState` hook
   - Register fetchers in Zustand store via `setFetchers()`
   - Trigger initial `reloadMarginState()` (with 100ms delay)

2. **Store Fetch** (`margin-account-state.ts`)
   - Check if fetchers are ready (`fetchersReady` flag)
   - Call `fetchBorrowState(marginAccount)`
   - Wait for blockchain response from `RiskEngine.getBorrows()`

3. **Contract Call** (`marginFetchers.ts`)
   - Query `RiskEngine.getBorrows()` with latest block number
   - Returns total borrowed USD value as bigint (18 decimals)
   - Convert: `Number(raw) / 1e18`

4. **State Update**
   - Calculate metrics (HF, LTV, Leverage)
   - Update Zustand store with new `MarginState`
   - UI automatically re-renders with new data

### Reload Triggers
The borrowed balance now automatically reloads when:
- ✅ Component mounts
- ✅ Network changes (chainId)
- ✅ Wallet address changes
- ✅ Tab becomes visible (after being hidden)
- ✅ Window gains focus
- ✅ User manually triggers refresh

## Testing Checklist

Test these scenarios to verify the fixes:

- [ ] Page loads - borrowed balance shows immediately
- [ ] Switch browser tabs - balance updates when returning
- [ ] Change network - balance refreshes for new network
- [ ] Page refresh (F5) - balance loads on refresh
- [ ] Open new tab to same page - balance loads
- [ ] Switch wallets - balance updates for new wallet
- [ ] Error state - error banner shows if fetch fails
- [ ] Loading state - "Loading..." shows during fetch
- [ ] No margin account - shows "-" instead of 0

## Files Modified

1. **store/margin-account-state.ts**
   - Added `isLoading`, `lastError`, `fetchersReady` states
   - Enhanced `reloadMarginState()` with try-catch
   - Added `clearError()` method

2. **components/margin/leverage-assets-tab.tsx**
   - Added 100ms delay before initial reload
   - Added visibility change listener
   - Added window focus listener

3. **app/margin/page.tsx**
   - Added `isLoadingMargin` and `marginError` from store
   - Updated `accountStats` to handle loading state
   - Updated `marginAccountInfo` to handle loading state
   - Updated `accountStatsValues` to show "Loading..."
   - Added error banner with dismiss button
   - Added `AnimatePresence` for error banner animation

## Technical Details

### Race Condition Fix
```typescript
// BEFORE (Race Condition)
useEffect(() => {
  setFetchers(fetchers);
}, [fetchers]);

useEffect(() => {
  reloadMarginState(); // Might run before fetchers are set!
}, [reloadMarginState]);

// AFTER (Fixed with Delay)
useEffect(() => {
  setFetchers(fetchers);
}, [fetchers]);

useEffect(() => {
  const timer = setTimeout(() => {
    reloadMarginState(); // Runs after 100ms delay
  }, 100);
  return () => clearTimeout(timer);
}, [reloadMarginState]);
```

### Visibility Change Listener
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      reloadMarginState();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [reloadMarginState]);
```

## Performance Considerations

- **100ms delay**: Minimal impact, ensures fetchers are ready
- **Event listeners**: Properly cleaned up in useEffect returns
- **Visibility API**: Only reloads when tab is actually visible (no wasted requests)
- **Error handling**: Prevents infinite retry loops

## Future Improvements

Consider these enhancements:

1. **Retry Logic**: Auto-retry failed fetches with exponential backoff
2. **Cache Strategy**: Cache last successful state, show stale data while reloading
3. **Optimistic Updates**: Show pending state after transactions
4. **WebSocket**: Real-time updates instead of polling
5. **Polling Interval**: Add configurable auto-refresh every N seconds
