# FeeEdge Visibility Expansion Plan

Built from a working session with Grok on X (the @Fee_Edge thread), then filtered
through FeeEdge's actual economics. Dated 2026-06-23.

---

## The one constraint that decides everything

Pro is $29 once, no subscription. Direct LTV from the Pro sale is about $29, so any
channel with a per customer acquisition cost above roughly $15 to $20 loses money on
the Pro sale alone. Paid ads (X, Google, Reddit) almost certainly fall on the wrong
side of that line. So the growth engine is **organic plus affiliate**, not paid.

The thing that flips the math: **exchange affiliate revenue is the real product.**
A trader who opens an exchange account through our link can return many multiples of
$29, recurring, for as long as they trade. That is what lets us pay creators $8 per
Pro signup with no cap and still come out ahead. Every channel below is judged on one
question: does it put high intent traders in front of the calculator, which then feeds
Pro plus affiliate clicks?

---

## The three channels that actually move the needle

Ranked by return on effort for a $29 one time crypto tool. These beat paid ads, broad
content marketing, cold email, and generic communities, because all of those either
lose money on $29 LTV or send low intent traffic.

### 1. The built in share loop (highest leverage, do first)

This is the single biggest lever and it is already half built. After a trader runs
their numbers, the site shows a personalized "I would save $X a year" result with one
click sharing. Right now that is a feature. We treat it as the **primary distribution
channel.** Every person who runs the calc becomes a potential billboard, at zero
marginal cost. A 5 to 10 percent share rate turns the calculator itself into the
acquisition engine. Full build spec in the next section.

### 2. Programmatic SEO on fee comparison search terms

High intent searches ("cheapest crypto exchange", "Binance vs Bybit fees", "lowest fee
perps exchange", "cheapest exchange for $1M monthly volume") convert far better than
social traffic because the searcher is already deciding where to trade. We have the one
thing no static competitor has: a live fee database plus a real all in cost engine
(fees plus funding plus tiers plus token discounts). Build once, compounds forever,
marginal cost near zero. Full build spec below.

### 3. Performance creator partnerships (already in motion)

The 20 mid tier crypto influencer DMs (free Pro plus the $8 per Pro signup affiliate
offer) are exactly the right move. Mid tier accounts (roughly 10k to 100k followers) in
the trading and perps niche convert better than mega accounts for a tool like this, and
the $8 bounty plus their own exchange affiliate upside makes the partnership self
funding. This is the human amplifier on top of the share loop. Keep it running, issue
Pro codes and affiliate links the moment anyone says yes, and track signups per creator.

---

## Build spec: the share loop (the priority project)

Stack is TanStack Start plus Convex plus Vercel, which the build below assumes.

### Reproducible share URL
A clean result route so any shared link reopens the exact same ranking on any device:

```
https://feeedge.com/r?v=1000000&m=perps&mk=0.5&h=4&a=BTC,ETH,SOL&ref=share-abc123
```

- `v` monthly volume (USD), `m` market (perps or spot), `mk` maker fraction,
  `h` avg hold hours, `a` assets, `ref` attribution code.
- New `/r` route parses params, calls a Convex query (`getFeeRanking`) that runs the
  existing fee logic, and renders the same result UI as the main calculator.
- Params live in the URL (not session) so the result is reproducible from any browser.

### Dynamic OG image per result
So the link unfurls as a rich card on X and Telegram showing the actual savings number:

- Use `@vercel/og` (good fit on Vercel). Add an OG route (e.g. `/api/og`) that takes the
  same params plus a precomputed `savings` and `top` exchange and renders a 1200x630
  card: giant green savings number, "switching to {exchange}", and the inputs in a
  footer, FeeEdge branding.
- On the result page `<head>`, set `og:image` to that endpoint with the matching params
  and `twitter:card = summary_large_image`.
- Note: this is a different OG image from the homepage card. Keep the static homepage
  og.png as is; the per result card is generated on demand.

### Pre filled share text (per platform, no dashes)
- X: "I would save ~$5,304/yr on crypto fees with my exact trading style. Most active
  traders bleed this without knowing. Check yours free: {shareUrl}"
- Telegram: "I would save ~$5,304/yr switching to {topExchange} for how I trade. Run
  your numbers: {shareUrl}"
- Reddit / neutral: "Traders at my volume are leaving $5,304/yr on the table. Found a
  free tool that ranks 20 exchanges by real cost (fees plus funding). My result: {link}"
- Every shared URL carries `?ref=share-xxxx&utm_source=share&utm_medium=social&utm_campaign=feeedge_viral`.

### Result page UX that drives the share
- Lead with the giant savings number and the top exchange. Subtitle with their exact
  inputs so it feels personal.
- "Share my savings" as the primary button, not buried.
- One click buttons for X, Telegram, Reddit, WhatsApp.
- Social proof on the page: "X traders checked their fees this week" and an optional
  "top savers this month" list (pseudonymous). FOMO is the nudge.
- No login wall for sharing. Mobile first (most traders are on a phone).

### Attribution: share to Pro conversion (no cookies)
- On share click, mint a short `ref` code (`share-${nanoid(8)}`), optionally as a Convex
  record in a `shares` table.
- On the Pro signup mutation, capture the `ref` from the URL and store
  `referredByShare` on the user/conversion record.
- Report: count Pro conversions where `referredByShare` starts with `share-`, and watch
  affiliate clicks per shared result. Target share rate above 5 to 10 percent of calc
  users.

### Edie amplification layer
- Edie reposts real user shares daily ("another trader saving $X, run yours").
- Edie replies to large trading accounts with a personalized calc link when fees come up.
- The existing UGC video gets paired with "try the calc that generated this".

---

## Build spec: programmatic SEO

Generate hundreds of pages from the fee database, all transactional/comparison intent.

### Keyword map (cluster around the 20 exchanges)
- Head terms: "cheapest crypto exchange", "lowest fee perps exchange 2026".
- Long tail patterns: "{A} vs {B} fees", "Binance vs Bybit fees for scalpers",
  "cheapest exchange for $100k/$1M monthly volume perps/spot", "maker vs taker impact
  on {style}". Start with low competition long tails that signal a switch decision.

### Page template (the unfair advantage is the live data)
- H1 is the exact keyword ("Binance vs Bybit Fees 2026: Which Is Cheaper for Your Volume?").
- Dynamic, DB driven sections: side by side maker/taker plus funding plus total all in
  cost table, with adjustable volume/style inputs.
- An embedded mini calculator and a "your personalized savings" box that links to the
  full tool (this is where SEO traffic enters the share loop).
- Methodology note plus a "last updated" timestamp; refresh from the existing fee
  pipeline so pages stay fresh automatically.
- Affiliate CTA on the winning exchange.

### Scale and technical
- Start with 200 to 500 high potential combinations, static generated from the fee data
  and regenerated when fees update.
- Schema markup (comparison plus FAQ), clean URLs (`/binance-vs-bybit-fees`), canonicals,
  XML sitemap, fast mobile load.
- Internal linking: a hub page ("Crypto Exchange Fees Comparison 2026") links to every
  comparison page; the main calculator is the pillar everything points to.
- Measure organic clicks to calc sessions to Pro to affiliate revenue per cluster, and
  double down on the comparison pairs that win.

---

## Distribution: Reddit and Telegram without getting banned

Core rule: value first, link second. Never drop affiliate links cold. Lead with a
screenshot of a real result and a question. Build karma before you post.

### Reddit
- Target subs: r/CryptoMarkets (best for fee and strategy talk), r/Daytrading,
  r/algotradingcrypto, r/BitcoinMarkets, and r/CryptoCurrency (only inside the Daily
  Discussion thread, strict anti promo rules).
- Formats that get upvoted: "Tool Tuesday/Software Sunday" style ("Built a free tool
  that shows exact fee savings for your volume, here is my $1M/month perps result"),
  value first comparisons ("Bybit vs Binance vs Hyperliquid real all in cost for a
  $500k/month scalper including funding"), and "ran the numbers and was shocked" hooks.
  Screenshot in the post, link in the comments.
- Cadence: 1 to 2 posts per week per sub, rotate subs, post in daily threads first,
  spend 30 to 60 minutes a day replying for goodwill, never cross post the same content
  the same day.

### Telegram
- Target active trading discussion groups and perps/futures trader groups; avoid pure
  signals/pump channels (they ban promo fast).
- Formats: screenshot of a big savings result with a short caption, quick tips
  ("funding often costs more than the trade fee on perps"), and value replies in
  existing threads with a soft link when relevant.
- Cadence: 3 to 5 value contributions per week across 4 to 6 groups, max 1 original
  post per day, engage in 5 to 10 other messages first. Use the share buttons from the
  result page (pre filled text already loaded).

---

## Sequencing (what to do, in order)

1. **This week:** Ship the share loop (URL route, OG image, pre filled text,
   attribution). It powers every other channel. In parallel, keep the X cadence and the
   creator DMs running, and start Edie reposting real results.
2. **Next 2 to 4 weeks:** Stand up the first 50 to 200 programmatic SEO pages from the
   fee DB, hub page plus the highest intent comparison pairs first.
3. **Ongoing:** Reddit and Telegram distribution at the safe cadence above, seeded with
   share loop screenshots. Layer the UGC video where video is allowed.
4. **Always:** Issue Pro codes plus affiliate links the moment a creator says yes, and
   keep the single tracking sheet: channel, date, post type, engagement, signups
   attributed.

## What we are deliberately not doing
Paid ads (negative on $29 LTV), broad top of funnel content, cold email lists, and
generic non trading communities. Everything funnels back to the calculator, then Pro,
then affiliate revenue.

## The one number to watch
Share rate of calculator users. If that climbs past 5 to 10 percent, the product
distributes itself and the other channels just pour fuel on it.
