
export const NETWORKS = {
  BASE: { chainID: 8453, icons: "/icons/base.svg", name: "Base" },
  ARB: { chainId: 42161, icon: "/icons/arbitrum.svg", name: "Arbitrum" },
  OP: { chainId: 10, icon: "/icons/op.svg", name: "Optimism" },
} as const;


export const networkOptions = Object.values(NETWORKS) // it will give only value from NETWORKS



