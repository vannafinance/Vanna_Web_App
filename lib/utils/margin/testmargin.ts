import { useCallback } from "react";
import { getAddressList } from "../web3/addressList";
import Registry from "../../../abi/vanna/out/out/Registry.sol/Registry.json"
import { BugIcon } from "lucide-react";
import { readContract } from "viem/actions";
import VEther from '@/abi/vanna/out/out/VEther.sol/VEther.json';
import VToken from '@/abi/vanna/out/out/VToken.sol/VToken.json';


export const fetchBorrowPosition = async (
  chainId: number,
  userAddress: `0x${string}`,
  publicClient: any
) => {
  if (!chainId || !publicClient) return null;

  const addressList = getAddressList(chainId);
  if (!addressList) return null;

  let accounts: `0x${string}`[] = [];

  try {
    accounts = await publicClient.readContract({
      address: addressList.registryContractAddress,
      abi: Registry.abi,
      functionName: "accountsOwnedBy",
      args: [userAddress],
    }) as `0x${string}`[];
  } catch (e) {
    console.error("Registry read failed:", e);
    return null;
  }

  if (!accounts.length) {
    return { hasAccount: false };
  }

  const activeAccount = accounts[0];

  try {
    const accountBalance = await publicClient.getBalance({ address: activeAccount });

    const borrowedBalanceRaw = await publicClient.readContract({
      address: addressList.vEtherContractAddress,
      abi: VEther.abi,
      functionName: "getBorrowBalance",
      args: [activeAccount],
    });

    const borrowedETH = BigInt(borrowedBalanceRaw) / (10n ** 18n);

    const borrowedUSDCraw = await publicClient.readContract({
      address: addressList.vUSDCContractAddress,
      abi: VToken.abi,
      functionName: "getBorrowBalance",
      args: [activeAccount],
    });

    const borrowedUSDC = BigInt(borrowedUSDCraw) / (10n ** 6n);
    const borrowedUSDTraw = await publicClient.readContract({
      address: addressList.vUSDTContractAddress,
      abi: VToken.abi,
      functionName: "getBorrowBalance",
      args: [activeAccount],
    });

    const borrowedUSDT = BigInt(borrowedUSDCraw) / (10n ** 6n);

 
    return {
      hasAccount: true,
      activeAccount,
      accountBalance,
      borrowedETH,
      borrowedUSDC,
      borrowedUSDT
    };
  } catch (e) {
    console.error("Borrow fetch failed:", e);
    return null;
  }
};
