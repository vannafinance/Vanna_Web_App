import { useCallback } from "react";
import { usePublicClient } from "wagmi";
import Registry from "@/abi/vanna/out/out/Registry.sol/Registry.json";
import RiskEngine from "@/abi/vanna/out/out/RiskEngine.sol/RiskEngine.json";
import { getAddressList } from "@/lib/utils/web3/addressList";

// Fetcher 1: Get account addresses
export const useFetchAccountCheck = (
  chainId?: number,
  address?: `0x${string}`,
  publicClient?: any
) => {
  return useCallback(async (): Promise<`0x${string}`[]> => {
    if (!publicClient || !chainId || !address) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    const accounts = await publicClient.readContract({
      address: addressList.registryContractAddress,
      abi: Registry.abi,
      functionName: "accountsOwnedBy",
      args: [address],
    }) as `0x${string}`[];

    return accounts;
  }, [address, publicClient, chainId]);
};

// Fetcher 2: Get collateral state
export const useFetchCollateralState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBalance",
      args: [acc],
    }) as bigint[];

    const collateralUsd = Number(raw) / 1e16;
    return [{ token: "USD", amount: collateralUsd, usd: collateralUsd }];
  }, [publicClient, chainId]);
};

// Fetcher 3: Get borrow state
export const useFetchBorrowState = (chainId?: number, publicClient?: any) => {
  return useCallback(async (acc: `0x${string}`) => {
    if (!publicClient || !chainId) return [];

    const addressList = getAddressList(chainId);
    if (!addressList) return [];

    const raw = await publicClient.readContract({
      address: addressList.riskEngineContractAddress,
      abi: RiskEngine.abi,
      functionName: "getBorrows",
      args: [acc],
    }) as bigint[];

    const borrowUsd = Number(raw) / 1e16;
    return [{ token: "USD", amount: borrowUsd, usd: borrowUsd }];
  }, [publicClient, chainId]);
};