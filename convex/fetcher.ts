import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { scrapeFee, scrapingEnabled } from "./scrape";

type Rate = { maker: number; taker: number };

// Date the curated rates below were last hand-verified from the exchanges. Used
// as the "last updated" stamp for any exchange/market still on the curated
// fallback (i.e. not freshly fetched via API or scraped), so the UI never
// claims a fresh update that didn't happen. Bump when you re-verify by hand.
const VERIFIED_AT = Date.parse("2026-07-01T00:00:00Z");

// Published maker/taker base rates (decimals: 0.0005 = 0.05%), used as the
// fallback whenever an exchange has no clean public fee API and scraping is off
// or fails. Keep the futures values in sync with the tier-0 rates shown in the UI.
const PUBLISHED: Record<"futures" | "spot", Record<string, Rate>> = {
  futures: {
    binance: { maker: 0.0002, taker: 0.0005 },
    bybit: { maker: 0.0002, taker: 0.00055 },
    hyperliquid: { maker: 0.00015, taker: 0.00045 },
    okx: { maker: 0.0002, taker: 0.0005 },
    gateio: { maker: 0.00015, taker: 0.0005 },
    bitget: { maker: 0.0002, taker: 0.0006 },
    kucoin: { maker: 0.0002, taker: 0.0006 },
    mexc: { maker: 0.0, taker: 0.0002 },
    kraken: { maker: 0.0002, taker: 0.0005 },
    htx: { maker: 0.0002, taker: 0.0006 },
    bingx: { maker: 0.0002, taker: 0.0005 },
    coinbase: { maker: 0.0, taker: 0.0003 },
    cryptocom: { maker: 0.0002, taker: 0.0004 },
    bitfinex: { maker: 0.0, taker: 0.0 },
    whitebit: { maker: 0.0001, taker: 0.00055 },
    phemex: { maker: 0.0001, taker: 0.0006 },
    bitmex: { maker: 0.0005, taker: 0.0005 },
    backpack: { maker: 0.0002, taker: 0.0005 },
    bitmart: { maker: 0.0002, taker: 0.0006 },
    coinex: { maker: 0.0003, taker: 0.0005 },
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
    kraken: { maker: 0.0025, taker: 0.004 },
    htx: { maker: 0.002, taker: 0.002 },
    bingx: { maker: 0.001, taker: 0.001 },
    coinbase: { maker: 0.004, taker: 0.006 },
    cryptocom: { maker: 0.0025, taker: 0.005 },
    bitfinex: { maker: 0.0, taker: 0.0 },
    whitebit: { maker: 0.001, taker: 0.001 },
    phemex: { maker: 0.001, taker: 0.001 },
    bitmex: { maker: 0.0005, taker: 0.0005 },
    backpack: { maker: 0.0008, taker: 0.001 },
    bitmart: { maker: 0.0015, taker: 0.0025 },
    coinex: { maker: 0.002, taker: 0.002 },
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
      (a, b) => (a.usdVolume ?? 0) - (b.usdVolume ?? 0),
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

// Guard: reject implausible API responses so a junk value can never be
// published as a real fee. Base maker/taker should sit in a tight range.
function saneRate(maker: number, taker: number): Rate | null {
  if (!isFinite(maker) || !isFinite(taker)) return null;
  if (taker < 0 || taker > 0.02 || maker < -0.01 || maker > 0.02) return null;
  return { maker, taker };
}

// Bitget USDT-M perps: public contracts endpoint exposes base maker/taker as
// decimals (0.0006 = 0.06%). Verified to match the published tier-0 rate.
async function fetchBitgetFutures(): Promise<Rate | null> {
  try {
    const res = await fetch(
      "https://api.bitget.com/api/v2/mix/market/contracts?productType=usdt-futures&symbol=BTCUSDT",
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const row = data?.data?.[0];
    if (!row) return null;
    return saneRate(Number(row.makerFeeRate), Number(row.takerFeeRate));
  } catch (e) {
    console.error("Bitget futures fee fetch failed:", e);
    return null;
  }
}

// MEXC USDT-M perps: public contract detail exposes base maker/taker as
// decimals (0.0002 = 0.02%). Verified to match the published tier-0 rate.
async function fetchMexcFutures(): Promise<Rate | null> {
  try {
    const res = await fetch(
      "https://contract.mexc.com/api/v1/contract/detail?symbol=BTC_USDT",
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const d = data?.data;
    if (!d) return null;
    return saneRate(Number(d.makerFeeRate), Number(d.takerFeeRate));
  } catch (e) {
    console.error("MEXC futures fee fetch failed:", e);
    return null;
  }
}

const LIVE_FETCHERS: Record<string, () => Promise<Rate | null>> = {
  "kraken:futures": fetchKrakenFutures,
  "kraken:spot": fetchKrakenSpot,
  "bitget:futures": fetchBitgetFutures,
  "mexc:futures": fetchMexcFutures,
};

export const fetchAllFees = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const scrapeOn = scrapingEnabled();
    for (const market of ["futures", "spot"] as const) {
      for (const exchange of Object.keys(PUBLISHED[market])) {
        let rate = PUBLISHED[market][exchange];
        let source = "published";
        // Curated values keep their hand-verified date; only a real fetch
        // (API or scrape) advances the timestamp to now.
        let lastUpdated = VERIFIED_AT;

        // 1) Live public API where one exists (most reliable).
        const fetcher = LIVE_FETCHERS[`${exchange}:${market}`];
        if (fetcher) {
          const live = await fetcher();
          if (live) {
            rate = live;
            source = "live";
            lastUpdated = Date.now();
          }
        }

        // 2) Otherwise scrape the exchange's fee page via Bright Data (if a key
        //    is configured and the page parses to a plausible rate).
        if (source === "published" && scrapeOn) {
          try {
            const scraped = await scrapeFee(exchange, market);
            if (scraped) {
              rate = scraped;
              source = "scraped";
              lastUpdated = Date.now();
            }
          } catch (e) {
            console.error(`Scrape failed for ${exchange} ${market}:`, e);
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
            lastUpdated,
          });
        } catch (e) {
          console.error(`Failed to upsert ${exchange} ${market}:`, e);
        }
      }
    }
    return null;
  },
});
