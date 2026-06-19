import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getFeeRates = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("feeRates"),
      _creationTime: v.number(),
      exchange: v.string(),
      market: v.string(),
      makerFee: v.number(),
      takerFee: v.number(),
      lastUpdated: v.number(),
      stale: v.boolean(),
      source: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("feeRates").collect();
  },
});

export const upsertFeeRate = internalMutation({
  args: {
    exchange: v.string(),
    market: v.string(),
    makerFee: v.number(),
    takerFee: v.number(),
    stale: v.boolean(),
    source: v.optional(v.string()),
    // When provided, use this as the "last updated" time. Live/scraped fetches
    // pass Date.now(); curated fallbacks pass their last-verified date so the
    // card doesn't falsely claim a fresh update every cron run.
    lastUpdated: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { lastUpdated, ...rest } = args;
    const ts = lastUpdated ?? Date.now();
    const existing = await ctx.db
      .query("feeRates")
      .withIndex("by_exchange_and_market", (q) =>
        q.eq("exchange", args.exchange).eq("market", args.market),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...rest, lastUpdated: ts });
    } else {
      await ctx.db.insert("feeRates", { ...rest, lastUpdated: ts });
    }
    return null;
  },
});
