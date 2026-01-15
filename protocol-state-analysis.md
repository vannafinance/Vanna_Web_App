✅ (A) Protocol State (from smart contracts)

This comes from fetchBalance, fetchCollateralState, fetchBorrowState, reloadMarginState.

This is ground truth.

Things to store:

Key	Meaning
collateralUsd	Total collateral value (in USD)
borrowUsd	Total borrowed value
hf	Health factor
ltv	borrowUsd / collateralUsd
maxBorrow	remaining borrow limit
maxWithdraw	max withdraw without HF breach
collateral[]	list of assets as collateral
borrow[]	list of assets borrowed

This is stored correctly in:

marginState

🟣 (B) UI Composition State (what user selects)

User interactions that must NOT override real state

Key UI needs:

Key	Example	Purpose
currentCollaterals[]	[{asset: USDC, amt: 100}]	What user intends to deposit
currentBorrowItems[]	[{asset: USDT, amt: 50}]	What user intends to borrow
mode	Deposit / Borrow	Toggle MB/WB
balanceType	MB or WB	Where collateral comes from
leverage	x2 / x5 / x10	Borrow slider
editingIndex	0,1,2	UX for add/edit collateral
selectedMBCollaterals[]	subset of collateral	Multi-select MB assets

These states are correct in your code.

🔵 (C) Transaction Mode State

Describes actual action to perform:

You have the correct matrix:

Case	Origin	TX	Count
Borrow MB	Margin	borrow	1
Borrow WB	Wallet → Margin	deposit → borrow	2
Dual Borrow MB	Margin	borrow x2	2
Dual Borrow WB	Wallet → Margin	deposit → borrow x2	3

Additionally for repay:

| Repay MB | Margin | repay | 1 |
| Repay WB | Wallet → Margin | deposit → repay | 2 |
| Close All | Mixed | repay → withdraw | ≈3 |

🌗 (D) Derived UX Computed State (view-only)

You compute:

updatedCollateral
fees
netHealthFactor
platformPoints


But the UI will also require:

✔ Simulated HF after borrow
✔ Simulated LTV after borrow
✔ Simulated liquidation buffer
✔ Time to liquidation (optional later)

Add to compute layer:

const simulateBorrow = (state, amountUsd) => {
 const newHF = calcHF(state.collateralUsd, state.borrowUsd + amountUsd);
 const newLTV = calcLTV(state.collateralUsd, state.borrowUsd + amountUsd);
 return { newHF, newLTV }
}


Use for instant preview under slider.

🟡 (E) View State for “Info Panel”

Right panel needs:

Field	Computed from
Total Collateral value	state.collateralUsd
Total Borrow value	state.borrowUsd
Total Value	collateral - debt
Health Factor	state.hf
Time to liquidation	TBD (≈ interest+vol)
Liquidation threshold	LTV limit (90%)
Borrow rate	from oracle later
Min debt	config
Max debt	state.maxBorrow
Liquidation premium	config
Liquidation fee	config
Collateral Factor	config

You already have:

hf
ltv
maxBorrow
maxWithdraw


Need to add:

liqThreshold = 0.9
minDebt = config.min
liqFee = config.liqFee
rate = oracle.borrowRate

🧩 (F) State Separation Rules

Critical rules for clean UI logic:

1️⃣ Protocol ≠ UI

User editing never mutates protocol state

✔ correct approach

2️⃣ Protocol refresh must set:
marginState = reloadMarginState()


after every TX

3️⃣ UI state persists — does not auto reset

So dual borrow selections persist after TX

4️⃣ Derived UI only read + compute

Never write into contract structs

🏁 (G) Actions Layer

Everything reduces to:

executeBorrow
executeDualBorrow
executeRepay
executeTransfer


These are good.

Add later:

executeCloseAll()


which does:

repayFull → withdrawAll

🔥 (H) UX State Signals (Color + Warnings)

To guide user visually:

Warning	Condition
“Low HF”	hf < 1.3
“High Liquidation Risk”	hf < 1.1
“Will liquidate”	hf <= 1.0
“No collateral”	stateCollateralUsd == 0
“Max Borrow reached”	maxBorrow == 0
“Max Withdraw reached”	maxWithdraw == 0

Color map:

HF Range	Color
> 1.5	green
1.3 - 1.5	yellow
1.1 - 1.3	orange
≤ 1.1	red
🔮 (I) Next UI Enhancements

Next week enhancements:

✔ Health bar UI
✔ Liquidation price UI (if collateral = volatile)
✔ Oracle integration (prices + rates)
✔ Multi-borrow UI completion
✔ Multi-repay UI
✔ Auto close positions
✔ Farming → collateral loop

🎯 Implementation Checklist (after break)

When you come back, implement in order:

STEP 1: Finalize Protocol State
marginState = reloadMarginState()

STEP 2: Add Simulation Layer
simulateBorrow()
simulateRepay()
simulateWithdraw()

STEP 3: Add HF/LTV Indicators

UI:

✔ Current HF
✔ Post Borrow HF
✔ Liquidation threshold

STEP 4: InfoCard uses protocol state

Replace placeholder numbers

STEP 5: Add Repay

MB + WB modes

STEP 6: Add Transfer

MB → WB withdraw

STEP 7: Add Close All

repayFull + withdrawAll

If you want I can:

✅ Draw state diagram
or
🟣 Create clean store via zustand
or
🚀 Repack core logic into useMargin() hook
or
🧱 Move protocol to libs

Just tell me:

“store” / “hook” / “diagram” / “lib refactor”

Enjoy your break — when you return just say:
“continue UI state implementation