'use client'

import { useEffect, useMemo, useState } from "react"
import { useAccount, usePublicClient, useChainId } from "wagmi"
import { fetchBorrowPosition } from "../../lib/utils/margin/testmargin"

export default function BorrowDashboard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !chainId) return

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchBorrowPosition(chainId, address, publicClient)
        setData(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [address, chainId, publicClient, isConnected])

  const ethPriceUSD = 1984.5

  const totalOutstandingUSD = useMemo(() => {
    if (!data?.hasAccount) return 0
    if (!data) return 0

    const ethUSD = Number(data.borrowedETH.toString()) * ethPriceUSD
    const usdcUSD = Number(data.borrowedUSDC.toString())

    return ethUSD + usdcUSD ;
  }, [data])

  if (!isConnected) return <p>Connect wallet</p>
  if (loading) return <p>Loading borrow positions...</p>
  if (!data) return <p>Failed to load data</p>

  if (!data.hasAccount) {
    return <p>You don’t have an account on this chain yet.</p>
  }

  return (
    <div className="p-4 space-y-2 rounded-xl border">
      <p><b>Active Account:</b> {data.activeAccount}</p>

      <p><b>ETH Balance:</b> {(Number(data.accountBalance) / 1e18).toFixed(4)} ETH</p>

      <p><b>Borrowed ETH:</b> {data.borrowedETH.toString()} ETH</p>
      <p><b>Borrowed USDC:</b> {data.borrowedUSDC.toString()} USDC</p>
      <p><b>Borrowed USDC:</b> {data.borrowedUSDT.toString()} USDC</p>

      <hr />

      <p className="font-semibold text-lg">
        💸 Total Outstanding to Repay (USD): ${totalOutstandingUSD.toFixed(2)}
      </p>
    </div>
  )
}
