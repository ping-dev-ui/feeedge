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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feeRates")
      .withIndex("by_exchange_and_market", (q) =>
        q.eq("exchange", args.exchange).eq("market", args.market),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, lastUpdated: Date.now() });
    } else {
      await ctx.db.insert("feeRates", { ...args, lastUpdated: Date.now() });
    }
    return null;
  },
});
