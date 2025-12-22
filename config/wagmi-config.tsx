import { createConfig, http } from 'wagmi';
import { mainnet,sepolia,base,optimism  } from 'viem/chains';
import { injected,metaMask,safe,walletConnect  } from 'wagmi/connectors';



const projectId = "f22dfa1f5a575e7a9ca23001ebc6bec8" ; // https://dashboard.reown.com/


export const config=createConfig({
    chains:[mainnet,sepolia],
    connectors:[
        injected(),
        walletConnect({projectId}),
        metaMask(),

    ],
    transports:{
        [mainnet.id]:http(),
        [sepolia.id]:http()
    }
})