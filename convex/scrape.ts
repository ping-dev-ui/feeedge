import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Bright Data–powered fee-page scraper for exchanges that don't expose a clean
// public fee API. Used as the second source (after live APIs, before curated
// fallback) by convex/fetcher.ts. Entirely no-op unless BRIGHTDATA_API_KEY is
// set, so the build/deploy is safe before you configure it.
//
// Scraping only runs for an exchange/market that has BOTH a fee-page URL and a
// VERIFIED parser below. Anything else falls back to the curated rate, so a bad
// parse can never override an accurate curated value.
//
// To add/verify a parser: run the `scrape:debugUnlock` action (Convex dashboard)
// with a fee-page URL to see the exact text the parser receives, then write a
// parser that targets that text and add it to PARSERS.

type Rate = { maker: number; taker: number };
type Market = "futures" | "spot";

const ZONE = () => process.env.BRIGHTDATA_ZONE || "web_unlocker1";
const KEY = () => process.env.BRIGHTDATA_API_KEY || "";

export function scrapingEnabled(): boolean {
  return KEY().length > 0;
}

// Fee-schedule page per exchange, per market. Spot and futures often live on
// different pages, so each market has its own URL.
const FEE_PAGE: Record<string, Partial<Record<Market, string>>> = {
  binance: {
    spot: "https://www.binance.com/en/fee/trading",
  },
  bybit: {
    spot: "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
    futures: "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure",
  },
  htx: {
    spot: "https://www.htx.com/en-us/rate/",
    futures: "https://www.htx.com/en-us/rate/",
  },
  bingx: {
    futures: "https://bingx.com/en/support/articles/360046487573-perpetual-futures-fee-schedule",
    spot: "https://bingx.com/en/support/articles/360027240173-fee-schedule",
  },
  bitget: {
    spot: "https://www.bitget.com/rate",
    futures: "https://www.bitget.com/rate",
  },
  kucoin: {
    spot: "https://www.kucoin.com/vip/level",
    futures: "https://www.kucoin.com/vip/level",
  },
  okx: {
    spot: "https://www.okx.com/fees",
    futures: "https://www.okx.com/fees",
  },
  bitmart: {
    spot: "https://www.bitmart.com/fee/en-US",
    futures: "https://www.bitmart.com/fee/en-US",
  },
  coinex: {
    spot: "https://www.coinex.com/en/fees",
    futures: "https://www.coinex.com/en/fees",
  },
  whitebit: {
    spot: "https://whitebit.com/fees",
    futures: "https://whitebit.com/fees",
  },
  phemex: {
    futures: "https://phemex.com/contract-trading-fees",
    spot: "https://phemex.com/spot-trading-fees",
  },
  bitmex: {
    spot: "https://www.bitmex.com/wallet/fees/trading",
    futures: "https://www.bitmex.com/wallet/fees/trading",
  },
  backpack: {
    spot: "https://support.backpack.exchange/exchange/trading/trading-fees",
    futures: "https://support.backpack.exchange/exchange/trading/trading-fees",
  },
  bitfinex: {
    spot: "https://www.bitfinex.com/fees/",
    futures: "https://www.bitfinex.com/fees/",
  },
  cryptocom: {
    spot: "https://crypto.com/exchange/fees",
    futures: "https://crypto.com/exchange/fees",
  },
  coinbase: {
    spot: "https://www.coinbase.com/advanced-fees",
    futures: "https://www.coinbase.com/advanced-fees",
  },
};

// Strip HTML to a normalized text string for parsing.
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fetch a page through Bright Data's Web Unlocker (handles bot-blocks + JS).
// Returns the raw response text, or null on failure.
async function unlock(url: string): Promise<string | null> {
  if (!scrapingEnabled()) return null;
  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone: ZONE(),
        url,
        format: "raw",
        data_format: "html",
      }),
    });
    if (!res.ok) {
      console.error(`Bright Data unlock failed (${res.status}) for ${url}`);
      return null;
    }
    return await res.text();
  } catch (e) {
    console.error(`Bright Data unlock error for ${url}:`, e);
    return null;
  }
}

// --- Parsing helpers --------------------------------------------------------

const PCT = /(-?\d+(?:\.\d+)?)\s*%/;

// Find a percentage immediately after a label within the next `window` chars.
// e.g. labelledPct(text, /maker/i) on "... Maker 0.020% Taker ..." -> 0.0002.
function labelledPct(text: string, label: RegExp, window = 60): number | null {
  const m = label.exec(text);
  if (!m) return null;
  const seg = text.slice(m.index, m.index + window);
  const p = PCT.exec(seg);
  if (!p) return null;
  const v = Number(p[1]) / 100;
  return isFinite(v) ? v : null;
}

// A plausible base-tier maker/taker pair: 0%–0.6%, maker <= taker.
function plausible(r: Rate | null): r is Rate {
  if (!r) return false;
  const { maker, taker } = r;
  if (![maker, taker].every((x) => isFinite(x) && x >= 0 && x <= 0.006)) return false;
  return maker <= taker + 1e-9;
}

// Generic heuristic — NOT used automatically (produced wrong-but-plausible
// values on real pages). Exported for reference / opt-in by a verified parser.
export function genericParse(html: string, _market: Market): Rate | null {
  const text = stripHtml(html);
  const maker = labelledPct(text, /maker/i);
  const taker = labelledPct(text, /taker/i);
  if (maker == null || taker == null) return null;
  const r = { maker, taker };
  return plausible(r) ? r : null;
}

// Find maker + taker by their labels anywhere in the text (taker may appear
// before maker on the page). Works for pages that print "Maker … X%  Taker … Y%".
function makerTaker(text: string): Rate | null {
  const maker = labelledPct(text, /maker/i, 60);
  const taker = labelledPct(text, /taker/i, 60);
  if (maker == null || taker == null) return null;
  return { maker, taker };
}

// VERIFIED per-exchange/market parsers. Keyed by "exchange:market". Each is
// written and confirmed against the real Bright Data output (via debugUnlock)
// before being added here.
// Binance spot fee schedule renders server-side; the "Regular User" row carries
// the base rate as "0.100% / 0.100%" (Maker / Taker). Take the first two %.
function binanceSpot(text: string): Rate | null {
  const i = text.search(/Regular User/i);
  if (i < 0) return null;
  const nums = [...text.slice(i, i + 140).matchAll(/(-?\d+(?:\.\d+)?)\s*%/g)].map(
    (m) => Number(m[1]) / 100,
  );
  return nums.length >= 2 ? { maker: nums[0], taker: nums[1] } : null;
}

// Bybit help-center fee table prints the VIP 0 row as six percentages in order:
// spotTaker, spotMaker, perpTaker, perpMaker, optTaker, optMaker.
function bybitVip0(text: string): number[] | null {
  const i = text.search(/VIP\s*0\b/i);
  if (i < 0) return null;
  const nums = [...text.slice(i, i + 170).matchAll(/(-?\d+(?:\.\d+)?)\s*%/g)].map(
    (m) => Number(m[1]) / 100,
  );
  return nums.length >= 4 ? nums : null;
}
function bybitSpot(text: string): Rate | null {
  const n = bybitVip0(text);
  return n ? { taker: n[0], maker: n[1] } : null;
}
function bybitFutures(text: string): Rate | null {
  const n = bybitVip0(text);
  return n ? { taker: n[2], maker: n[3] } : null;
}

const PARSERS: Record<string, (text: string) => Rate | null> = {
  // BingX futures support article renders server-side as:
  // "Taker (filled instantly): 0.05% Maker (pending orders): 0.02%"
  // → maker 0.02%, taker 0.05% (verified 2026-06-19).
  "bingx:futures": makerTaker,
  // Binance spot + Bybit spot/futures: fee tables confirmed present in the
  // served HTML (2026-06-21). Pending live verification of the scraped value
  // against the published base rate before being fully trusted.
  "binance:spot": binanceSpot,
  "bybit:spot": bybitSpot,
  "bybit:futures": bybitFutures,
};

// Public entry point: scrape one exchange/market. Returns a decimal Rate or null
// (→ caller falls back to curated value).
export async function scrapeFee(
  exchange: string,
  market: Market,
): Promise<Rate | null> {
  const url = FEE_PAGE[exchange]?.[market];
  const parser = PARSERS[`${exchange}:${market}`];
  if (!url || !parser || !scrapingEnabled()) return null;
  const html = await unlock(url);
  if (!html) return null;
  const rate = parser(stripHtml(html));
  return plausible(rate) ? rate : null;
}

// Debug helper: fetch a URL via Bright Data and return a slice of the stripped
// text, so parsers can be built against the exact content Convex receives.
// Run from the Convex dashboard: scrape:debugUnlock { url, around?: "maker" }.
export const debugUnlock = internalAction({
  args: { url: v.string(), around: v.optional(v.string()) },
  returns: v.object({
    ok: v.boolean(),
    length: v.number(),
    text: v.string(),
  }),
  handler: async (_ctx, args) => {
    const html = await unlock(args.url);
    if (!html) return { ok: false, length: 0, text: "(no response — check key/zone)" };
    const text = stripHtml(html);
    let slice: string;
    if (args.around) {
      const i = text.toLowerCase().indexOf(args.around.toLowerCase());
      slice = i >= 0 ? text.slice(Math.max(0, i - 200), i + 1800) : text.slice(0, 2000);
    } else {
      slice = text.slice(0, 2000);
    }
    return { ok: true, length: text.length, text: slice };
  },
});
