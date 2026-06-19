# FeeEdge — influencer outreach DMs

Handle: **@fee_edge** · Site: **https://feeedge.com**

## The deal (sent in step 2, after they reply)
1. **A unique 100%-off code** — their personal Pro access. *Cap it to 1 redemption in Stripe* so it can't be leaked to their whole audience. Name it by person, e.g. `ALICE-PRO`.
2. **A unique affiliate link** — `feeedge.com/?ref=alice` — what they share with their audience.
3. **$8 for every person who subscribes to Pro** through their link. Flat, all sizes. Tracked in `/admin` + Stripe.

**Flow:** Step 1 gauges interest only (no code/link). Send the code, link, and exact payout in Step 2, *after* they say they're interested.

---

## STEP 1 — interest DM (no code/link yet)

Keep it warm and human. Generic opener (no need to reference a specific post). The $8-per-subscription offer is stated up front; just hold the actual code/link until they reply.

**Version A:**
> Hey [Name], hope you're doing well! I've been building something I think your audience would actually find useful and wanted to run it by you.
>
> It's called FeeEdge (feeedge.com) — it shows traders the cheapest exchange for how *they* trade, comparing real fees across 20 venues (perps + spot, funding, token discounts, the lot).
>
> I'd love to give you free lifetime Pro to check it out — and if you share it, **I pay you $8 for every person who subscribes to Pro through your link.** No cap. Interested? Happy to send your code and link over.

**Version B (shorter):**
> Hey [Name]! Quick one — I built a tool (feeedge.com) that finds the cheapest crypto exchange for how you actually trade. Genuinely handy for anyone paying trading fees.
>
> I'll set you up with free Pro, and **pay you $8 for every Pro subscriber you send.** No cap. Worth a look — want your code + link?

**Version C (casual / warm):**
> Yo [Name] 👋 been working on something I think your people would dig — FeeEdge (feeedge.com), it ranks 20 exchanges by what you'd actually pay in fees for your style.
>
> Free Pro for you, and **$8 for every person who subscribes through your link** (no cap). Want me to send it over?

---

## STEP 2 — onboarding DM (after they say yes)

Now lay out exactly what's in it for them. Be clear and specific about the $8.

> Awesome, thanks [Name] 🙌 Here's the full picture:
>
> **What you get:**
> • **Free Pro, on the house** — your personal code: **ALICE-PRO**. Unlocks everything (all 20 exchanges, funding optimizer, alerts, the works).
> • **Your own link:** feeedge.com/?ref=alice — this is what you share.
> • **You earn $8 for every person who subscribes to Pro through your link.** No cap, tracked automatically, paid out monthly (PayPal or USDT, your call).
>
> **Why it's an easy share:** it genuinely saves your audience money on fees, so you're handing them something useful — not a random promo. And you get paid on top of that.
>
> Only thing I ask is you mark it as an affiliate link so it stays above board. Want me to write up a post/thread you can tweak into your own words to make it effortless?

---

## How the codes & payouts work
- **Personal comp code:** one unique 100%-off code per influencer in Stripe (Products → Coupons / Promotion codes). **Set max redemptions = 1** so a leaked code can't give the whole audience free Pro. Name them by person: `ALICE-PRO`, `CTGUY-PRO`.
- **Affiliate link:** `feeedge.com/?ref=alice` — the `ref` is captured, attached to checkout, and shows per Pro signup in `/admin` and on the Stripe payment metadata.
- **Bounty:** flat **$8 per paid Pro subscriber** via their link. Pay only on *paid* $29 sales — never on free-code redemptions.
- **Attribution:** last-touch — the most recent `?ref=` a buyer clicked wins.
- **Payouts:** monthly, small minimum (e.g. $20) so you're not sending tiny transfers.
- **Disclosure:** ask them to mark posts #ad / affiliate (FTC + builds trust).

## Targeting tips
- Prioritize accounts (any size) whose audience is **active perp/derivatives traders** — since you pay per sale, a small high-converting account beats a big passive one.
- Lead with the free comp; never open with "will you promote this."
- Follow up **once** after ~4–5 days, then drop it.
- Offer to draft the post/thread for them (less work = more yeses), but let them use their own voice.
- The bigger upside is **exchange-affiliate revenue** — a referred trader opening an account via your links can out-earn the $29 many times over.
