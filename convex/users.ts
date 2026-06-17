import { query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Public: the currently signed-in user's Pro status (null if signed out).
export const viewer = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      isPro: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    return { _id: user._id, email: user.email, isPro: user.isPro ?? false };
  },
});

// Internal: used by the Stripe action to read customer linkage.
export const getById = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user === null) return null;
    return {
      _id: user._id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    };
  },
});

export const setStripeCustomerId = internalMutation({
  args: { userId: v.id("users"), stripeCustomerId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { stripeCustomerId: args.stripeCustomerId });
    return null;
  },
});

export const setProByUserId = internalMutation({
  args: {
    userId: v.id("users"),
    isPro: v.boolean(),
    stripeSubscriptionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isPro: args.isPro,
      ...(args.stripeSubscriptionId
        ? { stripeSubscriptionId: args.stripeSubscriptionId }
        : {}),
    });
    return null;
  },
});

export const setProByCustomerId = internalMutation({
  args: { stripeCustomerId: v.string(), isPro: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .unique();
    if (user === null) return null;
    await ctx.db.patch(user._id, { isPro: args.isPro });
    return null;
  },
});
