import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feeRates: defineTable({
    exchange: v.string(),
    market: v.string(), // "spot" or "futures"
    makerFee: v.number(),
    takerFee: v.number(),
    lastUpdated: v.number(),
    stale: v.boolean(),
  }),
});