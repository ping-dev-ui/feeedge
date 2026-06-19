# Fee data refresh — how it works & setup

## What happens now (all 20 exchanges)
A Convex cron (`fetch fee rates`, every 24h) refreshes every exchange/market and
writes it to the `feeRates` table with a `lastUpdated` timestamp. Each exchange
card shows **"Updated {date time}"** from that stamp.

Source priority per exchange:
1. **Live public API** — currently Kraken (spot + futures). Stamps `lastUpdated = now`.
2. **Bright Data scrape** of the exchange's fee page — used for venues without a
   clean API, *only when `BRIGHTDATA_API_KEY` is set*. Stamps `now` on success.
3. **Curated fallback** — hand-verified rates baked into `convex/fetcher.ts`.
   Stamped with `VERIFIED_AT` (the date we last verified by hand), **not** "now",
   so a card never claims a fresh update that didn't happen.

Until you add the Bright Data key, everything safely uses 1 + 3 (no errors).

## To turn on daily website scraping (Bright Data)
1. In Bright Data, create a **Web Unlocker** zone (it handles bot-blocks + JS).
2. In the **Convex dashboard → Settings → Environment Variables**, add:
   - `BRIGHTDATA_API_KEY` = your Bright Data API token
   - `BRIGHTDATA_ZONE` = your web-unlocker zone name *(optional; defaults to `web_unlocker1`)*
3. Redeploy Convex (`npx convex deploy`). The next cron run (or a manual
   `fetcher:fetchAllFees` run) will start scraping the pages in `convex/scrape.ts`.

## Deploying these code changes
```
npx convex deploy        # pushes convex/ changes + regenerates _generated
# then commit regenerated types + push frontend:
git add convex src/routes/index.tsx
git commit -m "Daily fee refresh: 20 exchanges, Bright Data scraping, per-card update time"
git push
```
After deploy, run `fetcher:fetchAllFees` once in the Convex dashboard so all 20
exchanges get a `feeRates` record immediately (otherwise they populate on the
next cron tick).

## Tuning the scrapers
`convex/scrape.ts` has a fee-page URL per exchange and a conservative generic
parser; if a page can't be parsed confidently it falls back to curated (safe).
Once the key is live I can inspect the real returned HTML per exchange and add
precise parsers in the `PARSERS` map — tell me when the key is set and I'll tune
the ones that need it.

## Note on the curated values
The `VERIFIED_AT` date and the rates in `convex/fetcher.ts` PUBLISHED should be
bumped whenever you re-verify by hand. Flagged-uncertain venues (Bitfinex 0%,
BitMEX, WhiteBIT WBT, Coinbase promo) are listed in `FEE_DATA_NOTES_20.md`.
