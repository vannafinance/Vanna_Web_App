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
    const marginAccount = await getMarginAccount({ fetchAccountCheck });
   const addresses = getAddressList(chainId);


    const token = tokenAddressByChain[chainId!]?.[asset];
    if (!token) throw new Error(`Unknown token mapping for ${asset}`);

    const decimals = TOKEN_DECIMALS[asset];
    const parsed = parseUnits(amount, decimals);


    const allowance = await publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: "allowance",
        args: [walletClient.account.address, addresses!.accountManagerContractAddress],
    }) as bigint;


    if (allowance < parsed) {
        const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        await walletClient.writeContract({
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [addresses!.accountManagerContractAddress, MAX_UINT256],
        });
    }


    const txHash=await walletClient.writeContract({
        address: addresses!.accountManagerContractAddress,
        abi: AccountManager.abi,
        functionName: "deposit",
        args: [marginAccount, token, parsed],
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    await useMarginStore.getState().reloadMarginState();

    return txHash


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



