import { baseAddressList, arbAddressList, opAddressList } from "@/lib/web3Constants";

export type AddressList = typeof baseAddressList;

export const getAddressList = (chainId: number | undefined): AddressList | null => {
  if (!chainId) return null;
  
  switch (chainId) {
    case 42161:
      return arbAddressList;
    case 10:
      return opAddressList;
    case 8453:
      return baseAddressList;
    default:
      return null;
  }
};