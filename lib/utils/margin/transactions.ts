// transactions.ts (deposit, withdraw, borrow, repay, transfer)

import { erc20Abi, parseUnits } from "viem";
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

    console.log(`[Deposit] Token: ${token}, Amount: ${parsed.toString()} (${decimals} decimals)`);

    // ✅ Check wallet balance before proceeding
    const walletBalance = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletClient.account.address],
    }) as bigint;

    console.log(`[Deposit] Wallet balance: ${walletBalance.toString()}, Required: ${parsed.toString()}`);

    if (walletBalance < parsed) {
        const balanceInToken = Number(walletBalance) / Math.pow(10, decimals);
        const requiredInToken = Number(parsed) / Math.pow(10, decimals);
        throw new Error(
            `Insufficient ${asset} balance. Have: ${balanceInToken.toFixed(6)}, Need: ${requiredInToken.toFixed(6)}`
        );
    }

    // Check current allowance
    const allowance = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [walletClient.account.address, addresses.accountManagerContractAddress],
    }) as bigint;

    console.log(`[Deposit] Current allowance: ${allowance.toString()}, Required: ${parsed.toString()}`);

    // If allowance is insufficient, approve first
    if (allowance < parsed) {
        console.log(`[Deposit] Insufficient allowance, requesting approval...`);
        const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        const approvalHash = await walletClient.writeContract({
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [addresses.accountManagerContractAddress, MAX_UINT256],
        });

        console.log(`[Deposit] Approval transaction submitted: ${approvalHash}`);
        console.log(`[Deposit] Waiting for approval confirmation...`);

        // ✅ CRITICAL FIX: Wait for approval transaction to confirm
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        console.log(`[Deposit] Approval confirmed!`);
    } else {
        console.log(`[Deposit] Sufficient allowance already exists, skipping approval`);
    }

    // Now execute the deposit
    console.log(`[Deposit] Submitting deposit transaction...`);
    const txHash = await walletClient.writeContract({
        address: addresses.accountManagerContractAddress,
        abi: AccountManager.abi,
        functionName: "deposit",
        args: [marginAccount, token, parsed],
    });

    console.log(`[Deposit] Deposit transaction submitted: ${txHash}`);
    console.log(`[Deposit] Waiting for deposit confirmation...`);

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`[Deposit] Deposit confirmed!`);

    console.log(`[Deposit] Reloading margin state...`);
    await useMarginStore.getState().reloadMarginState();

    console.log(`[Deposit] ✅ Deposit complete!`);
    return txHash;

    } catch (error: any) {
        console.error(`[Deposit] ❌ Error:`, error);

        // Check if user rejected the transaction
        if (error?.code === 4001 || error?.message?.includes("User rejected") || error?.message?.includes("user rejected")) {
            throw new Error("Transaction cancelled by user");
        }

        // Check for insufficient balance
        if (error?.message?.includes("Insufficient")) {
            throw error; // Re-throw our custom balance error
        }

        // Check for contract errors
        if (error?.message?.includes("execution reverted")) {
            throw new Error(`Contract error: ${error.shortMessage || error.message || "Unknown error"}`);
        }

        // Generic error
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

    const decimals = TOKEN_DECIMALS[asset];
    const parsed = parseUnits(amount, decimals);

    // special case for WETH / ETH
    if (asset === "WETH" || asset === "ETH") {
        return walletClient.writeContract({
            address: addresses!.accountManagerContractAddress,
            abi: AccountManager.abi,
            functionName: "withdrawEth",
            args: [marginAccount, parsed],
        });
    }

    const token = tokenAddressByChain[chainId!]?.[asset];
    if (!token) throw new Error(`Unknown token mapping for ${asset}`);

    const tx_hash=await walletClient.writeContract({
        address: addresses!.accountManagerContractAddress,
        abi: AccountManager.abi,
        functionName: "withdraw",
        args: [marginAccount, token, parsed],
    });

     await publicClient.waitForTransactionReceipt({ hash: tx_hash });

    await useMarginStore.getState().reloadMarginState();

    return tx_hash ;



};



