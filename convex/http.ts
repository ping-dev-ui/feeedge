import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Registers the Convex Auth HTTP routes (token exchange, OAuth callbacks, etc.).
auth.addHttpRoutes(http);

// Stripe webhook. Configure this exact URL in the Stripe dashboard:
//   https://<your-convex-deployment>.convex.site/stripe/webhook
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }
    const payload = await request.text();
    const result = await ctx.runAction(internal.stripe.handleWebhook, {
      payload,
      signature,
    });
    return new Response(null, { status: result.ok ? 200 : 400 });
  }),
});

export default http;
