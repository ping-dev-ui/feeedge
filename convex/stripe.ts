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
  args: { ref: v.optional(v.string()) },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
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
      // Influencer/referral attribution: shows on the Payment in Stripe and is
      // read by the webhook to persist who drove the purchase.
      metadata: { userId, ref: args.ref ? args.ref.slice(0, 64) : "" },
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
      // Grant access once the checkout is settled. "paid" = money collected;
      // "no_payment_required" = total was $0 (e.g. a 100%-off comp code).
      const settled =
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required";
      if (settled && session.client_reference_id) {
        const userId = session.client_reference_id as Id<"users">;
        const user = await ctx.runQuery(internal.users.getById, { userId });
        // Only act on the first upgrade so Stripe retries don't re-send email.
        if (user && !user.isPro) {
          await ctx.runMutation(internal.users.setProByUserId, {
            userId,
            isPro: true,
          });
          const ref = session.metadata?.ref;
          if (ref) {
            await ctx.runMutation(internal.users.setReferredBy, { userId, ref });
          }
          const email = user.email ?? session.customer_details?.email ?? undefined;
          if (email) {
            await sendWelcomeEmail(email);
          }
        }
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

// Best-effort "Welcome to Pro" email via Resend. Never throws — a failed email
// must not fail the webhook (or Stripe will keep retrying it).
async function sendWelcomeEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.ALERTS_FROM_EMAIL ?? "FeeEdge <onboarding@resend.dev>";
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Welcome to FeeEdge Pro 🎉",
        html:
          `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6">` +
          `<h2 style="margin:0 0 8px">You're now FeeEdge Pro</h2>` +
          `<p>Thanks for upgrading! Your account is unlocked. You now have:</p>` +
          `<ul>` +
          `<li>All 20 exchanges in the comparison (no more locked rows)</li>` +
          `<li>Funding-cost estimates on perps</li>` +
          `<li>Unlimited saved scenarios &amp; email price alerts</li>` +
          `</ul>` +
          `<p><a href="${siteUrl}" style="display:inline-block;background:#10b981;color:#000;font-weight:bold;padding:10px 18px;border-radius:6px;text-decoration:none">Open FeeEdge</a></p>` +
          `<p style="color:#888;font-size:12px;margin-top:24px">FeeEdge Analytics — estimates only, not financial advice.</p>` +
          `</div>`,
      }),
    });
  } catch (e) {
    console.error("Welcome email failed:", e);
  }
}
