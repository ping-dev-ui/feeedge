import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getFeeRates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feeRates").collect();
  },
});

export const upsertFeeRate = mutation({
  args: {
    exchange: v.string(),
    market: v.string(),
    makerFee: v.number(),
    takerFee: v.number(),
    stale: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feeRates")
      .filter((q) =>
        q.and(
          q.eq(q.field("exchange"), args.exchange),
          q.eq(q.field("market"), args.market)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("feeRates", {
        ...args,
        lastUpdated: Date.now(),
      });
    }
  },
});