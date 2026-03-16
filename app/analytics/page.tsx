'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTheme } from '@/contexts/theme-context';
import { useProtocolMetrics } from '@/lib/risk/hooks/useProtocolMetrics';
import { useRateModelData } from '@/lib/risk/hooks/useRateModelData';
import { useUserRiskPosition } from '@/lib/risk/hooks/useUserRiskPosition';
import MetricCard from '@/components/risk/MetricCard';
import UtilizationBar from '@/components/risk/UtilizationBar';
import HealthFactorGauge from '@/components/risk/HealthFactorGauge';
import PriceSimulator from '@/components/risk/PriceSimulator';
import {
  formatUSD, formatPercent, formatHF, bigintToNumber,
  getHFColor, getHFBgClass, getRiskTierColor, truncateAddress,
} from '@/lib/risk/formatting';
import { CHAIN_CONTRACTS, CHAIN_NAMES, CHAIN_COLORS, SUPPORTED_CHAINS } from '@/lib/risk/contracts';
import marginCalc from '@/lib/utils/margin/calculations';
import type { TokenRisk } from '@/lib/risk/types';

/* ═══════════════════════════════════════════════════════
   TYPES & DUMMY DATA
   ═══════════════════════════════════════════════════════ */

interface WalletPosition {
  address: string;
  collateral: number;
  debt: number;
  hf: number;
  primaryAsset: string;
  leverageX: number;
}

// Current token prices (dummy — later replace with oracle)
const TOKEN_PRICES: Record<string, number> = {
  ETH: 3500,
  WETH: 3500,
  USDC: 1,
  USDT: 1,
};

// All protocol tokens (for display across dashboard)
const PROTOCOL_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '◆' },
  { symbol: 'USDC', name: 'USD Coin', icon: '$' },
  { symbol: 'USDT', name: 'Tether USD', icon: '₮' },
];

// Simulation assets — ONLY volatile tokens (stablecoins excluded: no point simulating $1 price changes)
const SIM_ASSETS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '◆' },
];

// Generate realistic dummy wallet data
function generateWallets(chainId: number): WalletPosition[] {
  const seed = chainId * 7;
  const gen = (i: number) => {
    const r = Math.sin(seed + i * 13.7) * 10000;
    return Math.abs(r - Math.floor(r));
  };

  const wallets: WalletPosition[] = [];
  const assets = ['ETH', 'ETH', 'USDC', 'ETH', 'USDT', 'ETH', 'ETH', 'USDC'];

  // HF < 1.0 — Underwater / Eligible for liquidation
  const underwaterCount = 2 + Math.floor(gen(0) * 3);
  for (let i = 0; i < underwaterCount; i++) {
    const coll = 20000 + gen(i + 100) * 300000;
    const hf = 0.75 + gen(i + 200) * 0.24;
    const debt = (coll * 0.9) / hf;
    wallets.push({
      address: `0x${(seed * 1000 + i).toString(16).padStart(4, '0')}...${(i * 7 + 3).toString(16).padStart(4, '0')}`,
      collateral: coll, debt, hf,
      primaryAsset: assets[i % assets.length],
      leverageX: coll / Math.max(coll - debt, 1),
    });
  }

  // HF 1.0-1.1 — Critical
  const criticalCount = 3 + Math.floor(gen(1) * 4);
  for (let i = 0; i < criticalCount; i++) {
    const coll = 30000 + gen(i + 300) * 500000;
    const hf = 1.001 + gen(i + 400) * 0.098;
    const debt = (coll * 0.9) / hf;
    wallets.push({
      address: `0x${(seed * 2000 + i).toString(16).padStart(4, '0')}...${(i * 11 + 5).toString(16).padStart(4, '0')}`,
      collateral: coll, debt, hf,
      primaryAsset: assets[(i + 2) % assets.length],
      leverageX: coll / Math.max(coll - debt, 1),
    });
  }

  // HF 1.1-1.2 — Warning
  const warningCount = 5 + Math.floor(gen(2) * 6);
  for (let i = 0; i < warningCount; i++) {
    const coll = 25000 + gen(i + 500) * 600000;
    const hf = 1.1 + gen(i + 600) * 0.1;
    const debt = (coll * 0.9) / hf;
    wallets.push({
      address: `0x${(seed * 3000 + i).toString(16).padStart(4, '0')}...${(i * 13 + 9).toString(16).padStart(4, '0')}`,
      collateral: coll, debt, hf,
      primaryAsset: assets[(i + 4) % assets.length],
      leverageX: coll / Math.max(coll - debt, 1),
    });
  }

  // HF 1.2-1.5 — Caution
  const cautionCount = 12 + Math.floor(gen(3) * 8);
  for (let i = 0; i < cautionCount; i++) {
    const coll = 10000 + gen(i + 700) * 800000;
    const hf = 1.2 + gen(i + 800) * 0.3;
    const debt = (coll * 0.9) / hf;
    wallets.push({
      address: `0x${(seed * 4000 + i).toString(16).padStart(4, '0')}...${(i * 17 + 2).toString(16).padStart(4, '0')}`,
      collateral: coll, debt, hf,
      primaryAsset: assets[(i + 1) % assets.length],
      leverageX: coll / Math.max(coll - debt, 1),
    });
  }

  // HF > 1.5 — Safe
  const safeCount = 25 + Math.floor(gen(4) * 15);
  for (let i = 0; i < safeCount; i++) {
    const coll = 5000 + gen(i + 900) * 1000000;
    const hf = 1.5 + gen(i + 1000) * 3;
    const debt = (coll * 0.9) / hf;
    wallets.push({
      address: `0x${(seed * 5000 + i).toString(16).padStart(4, '0')}...${(i * 19 + 7).toString(16).padStart(4, '0')}`,
      collateral: coll, debt, hf,
      primaryAsset: assets[(i + 3) % assets.length],
      leverageX: coll / Math.max(coll - debt, 1),
    });
  }

  return wallets.sort((a, b) => a.hf - b.hf);
}

/* ═══════════════════════════════════════════════════════
   HELPERS & PRICE UTILS
   ═══════════════════════════════════════════════════════ */

function getApproxUsdPrice(symbol: string): number {
  return TOKEN_PRICES[symbol] || 1;
}

function getRiskTier(symbol: string, utilization: number, concentration: number): TokenRisk['riskTier'] {
  if (symbol === 'ETH' || symbol === 'WETH') {
    if (utilization > 85 || concentration > 60) return 'Critical';
    if (utilization > 70 || concentration > 40) return 'High';
    return 'Medium';
  }
  // Stablecoins (USDC, USDT) — lower inherent volatility risk
  return utilization > 90 ? 'High' : utilization > 75 ? 'Medium' : 'Low';
}

/* ═══════════════════════════════════════════════════════
   THEME-AWARE PRIMITIVES
   ═══════════════════════════════════════════════════════ */

function useColors() {
  const { isDark } = useTheme();
  return {
    isDark,
    pageBg: isDark ? 'bg-[#0D0D12]' : 'bg-[#F7F7F7]',
    cardBg: isDark ? 'bg-[#141419] border-[#1E1E26]' : 'bg-white border-[#E5E7EB]',
    cardBgHex: isDark ? '#141419' : '#FFFFFF',
    borderHex: isDark ? '#1E1E26' : '#E5E7EB',
    inputBg: isDark ? 'bg-[#0D0D12] border-[#1E1E26]' : 'bg-[#F7F7F7] border-[#E5E7EB]',
    text1: isDark ? 'text-[#F9FAFB]' : 'text-[#1F1F1F]',
    text2: isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]',
    text3: isDark ? 'text-[#6B7280]' : 'text-[#9CA3AF]',
    text4: isDark ? 'text-[#4B5563]' : 'text-[#D1D5DB]',
    gridLine: isDark ? '#1E1E26' : '#F3F4F6',
    hoverRow: isDark ? 'hover:bg-[#1E1E26]/30' : 'hover:bg-[#F9FAFB]',
    innerBg: isDark ? 'bg-[#0D0D12]' : 'bg-[#F7F7F7]',
    innerBorder: isDark ? 'border-[#1E1E26]' : 'border-[#E5E7EB]',
  };
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const c = useColors();
  return <div className={`rounded-2xl border p-5 ${c.cardBg} ${className}`}>{children}</div>;
}

function SectionHeader({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  const c = useColors();
  return (
    <div id={id} className="scroll-mt-16 pt-8 pb-3">
      <h2 className={`text-[15px] font-bold tracking-tight ${c.text1}`}>{title}</h2>
      <p className={`text-[11px] mt-0.5 ${c.text3}`}>{subtitle}</p>
      <div className="mt-2.5 h-px" style={{ backgroundColor: c.borderHex }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SVG LINE CHART (Chaos Labs style)
   ═══════════════════════════════════════════════════════ */

function LineChart({ title, subtitle, data, color, yFormat, xLabels }: {
  title: string; subtitle: string;
  data: number[]; color: string;
  yFormat: (v: number) => string;
  xLabels: string[];
}) {
  const c = useColors();
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - ((v - min) / range) * 85 - 5,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L 100 100 L 0 100 Z`;

  return (
    <Card>
      <h3 className={`text-sm font-bold ${c.text1} mb-0.5`}>{title}</h3>
      <p className={`text-[10px] ${c.text3} mb-4`}>{subtitle}</p>
      <div className="relative h-44">
        <div className={`absolute left-0 top-0 bottom-5 w-14 flex flex-col justify-between text-[9px] font-mono pr-2 text-right ${c.text3}`}>
          <span>{yFormat(max)}</span>
          <span>{yFormat((max + min) / 2)}</span>
          <span>{yFormat(min)}</span>
        </div>
        <div className="ml-16 mr-1 relative h-[calc(100%-18px)]">
          {[0, 50, 100].map(y => (
            <div key={y} className="absolute left-0 right-0 h-px" style={{ top: `${y}%`, backgroundColor: c.gridLine }} />
          ))}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#grad-${color.replace('#', '')})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={color} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
        </div>
        <div className={`ml-16 mr-1 flex justify-between text-[9px] font-mono mt-1 ${c.text4}`}>
          {xLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   RISK EXPLORER — Chaos Labs-style Coin Simulator
   ═══════════════════════════════════════════════════════ */

function RiskExplorer({ wallets, chainName }: { wallets: WalletPosition[]; chainName: string }) {
  const c = useColors();
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [priceChangePct, setPriceChangePct] = useState(5);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const [applied, setApplied] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);

  const currentPrice = TOKEN_PRICES[selectedAsset] || 1;
  const projectedPrice = direction === 'down'
    ? currentPrice * (1 - priceChangePct / 100)
    : currentPrice * (1 + priceChangePct / 100);

  // Simulate what happens to all wallets when this asset price changes
  const simulation = useMemo(() => {
    if (!applied) return null;
    const priceMultiplier = projectedPrice / currentPrice;

    const simulatedWallets = wallets.map(w => {
      // Only positions with the selected asset are affected
      const isAffected = w.primaryAsset === selectedAsset ||
        (selectedAsset === 'ETH' && w.primaryAsset === 'WETH');
      if (!isAffected) return w;

      const newCollateral = w.collateral * priceMultiplier;
      const newHf = marginCalc.calcHF(newCollateral, w.debt);
      return { ...w, collateral: newCollateral, hf: newHf };
    });

    const eligibleForLiq = simulatedWallets.filter(w => w.hf < 1.0);
    const riskForLiq = simulatedWallets.filter(w => w.hf >= 1.0 && w.hf < 1.2);
    const totalProtocolValue = wallets.reduce((s, w) => s + w.collateral, 0);
    const badDebt = eligibleForLiq.reduce((s, w) => s + Math.max(w.debt - w.collateral, 0), 0);

    return {
      wallets: simulatedWallets,
      eligibleForLiq,
      riskForLiq,
      eligibleValue: eligibleForLiq.reduce((s, w) => s + w.collateral, 0),
      riskValue: riskForLiq.reduce((s, w) => s + w.collateral, 0),
      badDebt,
      totalProtocolValue,
    };
  }, [applied, wallets, selectedAsset, projectedPrice, currentPrice]);

  // Pre-simulation stats (current state)
  const currentStats = useMemo(() => {
    const eligibleForLiq = wallets.filter(w => w.hf < 1.0);
    const riskForLiq = wallets.filter(w => w.hf >= 1.0 && w.hf < 1.2);
    const totalProtocolValue = wallets.reduce((s, w) => s + w.collateral, 0);
    const badDebt = eligibleForLiq.reduce((s, w) => s + Math.max(w.debt - w.collateral, 0), 0);
    return { eligibleForLiq, riskForLiq, eligibleValue: eligibleForLiq.reduce((s, w) => s + w.collateral, 0), riskValue: riskForLiq.reduce((s, w) => s + w.collateral, 0), badDebt, totalProtocolValue };
  }, [wallets]);

  const stats = applied && simulation ? simulation : currentStats;
  const displayWallets = applied && simulation ? simulation.wallets : wallets;

  const assetInfo = SIM_ASSETS.find(a => a.symbol === selectedAsset)!;

  return (
    <div className="space-y-5">
      {/* Risk Explorer Header Card */}
      <Card>
        <h3 className={`text-lg font-bold ${c.text1} mb-1`}>Risk Explorer</h3>
        <p className={`text-[11px] ${c.text3} mb-5`}>Simulate asset price changes to see protocol-wide impact</p>

        {/* Scenario Row */}
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder} mb-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold ${c.text1}`}>Scenario A</span>
            {applied && (
              <span className={`text-[10px] ${c.text3}`}>
                You&apos;re simulating a {priceChangePct}% {direction === 'down' ? 'drop' : 'rise'} in {selectedAsset} to {formatUSD(projectedPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {/* Asset selector */}
            <div>
              <label className={`block text-[10px] uppercase tracking-wider font-semibold ${c.text3} mb-1.5`}>Asset</label>
              <div className="relative">
                <button
                  onClick={() => setAssetDropdownOpen(!assetDropdownOpen)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${c.innerBg} ${c.innerBorder} ${c.text1} hover:border-[#703AE6]/40`}
                >
                  <span className="w-6 h-6 rounded-full bg-[#703AE6]/15 flex items-center justify-center text-[10px] text-[#703AE6] font-bold">{assetInfo.icon}</span>
                  {selectedAsset}
                  <svg className={`w-3 h-3 ml-auto transition-transform ${assetDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {assetDropdownOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border ${c.cardBg} shadow-lg z-20 overflow-hidden`}>
                    {SIM_ASSETS.map(a => (
                      <button key={a.symbol}
                        onClick={() => { setSelectedAsset(a.symbol); setAssetDropdownOpen(false); setApplied(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] transition-colors ${c.hoverRow} ${
                          a.symbol === selectedAsset ? 'text-[#703AE6] font-bold' : c.text2
                        }`}>
                        <span className="w-5 h-5 rounded-full bg-[#703AE6]/10 flex items-center justify-center text-[9px] text-[#703AE6] font-bold">{a.icon}</span>
                        <span className="font-semibold">{a.symbol}</span>
                        <span className={`text-[10px] ${c.text3}`}>{a.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Price Change */}
            <div>
              <label className={`block text-[10px] uppercase tracking-wider font-semibold ${c.text3} mb-1.5`}>Price Change</label>
              <div className={`flex items-center gap-1 px-3 py-2.5 rounded-xl border ${c.innerBg} ${c.innerBorder}`}>
                <input
                  type="number"
                  value={priceChangePct}
                  onChange={e => { setPriceChangePct(Math.max(0, Math.min(99, Number(e.target.value)))); setApplied(false); }}
                  className={`w-12 bg-transparent text-sm font-mono font-bold ${c.text1} focus:outline-none`}
                />
                <span className={`text-sm font-bold ${c.text3}`}>%</span>
                <div className="ml-auto flex gap-0.5">
                  <button onClick={() => { setDirection('up'); setApplied(false); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-colors ${direction === 'up' ? 'bg-[#32EEE2]/15 text-[#32EEE2]' : `${c.text4}`}`}>↑</button>
                  <button onClick={() => { setDirection('down'); setApplied(false); }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-colors ${direction === 'down' ? 'bg-[#FC5457]/15 text-[#FC5457]' : `${c.text4}`}`}>↓</button>
                </div>
              </div>
            </div>

            {/* Projected Price */}
            <div>
              <label className={`block text-[10px] uppercase tracking-wider font-semibold ${c.text3} mb-1.5`}>Projected Price</label>
              <div className={`px-3 py-2.5 rounded-xl border ${c.innerBg} ${c.innerBorder}`}>
                <span className={`text-sm font-mono font-bold ${direction === 'down' ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>
                  {formatUSD(projectedPrice)}
                </span>
              </div>
            </div>

            {/* Current Price */}
            <div>
              <label className={`block text-[10px] uppercase tracking-wider font-semibold ${c.text3} mb-1.5`}>Current Price</label>
              <div className={`px-3 py-2.5 rounded-xl border ${c.innerBg} ${c.innerBorder}`}>
                <span className={`text-sm font-mono font-bold ${c.text2}`}>{formatUSD(currentPrice)}</span>
              </div>
            </div>
          </div>

          {/* Apply / Cancel buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setApplied(true)}
              className="px-6 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FC5457 10%, #703AE6 80%)' }}
            >
              APPLY
            </button>
            <button
              onClick={() => setApplied(false)}
              className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-colors border ${
                c.isDark ? 'bg-[#1E1E26] border-[#2A2A35] text-[#9CA3AF] hover:text-white' : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#6B7280] hover:text-[#1F1F1F]'
              }`}
            >
              CANCEL
            </button>
            {applied && (
              <span className="flex items-center text-[10px] text-[#32EEE2] font-semibold ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32EEE2] mr-1.5 animate-pulse" />
                Simulation Active
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Eligible for Liquidations (HF < 1) ── */}
      <LiquidationBucket
        title="Eligible for Liquidations"
        subtitle="Health"
        healthLabel="<1"
        healthColor="#FC5457"
        wallets={applied ? (simulation?.eligibleForLiq || []) : currentStats.eligibleForLiq}
        totalValue={stats.eligibleValue}
        totalProtocolValue={stats.totalProtocolValue}
        badDebt={stats.badDebt}
        showBadDebt
      />

      {/* ── Risk for Liquidations (HF 1-1.2) ── */}
      <LiquidationBucket
        title="Risk for Liquidations"
        subtitle="Health"
        healthLabel="1-1.2"
        healthColor="#FF007A"
        wallets={applied ? (simulation?.riskForLiq || []) : currentStats.riskForLiq}
        totalValue={stats.riskValue}
        totalProtocolValue={stats.totalProtocolValue}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIQUIDATION BUCKET — with expandable wallet list
   ═══════════════════════════════════════════════════════ */

function LiquidationBucket({
  title, subtitle, healthLabel, healthColor,
  wallets, totalValue, totalProtocolValue,
  badDebt, showBadDebt = false,
}: {
  title: string; subtitle: string; healthLabel: string; healthColor: string;
  wallets: WalletPosition[]; totalValue: number; totalProtocolValue: number;
  badDebt?: number; showBadDebt?: boolean;
}) {
  const c = useColors();
  const [walletsExpanded, setWalletsExpanded] = useState(false);

  const valueChange = totalValue > 0 ? ((totalValue / totalProtocolValue) * 100).toFixed(1) : '0';
  const isValueUp = totalValue > totalProtocolValue * 0.1;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <h3 className={`text-sm font-bold ${c.text1}`}>{title}</h3>
      </div>
      <div className="flex items-center gap-2 mb-5">
        <span className={`text-[11px] font-semibold ${c.text3}`}>{subtitle}</span>
        <span className="text-[10px]" style={{ color: healthColor }}>◂▸</span>
        <span className="text-[11px] font-mono font-bold" style={{ color: healthColor }}>{healthLabel}</span>
      </div>

      {/* Metric cards row */}
      <div className={`grid ${showBadDebt ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-4`}>
        {/* Value */}
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold ${c.text3}`}>Value</span>
            <span className="w-6 h-6 rounded-lg bg-[#703AE6]/10 flex items-center justify-center text-[11px] text-[#703AE6]">$</span>
          </div>
          <p className={`text-xl font-mono font-bold ${c.text1}`}>{formatUSD(totalValue)}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] ${isValueUp ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>
              {isValueUp ? '▲' : '▼'} {valueChange}%
            </span>
          </div>
          <p className={`text-[10px] ${c.text4} mt-0.5`}>Total: {formatUSD(totalProtocolValue)}</p>
        </div>

        {/* Wallets at Risk — clickable */}
        <div
          className={`rounded-xl border p-4 cursor-pointer transition-all ${c.innerBg} ${c.innerBorder} ${walletsExpanded ? 'ring-1 ring-[#703AE6]/30' : ''} hover:border-[#703AE6]/30`}
          onClick={() => setWalletsExpanded(!walletsExpanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold ${c.text3}`}>Wallets at Risk</span>
            <span className="w-6 h-6 rounded-lg bg-[#FF007A]/10 flex items-center justify-center">
              <svg className={`w-3 h-3 text-[#FF007A] transition-transform ${walletsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
          <p className={`text-xl font-mono font-bold ${c.text1}`}>{wallets.length}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] ${wallets.length > 5 ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>
              {wallets.length > 5 ? '▲' : '▼'}
            </span>
          </div>
          <p className={`text-[10px] ${c.text4} mt-0.5`}>Click to view addresses</p>
        </div>

        {/* Bad Debt */}
        {showBadDebt && (
          <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[11px] font-semibold ${c.text3}`}>Bad Debt</span>
              <span className="w-6 h-6 rounded-lg bg-[#FC5457]/10 flex items-center justify-center text-[11px] text-[#FC5457]">!</span>
            </div>
            <p className={`text-xl font-mono font-bold ${c.text1}`}>{formatUSD(badDebt || 0)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[10px] ${(badDebt || 0) > 0 ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>
                {(badDebt || 0) > 0 ? '▲' : '▼'}
              </span>
            </div>
            <p className={`text-[10px] ${c.text4} mt-0.5`}>Total: {formatUSD(totalProtocolValue)}</p>
          </div>
        )}
      </div>

      {/* Expanded wallet list */}
      {walletsExpanded && (
        <div className="border-t pt-4 mt-2" style={{ borderColor: c.borderHex }}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold ${c.text3}`}>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.borderHex}` }}>
                  {['Wallet', 'Asset', 'Collateral', 'Debt', 'Health Factor', 'Leverage', 'Bad Debt'].map((h, i) => (
                    <th key={h} className={`${i < 2 ? 'text-left' : 'text-right'} py-2 px-2 font-semibold ${c.text3}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map((w, i) => {
                  const bd = Math.max(w.debt - w.collateral, 0);
                  return (
                    <tr key={i} className={`${c.hoverRow} transition-colors`} style={{ borderBottom: `1px solid ${c.borderHex}40` }}>
                      <td className={`py-2.5 px-2 font-mono ${c.text2}`}>{w.address}</td>
                      <td className={`py-2.5 px-2 ${c.text3}`}>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-[#703AE6]/15 flex items-center justify-center text-[8px] text-[#703AE6]">
                            {PROTOCOL_TOKENS.find(a => a.symbol === w.primaryAsset)?.icon || '·'}
                          </span>
                          {w.primaryAsset}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2 text-right font-mono ${c.text2}`}>{formatUSD(w.collateral)}</td>
                      <td className={`py-2.5 px-2 text-right font-mono ${c.text2}`}>{formatUSD(w.debt)}</td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="font-mono font-bold" style={{ color: getHFColor(w.hf) }}>{w.hf.toFixed(4)}</span>
                      </td>
                      <td className={`py-2.5 px-2 text-right font-mono ${c.text2}`}>{w.leverageX.toFixed(1)}x</td>
                      <td className="py-2.5 px-2 text-right font-mono">
                        <span style={{ color: bd > 0 ? '#FC5457' : '#32EEE2' }}>{bd > 0 ? formatUSD(bd) : '—'}</span>
                      </td>
                    </tr>
                  );
                })}
                {wallets.length === 0 && (
                  <tr><td colSpan={7} className={`py-6 text-center ${c.text3}`}>No wallets in this range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   WALLETS BY HF RANGE — grouped address lists
   ═══════════════════════════════════════════════════════ */

function WalletsByHFRange({ wallets }: { wallets: WalletPosition[] }) {
  const c = useColors();
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);

  const buckets = useMemo(() => [
    { key: 'lt1', label: '< 1.0', sublabel: 'Liquidatable', color: '#FC5457', wallets: wallets.filter(w => w.hf < 1.0) },
    { key: '1_1.1', label: '1.0 – 1.1', sublabel: 'Critical', color: '#FF007A', wallets: wallets.filter(w => w.hf >= 1.0 && w.hf < 1.1) },
    { key: '1.1_1.2', label: '1.1 – 1.2', sublabel: 'Warning', color: '#703AE6', wallets: wallets.filter(w => w.hf >= 1.1 && w.hf < 1.2) },
    { key: '1.2_1.5', label: '1.2 – 1.5', sublabel: 'Caution', color: '#9F7BEE', wallets: wallets.filter(w => w.hf >= 1.2 && w.hf < 1.5) },
    { key: 'gt1.5', label: '> 1.5', sublabel: 'Safe', color: '#32EEE2', wallets: wallets.filter(w => w.hf >= 1.5) },
  ], [wallets]);

  const totalWallets = wallets.length;

  return (
    <Card>
      <h3 className={`text-sm font-bold ${c.text1} mb-1`}>All Positions by Health Factor</h3>
      <p className={`text-[10px] ${c.text3} mb-5`}>{totalWallets} total positions — click a range to see addresses</p>

      <div className="space-y-2">
        {buckets.map(b => {
          const isOpen = expandedBucket === b.key;
          const pct = totalWallets > 0 ? (b.wallets.length / totalWallets) * 100 : 0;
          const totalVal = b.wallets.reduce((s, w) => s + w.collateral, 0);

          return (
            <div key={b.key}>
              {/* Bucket header — clickable */}
              <button
                onClick={() => setExpandedBucket(isOpen ? null : b.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isOpen
                    ? `${c.innerBg} ${c.innerBorder} ring-1`
                    : `${c.innerBg} ${c.innerBorder} hover:border-[${b.color}]/30`
                }`}
                style={isOpen ? { borderColor: `${b.color}40`, ringColor: `${b.color}20` } : {}}
              >
                {/* HF Range label */}
                <div className="w-20 shrink-0">
                  <p className="text-[12px] font-mono font-bold" style={{ color: b.color }}>{b.label}</p>
                  <p className={`text-[9px] ${c.text4}`}>{b.sublabel}</p>
                </div>

                {/* Bar */}
                <div className={`flex-1 h-5 rounded-lg overflow-hidden ${c.isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'}`}>
                  <div className="h-full rounded-lg transition-all duration-500" style={{ backgroundColor: b.color, width: `${Math.max(pct, 2)}%`, opacity: 0.65 }} />
                </div>

                {/* Count + Value */}
                <div className="w-24 text-right shrink-0">
                  <p className={`text-[12px] font-mono font-bold ${c.text1}`}>{b.wallets.length}</p>
                  <p className={`text-[9px] font-mono ${c.text4}`}>{formatUSD(totalVal)}</p>
                </div>

                {/* Chevron */}
                <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${c.text3}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Expanded wallet list */}
              {isOpen && b.wallets.length > 0 && (
                <div className={`ml-4 mt-1 mb-2 rounded-xl border ${c.innerBg} ${c.innerBorder} p-3 overflow-x-auto`}>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${c.borderHex}` }}>
                        {['#', 'Address', 'Asset', 'Collateral', 'Debt', 'HF', 'Leverage'].map((h, i) => (
                          <th key={h} className={`${i < 3 ? 'text-left' : 'text-right'} py-1.5 px-2 font-semibold ${c.text3}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.wallets.sort((a, b2) => a.hf - b2.hf).map((w, i) => (
                        <tr key={i} className={`${c.hoverRow} transition-colors`}>
                          <td className={`py-2 px-2 ${c.text4}`}>{i + 1}</td>
                          <td className={`py-2 px-2 font-mono ${c.text2}`}>{w.address}</td>
                          <td className={`py-2 px-2 ${c.text3}`}>{w.primaryAsset}</td>
                          <td className={`py-2 px-2 text-right font-mono ${c.text2}`}>{formatUSD(w.collateral)}</td>
                          <td className={`py-2 px-2 text-right font-mono ${c.text2}`}>{formatUSD(w.debt)}</td>
                          <td className="py-2 px-2 text-right">
                            <span className="font-mono font-bold" style={{ color: getHFColor(w.hf) }}>{w.hf.toFixed(4)}</span>
                          </td>
                          <td className={`py-2 px-2 text-right font-mono ${c.text2}`}>{w.leverageX.toFixed(1)}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isOpen && b.wallets.length === 0 && (
                <div className={`ml-4 mt-1 mb-2 rounded-xl border ${c.innerBg} ${c.innerBorder} p-4 text-center`}>
                  <p className={`text-[11px] ${c.text3}`}>No wallets in this range</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   BAD DEBT MONITOR
   ═══════════════════════════════════════════════════════ */

function BadDebtMonitor({ wallets, chainName }: { wallets: WalletPosition[]; chainName: string }) {
  const c = useColors();
  const [showStressTest, setShowStressTest] = useState(false);

  const underwater = wallets.filter(w => w.hf < 1.0);
  const totalBadDebt = underwater.reduce((s, w) => s + Math.max(w.debt - w.collateral, 0), 0);
  const totalBorrowed = wallets.reduce((s, w) => s + w.debt, 0);
  const badDebtRatio = totalBorrowed > 0 ? (totalBadDebt / totalBorrowed) * 100 : 0;

  // Reserve fund (dummy)
  const reserveFund = 850000;
  const reserveCoverage = totalBadDebt > 0 ? (reserveFund / totalBadDebt) * 100 : Infinity;

  // Bad debt by asset
  const assetBreakdown = useMemo(() => {
    const map: Record<string, { debt: number; count: number }> = {};
    underwater.forEach(w => {
      const bd = Math.max(w.debt - w.collateral, 0);
      if (!map[w.primaryAsset]) map[w.primaryAsset] = { debt: 0, count: 0 };
      map[w.primaryAsset].debt += bd;
      map[w.primaryAsset].count++;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.debt - a.debt);
  }, [underwater]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-bold ${c.text1}`}>Bad Debt Monitor</h3>
        <button
          onClick={() => setShowStressTest(!showStressTest)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            showStressTest
              ? 'bg-[#FC5457]/15 text-[#FC5457]'
              : `${c.isDark ? 'bg-[#1E1E26] text-[#6B7280] hover:text-white' : 'bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#1F1F1F]'}`
          }`}
        >
          <svg className={`w-3 h-3 transition-transform ${showStressTest ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          Stress Test
        </button>
      </div>
      <p className={`text-[10px] ${c.text3} mb-5`}>Positions where debt exceeds collateral value on {chainName}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${c.text3}`}>Total Bad Debt</p>
          <p className={`text-xl font-mono font-bold mt-1.5 ${totalBadDebt > 0 ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>{formatUSD(totalBadDebt)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${c.text3}`}>Bad Debt Ratio</p>
          <p className={`text-xl font-mono font-bold mt-1.5 ${badDebtRatio > 1 ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>{formatPercent(badDebtRatio)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${c.text3}`}>Reserve Fund</p>
          <p className={`text-xl font-mono font-bold mt-1.5 ${c.text1}`}>{formatUSD(reserveFund)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${c.innerBg} ${c.innerBorder}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${c.text3}`}>Reserve Coverage</p>
          <p className={`text-xl font-mono font-bold mt-1.5 ${isFinite(reserveCoverage) && reserveCoverage > 100 ? 'text-[#32EEE2]' : 'text-[#FC5457]'}`}>
            {isFinite(reserveCoverage) ? formatPercent(Math.min(reserveCoverage, 999)) : '∞'}
          </p>
        </div>
      </div>

      {/* By asset breakdown */}
      {assetBreakdown.length > 0 && (
        <div>
          <h4 className={`text-[11px] font-bold uppercase tracking-wider ${c.text3} mb-3`}>Bad Debt by Asset</h4>
          <div className="space-y-2">
            {assetBreakdown.map(([asset, data]) => (
              <div key={asset} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FC5457]/10 flex items-center justify-center text-[9px] text-[#FC5457] font-bold">
                  {PROTOCOL_TOKENS.find(a => a.symbol === asset)?.icon || '·'}
                </span>
                <span className={`text-[12px] font-semibold w-14 ${c.text1}`}>{asset}</span>
                <div className={`flex-1 h-4 rounded-lg overflow-hidden ${c.isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'}`}>
                  <div className="h-full rounded-lg bg-[#FC5457]/50" style={{ width: `${totalBadDebt > 0 ? (data.debt / totalBadDebt) * 100 : 0}%` }} />
                </div>
                <span className={`text-[11px] font-mono font-bold ${c.text2} w-20 text-right`}>{formatUSD(data.debt)}</span>
                <span className={`text-[10px] ${c.text4} w-16 text-right`}>{data.count} wallet{data.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assetBreakdown.length === 0 && !showStressTest && (
        <div className="rounded-xl bg-[#32EEE2]/5 border border-[#32EEE2]/15 p-4 text-center">
          <p className="text-[#32EEE2] text-sm font-semibold">No bad debt detected</p>
          <p className={`text-[10px] ${c.text3} mt-1`}>All positions are currently collateralized — click &quot;Stress Test&quot; to see when bad debt would occur</p>
        </div>
      )}

      {/* ── Inline Stress Test Heatmap ── */}
      {showStressTest && (
        <div className="mt-5 pt-5 border-t" style={{ borderColor: c.borderHex }}>
          <BadDebtStressHeatmap wallets={wallets} chainName={chainName} />
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   BAD DEBT STRESS HEATMAP
   Shows WHEN and WHY bad debt occurs by simulating every
   combination of asset price drop × leverage level.

   Supports ALL protocol assets:
   ─ ETH: Volatile — price can crash 5-60%
   ─ USDC: Stablecoin — can depeg (happened Mar 2023, hit $0.87)
   ─ USDT: Stablecoin — can depeg (briefly hit $0.95 in 2022)

   Each asset tab shows different drop ranges because
   ETH volatility ≠ stablecoin depeg risk.

   Data source: Currently simulated from wallet positions.
   Later: Replace with real position data from indexer.
   ═══════════════════════════════════════════════════════ */

interface StressAsset {
  symbol: string;
  name: string;
  icon: string;
  drops: number[];
  description: string;
  matchFn: (w: WalletPosition) => boolean;
}

const STRESS_ASSETS: StressAsset[] = [
  {
    symbol: 'ETH',
    name: 'ETH Price Crash',
    icon: '◆',
    drops: [-5, -10, -15, -20, -25, -30, -40, -50, -60],
    description: 'ETH is volatile — a market crash directly reduces ETH collateral value while debt (borrowed stablecoins) stays the same.',
    matchFn: (w) => w.primaryAsset === 'ETH' || w.primaryAsset === 'WETH',
  },
  {
    symbol: 'USDC',
    name: 'USDC Depeg',
    icon: '$',
    drops: [-1, -2, -3, -5, -8, -10, -13, -15, -20],
    description: 'If USDC loses its $1 peg (like March 2023 when it hit $0.87), USDC collateral drops in value while ETH-denominated debt stays the same.',
    matchFn: (w) => w.primaryAsset === 'USDC',
  },
  {
    symbol: 'USDT',
    name: 'USDT Depeg',
    icon: '₮',
    drops: [-1, -2, -3, -5, -8, -10, -13, -15, -20],
    description: 'If USDT loses its peg (briefly hit $0.95 in 2022), USDT collateral drops while other-asset debt remains constant — creating underwater positions.',
    matchFn: (w) => w.primaryAsset === 'USDT',
  },
];

function BadDebtStressHeatmap({ wallets, chainName }: { wallets: WalletPosition[]; chainName: string }) {
  const c = useColors();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [activeAsset, setActiveAsset] = useState(0); // index into STRESS_ASSETS

  const asset = STRESS_ASSETS[activeAsset];
  const priceDrops = asset.drops;

  // Leverage ranges (Y-axis)
  const leverageRanges = [
    { label: '1–2x', min: 1, max: 2 },
    { label: '2–3x', min: 2, max: 3 },
    { label: '3–5x', min: 3, max: 5 },
    { label: '5–7x', min: 5, max: 7 },
    { label: '7–10x', min: 7, max: 10 },
  ];

  // Compute bad debt: "If [asset] drops X%, how much bad debt
  // do positions at leverage range Y generate?"
  const heatmapData = useMemo(() => {
    return leverageRanges.map(range => {
      const bucketed = wallets.filter(w => w.leverageX >= range.min && w.leverageX < range.max);
      return priceDrops.map(drop => {
        let badDebt = 0;
        let liquidatedCount = 0;
        const priceMultiplier = 1 + drop / 100;

        bucketed.forEach(w => {
          // Only positions with the stressed asset are affected
          const isAffected = asset.matchFn(w);
          const newCollateral = isAffected
            ? w.collateral * priceMultiplier
            : w.collateral;

          const newHF = marginCalc.calcHF(newCollateral, w.debt);
          if (newHF < 1.0) {
            liquidatedCount++;
            const unrecoverable = Math.max(w.debt - newCollateral, 0);
            badDebt += unrecoverable;
          }
        });

        return { badDebt, liquidatedCount, positionCount: bucketed.length };
      });
    });
  }, [wallets, activeAsset]);

  const maxBadDebt = Math.max(...heatmapData.flat().map(d => d.badDebt), 1);

  const getCellStyle = (value: number) => {
    const intensity = Math.min(value / maxBadDebt, 1);
    if (value === 0) {
      return {
        backgroundColor: '#32EEE2',
        opacity: c.isDark ? 0.08 : 0.12,
      };
    }
    if (intensity < 0.3) {
      return { backgroundColor: '#FF007A', opacity: 0.15 + intensity * 0.4 };
    }
    return { backgroundColor: '#FC5457', opacity: 0.2 + intensity * 0.7 };
  };

  const totalProtocolValue = wallets.reduce((s, w) => s + w.collateral, 0);
  const affectedPositions = wallets.filter(asset.matchFn).length;

  return (
    <div>
      {/* Header + Asset Tabs */}
      <div className="flex items-center justify-between mb-1">
        <h4 className={`text-[12px] font-bold ${c.text1}`}>Bad Debt Stress Test</h4>
        <div className="flex gap-1">
          {STRESS_ASSETS.map((a, i) => (
            <button
              key={a.symbol}
              onClick={() => { setActiveAsset(i); setHoveredCell(null); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                activeAsset === i
                  ? 'bg-[#703AE6]/15 text-[#703AE6]'
                  : `${c.text4} ${c.isDark ? 'hover:text-[#9CA3AF]' : 'hover:text-[#4B5563]'}`
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                activeAsset === i ? 'bg-[#703AE6]/20 text-[#703AE6]' : `${c.isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'}`
              }`}>{a.icon}</span>
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Asset-specific explanation */}
      <div className={`rounded-xl border px-3 py-2 mb-4 ${c.innerBg} ${c.innerBorder}`}>
        <div className="flex items-start gap-2">
          <span className={`text-[10px] ${c.text3} shrink-0 mt-0.5`}>ℹ</span>
          <div className={`text-[10px] leading-relaxed ${c.text3}`}>
            <p>
              <strong className={c.text2}>{asset.name}:</strong> {asset.description}
            </p>
            <p className="mt-1">
              <span className="inline-block w-2 h-2 rounded-sm bg-[#32EEE2]/20 mx-0.5 align-middle" /> = safe,{' '}
              <span className="inline-block w-2 h-2 rounded-sm bg-[#FC5457]/60 mx-0.5 align-middle" /> = bad debt.{' '}
              <strong className={c.text2}>{affectedPositions}</strong> positions hold {asset.symbol} as collateral on {chainName}.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Column headers */}
          <div className="flex items-end mb-1">
            <div className="w-16 shrink-0">
              <span className={`text-[8px] uppercase tracking-wider font-bold ${c.text4}`}>Leverage ↓</span>
            </div>
            {priceDrops.map((drop, i) => (
              <div key={i} className="flex-1 text-center">
                <span className={`text-[9px] font-mono font-bold ${
                  Math.abs(drop) <= (asset.symbol === 'ETH' ? 15 : 3)
                    ? 'text-[#32EEE2]'
                    : Math.abs(drop) <= (asset.symbol === 'ETH' ? 30 : 10)
                      ? 'text-[#FF007A]'
                      : 'text-[#FC5457]'
                }`}>
                  {drop}%
                </span>
              </div>
            ))}
            <div className="w-14 shrink-0 text-right">
              <span className={`text-[8px] uppercase tracking-wider font-bold ${c.text4}`}>Positions</span>
            </div>
          </div>

          {/* Axis label */}
          <div className="flex mb-2">
            <div className="w-16 shrink-0" />
            <div className={`flex-1 text-center text-[8px] uppercase tracking-widest font-bold ${c.text4}`}>
              {asset.symbol} {asset.symbol === 'ETH' ? 'Price Drop' : 'Depeg'} →
            </div>
            <div className="w-14 shrink-0" />
          </div>

          {/* Heatmap rows */}
          {leverageRanges.map((range, ri) => (
            <div key={range.label} className="flex items-center mb-1">
              <div className="w-16 shrink-0 text-right pr-2">
                <span className={`text-[11px] font-mono font-bold ${c.text1}`}>{range.label}</span>
              </div>

              {priceDrops.map((_, ci) => {
                const data = heatmapData[ri]?.[ci];
                if (!data) return <div key={ci} className="flex-1 px-0.5"><div className="h-11 rounded-md" /></div>;

                const style = getCellStyle(data.badDebt);
                const isHovered = hoveredCell?.row === ri && hoveredCell?.col === ci;

                return (
                  <div key={ci} className="flex-1 px-0.5">
                    <div
                      className={`h-11 rounded-md flex flex-col items-center justify-center cursor-default transition-all ${
                        isHovered ? 'ring-1 ring-white/30 scale-105' : ''
                      }`}
                      style={style}
                      onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {data.badDebt > 0 ? (
                        <>
                          <span className="text-[9px] font-mono font-bold text-white/90">
                            {data.badDebt >= 1000000 ? `$${(data.badDebt / 1000000).toFixed(1)}M` : data.badDebt >= 1000 ? `$${(data.badDebt / 1000).toFixed(0)}K` : `$${data.badDebt.toFixed(0)}`}
                          </span>
                          <span className="text-[7px] font-mono text-white/50">
                            {data.liquidatedCount} liq
                          </span>
                        </>
                      ) : (
                        <span className={`text-[9px] font-mono font-bold ${c.isDark ? 'text-[#32EEE2]/50' : 'text-[#32EEE2]/70'}`}>✓</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="w-14 shrink-0 pl-2 text-right">
                <span className={`text-[10px] font-mono ${c.text3}`}>
                  {wallets.filter(w => w.leverageX >= range.min && w.leverageX < range.max).length}
                </span>
              </div>
            </div>
          ))}

          {/* Hover tooltip */}
          {hoveredCell && (() => {
            const data = heatmapData[hoveredCell.row]?.[hoveredCell.col];
            const range = leverageRanges[hoveredCell.row];
            const drop = priceDrops[hoveredCell.col];
            if (!data || !range) return null;

            const eventLabel = asset.symbol === 'ETH' ? 'price crash' : 'depeg';
            const causeExplain = asset.symbol === 'ETH'
              ? `ETH drops ${Math.abs(drop)}% → ETH collateral shrinks while stablecoin debt stays the same`
              : `${asset.symbol} depegs to $${(1 + drop / 100).toFixed(2)} → ${asset.symbol} collateral loses value while debt remains at full price`;

            return (
              <div className={`mt-3 rounded-xl border p-3 ${c.innerBg} ${c.innerBorder}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                  <div>
                    <span className={`uppercase font-semibold ${c.text4}`}>Scenario</span>
                    <p className={`font-mono font-bold mt-0.5 ${c.text1}`}>{asset.symbol} {drop}% at {range.label}</p>
                  </div>
                  <div>
                    <span className={`uppercase font-semibold ${c.text4}`}>Bad Debt</span>
                    <p className={`font-mono font-bold mt-0.5 ${data.badDebt > 0 ? 'text-[#FC5457]' : 'text-[#32EEE2]'}`}>
                      {formatUSD(data.badDebt)}
                    </p>
                  </div>
                  <div>
                    <span className={`uppercase font-semibold ${c.text4}`}>Liquidated</span>
                    <p className={`font-mono font-bold mt-0.5 ${c.text1}`}>{data.liquidatedCount} of {data.positionCount}</p>
                  </div>
                  <div>
                    <span className={`uppercase font-semibold ${c.text4}`}>Impact</span>
                    <p className={`font-mono font-bold mt-0.5 ${data.badDebt > totalProtocolValue * 0.01 ? 'text-[#FC5457]' : c.text2}`}>
                      {totalProtocolValue > 0 ? formatPercent((data.badDebt / totalProtocolValue) * 100) : '0%'} of TVL
                    </p>
                  </div>
                </div>
                {data.badDebt > 0 ? (
                  <div className={`text-[9px] mt-2 space-y-1 ${c.text4}`}>
                    <p><strong className="text-[#FC5457]">Why bad debt occurs:</strong> {causeExplain}.</p>
                    <p>At {range.label} leverage, the equity buffer is thin — a {Math.abs(drop)}% {eventLabel} is enough to push debt above collateral value.
                      {data.liquidatedCount > 0 && ` ${data.liquidatedCount} position${data.liquidatedCount > 1 ? 's' : ''} cannot be fully recovered by liquidators, creating ${formatUSD(data.badDebt)} in protocol losses.`}
                    </p>
                  </div>
                ) : (
                  <p className={`text-[9px] mt-2 ${c.text4}`}>
                    <strong className="text-[#32EEE2]">Safe:</strong> A {Math.abs(drop)}% {asset.symbol} {eventLabel} at {range.label} leverage does not create bad debt — all positions remain recoverable.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: c.borderHex }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#32EEE2', opacity: 0.12 }} />
                <span className={`text-[9px] ${c.text4}`}>No bad debt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF007A', opacity: 0.35 }} />
                <span className={`text-[9px] ${c.text4}`}>Partial bad debt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FC5457', opacity: 0.85 }} />
                <span className={`text-[9px] ${c.text4}`}>Severe bad debt</span>
              </div>
            </div>
            <span className={`text-[8px] italic ${c.text4}`}>Hover a cell for details</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MARKET STATS PER COIN — enhanced token view
   ═══════════════════════════════════════════════════════ */

function MarketStats({ tokenRisks, wallets, chainName }: { tokenRisks: TokenRisk[]; wallets: WalletPosition[]; chainName: string }) {
  const c = useColors();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const tokenDetails = useMemo(() => {
    return tokenRisks.map(t => {
      const tokenWallets = wallets.filter(w => w.primaryAsset === t.symbol);
      const atRisk = tokenWallets.filter(w => w.hf < 1.2);
      const avgHF = tokenWallets.length > 0
        ? tokenWallets.reduce((s, w) => s + w.hf, 0) / tokenWallets.length
        : Infinity;

      return {
        ...t,
        price: TOKEN_PRICES[t.symbol] || 1,
        walletCount: tokenWallets.length,
        atRiskCount: atRisk.length,
        avgHF,
        totalCollateral: tokenWallets.reduce((s, w) => s + w.collateral, 0),
        totalDebt: tokenWallets.reduce((s, w) => s + w.debt, 0),
      };
    });
  }, [tokenRisks, wallets]);

  return (
    <Card>
      <h3 className={`text-sm font-bold ${c.text1} mb-1`}>Market Overview</h3>
      <p className={`text-[10px] ${c.text3} mb-5`}>Per-asset market statistics on {chainName}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tokenDetails.map(t => (
          <div
            key={t.symbol}
            className={`rounded-xl border p-4 cursor-pointer transition-all ${c.innerBg} ${c.innerBorder} ${
              selectedToken === t.symbol ? 'ring-1 ring-[#703AE6]/40' : ''
            } hover:border-[#703AE6]/30`}
            onClick={() => setSelectedToken(selectedToken === t.symbol ? null : t.symbol)}
          >
            {/* Token header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-[#703AE6]/10 flex items-center justify-center text-[12px] text-[#703AE6] font-bold">
                {PROTOCOL_TOKENS.find(a => a.symbol === t.symbol)?.icon || t.symbol[0]}
              </span>
              <div>
                <p className={`text-[13px] font-bold ${c.text1}`}>{t.symbol}</p>
                <p className={`text-[10px] ${c.text3}`}>{t.name}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={`text-[13px] font-mono font-bold ${c.text1}`}>{formatUSD(t.price)}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getRiskTierColor(t.riskTier)}`}
                  style={{ backgroundColor: `${getHFColor(t.riskTier === 'Low' ? 2 : t.riskTier === 'Medium' ? 1.3 : t.riskTier === 'High' ? 1.15 : 1.05)}10` }}>
                  {t.riskTier}
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className={`${c.text4} uppercase font-semibold`}>Supplied</span>
                <p className={`font-mono font-bold ${c.text2} mt-0.5`}>{formatUSD(t.totalSupplied)}</p>
              </div>
              <div>
                <span className={`${c.text4} uppercase font-semibold`}>Borrowed</span>
                <p className={`font-mono font-bold ${c.text2} mt-0.5`}>{formatUSD(t.totalBorrowed)}</p>
              </div>
              <div>
                <span className={`${c.text4} uppercase font-semibold`}>Utilization</span>
                <p className="font-mono font-bold mt-0.5" style={{ color: t.utilization > 80 ? '#FC5457' : t.utilization > 60 ? '#FF007A' : '#32EEE2' }}>
                  {formatPercent(t.utilization)}
                </p>
              </div>
              <div>
                <span className={`${c.text4} uppercase font-semibold`}>Wallets</span>
                <p className={`font-mono font-bold ${c.text2} mt-0.5`}>
                  {t.walletCount} <span className={`text-[9px] ${t.atRiskCount > 0 ? 'text-[#FC5457]' : c.text4}`}>({t.atRiskCount} at risk)</span>
                </p>
              </div>
            </div>

            {/* Utilization bar */}
            <div className="mt-3">
              <UtilizationBar value={t.utilization} showPercent={false} height={4} />
            </div>

            {/* Expanded details */}
            {selectedToken === t.symbol && (
              <div className="mt-4 pt-3 border-t space-y-2 text-[10px]" style={{ borderColor: c.borderHex }}>
                <div className="flex justify-between">
                  <span className={c.text3}>Supply APY</span>
                  <span className="font-mono font-bold text-[#32EEE2]">{formatPercent(t.supplyAPY)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={c.text3}>Borrow APY</span>
                  <span className={`font-mono font-bold ${c.text2}`}>{formatPercent(t.borrowAPY)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={c.text3}>Avg Health Factor</span>
                  <span className="font-mono font-bold" style={{ color: getHFColor(t.avgHF) }}>{isFinite(t.avgHF) ? t.avgHF.toFixed(2) : '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={c.text3}>Concentration</span>
                  <span className={`font-mono font-bold ${c.text2}`}>{formatPercent(t.concentrationPct, 1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={c.text3}>Total Collateral</span>
                  <span className={`font-mono font-bold ${c.text2}`}>{formatUSD(t.totalCollateral)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={c.text3}>Total Debt</span>
                  <span className={`font-mono font-bold ${c.text2}`}>{formatUSD(t.totalDebt)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   LEVERAGE RATIO DISTRIBUTION
   Inspired by Sentora Risk Radar — shows how positions
   are distributed across leverage buckets (1-2x to 7-10x).
   Helps identify concentration of high-leverage risk.
   ═══════════════════════════════════════════════════════ */

function LeverageDistribution({ wallets }: { wallets: WalletPosition[] }) {
  const c = useColors();

  const buckets = useMemo(() => {
    const ranges = [
      { label: '1–2x', min: 1, max: 2, color: '#32EEE2', desc: 'Conservative' },
      { label: '2–3x', min: 2, max: 3, color: '#703AE6', desc: 'Moderate' },
      { label: '3–5x', min: 3, max: 5, color: '#9F7BEE', desc: 'Aggressive' },
      { label: '5–7x', min: 5, max: 7, color: '#FF007A', desc: 'High Risk' },
      { label: '7–10x', min: 7, max: 10, color: '#FC5457', desc: 'Max Leverage' },
      { label: '10x+', min: 10, max: Infinity, color: '#FC5457', desc: 'Over-leveraged' },
    ];
    const total = wallets.length || 1;
    return ranges.map(r => {
      const ws = wallets.filter(w => w.leverageX >= r.min && w.leverageX < r.max);
      const value = ws.reduce((s, w) => s + w.collateral, 0);
      return { ...r, count: ws.length, pct: (ws.length / total) * 100, value };
    });
  }, [wallets]);

  const avgLeverage = wallets.length > 0
    ? wallets.reduce((s, w) => s + w.leverageX, 0) / wallets.length
    : 1;
  const maxPct = Math.max(...buckets.map(b => b.pct), 1);

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-bold ${c.text1}`}>Leverage Ratio Distribution</h3>
        <div className={`text-right`}>
          <span className={`text-[10px] ${c.text3}`}>Avg Leverage</span>
          <p className="text-[14px] font-mono font-bold text-[#703AE6]">{avgLeverage.toFixed(2)}x</p>
        </div>
      </div>
      <p className={`text-[10px] ${c.text3} mb-5`}>
        How positions are distributed across leverage levels — higher leverage = higher liquidation risk
      </p>

      <div className="space-y-3">
        {buckets.map(b => (
          <div key={b.label} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-14 shrink-0">
              <p className="text-[12px] font-mono font-bold" style={{ color: b.color }}>{b.label}</p>
              <p className={`text-[8px] ${c.text4}`}>{b.desc}</p>
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div className={`h-8 rounded-lg overflow-hidden ${c.isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'}`}>
                <div
                  className="h-full rounded-lg flex items-center px-2 transition-all duration-700"
                  style={{
                    backgroundColor: b.color,
                    width: `${Math.max((b.pct / maxPct) * 100, 3)}%`,
                    opacity: 0.75,
                  }}
                >
                  {b.pct > 15 && (
                    <span className="text-[10px] font-mono font-bold text-white/90">{b.pct.toFixed(1)}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="w-20 text-right shrink-0">
              <p className={`text-[12px] font-mono font-bold ${c.text1}`}>{b.count}</p>
              <p className={`text-[9px] font-mono ${c.text4}`}>{formatUSD(b.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Average leverage indicator */}
      <div className="mt-5 pt-4 border-t" style={{ borderColor: c.borderHex }}>
        <div className="flex items-center gap-4 text-[10px]">
          <div>
            <span className={`uppercase font-semibold ${c.text4}`}>Avg Leverage</span>
            <p className="font-mono font-bold text-[#703AE6] text-[14px]">{avgLeverage.toFixed(2)}x</p>
          </div>
          <div>
            <span className={`uppercase font-semibold ${c.text4}`}>Max Allowed</span>
            <p className={`font-mono font-bold ${c.text2} text-[14px]`}>10.00x</p>
          </div>
          <div>
            <span className={`uppercase font-semibold ${c.text4}`}>High-Risk (&gt;5x)</span>
            <p className="font-mono font-bold text-[14px]" style={{ color: buckets.filter(b => b.min >= 5).reduce((s, b) => s + b.count, 0) > 0 ? '#FC5457' : '#32EEE2' }}>
              {buckets.filter(b => b.min >= 5).reduce((s, b) => s + b.count, 0)} positions
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   HF DISTRIBUTION HEATMAP
   Inspired by Sentora — a grid heatmap showing the
   concentration of collateral value across HF ranges
   over recent time periods. Each cell's intensity shows
   how much capital sits in that HF bucket at that time.
   ═══════════════════════════════════════════════════════ */

function HFHeatmap({ wallets }: { wallets: WalletPosition[] }) {
  const c = useColors();

  // HF ranges (Y-axis)
  const hfRanges = [
    { label: '< 1.0', min: 0, max: 1.0, color: '#FC5457' },
    { label: '1.0–1.1', min: 1.0, max: 1.1, color: '#FF007A' },
    { label: '1.1–1.2', min: 1.1, max: 1.2, color: '#703AE6' },
    { label: '1.2–1.5', min: 1.2, max: 1.5, color: '#9F7BEE' },
    { label: '1.5–2.0', min: 1.5, max: 2.0, color: '#32EEE2' },
    { label: '> 2.0', min: 2.0, max: Infinity, color: '#32EEE2' },
  ];

  // Time periods (X-axis) — simulated snapshots over last 7 days
  const timePeriods = ['Mar 10', 'Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Today'];

  // Generate heatmap data — each cell = USD value of positions in that HF range at that time
  // We simulate slight variations over time from current state
  const heatmapData = useMemo(() => {
    const currentBuckets = hfRanges.map(r => {
      const ws = wallets.filter(w => w.hf >= r.min && w.hf < r.max);
      return ws.reduce((s, w) => s + w.collateral, 0);
    });

    // Generate time-varying data (dummy: slight random variation per period)
    return timePeriods.map((_, ti) => {
      return currentBuckets.map((val, ri) => {
        // More variation for risky buckets, less for safe ones
        const volatility = ri < 2 ? 0.4 : ri < 4 ? 0.2 : 0.1;
        const factor = 1 + Math.sin(ti * 2.1 + ri * 1.3) * volatility + (Math.random() - 0.5) * volatility * 0.3;
        return Math.max(0, val * factor);
      });
    });
  }, [wallets]);

  // Find max value for color scaling
  const maxVal = Math.max(...heatmapData.flat(), 1);

  // Color intensity function
  const getCellColor = (value: number, rangeIdx: number) => {
    const intensity = Math.min(value / maxVal, 1);
    const baseColor = hfRanges[rangeIdx].color;
    // Return opacity based on intensity
    return { backgroundColor: baseColor, opacity: 0.1 + intensity * 0.8 };
  };

  return (
    <Card>
      <h3 className={`text-sm font-bold ${c.text1} mb-1`}>Health Factor Distribution Heatmap</h3>
      <p className={`text-[10px] ${c.text3} mb-4`}>
        Collateral concentration by health factor range over time — brighter cells = more capital at risk
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Column headers (time) */}
          <div className="flex">
            <div className="w-16 shrink-0" />
            {timePeriods.map((t, i) => (
              <div key={i} className={`flex-1 text-center text-[9px] font-mono ${c.text4} pb-2`}>{t}</div>
            ))}
            <div className="w-20 shrink-0" />
          </div>

          {/* Heatmap rows */}
          {hfRanges.map((range, ri) => (
            <div key={range.label} className="flex items-center mb-1">
              {/* Row label */}
              <div className="w-16 shrink-0 text-right pr-2">
                <span className="text-[10px] font-mono font-bold" style={{ color: range.color }}>{range.label}</span>
              </div>

              {/* Cells */}
              {timePeriods.map((_, ti) => {
                const val = heatmapData[ti]?.[ri] || 0;
                const style = getCellColor(val, ri);
                return (
                  <div key={ti} className="flex-1 px-0.5">
                    <div
                      className="h-9 rounded-md flex items-center justify-center cursor-default transition-all hover:ring-1 hover:ring-white/20"
                      style={style}
                      title={`${range.label} on ${timePeriods[ti]}: ${formatUSD(val)}`}
                    >
                      <span className="text-[8px] font-mono font-bold text-white/80">
                        {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val > 0 ? `${val.toFixed(0)}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Row total */}
              <div className="w-20 shrink-0 pl-2 text-right">
                <span className={`text-[10px] font-mono font-bold ${c.text2}`}>
                  {formatUSD(wallets.filter(w => w.hf >= range.min && w.hf < range.max).reduce((s, w) => s + w.collateral, 0))}
                </span>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: c.borderHex }}>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] ${c.text4}`}>Low</span>
              <div className="flex gap-0.5">
                {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((op, i) => (
                  <div key={i} className="w-5 h-3 rounded-sm" style={{ backgroundColor: '#703AE6', opacity: op }} />
                ))}
              </div>
              <span className={`text-[9px] ${c.text4}`}>High</span>
            </div>
            <span className={`text-[9px] ${c.text4}`}>Values in USD</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   WHALE ACTIVITY MONITOR
   Inspired by Sentora — tracks top positions by size,
   their recent activity (deposits, withdrawals, borrows,
   repayments), and supply/credit history. Helps identify
   concentration risk and anticipate large market moves.
   ═══════════════════════════════════════════════════════ */

interface WhaleEvent {
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay';
  amount: number;
  asset: string;
  timestamp: string;
}

function generateWhaleHistory(seed: number): WhaleEvent[] {
  const types: WhaleEvent['type'][] = ['deposit', 'withdraw', 'borrow', 'repay'];
  const assets = ['ETH', 'USDC', 'USDT'];
  const events: WhaleEvent[] = [];
  const days = ['Mar 10', 'Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Mar 16'];

  for (let i = 0; i < 5 + Math.floor(Math.abs(Math.sin(seed)) * 6); i++) {
    const r = Math.abs(Math.sin(seed + i * 7.3));
    events.push({
      type: types[Math.floor(r * 4) % 4],
      amount: 5000 + r * 200000,
      asset: assets[Math.floor(Math.abs(Math.sin(seed + i * 3.1)) * 3) % 3],
      timestamp: days[Math.floor(Math.abs(Math.sin(seed + i * 2.7)) * 7) % 7],
    });
  }
  return events.reverse();
}

function WhaleMonitor({ wallets, chainName }: { wallets: WalletPosition[]; chainName: string }) {
  const c = useColors();
  const [expandedWhale, setExpandedWhale] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'credit' | 'supply'>('credit');

  // Top whales = top positions by collateral value
  const whales = useMemo(() => {
    return [...wallets]
      .sort((a, b) => b.collateral - a.collateral)
      .slice(0, 10)
      .map((w, i) => ({
        ...w,
        rank: i + 1,
        history: generateWhaleHistory(i * 17 + w.collateral),
        pctOfProtocol: (w.collateral / Math.max(wallets.reduce((s, w2) => s + w2.collateral, 0), 1)) * 100,
      }));
  }, [wallets]);

  const totalWhaleCollateral = whales.reduce((s, w) => s + w.collateral, 0);
  const totalProtocolCollateral = wallets.reduce((s, w) => s + w.collateral, 0);
  const whaleConcentration = totalProtocolCollateral > 0 ? (totalWhaleCollateral / totalProtocolCollateral) * 100 : 0;

  const eventIcons: Record<string, { icon: string; color: string }> = {
    deposit: { icon: '↓', color: '#32EEE2' },
    withdraw: { icon: '↑', color: '#FC5457' },
    borrow: { icon: '→', color: '#FF007A' },
    repay: { icon: '←', color: '#703AE6' },
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-bold ${c.text1}`}>Whale Activity Monitor</h3>
        <div className={`flex gap-1`}>
          {(['credit', 'supply'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'bg-[#703AE6]/15 text-[#703AE6]'
                  : `${c.text4} ${c.isDark ? 'hover:text-[#9CA3AF]' : 'hover:text-[#4B5563]'}`
              }`}
            >
              {tab} History
            </button>
          ))}
        </div>
      </div>
      <p className={`text-[10px] ${c.text3} mb-4`}>
        Top 10 positions by collateral on {chainName} — {whaleConcentration.toFixed(1)}% of total protocol value
      </p>

      {/* Concentration warning */}
      {whaleConcentration > 40 && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-[#FF007A]/8 border border-[#FF007A]/15 flex items-center gap-2">
          <span className="text-[#FF007A] text-[12px]">⚠</span>
          <span className={`text-[10px] font-semibold text-[#FF007A]`}>
            High concentration risk: Top 10 whales hold {whaleConcentration.toFixed(1)}% of protocol collateral
          </span>
        </div>
      )}

      {/* Whale table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.borderHex}` }}>
              {['#', 'Address', 'Collateral', 'Debt', 'HF', 'Leverage', '% Protocol', ''].map((h, i) => (
                <th key={h} className={`${i < 2 ? 'text-left' : 'text-right'} py-2 px-2 font-semibold ${c.text3}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {whales.map((w, idx) => (
              <>
                <tr
                  key={idx}
                  className={`cursor-pointer transition-colors ${c.hoverRow} ${expandedWhale === idx ? (c.isDark ? 'bg-[#1E1E26]/50' : 'bg-[#F7F7F7]') : ''}`}
                  onClick={() => setExpandedWhale(expandedWhale === idx ? null : idx)}
                  style={{ borderBottom: `1px solid ${c.borderHex}30` }}
                >
                  <td className={`py-2.5 px-2 ${c.text4}`}>{w.rank}</td>
                  <td className={`py-2.5 px-2 font-mono ${c.text2}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#703AE6]/10 flex items-center justify-center text-[8px] text-[#703AE6] font-bold">
                        {PROTOCOL_TOKENS.find(t => t.symbol === w.primaryAsset)?.icon || '·'}
                      </span>
                      {w.address}
                    </div>
                  </td>
                  <td className={`py-2.5 px-2 text-right font-mono font-bold ${c.text1}`}>{formatUSD(w.collateral)}</td>
                  <td className={`py-2.5 px-2 text-right font-mono ${c.text2}`}>{formatUSD(w.debt)}</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="font-mono font-bold" style={{ color: getHFColor(w.hf) }}>{w.hf.toFixed(3)}</span>
                  </td>
                  <td className={`py-2.5 px-2 text-right font-mono ${c.text2}`}>{w.leverageX.toFixed(1)}x</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`font-mono font-bold ${w.pctOfProtocol > 5 ? 'text-[#FF007A]' : c.text2}`}>
                      {w.pctOfProtocol.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <svg className={`w-3 h-3 inline transition-transform ${expandedWhale === idx ? 'rotate-180' : ''} ${c.text3}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </td>
                </tr>

                {/* Expanded: Activity History */}
                {expandedWhale === idx && (
                  <tr key={`${idx}-detail`}>
                    <td colSpan={8} className="p-0">
                      <div className={`mx-2 mb-3 rounded-xl border ${c.innerBg} ${c.innerBorder} p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className={`text-[11px] font-bold ${c.text1}`}>
                            {activeTab === 'credit' ? 'Credit History' : 'Supply History'}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${c.isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'} ${c.text3}`}>
                            Last 7 days
                          </span>
                        </div>

                        {/* Filter events based on active tab */}
                        <div className="space-y-1.5">
                          {w.history
                            .filter(e => activeTab === 'credit'
                              ? (e.type === 'borrow' || e.type === 'repay')
                              : (e.type === 'deposit' || e.type === 'withdraw')
                            )
                            .map((event, ei) => {
                              const ev = eventIcons[event.type];
                              return (
                                <div key={ei} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${c.borderHex}20` }}>
                                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold"
                                    style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>{ev.icon}</span>
                                  <span className={`text-[10px] font-semibold capitalize w-16 ${c.text2}`}>{event.type}</span>
                                  <span className={`text-[10px] font-mono font-bold ${c.text1}`}>{formatUSD(event.amount)}</span>
                                  <span className={`text-[10px] ${c.text3}`}>{event.asset}</span>
                                  <span className={`ml-auto text-[9px] font-mono ${c.text4}`}>{event.timestamp}</span>
                                </div>
                              );
                            })}
                          {w.history.filter(e => activeTab === 'credit'
                            ? (e.type === 'borrow' || e.type === 'repay')
                            : (e.type === 'deposit' || e.type === 'withdraw')
                          ).length === 0 && (
                            <p className={`text-center text-[10px] ${c.text4} py-3`}>No {activeTab} activity in last 7 days</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════
   DUMMY DATA GENERATORS
   ═══════════════════════════════════════════════════════ */

function genSupplyHistory(): number[] {
  const base = 2800000;
  return Array.from({ length: 30 }, (_, i) => base + Math.sin(i * 0.3) * 400000 + i * 15000 + Math.random() * 100000);
}
function genUtilHistory(): number[] {
  return Array.from({ length: 30 }, (_, i) => 55 + Math.sin(i * 0.25) * 20 + Math.random() * 5);
}
function genBorrowRateHistory(): number[] {
  return Array.from({ length: 30 }, (_, i) => 3.5 + Math.sin(i * 0.2) * 2 + Math.random() * 0.5);
}
function genBadDebtHistory(): number[] {
  return Array.from({ length: 30 }, (_, i) => Math.max(0, 5000 + Math.sin(i * 0.4) * 8000 + Math.random() * 3000));
}
const MONTH_LABELS = ['Feb 14', 'Feb 21', 'Feb 28', 'Mar 7', 'Mar 14'];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'risk-explorer', label: 'Risk Explorer' },
  { id: 'markets', label: 'Markets' },
  { id: 'bad-debt', label: 'Bad Debt' },
  { id: 'liquidations', label: 'Liquidations' },
  { id: 'whales', label: 'Whales' },
  { id: 'rates', label: 'Rates' },
  { id: 'user', label: 'My Position' },
  { id: 'simulator', label: 'Simulator' },
];

export default function AnalyticsDashboardPage() {
  const { isDark } = useTheme();
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { metrics, loading: metricsLoading } = useProtocolMetrics();
  const { params: rateParams, loading: ratesLoading } = useRateModelData();
  const { positions, aggregate, loading: userLoading } = useUserRiskPosition(address);

  const c = useColors();
  const [activeSection, setActiveSection] = useState('overview');

  // Active chain
  const activeChainId = SUPPORTED_CHAINS.includes(connectedChainId as typeof SUPPORTED_CHAINS[number])
    ? connectedChainId : 8453;
  const chainName = CHAIN_NAMES[activeChainId] || 'Unknown';
  const chainColor = CHAIN_COLORS[activeChainId] || '#703AE6';

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      for (const section of [...SECTIONS].reverse()) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 100) { setActiveSection(section.id); break; }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Chain data
  const chainPools = metrics?.pools.filter(p => p.chainId === activeChainId) || [];
  const chainData = metrics?.perChain[activeChainId];
  const chainSupplied = chainPools.reduce((s, p) => s + bigintToNumber(p.totalSupplied, p.decimals) * getApproxUsdPrice(p.symbol), 0);
  const chainBorrowed = chainPools.reduce((s, p) => s + bigintToNumber(p.totalBorrowed, p.decimals) * getApproxUsdPrice(p.symbol), 0);
  const chainUtil = chainSupplied > 0 ? (chainBorrowed / chainSupplied) * 100 : 0;

  // Token risks
  const tokenRisks: TokenRisk[] = useMemo(() => {
    const totalTVL = chainPools.reduce((s, p) => s + bigintToNumber(p.totalSupplied, p.decimals) * getApproxUsdPrice(p.symbol), 0);
    return chainPools.map(pool => {
      const suppliedUsd = bigintToNumber(pool.totalSupplied, pool.decimals) * getApproxUsdPrice(pool.symbol);
      const borrowedUsd = bigintToNumber(pool.totalBorrowed, pool.decimals) * getApproxUsdPrice(pool.symbol);
      const conc = totalTVL > 0 ? (suppliedUsd / totalTVL) * 100 : 0;
      return {
        symbol: pool.symbol, chainId: pool.chainId,
        name: pool.symbol === 'ETH' ? 'Ethereum' : pool.symbol === 'USDC' ? 'USD Coin' : 'Tether USD',
        totalSupplied: suppliedUsd, totalBorrowed: borrowedUsd,
        utilization: pool.utilization, supplyAPY: pool.supplyAPY, borrowAPY: pool.borrowAPY,
        concentrationPct: conc, riskTier: getRiskTier(pool.symbol, pool.utilization, conc),
      };
    });
  }, [chainPools]);

  // Rate model
  const chainRateParam = rateParams.find(p => p.chainId === activeChainId);
  const curvePoints = useMemo(() => {
    if (!chainRateParam) return [];
    const pts: { utilization: number; rate: number }[] = [];
    for (let u = 0; u <= 100; u += 2) {
      const ratio = u / 100;
      let rate: number;
      if (ratio <= chainRateParam.optimalUsageRatio) {
        rate = chainRateParam.baseRate + (chainRateParam.slope1 * ratio) / chainRateParam.optimalUsageRatio;
      } else {
        rate = chainRateParam.baseRate + chainRateParam.slope1 + chainRateParam.slope2 * ((ratio - chainRateParam.optimalUsageRatio) / chainRateParam.maxExcessUsageRatio);
      }
      pts.push({ utilization: u, rate: rate * 100 });
    }
    return pts;
  }, [chainRateParam]);
  const maxRate = Math.max(...curvePoints.map(p => p.rate), 1);
  const optimalLine = (chainRateParam?.optimalUsageRatio || 0.85) * 100;

  // Wallets (dummy)
  const allWallets = useMemo(() => generateWallets(activeChainId), [activeChainId]);

  // Dummy charts
  const supplyHistory = useMemo(genSupplyHistory, [activeChainId]);
  const utilHistory = useMemo(genUtilHistory, [activeChainId]);
  const borrowRateHistory = useMemo(genBorrowRateHistory, [activeChainId]);
  const badDebtHistory = useMemo(genBadDebtHistory, [activeChainId]);

  // HF buckets summary
  const hfBuckets = useMemo(() => {
    const total = allWallets.length;
    const buckets = [
      { label: '< 1.0', sub: 'Underwater', color: '#FC5457', wallets: allWallets.filter(w => w.hf < 1.0) },
      { label: '1.0-1.1', sub: 'Critical', color: '#FF007A', wallets: allWallets.filter(w => w.hf >= 1.0 && w.hf < 1.1) },
      { label: '1.1-1.2', sub: 'Warning', color: '#703AE6', wallets: allWallets.filter(w => w.hf >= 1.1 && w.hf < 1.2) },
      { label: '1.2-1.5', sub: 'Caution', color: '#9F7BEE', wallets: allWallets.filter(w => w.hf >= 1.2 && w.hf < 1.5) },
      { label: '> 1.5', sub: 'Safe', color: '#32EEE2', wallets: allWallets.filter(w => w.hf >= 1.5) },
    ];
    return buckets.map(b => ({ ...b, count: b.wallets.length, pct: total > 0 ? (b.wallets.length / total) * 100 : 0 }));
  }, [allWallets]);

  // Simulator state
  const [simCollateral, setSimCollateral] = useState(10000);
  const [simDebt, setSimDebt] = useState(5000);
  const [simEthPortion, setSimEthPortion] = useState(30);
  const [simEthChange, setSimEthChange] = useState(0);
  const [simExtraBorrow, setSimExtraBorrow] = useState(0);
  const [simExtraDeposit, setSimExtraDeposit] = useState(0);
  const simulation = useMemo(() => {
    const ethColl = simCollateral * (simEthPortion / 100) * (1 + simEthChange / 100);
    const stableColl = simCollateral * (1 - simEthPortion / 100);
    return marginCalc.simulatePosition(stableColl + ethColl + simExtraDeposit, simDebt + simExtraBorrow, 0, 0);
  }, [simCollateral, simDebt, simEthPortion, simEthChange, simExtraBorrow, simExtraDeposit]);
  const simCurrentHF = marginCalc.calcHF(simCollateral, simDebt);

  const inputCls = `w-full px-3 py-2.5 rounded-xl border font-mono text-sm focus:border-[#703AE6]/50 focus:outline-none transition-colors ${c.inputBg} ${c.text1}`;

  return (
    <div className={`${c.pageBg} min-h-screen ${c.text1}`}>
      <div className="max-w-[1360px] mx-auto px-5 pb-20">

        {/* Header */}
        <div className="pt-6 pb-1">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chainColor }} />
            <h1 className={`text-[18px] font-bold tracking-tight ${c.text1}`}>
              {chainName} Analytics
            </h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#32EEE2]/8 text-[#32EEE2] font-bold tracking-wider">LIVE</span>
          </div>
          <p className={`text-[11px] ${c.text3} mt-1 ml-6`}>
            Chain-specific protocol health monitoring for {chainName}
            {!SUPPORTED_CHAINS.includes(connectedChainId as typeof SUPPORTED_CHAINS[number]) &&
              <span className="text-[#FC5457] ml-2">(Switch to Base, Arbitrum, or Optimism for live data)</span>}
          </p>
        </div>

        {/* Section nav */}
        <div className="flex gap-1 pt-3 pb-2 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? 'text-[#703AE6] bg-[#703AE6]/8'
                  : `${c.text3} ${isDark ? 'hover:text-[#9CA3AF]' : 'hover:text-[#4B5563]'}`
              }`}
            >{s.label}</a>
          ))}
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        <SectionHeader id="overview" title="Protocol Overview" subtitle={`Real-time metrics for ${chainName}`} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard title="TVL" value={formatUSD(chainData?.tvl || 0)} loading={metricsLoading} accent />
          <MetricCard title="Total Supplied" value={formatUSD(chainSupplied)} loading={metricsLoading} />
          <MetricCard title="Total Borrowed" value={formatUSD(chainBorrowed)} loading={metricsLoading} />
          <MetricCard title="Utilization" value={formatPercent(chainUtil)} loading={metricsLoading} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard title="Active Markets" value={String(chainPools.length || 3)} />
          <MetricCard title="Active Users" value={String(allWallets.length)} subtitle={`On ${chainName}`} />
          <MetricCard title="Revenue (30d)" value="$16.1K" change="+8.5%" changePositive />
          <MetricCard title="Bad Debt" value={formatUSD(allWallets.filter(w => w.hf < 1).reduce((s, w) => s + Math.max(w.debt - w.collateral, 0), 0))} subtitle={allWallets.filter(w => w.hf < 1).length > 0 ? `${allWallets.filter(w => w.hf < 1).length} underwater positions` : 'No bad debt'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          <LineChart title="Total Supply Over Time" subtitle={`${chainName} — Last 30 days`} data={supplyHistory} color={chainColor} yFormat={formatUSD} xLabels={MONTH_LABELS} />
          <LineChart title="Utilization Rate Over Time" subtitle={`${chainName} — Last 30 days`} data={utilHistory} color="#703AE6" yFormat={v => formatPercent(v)} xLabels={MONTH_LABELS} />
        </div>

        {/* Lending pools table */}
        <Card className="overflow-x-auto mb-2">
          <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${c.text3}`}>Lending Pools on {chainName}</h3>
          <table className="w-full text-[12px] min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.borderHex}` }}>
                {['Asset', 'Supplied', 'Borrowed', 'Utilization', 'Borrow APY', 'Supply APY'].map((h, i) => (
                  <th key={h} className={`${i === 0 ? 'text-left' : 'text-right'} px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold ${c.text3}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricsLoading && <tr><td colSpan={6} className={`px-3 py-10 text-center ${c.text3}`}>Loading...</td></tr>}
              {!metricsLoading && chainPools.length === 0 && <tr><td colSpan={6} className={`px-3 py-10 text-center ${c.text3}`}>No pools found on {chainName}</td></tr>}
              {chainPools.map(pool => {
                const supplied = bigintToNumber(pool.totalSupplied, pool.decimals);
                const borrowed = bigintToNumber(pool.totalBorrowed, pool.decimals);
                return (
                  <tr key={pool.symbol} className={`${c.hoverRow} transition-colors`} style={{ borderBottom: `1px solid ${c.borderHex}40` }}>
                    <td className={`px-3 py-3 font-semibold ${c.text1}`}>{pool.symbol}</td>
                    <td className={`px-3 py-3 text-right font-mono ${c.text2}`}>{formatUSD(supplied * getApproxUsdPrice(pool.symbol))}</td>
                    <td className={`px-3 py-3 text-right font-mono ${c.text2}`}>{formatUSD(borrowed * getApproxUsdPrice(pool.symbol))}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-14"><UtilizationBar value={pool.utilization} showPercent={false} height={4} /></div>
                        <span className={`font-mono text-[10px] ${c.text3}`}>{formatPercent(pool.utilization)}</span>
                      </div>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${c.text2}`}>{formatPercent(pool.borrowAPY)}</td>
                    <td className="px-3 py-3 text-right font-mono text-[#32EEE2]">{formatPercent(pool.supplyAPY)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* ══════════════ RISK EXPLORER ══════════════ */}
        <SectionHeader id="risk-explorer" title="Risk Explorer" subtitle={`Simulate price impacts on ${chainName} protocol health`} />
        <RiskExplorer wallets={allWallets} chainName={chainName} />

        {/* ══════════════ MARKETS ══════════════ */}
        <SectionHeader id="markets" title="Market Stats" subtitle={`Per-asset statistics and risk on ${chainName}`} />
        <MarketStats tokenRisks={tokenRisks} wallets={allWallets} chainName={chainName} />

        {/* ══════════════ BAD DEBT ══════════════ */}
        <SectionHeader id="bad-debt" title="Bad Debt Monitor" subtitle={`Protocol bad debt analysis for ${chainName}`} />
        <BadDebtMonitor wallets={allWallets} chainName={chainName} />
        <div className="mt-3">
          <LineChart title="Bad Debt Over Time" subtitle={`${chainName} — Last 30 days`} data={badDebtHistory} color="#FC5457" yFormat={formatUSD} xLabels={MONTH_LABELS} />
        </div>

        {/* ══════════════ LIQUIDATIONS ══════════════ */}
        <SectionHeader id="liquidations" title="Liquidation Monitor" subtitle={`Health factor distribution on ${chainName}`} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          {/* HF Distribution */}
          <Card>
            <h3 className={`text-sm font-bold ${c.text1} mb-1`}>Health Factor Distribution</h3>
            <p className={`text-[10px] ${c.text3} mb-4`}>{allWallets.length} positions on {chainName}</p>
            <div className="space-y-2.5">
              {hfBuckets.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <p className="text-[11px] font-mono font-bold" style={{ color: b.color }}>{b.label}</p>
                    <p className={`text-[9px] ${c.text4}`}>{b.sub}</p>
                  </div>
                  <div className={`flex-1 h-6 rounded-lg overflow-hidden ${isDark ? 'bg-[#1E1E26]' : 'bg-[#F3F4F6]'}`}>
                    <div className="h-full rounded-lg" style={{ backgroundColor: b.color, width: `${b.pct}%`, opacity: 0.7 }} />
                  </div>
                  <div className="w-12 text-right shrink-0">
                    <span className={`text-[11px] font-mono font-bold ${c.text2}`}>{b.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <LineChart title="Borrow Rate Over Time" subtitle={`${chainName} — Last 30 days`} data={borrowRateHistory} color="#FC5457" yFormat={v => formatPercent(v)} xLabels={MONTH_LABELS} />
        </div>

        {/* Leverage Distribution + HF Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          <LeverageDistribution wallets={allWallets} />
          <HFHeatmap wallets={allWallets} />
        </div>

        {/* All positions by HF range — expandable */}
        <div className="mb-2">
          <WalletsByHFRange wallets={allWallets} />
        </div>

        {/* ══════════════ WHALES ══════════════ */}
        <SectionHeader id="whales" title="Whale Activity" subtitle={`Top positions and concentration risk on ${chainName}`} />
        <WhaleMonitor wallets={allWallets} chainName={chainName} />

        {/* ══════════════ RATES ══════════════ */}
        <SectionHeader id="rates" title="Interest Rate Model" subtitle={`Rate parameters for ${chainName}`} />
        {chainRateParam && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
            {[['Base Rate', chainRateParam.baseRate], ['Slope 1', chainRateParam.slope1], ['Slope 2', chainRateParam.slope2]].map(([label, val]) => (
              <Card key={String(label)}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text3}`}>{String(label)}</p>
                <p className={`text-2xl font-mono font-bold mt-2 ${c.text1}`}>{formatPercent(Number(val) * 100)}</p>
              </Card>
            ))}
          </div>
        )}
        <Card className="mb-2">
          <h3 className={`text-sm font-bold ${c.text1} mb-4`}>Borrow Rate vs Utilization</h3>
          {ratesLoading || curvePoints.length === 0 ? (
            <div className={`h-48 flex items-center justify-center ${c.text3}`}>{ratesLoading ? 'Loading...' : 'No data'}</div>
          ) : (
            <div className="relative h-48">
              <div className={`absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[9px] font-mono ${c.text3}`}>
                <span>{maxRate.toFixed(0)}%</span><span>{(maxRate / 2).toFixed(0)}%</span><span>0%</span>
              </div>
              <div className="ml-12 mr-2 relative h-[calc(100%-20px)]">
                {[0, 25, 50, 75, 100].map(y => (<div key={y} className="absolute left-0 right-0 h-px" style={{ top: `${y}%`, backgroundColor: c.gridLine }} />))}
                <div className="absolute top-0 bottom-0 border-l border-dashed border-[#703AE6]/25" style={{ left: `${optimalLine}%` }}>
                  <span className="absolute -top-4 -translate-x-1/2 text-[8px] text-[#703AE6] font-bold">Kink</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs><linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#703AE6" stopOpacity="0.2" /><stop offset="100%" stopColor="#703AE6" stopOpacity="0" /></linearGradient></defs>
                  <path d={`M 0 100 ${curvePoints.map(p => `L ${p.utilization} ${100 - (p.rate / maxRate) * 100}`).join(' ')} L 100 100 Z`} fill="url(#rateGrad)" />
                  <path d={`M ${curvePoints.map(p => `${p.utilization} ${100 - (p.rate / maxRate) * 100}`).join(' L ')}`} fill="none" stroke="#703AE6" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div className={`ml-12 mr-2 flex justify-between text-[9px] font-mono mt-1 ${c.text4}`}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>
          )}
        </Card>

        {/* ══════════════ MY POSITION ══════════════ */}
        <SectionHeader id="user" title="My Position" subtitle={isConnected ? `Wallet: ${truncateAddress(address || '')} on ${chainName}` : 'Connect wallet to view'} />
        {!isConnected ? (
          <Card className="flex flex-col items-center justify-center py-14">
            <p className={`${c.text3} mb-4 text-sm`}>Connect your wallet to view your position on {chainName}</p>
            <ConnectButton />
          </Card>
        ) : userLoading ? (
          <Card className={`py-14 text-center ${c.text3}`}>Loading...</Card>
        ) : !aggregate ? (
          <Card className="py-14 text-center">
            <p className={c.text3}>No margin accounts found on {chainName}.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <Card className="flex flex-col items-center justify-center relative lg:row-span-2">
                <HealthFactorGauge value={aggregate.healthFactor} size="lg" />
                <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getHFBgClass(aggregate.healthFactor)}`}>{aggregate.hfStatus}</div>
              </Card>
              <MetricCard title="Net Worth" value={formatUSD(aggregate.netWorth)} />
              <MetricCard title="Collateral" value={formatUSD(aggregate.totalCollateralUsd)} />
              <MetricCard title="Debt" value={formatUSD(aggregate.totalDebtUsd)} />
              <MetricCard title="Leverage" value={isFinite(aggregate.leverage) ? `${aggregate.leverage.toFixed(2)}x` : '1.00x'} />
              <MetricCard title="LTV" value={formatPercent(aggregate.ltv * 100)} />
              <MetricCard title="Can Borrow" value={formatUSD(aggregate.maxBorrow)} />
            </div>
            <Card>
              <UtilizationBar value={aggregate.ltv * 100} label="Borrowing Power Used" height={8} />
            </Card>
            <PriceSimulator collateralUsd={aggregate.totalCollateralUsd} debtUsd={aggregate.totalDebtUsd} ethCollateralPortion={0.3} />
          </div>
        )}

        {/* ══════════════ SIMULATOR ══════════════ */}
        <SectionHeader id="simulator" title="Position Simulator" subtitle="Model hypothetical positions and stress test" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-3">
            <Card>
              <h3 className={`text-sm font-bold ${c.text1} mb-4`}>Position</h3>
              <div className="space-y-3">
                {[{ label: 'Collateral (USD)', val: simCollateral, set: setSimCollateral }, { label: 'Debt (USD)', val: simDebt, set: setSimDebt }].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className={`block text-[10px] mb-1 font-bold uppercase tracking-wider ${c.text3}`}>{label}</label>
                    <input type="number" value={val} onChange={e => set(Number(e.target.value))} className={inputCls} />
                  </div>
                ))}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={`font-bold uppercase tracking-wider ${c.text3}`}>ETH Portion</span>
                    <span className={`font-mono font-bold ${c.text1}`}>{simEthPortion}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={simEthPortion} onChange={e => setSimEthPortion(Number(e.target.value))} className="w-full accent-[#703AE6]" />
                </div>
              </div>
            </Card>
            <Card>
              <h3 className={`text-sm font-bold ${c.text1} mb-4`}>Scenario</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={`font-bold uppercase tracking-wider ${c.text3}`}>ETH Price Change</span>
                    <span className={`font-mono font-bold ${simEthChange >= 0 ? 'text-[#32EEE2]' : 'text-[#FC5457]'}`}>{simEthChange >= 0 ? '+' : ''}{simEthChange}%</span>
                  </div>
                  <input type="range" min={-80} max={100} value={simEthChange} onChange={e => setSimEthChange(Number(e.target.value))} className="w-full accent-[#703AE6]" />
                </div>
                {[{ label: 'Extra Borrow (USD)', val: simExtraBorrow, set: setSimExtraBorrow }, { label: 'Extra Deposit (USD)', val: simExtraDeposit, set: setSimExtraDeposit }].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className={`block text-[10px] mb-1 font-bold uppercase tracking-wider ${c.text3}`}>{label}</label>
                    <input type="number" value={val} onChange={e => set(Number(e.target.value))} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[{ label: 'ETH -20%', e: -20, b: 0, d: 0 }, { label: 'ETH -50%', e: -50, b: 0, d: 0 }, { label: 'Borrow $5K', e: 0, b: 5000, d: 0 }, { label: 'Deposit $5K', e: 0, b: 0, d: 5000 }].map(sc => (
                  <button key={sc.label} onClick={() => { setSimEthChange(sc.e); setSimExtraBorrow(sc.b); setSimExtraDeposit(sc.d); }}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                      isDark ? 'bg-[#0D0D12] border-[#1E1E26] text-[#6B7280] hover:text-white' : 'bg-[#F7F7F7] border-[#E5E7EB] text-[#9CA3AF] hover:text-[#1F1F1F]'
                    }`}>{sc.label}</button>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <h4 className={`text-[10px] uppercase font-bold mb-3 ${c.text4}`}>Current</h4>
                <div className="space-y-3">
                  <div><p className={`text-[9px] font-bold ${c.text4}`}>Health Factor</p><p className="text-2xl font-mono font-bold" style={{ color: getHFColor(simCurrentHF) }}>{formatHF(simCurrentHF)}</p></div>
                  <div><p className={`text-[9px] font-bold ${c.text4}`}>LTV</p><p className={`text-lg font-mono font-bold ${c.text1}`}>{formatPercent(marginCalc.calcLTV(simCollateral, simDebt) * 100)}</p></div>
                  <div><p className={`text-[9px] font-bold ${c.text4}`}>Leverage</p><p className={`text-lg font-mono font-bold ${c.text1}`}>{marginCalc.calcLeverage(simCollateral, simDebt).toFixed(2)}x</p></div>
                </div>
              </Card>
              <div className={`rounded-2xl border p-5 ${getHFBgClass(simulation.newHF)}`}>
                <h4 className="text-[10px] uppercase font-bold mb-3 opacity-60">Simulated</h4>
                <div className="space-y-3">
                  <div><p className="text-[9px] opacity-60 font-bold">Health Factor</p><p className="text-2xl font-mono font-bold">{formatHF(simulation.newHF)}</p></div>
                  <div><p className="text-[9px] opacity-60 font-bold">LTV</p><p className="text-lg font-mono font-bold">{formatPercent(simulation.newLTV * 100)}</p></div>
                  <div><p className="text-[9px] opacity-60 font-bold">Leverage</p><p className="text-lg font-mono font-bold">{isFinite(simulation.newLeverage) ? `${simulation.newLeverage.toFixed(2)}x` : '\u221E'}</p></div>
                </div>
              </div>
            </div>
            {simulation.isLiquidatable ? (
              <div className="rounded-2xl bg-[#FC5457]/8 border border-[#FC5457]/15 p-5 text-center">
                <p className="text-[#FC5457] text-lg font-bold">Position Would Be Liquidated!</p>
              </div>
            ) : (
              <Card>
                <h4 className={`text-sm font-bold ${c.text1} mb-3`}>Safety Margin</h4>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className={c.text3}>Max Borrow</span><span className={`font-mono font-bold ${c.text1}`}>{formatUSD(simulation.maxBorrow)}</span></div>
                  <div className="flex justify-between"><span className={c.text3}>Max Withdraw</span><span className={`font-mono font-bold ${c.text1}`}>{formatUSD(simulation.maxWithdraw)}</span></div>
                  <div className="flex justify-between"><span className={c.text3}>Status</span><span className="font-mono font-bold" style={{ color: getHFColor(simulation.newHF) }}>{simulation.hfStatus.toUpperCase()}</span></div>
                </div>
              </Card>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
