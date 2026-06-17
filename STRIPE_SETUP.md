# Stripe + Auth setup (FeeEdge)

This wires a real, secure paywall: Convex Auth (email/password) → Stripe Checkout
→ Stripe webhook → per-user `isPro` flag in Convex. The "Upgrade to Pro" /
"Unlock All" buttons now require sign-in and start a real Checkout session.

Do these steps in order. Items marked **(secret)** are values only you should enter —
never share your Stripe secret key.

## 1. Install dependencies
```
npm install
```
(adds the `stripe` package)

## 2. Provision Convex Auth keys
From the project root:
```
npx @convex-dev/auth
```
This generates the JWT signing keys and sets `JWT_PRIVATE_KEY`, `JWKS`, and
`SITE_URL` in your Convex deployment. When it asks for your site URL, use your
production URL: `https://feeedge.vercel.app`.

## 3. Set Stripe environment variables in Convex
Either in the Convex dashboard (Settings → Environment Variables) or via CLI:
```
npx convex env set STRIPE_SECRET_KEY sk_live_...        # (secret)
npx convex env set STRIPE_PRICE_ID price_...            # your $29 product's price ID
npx convex env set SITE_URL https://feeedge.vercel.app  # used for checkout redirects
# STRIPE_WEBHOOK_SECRET is set in step 5 after you create the webhook
```

## 4. Deploy Convex (functions + schema + HTTP routes) and regenerate the API
```
npx convex dev      # for local testing, OR
npx convex deploy   # to push to your production Convex deployment
```
IMPORTANT: this regenerates `convex/_generated/`. You MUST commit those
regenerated files — otherwise the Vercel build's `tsc` step will fail because
`api.users`, `api.stripe`, etc. won't exist yet.

## 5. Create the Stripe webhook
In the Stripe dashboard → Developers → Webhooks → Add endpoint:
- Endpoint URL: `https://<your-convex-deployment>.convex.site/stripe/webhook`
  (find the exact `.convex.site` host in your Convex dashboard / `convex deploy` output)
- Events to send:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
Copy the endpoint's **Signing secret** (`whsec_...`) and set it:
```
npx convex env set STRIPE_WEBHOOK_SECRET whsec_...      # (secret)
```

## 6. Deploy the frontend
Commit everything (including regenerated `convex/_generated/`) and push to
`master`; Vercel rebuilds automatically.

## 7. End-to-end test
1. Open the site, click "Sign in", create an account.
2. Click "Upgrade to Pro" → you should land on Stripe Checkout.
3. Pay with a Stripe test card (e.g. 4242 4242 4242 4242) if using test mode.
4. On return, the webhook flips `isPro = true`; the page shows "PRO ACTIVE"
   and unlocks all 5 exchanges + the Funding column.

## Notes / things to verify
- This uses Stripe `subscription` mode. If your $29 price is one-time, change
  `mode: 'subscription'` to `mode: 'payment'` in `convex/stripe.ts` (and drop
  the subscription.* webhook handlers).
- Auth runs client-side; the first server render shows the signed-out view and
  hydrates. If you see an SSR error referencing storage/window from
  `ConvexAuthProvider`, tell me and I'll make the provider client-only.
- To add Google/GitHub login later, add providers in `convex/auth.ts` — the
  Stripe code keys off the authenticated user id and won't need changes.
