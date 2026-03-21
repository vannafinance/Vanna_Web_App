# Aerodrome Finance — Technical Integration Guide (Base Chain)

> **Purpose:** AMM integration for Vanna's Swap/LP page
> **Chain:** Base (Chain ID: 8453)
> **Protocol Type:** ve(3,3) DEX (fork of Velodrome/Solidly)

---

## 1. Contract Addresses (Base Mainnet)

### Core Protocol Contracts

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| **Router**       | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` |
| **PoolFactory**  | `0x420DD381b31aEf6683db6B902084cB0FFECe40Da` |
| **Voter**        | `0x16613524e02ad97eDfeF371bC883F2F5d6C480A5` |
| **AERO Token**   | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` |

### Asset Token Addresses (Base)

| Token    | Address                                      | Decimals |
| -------- | -------------------------------------------- | -------- |
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6        |
| **USDT** | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6        |
| **WETH** | `0x4200000000000000000000000000000000000006` | 18       |
| **cbBTC**| `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` | 8        |

---

## 2. Pool Types — Volatile vs Stable

| Aspect            | Volatile Pool                  | Stable Pool                        |
| ----------------- | ------------------------------ | ---------------------------------- |
| **Symbol**        | `vAMM-WETH/USDC`              | `sAMM-USDC/USDT`                  |
| **Curve**         | `x * y >= k` (constant product)| `x³y + y³x >= k` (stableswap)     |
| **Default Fee**   | 0.3% (30 bips)                | 0.05% (5 bips)                     |
| **Best For**      | Uncorrelated (ETH/USDC)       | Pegged assets (USDC/USDT)          |
| **First Deposit** | Any ratio                     | Must be equal value                 |

---

## 3. Action Methods

---

### 3.1 `swap()`

**Contract:** Router (`0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`)

#### Route Struct (used by all swap functions)
```solidity
struct Route {
    address from;     // Input token
    address to;       // Output token
    bool stable;      // true = stable pool, false = volatile pool
    address factory;  // address(0) = default PoolFactory
}
```

#### Primary Function: `swapExactTokensForTokens`
```solidity
function swapExactTokensForTokens(
    uint256 amountIn,          // Exact input amount
    uint256 amountOutMin,      // Min output (slippage protection)
    Route[] calldata routes,   // Swap path (supports multi-hop)
    address to,                // Recipient
    uint256 deadline           // Unix timestamp deadline
) external returns (uint256[] memory amounts);
```

#### ETH Variants
```solidity
// Swap ETH → Token (send ETH as msg.value)
function swapExactETHForTokens(
    uint256 amountOutMin,
    Route[] calldata routes,   // routes[0].from = WETH
    address to,
    uint256 deadline
) external payable returns (uint256[] memory amounts);

// Swap Token → ETH
function swapExactTokensForETH(
    uint256 amountIn,
    uint256 amountOutMin,
    Route[] calldata routes,   // routes[last].to = WETH
    address to,
    uint256 deadline
) external returns (uint256[] memory amounts);
```

#### Get Quote (Read-Only, for UI)
```solidity
function getAmountsOut(uint256 amountIn, Route[] memory routes)
    public view returns (uint256[] memory amounts);
```

#### Integration Flow (Example: USDC → WETH)
```
1. User approves Router for USDC amount
2. Call router.swapExactTokensForTokens(
     amountIn,
     amountOutMin,
     [Route(USDC, WETH, false, address(0))],
     userAddress,
     deadline
   )
3. User receives WETH
```

---

### 3.2 `addLiquidity()`

**Contract:** Router

```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    bool stable,              // true = stable, false = volatile
    uint256 amountADesired,   // Desired deposit of tokenA
    uint256 amountBDesired,   // Desired deposit of tokenB
    uint256 amountAMin,       // Min tokenA (slippage)
    uint256 amountBMin,       // Min tokenB (slippage)
    address to,               // Recipient of LP tokens
    uint256 deadline
) external returns (
    uint256 amountA,          // Actual tokenA deposited
    uint256 amountB,          // Actual tokenB deposited
    uint256 liquidity         // LP tokens minted
);
```

#### ETH Variant
```solidity
function addLiquidityETH(
    address token,
    bool stable,
    uint256 amountTokenDesired,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
```

#### Quote (Read-Only, for UI)
```solidity
function quoteAddLiquidity(
    address tokenA, address tokenB, bool stable, address _factory,
    uint256 amountADesired, uint256 amountBDesired
) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity);
```

### What LP Token Do You Get?

> **LP tokens are standard ERC20 tokens.** Each Pool contract IS the LP token itself.

- Pool address = LP token address (the contract inherits ERC20)
- Volatile pool LP: symbol = `vAMM-WETH/USDC`
- Stable pool LP: symbol = `sAMM-USDC/USDT`
- They are **NOT NFTs**, they are fungible ERC20 tokens

#### How to Find the Pool/LP Token Address
```solidity
// Via Router
function poolFor(address tokenA, address tokenB, bool stable, address _factory)
    public view returns (address pool);

// Via PoolFactory
function getPool(address tokenA, address tokenB, bool stable)
    external view returns (address);
```

### How to Track Position with LP Token

```solidity
// 1. Check LP balance
uint256 lpBalance = IERC20(poolAddress).balanceOf(userAddress);

// 2. Get pool reserves & total supply
(uint256 reserve0, uint256 reserve1, ) = IPool(poolAddress).getReserves();
uint256 totalSupply = IERC20(poolAddress).totalSupply();

// 3. Calculate user's share of underlying tokens
uint256 userToken0 = (lpBalance * reserve0) / totalSupply;
uint256 userToken1 = (lpBalance * reserve1) / totalSupply;

// 4. Pool metadata (token addresses, decimals, stable flag)
(uint256 dec0, uint256 dec1, uint256 r0, uint256 r1, bool st, address t0, address t1)
    = IPool(poolAddress).metadata();
```

#### Fee Tracking (Earned trading fees)
```solidity
// Fees accrue automatically to LP holders via index mechanism
// Claim accrued fees:
(uint256 claimed0, uint256 claimed1) = IPool(poolAddress).claimFees();
```

#### Integration Flow (Example: Add USDC/WETH Volatile Liquidity)
```
1. User approves Router for USDC amount
2. User approves Router for WETH amount
3. Call router.addLiquidity(
     USDC, WETH, false,         // volatile pool
     amountUSDC, amountWETH,
     minUSDC, minWETH,
     userAddress, deadline
   )
4. User receives vAMM-USDC/WETH LP tokens (ERC20 at the pool address)
5. Track position: IERC20(poolAddress).balanceOf(userAddress)
```

---

### 3.3 `removeLiquidity()`

**Contract:** Router

```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    bool stable,
    uint256 liquidity,       // LP tokens to burn
    uint256 amountAMin,      // Min tokenA to receive
    uint256 amountBMin,      // Min tokenB to receive
    address to,              // Recipient of tokens
    uint256 deadline
) external returns (uint256 amountA, uint256 amountB);
```

#### ETH Variant
```solidity
function removeLiquidityETH(
    address token,
    bool stable,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
) external returns (uint256 amountToken, uint256 amountETH);
```

#### Quote (Read-Only, for UI)
```solidity
function quoteRemoveLiquidity(
    address tokenA, address tokenB, bool stable, address _factory,
    uint256 liquidity
) external view returns (uint256 amountA, uint256 amountB);
```

#### Integration Flow
```
1. User approves Router for LP token amount (approve the Pool contract address)
2. Call router.removeLiquidity(
     USDC, WETH, false,
     lpAmount,
     minUSDC, minWETH,
     userAddress, deadline
   )
3. User receives USDC + WETH proportionally
```

---

## 4. Gauge Staking (Earning AERO Rewards)

After getting LP tokens, users can stake them in Gauges to earn AERO emissions:

```solidity
// Find gauge for a pool
address gauge = IVoter(voterAddress).gauges(poolAddress);

// Stake LP tokens
IERC20(poolAddress).approve(gauge, amount);
IGauge(gauge).deposit(amount, userAddress);

// Check staked balance
IGauge(gauge).balanceOf(userAddress);

// Claim AERO rewards
IGauge(gauge).getReward(userAddress);

// Unstake
IGauge(gauge).withdraw(amount);
```

---

## 5. Summary Table

| Action              | Function                          | Input                    | Output                         |
| ------------------- | --------------------------------- | ------------------------ | ------------------------------ |
| **Swap**            | `swapExactTokensForTokens()`      | Token A                  | Token B                        |
| **Add Liquidity**   | `addLiquidity()`                  | Token A + Token B        | ERC20 LP Token (Pool address)  |
| **Remove Liquidity**| `removeLiquidity()`               | ERC20 LP Token           | Token A + Token B              |
| **Track Position**  | `balanceOf()` on Pool             | User address             | LP balance → underlying calc   |
| **Stake LP**        | `IGauge.deposit()`                | LP Token                 | AERO rewards over time         |

---

## 6. Key Things to Know for Frontend Integration

1. **All user interactions go through the Router** — never call Pool directly for swaps/liquidity
2. **Always `approve()` the Router** before calling swap/addLiquidity/removeLiquidity
3. **For removeLiquidity, approve the Router for the Pool (LP token) address**
4. **Use `getAmountsOut()` and `quoteAddLiquidity()` / `quoteRemoveLiquidity()`** for preview in the UI
5. **Set deadline** = `Math.floor(Date.now() / 1000) + 1200` (20 min)
6. **Set slippage** = typically 0.5% - 1% for volatile, 0.1% for stable pools
7. **LP tokens are at the Pool contract address** — not a separate token contract
8. **Multi-hop swaps** are possible by passing multiple Route entries in the array
