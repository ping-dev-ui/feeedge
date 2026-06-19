# Build Playbook & Lessons Learned

A portable reference distilled from building **FeeEdge** (TanStack Start SSR + Convex + Stripe + Vercel, DNS on Vercel, Resend email). Drop the relevant parts into other projects' `CLAUDE.md`.

---

## 1. Deploy pipeline (TanStack Start + Convex + Vercel) — the big time-sinks

- **The build runs `vite build && tsc --noEmit && node scripts/build-vercel.mjs`.** `vite build` does NOT type-check; the separate **`tsc --noEmit` step fails the build on any type error.** A green local app can still fail the Vercel build on a pure type error.
- **Adding a Convex function? You MUST commit `convex/_generated`.** When you add `convex/foo.ts`, the `api.foo` type only exists after `npx convex deploy` (or `convex codegen`) regenerates `convex/_generated/api.d.ts`. If you don't **commit** that regenerated folder, Vercel's `tsc` can't find `api.foo` and **every deploy silently fails** (last good deploy stays live, so it looks like "nothing deployed"). This cost ~1 hour here.
  - Fix sequence: `npx convex deploy` → `git add convex` (includes `_generated`) → commit → push.
- **Don't paper over missing generated types with `(api as any)`.** It "fixes" one error but broke `useSuspenseQuery` typing (the `skipToken` / `UseSuspenseQueryOptions` mismatch). Commit the real generated types instead.
- **`React.CSSProperties` without importing React fails `tsc`** under the modern JSX transform. Use `import type { CSSProperties } from 'react'`.
- **Read the actual Vercel build log before guessing.** Every blind fix masked the real error. Open the *newest* deployment (not an older one), Build Logs, search `error TS`. Driving the Vercel dashboard in-browser to read the log was the unlock.
- **New routes/pages need the route tree regenerated** — TanStack's vite plugin does this on build, so new `src/routes/*` files work on Vercel even though the local sandbox `routeTree.gen.ts` is stale. Those stale-tree `tsc` errors locally are false positives; the real errors are the non-route ones.

## 2. Git on a synced/sandbox filesystem

- **The bash mount can diverge or truncate vs the host files.** `tsc`/`wc`/`grep` in bash sometimes saw a chopped copy of a file the host had complete. **Trust the file tools (Read) for host truth, not bash**, when verifying file contents.
- **Recurring lock files** (`.git/index.lock`, `.git/HEAD.lock`) block commits. Clear first: `Remove-Item .git\index.lock,.git\HEAD.lock -ErrorAction SilentlyContinue`.
- **The sandbox can't push** (no GitHub auth) — the user pushes from their own terminal. Commits made in the sandbox do reach the shared repo, but pushing is theirs.
- **PowerShell gotchas:**
  - `npx`/`npm` `.ps1` blocked by execution policy → use **`npx.cmd` / `npm.cmd`**.
  - `$` in filenames (e.g. TanStack `$pair.tsx`) gets variable-expanded → **single-quote** the path or `git add <directory>`.
  - `<` `>` are redirection operators; avoid in pasted commands.

## 3. DNS, email, domains

- **Resend only SENDS email; it cannot receive.** A verified Resend domain does NOT give you an inbox. For `support@` etc., set up **receiving separately** (MX records → a forwarder like **ImprovMX** free, or a mailbox like Zoho/Google Workspace).
- **Check where DNS actually lives first.** Use DNS-over-HTTPS since the sandbox can't do UDP DNS: `https://dns.google/resolve?name=DOMAIN&type=NS` (also `&type=MX`, `&type=TXT`). FeeEdge's NS were `ns1/ns2.vercel-dns.com` (Vercel), not Cloudflare — so **Cloudflare Email Routing couldn't be enabled** ("zone must be active" requires NS pointed at Cloudflare). Don't move nameservers just for email; add records where DNS already lives.
- **Multiple TXT records coexist on the apex** (e.g. SPF + `google-site-verification`). Adding one doesn't remove others.
- **Verification & propagation:** add the record, then confirm via DoH before clicking "Verify". Vercel DNS TTL ~60s propagates fast.

## 4. Third-party APIs: server IP vs browser IP (counterintuitive!)

- **CoinGecko blocks datacenter/cloud IPs** (Convex/AWS, often Vercel) but **serves browsers fine** (residential IPs). So "move it server-side for reliability" BACKFIRED — the cron got 429/403, while the original client-side fetch worked. Decide per-API whether server or client is more reliable.
- **Binance public APIs are geo-blocked (e.g. US)** and flaky from browsers via CORS — caused the original "—" stats. CoinGecko (browser) was the working path.
- **Ad-blockers / Brave Shields block `api.coingecko.com`** (crypto/tracker lists), blanking client-side widgets even when the API works. Bulletproof fix when needed: **same-origin proxy** (`/api/...` on your own domain) so blockers can't touch it (only if your server IP can reach the upstream).
- **Always hard-refresh (Ctrl+Shift+R) / test in Incognito** before believing a client-side feature is broken — stale JS bundles and extensions cause phantom bugs.
- **CoinCap (`api.coincap.io`) is CORS-blocked from the browser** — not a usable client fallback.

## 5. Browser automation (Claude in Chrome)

- **Blocked for automation:** Stripe dashboard (financial). **Not blocked:** Vercel, Convex dashboard, Google Search Console, Google account pages.
- **Use `javascript_tool` to read exact values from the DOM** (e.g. a full verification token that's visually truncated) instead of fighting screenshots/copy buttons.
- **Screenshots can time out on heavy pages** (Vercel) — fall back to `get_page_text`.
- Reading build logs / running a fetch from the live page's console is far faster than guessing.

## 6. Stripe

- **402 on a live checkout = a test card (4242…) used in live mode.** Not a bug.
- **Grant access on `payment_status === 'paid' OR 'no_payment_required'`** — the latter is how 100%-off comp codes settle.
- **Personal comp codes: cap redemptions to 1** so a leaked code can't give your whole audience free product.
- Put **Terms + Refund URLs** in Stripe public business settings; webhook signature via `constructEventAsync`.

## 7. Convex specifics

- New function syntax with **`args` + `returns` validators** always; `returns: v.null()` for void.
- **No `ctx.db` in actions** — use `ctx.runQuery/runMutation`. Pass **function references** (`internal.x.y`), never the function itself.
- **No `.filter()` on queries** — define an index and use `.withIndex()`.
- **Crons:** `crons.interval(...)`; a cron that fails (e.g. blocked upstream) logs errors every run — remove it if unused.
- Convex queries are **live/reactive** — frontend updates automatically when data changes (nice, but means a stale source = stale UI).

## 8. Product / growth patterns (for a low-priced one-time product)

- **$29 one-time ⇒ LTV ~$29 ⇒ paid ads lose money.** Engine = SEO + community + word-of-mouth + **affiliate revenue** (exchanges pay recurring % — dwarfs the $29).
- **Affiliate attribution:** capture `?ref=` → localStorage → Stripe Checkout `metadata` → persist on the user (e.g. `referredBy`). A private `/admin` page (gated by email via env var) tallies it.
- **Influencer outreach:** gauge interest first, THEN send a **unique personal comp code + a `?ref=` link + a flat bounty per paid signup**. State the bounty up front; pay only on *paid* sales.
- **Programmatic SEO:** one shared data module → dynamic routes (e.g. 36 comparison pairs) + cornerstone pages, all SSR'd, plus `sitemap.xml` + `robots.txt`, submitted via Search Console (domain property verified by DNS TXT).
- **Legal basics for taking payments:** Terms, Privacy, Refund pages + footer links + a sign-up consent line. A 14-day money-back refund policy is friendlier and satisfies EU/UK withdrawal rights.

## 9. General working style that paid off

- When a deploy "doesn't show up," it's usually a **failed build, not a slow one** — get the real error.
- Verify the live result yourself (fetch the page / drive the browser) instead of assuming a push worked.
- Keep changes shippable in small commits; the footer/links are a cheap "did this build actually deploy?" signal.

---

# Part 2 — Learnings from the v2 expansion (20 exchanges, scraping, sharing, ops)

## 10. Scraping exchange data — what actually works
- **Web Unlocker (Bright Data) returns the server HTML, NOT JS-rendered content.** For SPA fee pages (Bitget, Coinbase, etc.) it returned only nav/footer chrome — no fee numbers. It only works on **server-rendered pages** (e.g. BingX's support-article fee page parsed cleanly). Rendering JS needs the **Browser API** (separate, *paid*, not in free credits).
- **Free tier is plenty for low-volume fee refresh:** ~5,000 Unlocker requests/month free, no card needed *to use the API* — but **creating a Web Unlocker zone prompted for a card** anyway (no charge within free credits; hard-stop instead of overage). Rate was $1.50/CPM, so ~900 req/mo ≈ $0.
- **Never auto-trust a generic parser.** A heuristic "find maker%/taker%" parser grabbed arbitrary page numbers and shipped a *wrong-but-plausible* rate (BitMart 0.04/0.25 for both markets). Fix: **only scrape when a VERIFIED per-exchange parser exists**; skip otherwise (also saves credits). Build parsers against the *real* returned text via a debug action.
- **Build a `debugUnlock` action** (returns the stripped page text Convex actually receives) so you write parsers against ground truth, not guesses. Verify each scraped value equals the known curated value before enabling.
- **Honest data > live data.** Keep accurate **curated** rates with a visible "verified {date}" and only advance the timestamp on a *real* fetch (API/scrape). Don't stamp "updated now" on a value that didn't actually refresh — store an explicit `lastUpdated` per record (API/scrape → now; curated → fixed verified date).
- **Fee schedules change ~yearly, not daily.** A monthly **scheduled re-verification task** (Claude re-checks via web search, updates changed values, bumps the verified date) is the realistic maintenance model — cheaper and more reliable than fragile daily scraping.

## 11. Cron / data pipeline (Convex)
- Cron cadence lives in `crons.ts` (`crons.interval`). Verify it's actually registered + succeeding in **Dashboard → Schedules → Cron Jobs** (shows last run + next run).
- `upsertFeeRate` takes an **optional explicit `lastUpdated`** so curated rows keep their verified date across runs instead of faking freshness.
- The calculator overlays live/scraped/curated `feeRates` onto its base tier only when `tier.volume === 0`. Keep the three data sources (calculator `EXCHANGES`, SEO `exchanges.ts`, fetcher `PUBLISHED`) **in sync** — a shared dataset would be better; until then, edit all three together.

## 12. Convex dashboard automation is flaky in-browser
- The Convex dashboard SPA frequently **hung on its loading spinner and froze `screenshot`** under remote control; clicks landed on stale elements. `find` returned cached refs that didn't match the visible (still-loading) page.
- Workarounds that worked: navigate directly to deep URLs, use **`find` + ref clicks** for the Run-functions panel, read results with **`javascript_tool`** instead of screenshots, and **build the funnel/insight via a URL hash query** (PostHog) instead of clicking through the UI.
- When the dashboard won't cooperate, **hand the 3-click action to the user** (it works fine for them) and have them paste the output — far faster than fighting the frozen UI.
- **Env vars are per-deployment.** A key added to the **Development** deployment is NOT on **Production** (the live site + crons run on Production). Always confirm which deployment the var landed on.

## 13. Web share / clipboard (cost real time)
- **`navigator.share` exists on desktop Chrome but is flaky/confusing** — it can "resolve" without actually sharing, so a share-first handler feels like it does nothing. **Use the native share sheet only on touch devices** (`matchMedia('(pointer: coarse)')`); on desktop, **copy the link** with clear feedback.
- **Never swallow errors silently on user-facing actions.** The original `catch {}` (with no clipboard fallback when `navigator.share` threw) is exactly why the share button silently failed and went unnoticed — it "worked" wherever it was first tested (mobile). Build a **fallback chain**: share (touch) → `clipboard.writeText` → legacy `execCommand('copy')` → `prompt()`, so something always happens + visible feedback.
- **Automation is a poor oracle for clipboard.** Programmatic clicks lack genuine user-activation, so `clipboard.writeText`/`readText` reject or trigger a permission prompt that **freezes the page** (froze `javascript_tool` twice). A "didn't work" in automation can be a false negative — confirm with the real user + a hard refresh.
- **Verify the fix is actually live, not cached.** Scan loaded JS via `performance.getEntriesByType('resource')` + fetch each chunk for a **unique marker string** from the new code. The route chunk is a dynamic import, so it won't be in `<script src>` tags.
- **Social share intents that work via URL:** X (`twitter.com/intent/tweet`), WhatsApp (`wa.me/?text=`), Telegram (`t.me/share/url`), Reddit (`reddit.com/submit`), Facebook (`facebook.com/sharer`), Email (`mailto:`). **Instagram has NO web share intent** — can't pre-fill a post/story/DM from a link; the only path is "copy link, paste manually."
- **Brand icons:** lucide dropped most brand glyphs — use **inline brand SVG paths** for X/WhatsApp/Telegram/Reddit/Facebook; keep `Mail` from lucide.

## 14. SEO depth (what was added in v2)
- **Schema markup is cheap, high-value:** `Organization` + `WebSite` + `SoftwareApplication`(+`Offer` price) sitewide; `FAQPage` (with matching visible Q&A) on cornerstone pages; `Article` on guides + the report; `BreadcrumbList` + `FAQPage` on comparison/exchange pages. Render JSON-LD via a tiny SSR `<JsonLd>` component (`dangerouslySetInnerHTML` of `JSON.stringify`).
- **Data is link-bait.** A "State of {industry} {year}" **report page** computed from your own dataset is the kind of thing people cite/link to — it doubles as content *and* the backlink engine (the real off-page lever on-page work can't replace).
- **`llms.txt`** in `/public` (key facts + page links) for AI-search visibility (ChatGPT/Perplexity/Google AI) — a growing traffic source for comparison queries.
- **Freshness signal:** show "Updated {month year}" on price/fee pages (a shared `DATA_UPDATED` constant) — ranking factor for this content type; bump it alongside the data.
- **Per-page OG images** lift social CTR; generate branded ones with Pillow (see §16). Watch for **unused-import `tsc` errors** when scaffolding many pages fast (an unused `Link` import failed one build).
- **Resubmit the sitemap after big additions** — Google may not re-read it for a while; in GSC use the **full URL** for a domain property (`https://domain/sitemap.xml`, not `sitemap.xml`). The per-URL "Request indexing" bar is flaky to automate; sitemap resubmit covers discovery reliably.

## 15. Affiliate / partnership outreach (monetization)
- For a low-priced one-time product, **affiliate revenue from the things you compare** dwarfs the product price and scales with traffic. Prioritize it.
- **Lead with their benefit** (high-intent users actively choosing where to trade), and state you **rank independently** (pre-empts "do you just promote whoever pays"). Never let commissions bias rankings — independence is the product.
- **Contact reality (crypto exchanges):** some have direct BD/affiliate emails (KuCoin `affiliate@`, Phemex/BingX/CoinEx `bd@`, BitMEX `affiliates@`); many are **application-form only** (Bitget, Kraken, HTX, BitMart, WhiteBIT); **Coinbase + Crypto.com run through the Impact network**. Verify the program is on the real domain before signing up; never enter banking details on a non-official page.
- **Gmail MCP creates drafts, not sends** (by design + safety). Draft one personalized email per recipient (swap the exchange name + a specific "ranks well for X" line), then the human reviews & sends.

## 16. Marketing image generation (no external credits needed)
- **Don't need Higgsfield/paid gen for branded promo cards** — build them with **Pillow** in the sandbox using the bundled `canvas-fonts` (Bricolage Grotesque for headlines, IBM Plex Mono for numbers). Supersample 2× then downscale (LANCZOS) for crisp edges.
- Sizes: **1600×900** (X/social), **1200×630** (OG), **1270×760** (Product Hunt gallery).
- Reuse the brand system: dark-green `#06140e` ground, emerald `#10b981`/mint `#34d399` as the single accent, a soft glow + faint grid, the real `logo-mark.png` pasted in. Lead the composition with the **insight/number**, not the product name.

## 17. Action-categorization boundaries that recurred
- **Won't do (hand to user):** create accounts, enter passwords / API keys / payment-card details, send emails/messages, execute trades or move money. Drafting, building, and reading are fine.
- **The "send the emails" / "add the card" asks** were declined with the work pre-staged (drafts created, form queued) so the user just reviews + confirms — keeps them in control of anything irreversible leaving their account.

## 18. The recurring meta-lesson
- The sandbox **can't reliably type-check** (mount corruption) and **can't push/deploy** — so on big multi-file changes, **the Vercel build is the compiler** and a quick green/red check after each push is the safety net. Most "it's broken" moments were either a **failed build** (read the log), a **cached bundle** (hard refresh), or an **env var on the wrong deployment** — check those three first.
