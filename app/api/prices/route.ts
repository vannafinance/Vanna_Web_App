import { NextResponse } from "next/server";

const MUX_URL = "https://app.mux.network/api/liquidityAsset";

export const revalidate = 0; // disable Next cache if you want manual cache

let lastCache: Record<string, number> | null = null;
let lastTs = 0;
const TTL = 10_000; // 10s

const normalize = (s: string): string => {
  if (s === "WETH") return "ETH";
  if (s === "WBTC") return "BTC";
  return s;
};

export async function GET() {
  const now = Date.now();

  // Serve from cache
  if (lastCache && now - lastTs < TTL) {
    return NextResponse.json({
      ...lastCache,
      timestamp: lastTs,
      cached: true
    });
  }

  try {
    const rsp = await fetch(MUX_URL, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const raw = await rsp.json();

    const out: Record<string, number> = {};

    for (const a of raw.assets ?? []) {
      const s = normalize(a.symbol);
      const p = Number(a.price);
      if (!isFinite(p)) continue;
      out[s] = p;
    }

    // --- canonical exposure for our margin app ---
    const result = {
      ETH: out["ETH"],
      WETH: out["ETH"], // mirror
      BTC: out["BTC"],
      WBTC: out["BTC"], // mirror
      USDC: 1,
      USDT: 1,
      DAI: 1,
      timestamp: now,
      cached: false,
    };

    lastCache = result as any;
    lastTs = now;

    return NextResponse.json(result);

  } catch (e) {
    // fallback to cached on failure
    if (lastCache) {
      return NextResponse.json({
        ...lastCache,
        timestamp: lastTs,
        degraded: true,
      });
    }
    
    return NextResponse.json({ error: "MUX price fetch failed" }, { status: 500 });
  }
}
