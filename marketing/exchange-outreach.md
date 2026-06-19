# Exchange outreach — affiliates & data

Goal: turn high-intent traffic into affiliate revenue, and get authoritative fee
data. Two parts: an outreach email template, and a checklist of the exchanges
you don't yet have a referral link for.

---

## A. Outreach email (to affiliate / BD / partnerships)

**Subject:** Partnership — FeeEdge sends high-intent traders to [Exchange]

**Body:**
> Hi [name / "the [Exchange] partnerships team"],
>
> I'm Miguel, founder of **FeeEdge** (https://feeedge.com) — a tool that ranks 20
> major crypto exchanges by the real trading fees a user would pay, based on
> their volume, maker/taker style and the market they trade. We just launched on
> Product Hunt and are seeing strong early traffic.
>
> The users we send are unusually high-intent: they're actively comparing venues
> and deciding where to open an account or move volume — [Exchange] already ranks
> well for several trader profiles on FeeEdge.
>
> Two quick things I'd love to explore:
> 1. **Affiliate partnership** — I'd like to join your affiliate/partner program
>    (or discuss a managed rate) so we can route sign-ups to [Exchange] and share
>    in the trading-fee revenue we help generate.
> 2. **Fee data** — do you offer an official fee schedule or partner API? We want
>    [Exchange]'s rates to always be exact and current on our site.
>
> Worth a 15-minute call, or can you point me to the right person/program? Happy
> to share traffic and conversion numbers.
>
> Thanks,
> Miguel — FeeEdge
> https://feeedge.com · @fee_edge · support@feeedge.com

**Notes**
- Keep it short; swap `[Exchange]` and personalise the one ranking line.
- Lead with *their* benefit (high-intent sign-ups), not your need.
- Mention you rank **independently** — it builds trust and pre-empts "do you just promote whoever pays most?".
- Send from support@feeedge.com (or a founder@ alias) for legitimacy.

---

## B. Affiliate-program checklist

**Already have referral links (6):** Binance, Bybit, Hyperliquid, OKX, Gate.io, MEXC.
→ Consider asking these for a *higher managed rate* now that you have traffic.

**Missing — sign up / contact (14):**

| Exchange | Where to find the program | Notes |
|---|---|---|
| Bitget | "Bitget Affiliate / Partner program" | Active, generous; apply online |
| KuCoin | "KuCoin Affiliate program" | Public program, easy signup |
| Kraken | "Kraken Affiliate" | Often via a network; geo/KYC rules stricter |
| HTX | "HTX Affiliate / Partner" | Public program |
| BingX | "BingX Affiliate / Partner" | Public; you already link the futures fee page |
| Coinbase | "Coinbase Affiliate" (runs via Impact network) | US-leaning; apply through Impact |
| Crypto.com | "Crypto.com Affiliate program" | Apply online |
| Bitfinex | "Bitfinex Affiliate program" | Established referral program |
| WhiteBIT | "WhiteBIT referral / ambassador" | Referral + partner tiers |
| Phemex | "Phemex Affiliate program" | Public |
| BitMEX | "BitMEX Affiliate program" | Public |
| Backpack | "Backpack referral program" | Newer; referral codes |
| BitMart | "BitMart Affiliate / Partner" | Public |
| CoinEx | "CoinEx Affiliate / Broker program" | Public |

> ⚠️ Affiliate URLs and terms change often and some are geo-restricted — confirm
> the official program page on each exchange (search "[exchange] affiliate" and
> verify it's the real domain) before signing up. Don't commit personal/banking
> details to anything that isn't clearly official.

### Contacts (verified June 2026 — re-confirm before sending)

**Direct emails found:**
- KuCoin — `affiliate@kucoin.com` (apply: kucoin.com/affiliate-apply)
- Phemex — `bd@phemex.com` ("Collaborator Program")
- BingX — `bd@bingx.com` (apply: bingx.com/global-partner)
- BitMEX — `affiliates@bitmex.com` (bitmex.com/affiliates)
- CoinEx — `bd@coinex.com` (business) / `vip@coinex.com` (broker/key-account)

**Apply by form (no public email — the form is the main route):**
- Bitget — bitget.com/affiliates (reviewed ~1 business day)
- Kraken — kraken.com/affiliate/apply (a contact email is shown on the affiliate page once you're in)
- HTX — htx.com/affiliate-to-list (contact email listed on the affiliate page)
- Coinbase — crypto via the **Impact** network, form at crypto.com-style link… (Coinbase: apply through Impact)
- Crypto.com — crypto.com/en/affiliate (runs on the **Impact** platform)
- Bitfinex — affiliate.bitfinex.com (support/dashboard; also Telegram)
- WhiteBIT — whitebit.com/affiliate/overview (retail) + institutional.whitebit.com/partner-program (B2B)
- BitMart — bitmart.com/en-US/affiliate (contact email shown on the affiliate page)
- Backpack — in-app referral program; no public affiliate email found — reach out via their support/X to ask about a partner rate

> Some results masked the exact address (shown as a generic affiliate@ on the
> program page). Where only a form exists, apply there first; a manager email
> usually follows on approval. Verify every address/domain before sending.

**How to add a new link once approved:** drop it into `REFERRAL_LINKS` in
`src/routes/index.tsx` and the `referral` field in `src/data/exchanges.ts`
(keyed by slug), then push. The "Open account" buttons + comparison/exchange
pages will start showing it automatically.

---

## C. The rule (don't break this)
Rank **only** by real cost. Affiliate links are disclosed and never influence
ordering. Independence is the whole product — protect it.
