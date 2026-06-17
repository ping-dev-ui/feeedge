import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

type Rate = { maker: number; taker: number };

// Published maker/taker base rates (decimals: 0.0005 = 0.05%), used as the
// fallback whenever an exchange has no clean public fee API (most don't without
// auth). Keep the futures values in sync with the tier-0 rates shown in the UI.
const PUBLISHED: Record<"futures" | "spot", Record<string, Rate>> = {
  futures: {
    binance: { maker: 0.0002, taker: 0.0005 },
    bybit: { maker: 0.0002, taker: 0.00055 },
    hyperliquid: { maker: 0.0001, taker: 0.00035 },
    okx: { maker: 0.0002, taker: 0.0005 },
    gateio: { maker: 0.00015, taker: 0.0005 },
    bitget: { maker: 0.0002, taker: 0.0006 },
    kucoin: { maker: 0.0002, taker: 0.0006 },
    mexc: { maker: 0.0001, taker: 0.0004 },
    kraken: { maker: 0.0002, taker: 0.0005 },
  },
  spot: {
    binance: { maker: 0.001, taker: 0.001 },
    bybit: { maker: 0.001, taker: 0.001 },
    hyperliquid: { maker: 0.0004, taker: 0.0007 },
    okx: { maker: 0.0008, taker: 0.001 },
    gateio: { maker: 0.002, taker: 0.002 },
    bitget: { maker: 0.001, taker: 0.001 },
    kucoin: { maker: 0.001, taker: 0.001 },
    mexc: { maker: 0.0, taker: 0.0005 },
    kraken: { maker: 0.0016, taker: 0.0026 },
  },
};

// --- Live fetchers (best-effort, public, no auth) ---------------------------
// Return { maker, taker } as decimals, or null to fall back to published.

async function fetchKrakenFutures(): Promise<Rate | null> {
  try {
    const res = await fetch(
      "https://futures.kraken.com/derivatives/api/v3/feeschedules",
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const schedules = data?.feeSchedules ?? data?.feeSchedule ?? [];
    const tiers = schedules?.[0]?.tiers;
    if (!Array.isArray(tiers) || tiers.length === 0) return null;
    const base = [...tiers].sort(
      (a, b) => (a.usdValue ?? 0) - (b.usdValue ?? 0),
    )[0];
    const maker = Number(base.makerFee);
    const taker = Number(base.takerFee);
    if (!isFinite(maker) || !isFinite(taker)) return null;
    return { maker: maker / 100, taker: taker / 100 };
  } catch (e) {
    console.error("Kraken futures fee fetch failed:", e);
    return null;
  }
}

async function fetchKrakenSpot(): Promise<Rate | null> {
  try {
    const res = await fetch(
      "https://api.kraken.com/0/public/AssetPairs?pair=XXBTZUSD",
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const pair = data?.result?.XXBTZUSD ?? Object.values(data?.result ?? {})[0];
    const takerTiers = pair?.fees;
    const makerTiers = pair?.fees_maker;
    if (!Array.isArray(takerTiers) || takerTiers.length === 0) return null;
    const taker = Number(takerTiers[0]?.[1]);
    const maker = Array.isArray(makerTiers)
      ? Number(makerTiers[0]?.[1])
      : taker;
    if (!isFinite(maker) || !isFinite(taker)) return null;
    // Kraken reports these as percentages (0.26 = 0.26%).
    return { maker: maker / 100, taker: taker / 100 };
  } catch (e) {
    console.error("Kraken spot fee fetch failed:", e);
    return null;
  }
}

const LIVE_FETCHERS: Record<string, () => Promise<Rate | null>> = {
  "kraken:futures": fetchKrakenFutures,
  "kraken:spot": fetchKrakenSpot,
};

export const fetchAllFees = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const market of ["futures", "spot"] as const) {
      for (const exchange of Object.keys(PUBLISHED[market])) {
        let rate = PUBLISHED[market][exchange];
        let source = "published";

        const fetcher = LIVE_FETCHERS[`${exchange}:${market}`];
        if (fetcher) {
          const live = await fetcher();
          if (live) {
            rate = live;
            source = "live";
          }
        }

        try {
          await ctx.runMutation(internal.fees.upsertFeeRate, {
            exchange,
            market,
            makerFee: rate.maker,
            takerFee: rate.taker,
            stale: false,
            source,
          });
        } catch (e) {
          console.error(`Failed to upsert ${exchange} ${market}:`, e);
        }
      }
    }
    return null;
  },
});
