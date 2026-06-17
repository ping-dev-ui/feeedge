"use node";

import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Called from the frontend "Upgrade to Pro" button. Requires the user to be
// signed in. Creates (or reuses) a Stripe customer, opens a one-time-payment
// Checkout Session for the configured price, and returns the hosted Checkout
// URL to redirect to.
export const createCheckoutSession = action({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("You must be signed in to upgrade.");
    }
    const user = await ctx.runQuery(internal.users.getById, { userId });
    if (user === null) {
      throw new Error("User not found.");
    }

    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await ctx.runMutation(internal.users.setStripeCustomerId, {
        userId,
        stripeCustomerId: customerId,
      });
    }

    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: requireEnv("STRIPE_PRICE_ID"), quantity: 1 }],
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }
    return session.url;
  },
});

// Invoked by the HTTP webhook route. Verifies the Stripe signature, then grants
// Pro on a completed one-time payment. Returns ok:false on a bad signature so
// the HTTP route can respond 400.
export const handleWebhook = internalAction({
  args: { payload: v.string(), signature: v.string() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        args.payload,
        args.signature,
        requireEnv("STRIPE_WEBHOOK_SECRET"),
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return { ok: false };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Only grant access once the payment is actually collected.
      if (session.payment_status === "paid" && session.client_reference_id) {
        await ctx.runMutation(internal.users.setProByUserId, {
          userId: session.client_reference_id as Id<"users">,
          isPro: true,
        });
      }
    }

    return { ok: true };
  },
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
