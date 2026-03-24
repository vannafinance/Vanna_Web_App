// transactions.ts (deposit, withdraw, borrow, repay, transfer)

import { erc20Abi, parseUnits, encodeFunctionData } from "viem";
import AccountManager from "@/abi/vanna/out/out/AccountManager.sol/AccountManager.json";
import { TOKEN_DECIMALS, tokenAddressByChain } from "@/lib/utils/web3/token";
import { useMarginStore } from "@/store/margin-account-state";
import { getAddressList } from "../web3/addressList";


type DepositTxParams = {
    walletClient: any;
    publicClient: any;
    chainId: number | undefined;
    fetchAccountCheck: () => Promise<string[]>;
    asset: string;
    amount: string;
};

type WithdrawTxParams = {
    walletClient: any;
    publicClient: any;
    chainId: number | undefined;
    fetchAccountCheck: () => Promise<string[]>;
    asset: string;
    amount: string;
};

// --- SMALL HELPERS ---

export const getMarginAccount = async ({ fetchAccountCheck,
}: {
    fetchAccountCheck: () => Promise<string[]>;
}) => {
    const accounts = await fetchAccountCheck();
    if (!accounts?.length) throw new Error("No margin account");
    return accounts[0];
};

export const getAddresses = ({
    getAddressList,
}: {
    getAddressList: () => any;
}) => {
    const addresses = getAddressList();
    if (!addresses) throw new Error("Unsupported chain");
    return addresses;
};

/**
 * Estimate gas with a fallback — required for Privy embedded wallets.
 * Without explicit gas, Privy sends gas=0, causing "intrinsic gas too low" errors.
 */
async function estimateGasWithFallback(
    publicClient: any,
    params: { account: `0x${string}`; to: `0x${string}`; data: `0x${string}` },
    fallback: bigint
): Promise<bigint> {
    try {
        const est = await publicClient.estimateGas(params);
        return (est * 130n) / 100n; // +30% buffer
    } catch {
        return fallback;
    }
}

// --- DEPOSIT ---

export const depositTx = async ({
    walletClient,
    publicClient,
    chainId,
    fetchAccountCheck,
    asset,
    amount,
}: DepositTxParams) => {
    try {
        console.log(`[Deposit] Starting deposit: ${amount} ${asset} on chain ${chainId}`);

        const marginAccount = await getMarginAccount({ fetchAccountCheck });
        console.log(`[Deposit] Margin account: ${marginAccount}`);

        const addresses = getAddressList(chainId);
        if (!addresses) throw new Error("Unsupported chain");

        const token = tokenAddressByChain[chainId!]?.[asset];
        if (!token) throw new Error(`Unknown token mapping for ${asset}`);

        const decimals = TOKEN_DECIMALS[asset];
        const parsed = parseUnits(amount, decimals);
        const userAddress: `0x${string}` = walletClient.account.address;

        console.log(`[Deposit] Token: ${token}, Amount: ${parsed.toString()} (${decimals} decimals)`);

        // Check wallet balance
        const walletBalance = await publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [userAddress],
        }) as bigint;

        if (walletBalance < parsed) {
            const balanceInToken = Number(walletBalance) / Math.pow(10, decimals);
            const requiredInToken = Number(parsed) / Math.pow(10, decimals);
            throw new Error(
                `Insufficient ${asset} balance. Have: ${balanceInToken.toFixed(6)}, Need: ${requiredInToken.toFixed(6)}`
            );
        }

        // Check allowance
        const allowance = await publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "allowance",
            args: [userAddress, addresses.accountManagerContractAddress],
        }) as bigint;

        console.log(`[Deposit] Allowance: ${allowance}, Required: ${parsed}`);

        // Approve if needed
        if (allowance < parsed) {
            console.log(`[Deposit] Requesting approval...`);
            const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

            // ERC20 approve — estimate gas, fallback 120k
            const approveGas = await estimateGasWithFallback(
                publicClient,
                {
                    account: userAddress,
                    to: token as `0x${string}`,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [addresses.accountManagerContractAddress, MAX_UINT256],
                    }),
                },
                120000n
            );

            const approvalHash = await walletClient.writeContract({
                address: token,
                abi: erc20Abi,
                functionName: "approve",
                args: [addresses.accountManagerContractAddress, MAX_UINT256],
                gas: approveGas,
            });

            console.log(`[Deposit] Approval tx: ${approvalHash}`);
            await publicClient.waitForTransactionReceipt({ hash: approvalHash });
            console.log(`[Deposit] Approval confirmed!`);
        }

        // Deposit — estimate gas, fallback 400k
        const depositGas = await estimateGasWithFallback(
            publicClient,
            {
                account: userAddress,
                to: addresses.accountManagerContractAddress as `0x${string}`,
                data: encodeFunctionData({
                    abi: AccountManager.abi as any,
                    functionName: "deposit",
                    args: [marginAccount, token, parsed],
                }),
            },
            400000n
        );

        console.log(`[Deposit] Submitting deposit...`);
        const txHash = await walletClient.writeContract({
            address: addresses.accountManagerContractAddress,
            abi: AccountManager.abi,
            functionName: "deposit",
            args: [marginAccount, token, parsed],
            gas: depositGas,
        });

        console.log(`[Deposit] Tx: ${txHash}`);
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        await useMarginStore.getState().reloadMarginState();
        console.log(`[Deposit] ✅ Complete!`);
        return txHash;

    } catch (error: any) {
        console.error(`[Deposit] ❌ Error:`, error);

        if (error?.code === 4001 || error?.message?.includes("User rejected") || error?.message?.includes("user rejected")) {
            throw new Error("Transaction cancelled by user");
        }
        if (error?.message?.includes("Insufficient")) {
            throw error;
        }
        if (error?.message?.includes("execution reverted")) {
            throw new Error(`Contract error: ${error.shortMessage || error.message}`);
        }
        throw new Error(`Deposit failed: ${error.message || "Unknown error"}`);
    }
};

// --- WITHDRAW ---

export const withdrawTx = async ({
    walletClient,
    publicClient,
    chainId,
    fetchAccountCheck,
    asset,
    amount,
}: WithdrawTxParams) => {
    const marginAccount = await getMarginAccount({ fetchAccountCheck });
    const addresses = getAddressList(chainId);
    if (!addresses) throw new Error("Unsupported chain");

    const decimals = TOKEN_DECIMALS[asset];
    const parsed = parseUnits(amount, decimals);
    const userAddress: `0x${string}` = walletClient.account.address;

    if (asset === "WETH" || asset === "ETH") {
        const withdrawEthGas = await estimateGasWithFallback(
            publicClient,
            {
                account: userAddress,
                to: addresses.accountManagerContractAddress as `0x${string}`,
                data: encodeFunctionData({
                    abi: AccountManager.abi as any,
                    functionName: "withdrawEth",
                    args: [marginAccount, parsed],
                }),
            },
            300000n
        );

        return walletClient.writeContract({
            address: addresses.accountManagerContractAddress,
            abi: AccountManager.abi,
            functionName: "withdrawEth",
            args: [marginAccount, parsed],
            gas: withdrawEthGas,
        });
    }

    const token = tokenAddressByChain[chainId!]?.[asset];
    if (!token) throw new Error(`Unknown token mapping for ${asset}`);

    const withdrawGas = await estimateGasWithFallback(
        publicClient,
        {
            account: userAddress,
            to: addresses.accountManagerContractAddress as `0x${string}`,
            data: encodeFunctionData({
                abi: AccountManager.abi as any,
                functionName: "withdraw",
                args: [marginAccount, token, parsed],
            }),
        },
        300000n
    );

    const tx_hash = await walletClient.writeContract({
        address: addresses.accountManagerContractAddress,
        abi: AccountManager.abi,
        functionName: "withdraw",
        args: [marginAccount, token, parsed],
        gas: withdrawGas,
    });

    await publicClient.waitForTransactionReceipt({ hash: tx_hash });
    await useMarginStore.getState().reloadMarginState();

    return tx_hash;
};
