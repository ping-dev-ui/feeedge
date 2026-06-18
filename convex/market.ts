import { query, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Public: latest stored BTC market stats (null until the first cron run).
export const getBtcStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      price: v.number(),
      priceChange: v.number(),
      volume: v.number(),
      marketCap: v.number(),
      lastUpdated: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("marketStats")
      .withIndex("by_asset", (q) => q.eq("asset", "btc"))
      .unique();
    if (!row) return null;
    return {
      price: row.price,
      priceChange: row.priceChange,
      volume: row.volume,
      marketCap: row.marketCap,
      lastUpdated: row.lastUpdated,
    };
  },
});

export const upsertBtcStats = internalMutation({
  args: {
    price: v.number(),
    priceChange: v.number(),
    volume: v.number(),
    marketCap: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("marketStats")
      .withIndex("by_asset", (q) => q.eq("asset", "btc"))
      .unique();
    const doc = { asset: "btc", ...args, lastUpdated: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert("marketStats", doc);
    }
    return null;
  },
});

// Fetch BTC stats from CoinGecko (server-side, once per cron — no per-user
// rate limits). Never throws so a transient API error doesn't break the cron.
export const fetchBtcStats = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h",
      );
      if (!res.ok) {
        console.error("CoinGecko fetch failed:", res.status);
        return null;
      }
      const arr = await res.json();
      const c = Array.isArray(arr) ? arr[0] : undefined;
      if (!c) return null;
      await ctx.runMutation(internal.market.upsertBtcStats, {
        price: Number(c.current_price),
        priceChange: Number(c.price_change_percentage_24h),
        volume: Number(c.total_volume),
        marketCap: Number(c.market_cap),
      });
    } catch (e) {
      console.error("fetchBtcStats error:", e);
    }
    return null;
  },
});
