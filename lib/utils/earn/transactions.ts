// Supply and Withdraw transactions for Earn vaults (ETH, USDC, USDT)

import { erc20Abi, parseUnits } from "viem";
import VToken from "@/abi/vanna/out/out/VToken.sol/VToken.json";
import VEther from "@/abi/vanna/out/out/VEther.sol/VEther.json";
import { TOKEN_DECIMALS, vTokenAddressByChain, tokenAddressByChain } from "@/lib/utils/web3/token";
import { EarnAsset, SupplyResult, WithdrawResult } from "@/lib/types";


/**
 * @notice Parameters required to supply native ETH into an Earn vault
 * @dev Used for VEther-based vault interactions
 */


type SupplyEthParams = {
    walletClient: any;
    publicClient: any;
    chainId: number;
    amount: string;
    userAddress: `0x${string}`;

}

/**
 * @notice Parameters required to supply ERC20 tokens into an Earn vault
 * @dev Token must be approved before calling supply
 */

type SupplyTokenParams = {
    walletClient: any;
    publicClient: any;
    chainId: number;
    amount: string;
    asset: "USDC" | "USDT";
    userAddress: `0x${string}`;

}

type WithdrawEthParams = {
    walletClient: any;
    publicClient: any;
    chainId: number;
    shares: string;           // vETH shares to redeem (e.g., "100")
    userAddress: `0x${string}`;
}

type WithdrawTokenParams = {
    walletClient: any;
    publicClient: any;
    chainId: number;
    shares: string;
    asset: "USDC" | "USDT";
    userAddress: `0x${string}`;
}



/**
 * @notice Returns the vToken contract address for a given asset and chain
 * @dev Throws if the vToken is not configured for the chain
 * @param chainId Chain ID where the Earn vault exists
 * @param asset Earn asset type (ETH, USDC, USDT)
 * @return address The vToken contract address
 */


export const getVTokenAddress = (chainId: number, asset: EarnAsset): `0x${string}` => {
    const address = vTokenAddressByChain[chainId]?.[asset];
    if (!address) {
        throw new Error(`vToken address not found for ${asset} on chain ${chainId}`);
    }
    return address;
};


/**
 * @notice Returns the underlying ERC20 token address for a given asset
 * @dev Only applicable for ERC20-based Earn vaults (USDC, USDT)
 * @param chainId Chain ID where the token is deployed
 * @param asset ERC20 asset symbol
 * @return address The ERC20 token contract address
 */

export const getTokenAddress = (chainId: number, asset: "USDC" | "USDT"): `0x${string}` => {
    const address = tokenAddressByChain[chainId]?.[asset];
    if (!address) {
        throw new Error(`Token address not found for ${asset} on chain ${chainId}`);
    }
    return address;
};


/**
 * Supply ETH to vETH vault
 * Calls: VEther.depositEth() payable
 * Returns: vETH shares
 */


export const supplyEth = async ({
  walletClient,
  publicClient,
  chainId,
  amount,
  userAddress,
}: SupplyEthParams): Promise<SupplyResult> => {
  try {
    const vEtherAddress = getVTokenAddress(chainId, "ETH");
    const decimals = TOKEN_DECIMALS["ETH"]; // 18
    const parsedAmount = parseUnits(amount, decimals);

    // Call depositEth() with ETH value
    const txHash = await walletClient.writeContract({
      address: vEtherAddress,
      abi: VEther.abi,
      functionName: "depositEth",
      value: parsedAmount,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Get shares received from logs (optional - can be calculated)
    // For now, return success
    return {
      success: true,
      txHash,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Supply ETH failed",
    };
  }
};


/**
 * Supply USDC or USDT to vToken vault
 * Steps: 1. Approve vToken contract  2. Call deposit()
 * Returns: vToken shares
 */

export const supplyToken = async ({
  walletClient,
  publicClient,
  chainId,
  asset,
  amount,
  userAddress,
}: SupplyTokenParams): Promise<SupplyResult> => {
  try {
    const vTokenAddress = getVTokenAddress(chainId, asset);
    const tokenAddress = getTokenAddress(chainId, asset);
    const decimals = TOKEN_DECIMALS[asset]; // 6 for USDC/USDT
    const parsedAmount = parseUnits(amount, decimals);

    // Step 1: Check allowance
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [userAddress, vTokenAddress],
    }) as bigint;

    // Step 2: Approve if needed
    if (allowance < parsedAmount) {
      const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      const approveHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [vTokenAddress, MAX_UINT256],
      });

      // Wait for approval confirmation
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Step 3: Deposit into vault
    // VToken.deposit(uint256 assets, address receiver) returns uint256 shares
    const txHash = await walletClient.writeContract({
      address: vTokenAddress,
      abi: VToken.abi,
      functionName: "deposit",
      args: [parsedAmount, userAddress],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: true,
      txHash,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || `Supply ${asset} failed`,
    };
  }
};


/**
 * Withdraw ETH from vETH vault
 * Calls: VEther.redeemEth(uint256 shares)
 * Returns: ETH to user
 */


export const withdrawEth = async ({
  walletClient,
  publicClient,
  chainId,
  shares,
  userAddress,
}: WithdrawEthParams): Promise<WithdrawResult> => {
  try {
    const vEtherAddress = getVTokenAddress(chainId, "ETH");
    const decimals = 18; // vETH has 18 decimals
    const parsedShares = parseUnits(shares, decimals);

    // Call redeemEth(shares)
    const txHash = await walletClient.writeContract({
      address: vEtherAddress,
      abi: VEther.abi,
      functionName: "redeemEth",
      args: [parsedShares],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: true,
      txHash,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Withdraw ETH failed",
    };
  }
};



/**
 * Withdraw USDC or USDT from vToken vault
 * Calls: VToken.redeem(uint256 shares, address receiver, address owner)
 * Returns: Underlying tokens to user
 */


export const withdrawToken = async ({
  walletClient,
  publicClient,
  chainId,
  asset,
  shares,
  userAddress,
}: WithdrawTokenParams): Promise<WithdrawResult> => {
  try {
    const vTokenAddress = getVTokenAddress(chainId, asset);
    // vToken shares for all assets are standardized to 18 decimals,
    // similar to vETH. The underlying asset's decimals are not used for shares.
    const vTokenDecimals = TOKEN_DECIMALS[asset];
    const parsedShares = parseUnits(shares, vTokenDecimals);

    // Call redeem(shares, receiver, owner)
    const txHash = await walletClient.writeContract({
      address: vTokenAddress,
      abi: VToken.abi,
      functionName: "redeem",
      args: [parsedShares, userAddress, userAddress],
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return {
      success: true,
      txHash,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || `Withdraw ${asset} failed`,
    };
  }
};



// Unified supply and withdraw 



export const supply = async (params: {
  walletClient: any;
  publicClient: any;
  chainId: number;
  asset: EarnAsset;
  amount: string;
  userAddress: `0x${string}`;
}): Promise<SupplyResult> => {
  if (params.asset === "ETH") {
    return supplyEth(params);
  }
  return supplyToken({ ...params, asset: params.asset as "USDC" | "USDT" });
};

/**
 * Unified withdraw function - handles both ETH and ERC20
 */
export const withdraw = async (params: {
  walletClient: any;
  publicClient: any;
  chainId: number;
  asset: EarnAsset;
  shares: string;
  userAddress: `0x${string}`;
}): Promise<WithdrawResult> => {
  if (params.asset === "ETH") {
    return withdrawEth(params);
  }
  return withdrawToken({ ...params, asset: params.asset as "USDC" | "USDT" });
};
