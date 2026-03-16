export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value > 0) return `$${value.toFixed(4)}`;
  return '$0.00';
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatHF(value: number): string {
  if (!isFinite(value)) return '\u221E';
  return value.toFixed(4);
}

export function formatTokenAmount(value: number, decimals = 4): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(decimals);
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function bigintToNumber(value: bigint, decimals: number): number {
  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}

// Brand-aligned HF colors:
// Safe (>1.5): Electric Blue #32EEE2
// Caution (1.25-1.5): Violet #703AE6
// Warning (1.1-1.25): Rose #FF007A
// Danger (<1.1): Imperial Red #FC5457
export function getHFColor(hf: number): string {
  if (hf > 1.5) return '#32EEE2';
  if (hf > 1.25) return '#703AE6';
  if (hf > 1.1) return '#FF007A';
  return '#FC5457';
}

export function getHFBgClass(hf: number): string {
  if (hf > 1.5) return 'bg-[#32EEE2]/10 text-[#32EEE2] border-[#32EEE2]/20';
  if (hf > 1.25) return 'bg-[#703AE6]/10 text-[#703AE6] border-[#703AE6]/20';
  if (hf > 1.1) return 'bg-[#FF007A]/10 text-[#FF007A] border-[#FF007A]/20';
  return 'bg-[#FC5457]/10 text-[#FC5457] border-[#FC5457]/20';
}

export function getRiskTierColor(tier: string): string {
  switch (tier) {
    case 'Low': return 'text-[#32EEE2]';
    case 'Medium': return 'text-[#703AE6]';
    case 'High': return 'text-[#FF007A]';
    case 'Critical': return 'text-[#FC5457]';
    default: return 'text-[#949494]';
  }
}
