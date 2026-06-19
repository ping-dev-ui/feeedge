# Fee-data accuracy audit (overnight, June 2026)

Web-verified the hardcoded base-tier fees against current published schedules. **No code was changed** — these are recommendations for you to review and apply. Most values were accurate; a few have drifted.

## ✅ Confirmed accurate (no change needed)
- **Binance** — spot 0.10%/0.10%, perps 0.02% maker / 0.05% taker, BNB 10% (futures). ✓
- **Bybit** — spot 0.10%/0.10%, perps 0.02% maker / 0.055% taker. ✓
- **OKX** — spot 0.08% maker / 0.10% taker, perps 0.02% / 0.05%. ✓ (token discount: see flags)
- **Hyperliquid spot** — 0.04% maker / 0.07% taker. ✓
- **MEXC spot** — 0.00% maker / 0.05% taker. ✓
- **KuCoin** — perps 0.02% / 0.06%, spot maker 0.10%. ✓
- **Kraken perps** — 0.02% maker / 0.05% taker. ✓

## 🔧 Recommended corrections (high confidence, multiple sources)

| Exchange | Field | Current | Verified | Decimal (code) |
|---|---|---|---|---|
| **Hyperliquid** | perps maker | 0.010% | **0.015%** | `0.0001 → 0.00015` |
| **Hyperliquid** | perps taker | 0.035% | **0.045%** | `0.00035 → 0.00045` |
| **MEXC** | futures maker | 0.010% | **0.000%** | `0.0001 → 0.0` |
| **MEXC** | futures taker | 0.040% | **0.020%** | `0.0004 → 0.0002` |
| **Kraken** | spot maker | 0.160% | **0.250%** | `0.0016 → 0.0025` |
| **Kraken** | spot taker | 0.260% | **0.400%** | `0.0026 → 0.004` |
| **KuCoin** | spot taker | 0.100% | **0.120%** | `0.001 → 0.0012` |

**Important consequence:** correcting Hyperliquid's perps up (0.015%/0.045%) and MEXC's perps down (0.00%/0.02%) means **MEXC likely becomes the cheapest perps venue at the default $1M view, not Hyperliquid.** That's more accurate — worth knowing since the homepage "Switching Savings" and #1 badge will change.

## ⚠️ Flags (sources conflict — verify on the official schedule before changing)
- **Gate.io spot** — currently 0.20%/0.20%. Several 2026 sources cite **0.10%/0.10%** as standard now. Confirm on Gate's official fee page; if 0.10%, change `0.002 → 0.001` (both).
- **OKX OKB discount** — currently 20%. Sources cite **25%** for pay-with-OKB. Low-stakes; bump to `0.25` if you want.
- **Bitget** — not re-verified this round (currently perps 0.02%/0.06%, spot 0.10%, BGB 20%). Worth a quick check.
- **KCS discount** does **not** apply to KuCoin futures (only spot). The app currently applies each token discount uniformly to a venue's blended rate — a minor simplification. If you want precision, gate token discounts to spot-only for KuCoin.

## Where to apply each change
The displayed rates come primarily from Convex `feeRates`, seeded by `convex/fetcher.ts` (published values), with `src/data/exchanges.ts` and the `EXCHANGES` array in `src/routes/index.tsx` as the SEO/fallback copies. To fully apply a correction, update **all three** so they stay consistent:
1. **`convex/fetcher.ts`** — the published per-exchange rates (what the live calculator shows). Requires `npx.cmd convex deploy`, then re-seed by triggering `fetcher:fetchAllFees` once in the Convex dashboard (or wait for the 6-hour cron).
2. **`src/data/exchanges.ts`** — powers the SEO comparison pages. Requires `git push`.
3. **`src/routes/index.tsx` `EXCHANGES`** — the calculator's fallback tiers. Requires `git push`.

I can make all these edits for you on your go-ahead — they're data-only (very low build risk), but I'd want you to push/deploy and eyeball the result since it shifts the rankings.

## Methodology note
Base/entry-tier published rates change and vary by source (review sites lag, exchanges run promos). The robust long-term fix is to **expand the live-fetch pipeline** (you already do Kraken live) to more venues' public fee endpoints, so the numbers self-update instead of being hardcoded. That's a bigger build — flagged for the roadmap.

## Sources
- Binance: tradersunion.com/brokers/crypto/view/binance/fees, chainfeetracker.com/binance-fees-guide.html
- Bybit: bybit.com/en/announcement-info/fee-rate, cointribune.com bybit-fees-2026
- OKX: tradersunion.com/brokers/crypto/view/okex/fees, coinmarketbox.com/okx-fees
- Hyperliquid: datawallet.com/crypto/hyperliquid-fees-explained, kkinvesting.io hyperliquid-fee-tutorial
- Gate.io: tradersunion.com/brokers/crypto/view/gate.io/fees, datawallet.com/crypto/bybit-vs-gate-io
- KuCoin: bitdegree.org/crypto/tutorials/kucoin-fees, tradersunion.com/brokers/crypto/view/kucoin/fees
- MEXC: bitdegree.org/crypto/tutorials/mexc-fees, mexc.com fees guide
- Kraken: kraken.com/features/fee-schedule, cryptoslate.com/crypto-exchanges/kraken-exchange-review
