import { CHAIN_CONFIG } from "@/lib/utils/web3/chainConfig";
import { useAccount, useBalance, useChainId } from "wagmi";


type SupportedChainId = 42161 | 10 | 8453 ;


export const useTokenBalance = (symbol) => {
  const chainId = useChainId() as SupportedChainId;
  const { address } = useAccount();
  
  const tokenAddr = CHAIN_CONFIG[chainId].tokens[symbol];
  return useBalance({ address, token: tokenAddr as `0x${string}`, watch: true });
};
