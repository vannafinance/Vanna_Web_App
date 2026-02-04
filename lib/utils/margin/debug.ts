/**
 * Debug utility for diagnosing margin account issues
 * Run in browser console: window.debugMarginAccount()
 */

export const debugMarginAccount = async () => {
  console.log("=== Margin Account Debug Info ===");

  // @ts-ignore - Access from window
  const { useMarginStore } = await import("@/store/margin-account-state");
  const { useUserStore } = await import("@/store/user");
  const { useBalanceStore } = await import("@/store/balance-store");

  const marginState = useMarginStore.getState().marginState;
  const userAddress = useUserStore.getState().address;
  const walletBalances = useBalanceStore.getState().walletBalances;
  const marginBalances = useBalanceStore.getState().marginBalances;

  console.log("\n📊 Current Margin State:");
  console.table({
    "Collateral (USD)": marginState?.collateralUsd || 0,
    "Borrowed (USD)": marginState?.borrowUsd || 0,
    "Health Factor": marginState?.hf || "N/A",
    "LTV": marginState?.ltv ? `${(marginState.ltv * 100).toFixed(2)}%` : "N/A",
    "Max Borrow (USD)": marginState?.maxBorrow || 0,
    "Max Withdraw (USD)": marginState?.maxWithdraw || 0,
  });

  console.log("\n💰 Wallet Balances:");
  console.table(walletBalances);

  console.log("\n🏦 Margin Account Balances:");
  console.table(marginBalances);

  console.log("\n👤 User Address:", userAddress);

  console.log("\n✅ Debug info logged above");
  console.log("If you see zeros or 'N/A', your margin account might not be loaded properly.");
  console.log("Try refreshing the page or switching networks.");

  return {
    marginState,
    walletBalances,
    marginBalances,
    userAddress,
  };
};

// Expose to window for console access
if (typeof window !== "undefined") {
  // @ts-ignore
  window.debugMarginAccount = debugMarginAccount;
}
