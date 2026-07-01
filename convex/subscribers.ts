import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Free-user email capture (monthly "cheapest exchange right now" update).
 * Public, no auth required. Dedupes by email; re-subscribing reactivates.
 */
export const subscribe = mutation({
  args: {
    email: v.string(),
    source: v.string(),
    ref: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    // Light validation; the form also validates client-side.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      throw new Error("Invalid email");
    }
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      if (existing.unsubscribed) {
        await ctx.db.patch(existing._id, { unsubscribed: false });
      }
      return null;
    }
    const doc: {
      email: string;
      source: string;
      unsubscribed: boolean;
      ref?: string;
    } = { email, source: args.source, unsubscribed: false };
    if (args.ref) doc.ref = args.ref;
    await ctx.db.insert("subscribers", doc);
    return null;
  },
});
