// Optimized multicall implementation for margin account functionality
import { PublicClient, formatUnits, erc20Abi } from "viem";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import Account from "@/abi/vanna/out/out/Account.sol/Account1.json";
import { getAddressList } from "@/lib/utils/web3/addressList";
import { vTokenAddressByChain, tokenAddressByChain } from "@/lib/utils/web3/token";

// ============ TYPES ============

export type MarginAccountData = {
  accountAddress: `0x${string}`;
  collateralUsd: number;
  borrowUsd: number;
  healthFactor: number;
  borrowedAssets: Array<{
    asset: string;
    address: `0x${string}`;
    amount: string;
    decimals: number;
  }>;
};

export type MarginAccountStats = {
  accounts: MarginAccountData[];
  totalCollateral: number;
  totalBorrowed: number;
  avgHealthFactor: number;
};

// ============ MULTICALL INDICES ============

/**
 * Named constants for margin account multicall indices
 * Format: ACCOUNT_{INDEX}_{DATA_TYPE}
 */
export const buildMarginAccountIndices = (accountCount: number) => {
  const indices: Record<string, number> = {};

  for (let i = 0; i < accountCount; i++) {
    indices[`ACCOUNT_${i}_COLLATERAL`] = i * 2;
    indices[`ACCOUNT_${i}_BORROWS`] = i * 2 + 1;
  }

  return indices;
};

// ============ MULTICALL BUILDER ============

/**
 * Build multicall contracts for all margin accounts
 * Fetches collateral and borrows for each account in one call
 */
export function buildMarginAccountsMulticallContracts(
  chainId: number,
  accounts: `0x${string}`[]
) {
  const addressList = getAddressList(chainId);
  if (!addressList) return [];

  const contracts: any[] = [];

  for (const accountAddress of accounts) {
    // Add collateral check (RiskEngine.getBalance)
    contracts.push({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBalance",
      args: [accountAddress],
    });

    // Add borrows check (RiskEngine.getBorrows)
    contracts.push({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBorrows",
      args: [accountAddress],
    });
  }

  return contracts;
}

/**
 * Build multicall for borrowed assets details
 * Gets symbol and decimals for each borrowed token
 */
export function buildBorrowedAssetsMulticallContracts(
  borrowedAddresses: `0x${string}`[]
) {
  const contracts: any[] = [];

  for (const tokenAddr of borrowedAddresses) {
    // Symbol
    contracts.push({
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "symbol",
    });

    // Decimals
    contracts.push({
      address: tokenAddr,
      abi: erc20Abi,
      functionName: "decimals",
    });
  }

  return contracts;
}

// ============ RESULT PARSERS ============

/**
 * Parse margin accounts multicall results
 */
export function parseMarginAccountsMulticallResults(
  results: any[],
  accounts: `0x${string}`[]
): MarginAccountData[] {
  const DUST_THRESHOLD = 0.01;
  const accountsData: MarginAccountData[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const collateralResult = results[i * 2];
    const borrowsResult = results[i * 2 + 1];

    if (
      collateralResult?.status === "failure" ||
      borrowsResult?.status === "failure"
    ) {
      console.error(`Failed to fetch data for account ${accounts[i]}`);
      continue;
    }

    const collateralRaw = collateralResult?.result as bigint;
    const borrowsRaw = borrowsResult?.result as bigint;

    // RiskEngine returns values in 18 decimals
    const collateralUsd = Number(collateralRaw) / 1e18;
    const borrowUsd = Number(borrowsRaw) / 1e18;

    // Apply dust threshold
    const cleanCollateralUsd = collateralUsd < DUST_THRESHOLD ? 0 : collateralUsd;
    const cleanBorrowUsd = borrowUsd < DUST_THRESHOLD ? 0 : borrowUsd;

    // Calculate health factor
    const healthFactor = cleanBorrowUsd > 0
      ? cleanCollateralUsd / cleanBorrowUsd
      : Infinity;

    accountsData.push({
      accountAddress: accounts[i],
      collateralUsd: cleanCollateralUsd,
      borrowUsd: cleanBorrowUsd,
      healthFactor,
      borrowedAssets: [], // Will be populated in Stage 2
    });
  }

  return accountsData;
}

/**
 * Parse borrowed assets multicall results
 */
export function parseBorrowedAssetsMulticallResults(
  results: any[],
  borrowedAddresses: `0x${string}`[]
): Array<{ symbol: string; decimals: number; address: `0x${string}` }> {
  const assets: Array<any> = [];

  for (let i = 0; i < borrowedAddresses.length; i++) {
    const symbolResult = results[i * 2];
    const decimalsResult = results[i * 2 + 1];

    if (
      symbolResult?.status === "failure" ||
      decimalsResult?.status === "failure"
    ) {
      console.error(`Failed to fetch token data for ${borrowedAddresses[i]}`);
      continue;
    }

    assets.push({
      symbol: symbolResult?.result as string,
      decimals: Number(decimalsResult?.result),
      address: borrowedAddresses[i],
    });
  }

  return assets;
}

// ============ MAIN FETCHERS ============

/**
 * Stage 1: Fetch all margin accounts with collateral and borrows
 * Reduces multiple calls to 1 multicall per account
 */
export async function fetchAllMarginAccountsMulticall(
  chainId: number,
  publicClient: PublicClient,
  ownerAddress: `0x${string}`
): Promise<MarginAccountStats | null> {
  try {
    const addressList = getAddressList(chainId);
    if (!addressList) return null;

    console.log(`🚀 [Margin] Step 1: Fetching account addresses...`);

    // Step 1: Get account addresses
    const accounts = (await publicClient.readContract({
      address: addressList.registryContractAddress,
      abi: Registry.abi,
      functionName: "accountsOwnedBy",
      args: [ownerAddress],
    })) as `0x${string}`[];

    if (!accounts || accounts.length === 0) {
      console.log(`No margin accounts found for ${ownerAddress}`);
      return {
        accounts: [],
        totalCollateral: 0,
        totalBorrowed: 0,
        avgHealthFactor: 0,
      };
    }

    console.log(`🚀 [Margin] Step 2: Fetching ${accounts.length} account stats with multicall...`);

    // Step 2: Fetch all account stats in ONE multicall
    const contracts = buildMarginAccountsMulticallContracts(chainId, accounts);

    const results = await publicClient.multicall({
      contracts,
      allowFailure: true,
    });

    console.log(`✅ [Margin] Multicall completed, parsing results...`);

    const accountsData = parseMarginAccountsMulticallResults(results, accounts);

    // Calculate aggregates
    const totalCollateral = accountsData.reduce(
      (sum, acc) => sum + acc.collateralUsd,
      0
    );
    const totalBorrowed = accountsData.reduce(
      (sum, acc) => sum + acc.borrowUsd,
      0
    );
    const avgHealthFactor =
      totalBorrowed > 0 ? totalCollateral / totalBorrowed : Infinity;

    console.log(
      `✅ [Margin] Successfully fetched ${accountsData.length}/${accounts.length} accounts`
    );

    return {
      accounts: accountsData,
      totalCollateral,
      totalBorrowed,
      avgHealthFactor,
    };
  } catch (error) {
    console.error("❌ [Margin] Multicall failed:", error);
    return null;
  }
}

/**
 * Stage 2: Fetch borrowed positions for a margin account
 * Gets details of all borrowed assets
 */
export async function fetchBorrowPositionsMulticall(
  chainId: number,
  publicClient: PublicClient,
  marginAccount: `0x${string}`
): Promise<MarginAccountData["borrowedAssets"]> {
  try {
    console.log(`🚀 [Margin] Fetching borrowed positions for ${marginAccount}...`);

    // Step 1: Get borrowed token addresses
    const borrowedAddresses = (await publicClient.readContract({
      address: marginAccount,
      abi: Account.abi,
      functionName: "getBorrows",
    })) as `0x${string}`[];

    if (!borrowedAddresses || borrowedAddresses.length === 0) {
      return [];
    }

    console.log(
      `🚀 [Margin] Found ${borrowedAddresses.length} borrowed assets, fetching details with multicall...`
    );

    // Step 2: Fetch token metadata (symbol, decimals) in ONE multicall
    const metadataContracts = buildBorrowedAssetsMulticallContracts(
      borrowedAddresses
    );

    const metadataResults = await publicClient.multicall({
      contracts: metadataContracts,
      allowFailure: true,
    });

    const assetsMetadata = parseBorrowedAssetsMulticallResults(
      metadataResults,
      borrowedAddresses
    );

    // Step 3: Fetch borrow balances for each asset
    const balanceContracts = assetsMetadata.map((asset) => {
      const sym = asset.symbol === "WETH" ? "ETH" : asset.symbol;
      const vTokenAddr = vTokenAddressByChain[chainId]?.[sym];

      return {
        address: vTokenAddr,
        abi: [
          {
            inputs: [{ type: "address", name: "account" }],
            name: "getBorrowBalance",
            outputs: [{ type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "getBorrowBalance",
        args: [marginAccount],
      };
    });

    const balanceResults = await publicClient.multicall({
      contracts: balanceContracts,
      allowFailure: true,
    });

    // Combine metadata and balances
    const positions = assetsMetadata.map((asset, index) => {
      const balanceResult = balanceResults[index];

      let amount = "0";
      if (balanceResult?.status === "success") {
        amount = formatUnits(
          balanceResult.result as bigint,
          asset.decimals
        );
      }

      return {
        asset: asset.symbol,
        address: asset.address,
        decimals: asset.decimals,
        amount,
      };
    });

    console.log(`✅ [Margin] Successfully fetched ${positions.length} borrow positions`);

    return positions.filter((p) => Number(p.amount) > 0);
  } catch (error) {
    console.error("❌ [Margin] Borrow positions multicall failed:", error);
    return [];
  }
}

/**
 * Complete margin account data fetch with 2-stage multicall
 * Stage 1: Account stats (collateral + borrows)
 * Stage 2: Borrowed asset details
 */
export async function fetchCompleteMarginAccountData(
  chainId: number,
  publicClient: PublicClient,
  ownerAddress: `0x${string}`
): Promise<MarginAccountStats | null> {
  // Stage 1: Fetch all accounts with basic stats
  const accountStats = await fetchAllMarginAccountsMulticall(
    chainId,
    publicClient,
    ownerAddress
  );

  if (!accountStats || accountStats.accounts.length === 0) {
    return accountStats;
  }

  // Stage 2: Fetch borrowed positions for each account
  console.log(`🚀 [Margin] Stage 2: Fetching borrowed positions for ${accountStats.accounts.length} accounts...`);

  const accountsWithPositions = await Promise.all(
    accountStats.accounts.map(async (account) => {
      const positions = await fetchBorrowPositionsMulticall(
        chainId,
        publicClient,
        account.accountAddress
      );

      return {
        ...account,
        borrowedAssets: positions,
      };
    })
  );

  return {
    ...accountStats,
    accounts: accountsWithPositions,
  };
}

// ============ BALANCE STORE OPTIMIZATION ============

/**
 * Optimized balance fetch using multicall (already exists in balance-store.ts)
 * This is a reference implementation showing the pattern
 */
export async function fetchAllBalancesMulticall(
  chainId: number,
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  marginAccount?: `0x${string}`
) {
  const { SUPPORTED_TOKENS_BY_CHAIN } = await import("@/lib/utils/web3/token");

  const supported = SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? [];
  const tokenAddrMap = tokenAddressByChain[chainId] ?? {};

  const contracts: any[] = [];

  // Build wallet balance contracts
  for (const token of supported) {
    if (token === "ETH") continue; // Handle separately

    const contract = tokenAddrMap[token];
    if (!contract) continue;

    contracts.push({
      address: contract,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress],
    });
  }

  // Build margin balance contracts
  if (marginAccount) {
    for (const token of supported) {
      if (token === "ETH") continue;

      const contract = tokenAddrMap[token];
      if (!contract) continue;

      contracts.push({
        address: contract,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [marginAccount],
      });
    }
  }

  // Execute multicall
  const [walletEth, marginEth, multicallResults] = await Promise.all([
    publicClient.getBalance({ address: userAddress }),
    marginAccount
      ? publicClient.getBalance({ address: marginAccount })
      : Promise.resolve(BigInt(0)),
    contracts.length > 0
      ? publicClient.multicall({ contracts, allowFailure: true })
      : Promise.resolve([]),
  ]);

  return {
    walletEth,
    marginEth,
    tokenBalances: multicallResults,
  };
}
