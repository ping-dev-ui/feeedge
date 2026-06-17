import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const ASSET_MULT: Record<string, number> = {
  BTC: 1.0,
  ETH: 1.02,
  SOL: 1.1,
  OTHER: 1.3,
};

type Profile = {
  market: string;
  monthlyVolume: number;
  makerRatio: number;
  holdTime: number;
  selectedAssets: string[];
};

type FeeRow = { exchange: string; market: string; makerFee: number; takerFee: number };
type FundingRow = { exchange: string; rate8h: number };

function assetMultiplier(assets: string[]): number {
  if (assets.length === 0) return 1;
  return assets.reduce((s, a) => s + (ASSET_MULT[a] ?? 1), 0) / assets.length;
}

// Best (cheapest) exchange + cost for a profile, using base fee rates + funding.
function bestCost(
  feeRows: FeeRow[],
  fundingRows: FundingRow[],
  p: Profile,
): { cost: number; exchange: string } | null {
  const fees: Record<string, { maker: number; taker: number }> = {};
  for (const r of feeRows) {
    if (r.market === p.market) fees[r.exchange] = { maker: r.makerFee, taker: r.takerFee };
  }
  const funding: Record<string, number> = {};
  for (const r of fundingRows) funding[r.exchange] = r.rate8h;

  const mult = assetMultiplier(p.selectedAssets);
  let best: { cost: number; exchange: string } | null = null;
  for (const ex of Object.keys(fees)) {
    const f = fees[ex];
    let cost =
      (p.monthlyVolume * p.makerRatio * f.maker +
        p.monthlyVolume * (1 - p.makerRatio) * f.taker) *
      mult;
    if (p.market === "futures") {
      const avgOI = (p.monthlyVolume / 2) / 30 / 24 * p.holdTime;
      cost += avgOI * Math.abs(funding[ex] ?? 0.0001) * (30 * 24 / 8);
    }
    if (best === null || cost < best.cost) best = { cost, exchange: ex };
  }
  return best;
}

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("alerts"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const createAlert = mutation({
  args: {
    market: v.string(),
    monthlyVolume: v.number(),
    makerRatio: v.number(),
    holdTime: v.number(),
    selectedAssets: v.array(v.string()),
  },
  returns: v.id("alerts"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to create alerts.");
    const user = await ctx.db.get(userId);
    if (!(user?.isPro ?? false)) {
      throw new Error("Email alerts are a Pro feature. Upgrade to enable them.");
    }
    if (!user?.email) {
      throw new Error("Your account has no email address to notify.");
    }

    const feeRows = await ctx.db.query("feeRates").collect();
    const fundingRows = await ctx.db.query("fundingRates").collect();
    const best = bestCost(feeRows, fundingRows, args);
    if (!best) throw new Error("No fee data available yet — try again shortly.");

    return await ctx.db.insert("alerts", {
      userId,
      email: user.email,
      market: args.market,
      monthlyVolume: args.monthlyVolume,
      makerRatio: args.makerRatio,
      holdTime: args.holdTime,
      selectedAssets: args.selectedAssets,
      baselineCost: best.cost,
      baselineExchange: best.exchange,
      active: true,
      lastNotified: undefined,
    });
  },
});

export const deleteAlert = mutation({
  args: { id: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated.");
    const a = await ctx.db.get(args.id);
    if (a && a.userId === userId) await ctx.db.delete(args.id);
    return null;
  },
});

export const listActive = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("alerts"),
      email: v.string(),
      market: v.string(),
      monthlyVolume: v.number(),
      makerRatio: v.number(),
      holdTime: v.number(),
      selectedAssets: v.array(v.string()),
      baselineCost: v.number(),
      baselineExchange: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("alerts")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows.map((a) => ({
      _id: a._id,
      email: a.email,
      market: a.market,
      monthlyVolume: a.monthlyVolume,
      makerRatio: a.makerRatio,
      holdTime: a.holdTime,
      selectedAssets: a.selectedAssets,
      baselineCost: a.baselineCost,
      baselineExchange: a.baselineExchange,
    }));
  },
});

export const updateBaseline = internalMutation({
  args: { id: v.id("alerts"), cost: v.number(), exchange: v.string(), notified: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      baselineCost: args.cost,
      baselineExchange: args.exchange,
      ...(args.notified ? { lastNotified: Date.now() } : {}),
    });
    return null;
  },
});

export const checkAlerts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ALERTS_FROM_EMAIL ?? "FeeEdge <onboarding@resend.dev>";
    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

    const feeRows = await ctx.runQuery(api.fees.getFeeRates, {});
    const fundingRows = await ctx.runQuery(api.funding.getFundingRates, {});
    const alerts = await ctx.runQuery(internal.alerts.listActive, {});

    for (const a of alerts) {
      const best = bestCost(feeRows as any, fundingRows as any, a);
      if (!best) continue;

      // Fire when a cheaper venue appears (>2% improvement vs the baseline).
      const improved = best.cost < a.baselineCost * 0.98;
      if (improved && apiKey) {
        const saved = a.baselineCost - best.cost;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from,
              to: a.email,
              subject: `FeeEdge: ${best.exchange} is now cheaper for your profile`,
              html:
                `<p><strong>${best.exchange}</strong> is now your cheapest venue ` +
                `(${a.market}) — about <strong>$${best.cost.toFixed(0)}/mo</strong>, ` +
                `roughly $${saved.toFixed(0)}/mo less than your last best.</p>` +
                `<p><a href="${siteUrl}">Open FeeEdge</a></p>`,
            }),
          });
        } catch (e) {
          console.error("Resend send failed:", e);
        }
      }

      // Keep the baseline tracking the best seen, so we only alert on new drops.
      await ctx.runMutation(internal.alerts.updateBaseline, {
        id: a._id as Id<"alerts">,
        cost: Math.min(best.cost, a.baselineCost),
        exchange: best.cost < a.baselineCost ? best.exchange : a.baselineExchange,
        notified: improved && !!apiKey,
      });
    }
    return null;
  },
});
