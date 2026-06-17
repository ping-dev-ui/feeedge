import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const FREE_SCENARIO_LIMIT = 1;

const scenarioObject = v.object({
  _id: v.id("scenarios"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  shareId: v.string(),
  market: v.string(),
  monthlyVolume: v.number(),
  makerRatio: v.number(),
  holdTime: v.number(),
  selectedAssets: v.array(v.string()),
});

const publicScenario = v.object({
  name: v.string(),
  market: v.string(),
  monthlyVolume: v.number(),
  makerRatio: v.number(),
  holdTime: v.number(),
  selectedAssets: v.array(v.string()),
});

export const listMine = query({
  args: {},
  returns: v.array(scenarioObject),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getByShareId = query({
  args: { shareId: v.string() },
  returns: v.union(v.null(), publicScenario),
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query("scenarios")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .unique();
    if (s === null) return null;
    return {
      name: s.name,
      market: s.market,
      monthlyVolume: s.monthlyVolume,
      makerRatio: s.makerRatio,
      holdTime: s.holdTime,
      selectedAssets: s.selectedAssets,
    };
  },
});

export const saveScenario = mutation({
  args: {
    name: v.string(),
    market: v.string(),
    monthlyVolume: v.number(),
    makerRatio: v.number(),
    holdTime: v.number(),
    selectedAssets: v.array(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to save scenarios.");

    const user = await ctx.db.get(userId);
    const isPro = user?.isPro ?? false;

    const existing = await ctx.db
      .query("scenarios")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (!isPro && existing.length >= FREE_SCENARIO_LIMIT) {
      throw new Error(
        "Free plan saves 1 scenario. Upgrade to Pro for unlimited.",
      );
    }

    const shareId =
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 6);

    await ctx.db.insert("scenarios", {
      userId,
      name: args.name,
      shareId,
      market: args.market,
      monthlyVolume: args.monthlyVolume,
      makerRatio: args.makerRatio,
      holdTime: args.holdTime,
      selectedAssets: args.selectedAssets,
    });
    return shareId;
  },
});

export const deleteScenario = mutation({
  args: { id: v.id("scenarios") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated.");
    const s = await ctx.db.get(args.id);
    if (s && s.userId === userId) {
      await ctx.db.delete(args.id);
    }
    return null;
  },
});
