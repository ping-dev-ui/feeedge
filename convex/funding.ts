import { query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getFundingRates = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("fundingRates"),
      _creationTime: v.number(),
      exchange: v.string(),
      rate8h: v.number(),
      lastUpdated: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("fundingRates").collect();
  },
});

export const upsertFundingRate = internalMutation({
  args: { exchange: v.string(), rate8h: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fundingRates")
      .withIndex("by_exchange", (q) => q.eq("exchange", args.exchange))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        rate8h: args.rate8h,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("fundingRates", {
        exchange: args.exchange,
        rate8h: args.rate8h,
        lastUpdated: Date.now(),
      });
    }
    return null;
  },
});

// --- Public funding-rate fetchers (BTC perp, returned as 8h decimal) --------
async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("Funding fetch failed:", url, e);
    return null;
  }
}

const FUNDING_FETCHERS: Record<string, () => Promise<number | null>> = {
  binance: async () => {
    const d = await getJson(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
    );
    const r = Number(d?.lastFundingRate);
    return isFinite(r) ? r : null;
  },
  bybit: async () => {
    const d = await getJson(
      "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT",
    );
    const r = Number(d?.result?.list?.[0]?.fundingRate);
    return isFinite(r) ? r : null;
  },
  okx: async () => {
    const d = await getJson(
      "https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP",
    );
    const r = Number(d?.data?.[0]?.fundingRate);
    return isFinite(r) ? r : null;
  },
  gateio: async () => {
    const d = await getJson(
      "https://api.gateio.ws/api/v4/futures/usdt/contracts/BTC_USDT",
    );
    const r = Number(d?.funding_rate);
    return isFinite(r) ? r : null;
  },
  bitget: async () => {
    const d = await getJson(
      "https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=BTCUSDT&productType=usdt-futures",
    );
    const r = Number(d?.data?.[0]?.fundingRate);
    return isFinite(r) ? r : null;
  },
  mexc: async () => {
    const d = await getJson(
      "https://contract.mexc.com/api/v1/contract/funding_rate/BTC_USDT",
    );
    const r = Number(d?.data?.fundingRate);
    return isFinite(r) ? r : null;
  },
};

export const fetchFundingRates = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const [exchange, fetcher] of Object.entries(FUNDING_FETCHERS)) {
      const rate = await fetcher();
      if (rate === null) continue;
      try {
        await ctx.runMutation(internal.funding.upsertFundingRate, {
          exchange,
          rate8h: rate,
        });
      } catch (e) {
        console.error(`Failed to upsert funding ${exchange}:`, e);
      }
    }
    return null;
  },
});
