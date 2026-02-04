# Borrowed Balance - Loading UX Solution

## Approach: Loading Icons + Manual Refresh (Instead of Auto-Reload)

Instead of automatically reloading data when tabs switch or window gains focus, we implemented a **user-controlled approach** with clear visual feedback.

## Key Changes

### 1. **Removed Automatic Reload Triggers**
❌ **Removed:**
- Tab visibility change listener
- Window focus listener

✅ **Kept:**
- Initial load on mount
- Network change reload (chainId)
- Wallet address change reload

**Why?** Automatic reloads can:
- Waste network requests
- Interrupt user workflow
- Create unnecessary blockchain queries
- Increase gas estimation calls

### 2. **Added Loading State Indicators**

#### A. Main Page Header (leverage-assets-tab.tsx)
```tsx
// Animated spinner + "Loading..." text
{isLoadingMargin && (
  <motion.div className="flex items-center gap-2">
    <svg className="animate-spin h-6 w-6 text-[#703AE6]">...</svg>
    <span>Loading...</span>
  </motion.div>
)}
```

#### B. Manual Refresh Button
```tsx
// Only shows when NOT loading
{!isLoadingMargin && userAddress && (
  <motion.button
    onClick={() => reloadMarginState()}
    className="..."
    whileTap={{ scale: 0.95, rotate: 180 }}
  >
    <svg>Refresh Icon</svg>
  </motion.button>
)}
```

#### C. Account Stats Cards
```tsx
// Shows spinner icon instead of value
{isLoading ? (
  <svg className="animate-spin h-8 w-8 text-[#703AE6]">...</svg>
) : (
  displayValue
)}
```

#### D. Margin Account Info Card
```tsx
// Small spinner next to title + dynamic subtitle
<h2>Margin Account Info</h2>
{isLoadingMargin && <svg className="animate-spin h-5 w-5">...</svg>}
<p>{isLoadingMargin ? "Fetching latest data..." : "Stay updated..."}</p>
```

### 3. **Enhanced Store State**

```typescript
interface MarginStore {
  marginState: MarginState | null;
  isLoading: boolean;           // ✅ New
  lastError: string | null;      // ✅ New
  fetchersReady: boolean;        // ✅ New

  reloadMarginState: () => Promise<MarginState | null>;
  clearError: () => void;        // ✅ New
}
```

## Visual Feedback Flow

### Loading States

1. **Initial Page Load**
   ```
   User arrives → Spinner appears → Data loads → Spinner disappears
   ```

2. **Manual Refresh**
   ```
   User clicks refresh → Button rotates 180° → Spinner appears → Data loads → Done
   ```

3. **Network Change**
   ```
   User switches network → Spinner appears → New network data loads → Done
   ```

### Error States

```
Fetch fails → Error banner appears at top → User can dismiss or retry
```

## User Benefits

✅ **Better Control**: Users decide when to refresh
✅ **Clear Feedback**: Always know when data is loading
✅ **Less Network Usage**: No unnecessary automatic requests
✅ **Faster UI**: No unexpected reloads interrupting workflow
✅ **Better UX**: Professional loading animations

## Implementation Details

### Loading Icon (SVG Spinner)
```tsx
<svg className="animate-spin h-6 w-6 text-[#703AE6]">
  <circle className="opacity-25" cx="12" cy="12" r="10"
    stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291..." />
</svg>
```

**Features:**
- Uses Tailwind's `animate-spin` class
- Purple color (#703AE6) matches brand
- Scales appropriately (h-5, h-6, h-8 based on context)

### Refresh Button Animation
```tsx
whileTap={{ scale: 0.95, rotate: 180 }}
```

**Features:**
- Scales down slightly on click (tactile feedback)
- Rotates 180° to indicate action
- Hover effect with scale 1.1

## Files Modified

### 1. store/margin-account-state.ts
- Added `isLoading`, `lastError`, `fetchersReady` states
- Enhanced `reloadMarginState()` with loading state management
- Added `clearError()` method

### 2. app/margin/page.tsx
- Added loading spinner in page header
- Added manual refresh button
- Added loading states to account stats
- Added spinner to info card header
- Added error banner (dismissible)

### 3. components/margin/account-stats.tsx
- Detect loading state (value === "⟳")
- Show animated spinner icon instead of text
- Maintain consistent layout during loading

### 4. components/margin/leverage-assets-tab.tsx
- Removed visibility change listener
- Removed window focus listener
- Kept initial load with 100ms delay
- Kept network/address change triggers

## Testing Checklist

- [ ] Page load - spinner shows, then data appears
- [ ] Click refresh button - button rotates, spinner shows, data refreshes
- [ ] Network change - spinner shows, new network data loads
- [ ] Error state - banner appears with error message
- [ ] Dismiss error - banner fades away
- [ ] No margin account - shows "-" instead of spinner
- [ ] Loading spinner animations - smooth and consistent

## Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Spinner | #703AE6 | Loading indicator |
| Error Banner | Red-100/Red-400 | Error background/border |
| Refresh Button Hover | #703AE6 (10% opacity) | Interactive feedback |

## Performance Notes

- **No polling**: Data only loads when triggered
- **Single request**: No duplicate fetches
- **Proper cleanup**: Event listeners removed (unused)
- **Efficient rendering**: Loading state doesn't cause layout shift

## Future Enhancements

Consider adding:
1. **Auto-refresh toggle** - Optional 30s/60s interval for power users
2. **Last updated timestamp** - Show "Updated 5 seconds ago"
3. **Pull-to-refresh** - Mobile-friendly refresh gesture
4. **Optimistic updates** - Show pending changes immediately
5. **Stale data indicator** - Yellow badge if data is >5 minutes old
