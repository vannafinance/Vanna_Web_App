"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useFetchAccountCheck, useFetchBorrowState, useFetchBorrowPositions } from "@/lib/utils/margin/marginFetchers";

export const DebugBorrowComparison = () => {
  const { chainId, address } = useAccount();
  const publicClient = usePublicClient();
  const [data, setData] = useState<any>(null);

  const fetchAccountCheck = useFetchAccountCheck(chainId, address as `0x${string}`, publicClient);
  const fetchBorrowState = useFetchBorrowState(chainId, publicClient);
  const fetchBorrowPositions = useFetchBorrowPositions(chainId, publicClient);

  useEffect(() => {
    const load = async () => {
      if (!publicClient || !chainId || !address) return;

      const accounts = await fetchAccountCheck();
      if (!accounts || !accounts.length) {
        setData({ error: "No margin account" });
        return;
      }

      const acc = accounts[0];

      // Get aggregate from RiskEngine
      const borrowStateRaw = await fetchBorrowState(acc);
      const riskEngineTotal = borrowStateRaw[0]?.usd || 0;

      // Get detailed positions from VToken contracts
      const positions = await fetchBorrowPositions(acc);

      // Fetch prices to calculate manual total
      const pricesRes = await fetch("/api/prices");
      const prices = await pricesRes.json();

      const manualTotal = positions.reduce((sum: number, pos: any) => {
        const price = prices[pos.asset] || 0;
        return sum + (Number(pos.amount) * price);
      }, 0);

      setData({
        riskEngineTotal,
        positions,
        manualTotal,
        prices,
      });
    };

    load();
  }, [publicClient, chainId, address]);

  if (!data) return <div className="p-4 bg-gray-100 rounded">Loading debug data...</div>;
  if (data.error) return <div className="p-4 bg-red-100 rounded">{data.error}</div>;

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded space-y-4">
      <h3 className="font-bold text-lg">🔍 Debug: Borrow Calculation Comparison</h3>

      <div className="space-y-2">
        <div className="font-semibold text-green-700">
          RiskEngine.getBorrows() Total: ${data.riskEngineTotal?.toFixed(4)}
        </div>

        <div className="font-semibold text-blue-700">
          Manual Calculation (VToken contracts): ${data.manualTotal?.toFixed(4)}
        </div>

        <div className={`font-bold ${Math.abs(data.riskEngineTotal - data.manualTotal) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
          Difference: ${Math.abs(data.riskEngineTotal - data.manualTotal).toFixed(4)}
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="font-semibold">Individual Borrow Positions:</h4>
        {data.positions.length === 0 && <p className="text-gray-500">No active borrows</p>}
        {data.positions.map((pos: any, i: number) => (
          <div key={i} className="pl-4 text-sm">
            • {pos.asset}: {pos.amount} (@ ${data.prices[pos.asset]?.toFixed(2)} = ${(Number(pos.amount) * data.prices[pos.asset]).toFixed(2)})
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-600 mt-4">
        ✅ <strong>Now using manual VToken calculation</strong> which directly reads from token contracts.
        This bypasses RiskEngine oracle/decimal issues and provides accurate values.
      </div>

      <div className="text-xs font-semibold text-green-700 mt-2">
        🎯 Expected: Both values should now match (difference ≈ $0.00)
      </div>
    </div>
  );
};
