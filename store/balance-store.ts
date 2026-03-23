import { create } from "zustand"
import {
  TOKEN_DECIMALS,
  tokenAddressByChain,
  SUPPORTED_TOKENS_BY_CHAIN,
} from "@/lib/utils/web3/token"
import { erc20Abi, formatUnits, PublicClient } from "viem"

type BalanceType = "WB" | "MB"

export interface AssetBalance {
  asset: string
  type: BalanceType
  amount: number
}

interface BalanceStore {
  balances: AssetBalance[]
  walletBalances: AssetBalance[]
  marginBalances: AssetBalance[]

  refreshBalances: (params: {
    chainId: number
    address: `0x${string}`
    publicClient: PublicClient
    marginAccount?: `0x${string}`
  }) => Promise<void>

  getBalance: (asset: string, type: BalanceType) => number
  reset: () => void
}

export const useBalanceStore = create<BalanceStore>((set, get) => ({
  balances: [],
  walletBalances: [],
  marginBalances: [],

  refreshBalances: async ({ chainId, address, publicClient, marginAccount }) => {
    const supported = SUPPORTED_TOKENS_BY_CHAIN[chainId] ?? []
    const addrMap = tokenAddressByChain[chainId] ?? {}

    const wbTokens: string[] = []
    const wbContracts: any[] = []

    const mbTokens: string[] = []
    const mbContracts: any[] = []

    // ETH is native, skip from ERC20 calls
    for (const token of supported) {
      if (token === "ETH") continue
      const contract = addrMap[token]
      if (!contract) continue

      wbTokens.push(token)
      wbContracts.push({
        address: contract,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      })

      if (marginAccount) {
        mbTokens.push(token)
        mbContracts.push({
          address: contract,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [marginAccount],
        })
      }
    }

    const allContracts = [...wbContracts, ...mbContracts]

    const [wbEthRaw, mbEthRaw, multicallResults] = await Promise.all([
      publicClient.getBalance({ address }), // Base ETH native
      marginAccount ? publicClient.getBalance({ address: marginAccount }) : Promise.resolve(0n),
      allContracts.length > 0 ? publicClient.multicall({ contracts: allContracts }) : Promise.resolve([]),
    ])

    const wbResults = multicallResults.slice(0, wbContracts.length)
    const mbResults = multicallResults.slice(wbContracts.length)

    const walletArr: AssetBalance[] = []

    // ETH wallet
    walletArr.push({
      asset: "ETH",
      type: "WB",
      amount: Number(formatUnits(wbEthRaw, 18)),
    })

    for (let i = 0; i < supported.length; i++) {
      const token = supported[i]
      if (token === "ETH") continue

      const index = wbTokens.indexOf(token)
      if (index !== -1 && wbResults[index]?.status === "success") {
        const decimals = TOKEN_DECIMALS[token] ?? 18
        walletArr.push({
          asset: token,
          type: "WB",
          amount: Number(formatUnits(wbResults[index].result as bigint, decimals)),
        })
      } else {
        walletArr.push({ asset: token, type: "WB", amount: 0 })
      }
    }

    const marginArr: AssetBalance[] = []

    if (marginAccount) {
      marginArr.push({
        asset: "ETH",
        type: "MB",
        amount: Number(formatUnits(mbEthRaw, 18)),
      })

      for (let i = 0; i < supported.length; i++) {
        const token = supported[i]
        if (token === "ETH") continue

        const index = mbTokens.indexOf(token)
        if (index !== -1 && mbResults[index]?.status === "success") {
          const decimals = TOKEN_DECIMALS[token] ?? 18
          marginArr.push({
            asset: token,
            type: "MB",
            amount: Number(formatUnits(mbResults[index].result as bigint, decimals)),
          })
        } else {
          marginArr.push({ asset: token, type: "MB", amount: 0 })
        }
      }
    }

    const balances = [...walletArr, ...marginArr]

    set({
      balances,
      walletBalances: walletArr,
      marginBalances: marginArr,
    })
  },

  getBalance: (asset, type) => {
    const b = get().balances.find((b) => b.asset === asset && b.type === type)
    return b?.amount ?? 0
  },

  reset: () => {
    set({
      balances: [],
      walletBalances: [],
      marginBalances: [],
    })
  },
}))