import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isPro: v.optional(v.boolean()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  feeRates: defineTable({
    exchange: v.string(),
    market: v.string(),
    makerFee: v.number(),
    takerFee: v.number(),
    lastUpdated: v.number(),
    stale: v.boolean(),
    source: v.optional(v.string()),
  }).index("by_exchange_and_market", ["exchange", "market"]),

  fundingRates: defineTable({
    exchange: v.string(),
    rate8h: v.number(),
    lastUpdated: v.number(),
  }).index("by_exchange", ["exchange"]),

  scenarios: defineTable({
    userId: v.id("users"),
    name: v.string(),
    shareId: v.string(),
    market: v.string(),
    monthlyVolume: v.number(),
    makerRatio: v.number(),
    holdTime: v.number(),
    selectedAssets: v.array(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_shareId", ["shareId"]),

  // Email alerts: notify when a cheaper exchange appears for a saved profile.
  alerts: defineTable({
    userId: v.id("users"),
    email: v.string(),
    market: v.string(),
    monthlyVolume: v.number(),
    makerRatio: v.number(),
    holdTime: v.number(),
    selectedAssets: v.array(v.string()),
    baselineCost: v.number(),
    baselineExchange: v.string(),
    active: v.boolean(),
    lastNotified: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["active"]),
});
