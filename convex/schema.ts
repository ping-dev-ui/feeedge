import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables (users, authSessions, authAccounts, etc.).
  ...authTables,

  // Override the auth `users` table to add subscription/Pro fields.
  // NOTE: must keep all of the original auth user fields below.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom subscription fields:
    isPro: v.optional(v.boolean()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_stripeCustomerId", ["stripeCustomerId"]),

  feeRates: defineTable({
    exchange: v.string(),
    market: v.string(), // "spot" or "futures"
    makerFee: v.number(),
    takerFee: v.number(),
    lastUpdated: v.number(),
    stale: v.boolean(),
  }),
});
