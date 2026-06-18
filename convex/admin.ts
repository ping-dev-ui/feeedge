import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Private referral dashboard data. Only the signed-in user whose email matches
// the ADMIN_EMAIL env var gets data back; everyone else gets null.
export const referralStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      totalPro: v.number(),
      directPro: v.number(),
      referredPro: v.number(),
      byRef: v.array(v.object({ ref: v.string(), count: v.number() })),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!me || !adminEmail || me.email !== adminEmail) return null;

    const users = await ctx.db.query("users").collect();
    const proUsers = users.filter((u) => u.isPro);

    const counts: Record<string, number> = {};
    let directPro = 0;
    for (const u of proUsers) {
      if (u.referredBy) {
        counts[u.referredBy] = (counts[u.referredBy] ?? 0) + 1;
      } else {
        directPro += 1;
      }
    }
    const byRef = Object.entries(counts)
      .map(([ref, count]) => ({ ref, count }))
      .sort((a, b) => b.count - a.count);
    const referredPro = byRef.reduce((s, r) => s + r.count, 0);

    return { totalPro: proUsers.length, directPro, referredPro, byRef };
  },
});
