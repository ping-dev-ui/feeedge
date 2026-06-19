// Bright Data–powered fee-page scraper for exchanges that don't expose a clean
// public fee API. Used as the second source (after live APIs, before curated
// fallback) by convex/fetcher.ts. Entirely no-op unless BRIGHTDATA_API_KEY is
// set, so the build/deploy is safe before you configure it.
//
// Setup:
//   1. Create a Bright Data "Web Unlocker" zone in your Bright Data dashboard.
//   2. In the Convex dashboard → Settings → Environment Variables, add:
//        BRIGHTDATA_API_KEY = <your API token>
//        BRIGHTDATA_ZONE    = <your web-unlocker zone name>  (optional; defaults below)
//
// Parsers are heuristic and conservative: if a page's maker/taker can't be
// confidently parsed, the scraper returns null and fetcher.ts falls back to the
// curated rate (with its verified date). Parsers can be tuned per-exchange once
// live HTML is observed.

type Rate = { maker: number; taker: number };
type Market = "futures" | "spot";

const ZONE = () => process.env.BRIGHTDATA_ZONE || "web_unlocker1";
const KEY = () => process.env.BRIGHTDATA_API_KEY || "";

export function scrapingEnabled(): boolean {
  return KEY().length > 0;
}

// Fee-schedule page per exchange. Only exchanges listed here are scraped; the
// rest stay on curated values until a URL+parser is added.
const FEE_PAGE: Record<string, string> = {
  htx: "https://www.htx.com/en-us/rate/",
  bingx: "https://bingx.com/en/support/articles/360046487573-perpetual-futures-fee-schedule",
  coinbase: "https://www.coinbase.com/advanced-fees",
  cryptocom: "https://crypto.com/exchange/fees",
  bitfinex: "https://www.bitfinex.com/fees/",
  whitebit: "https://whitebit.com/fees",
  phemex: "https://phemex.com/contract-trading-fees",
  bitmex: "https://www.bitmex.com/wallet/fees/trading",
  backpack: "https://support.backpack.exchange/exchange/trading/trading-fees",
  bitmart: "https://www.bitmart.com/fee/en-US",
  coinex: "https://www.coinex.com/en/fees",
  bitget: "https://www.bitget.com/rate",
  kucoin: "https://www.kucoin.com/vip/level",
  okx: "https://www.okx.com/fees",
  gateio: "https://www.gate.io/fee",
};

// Fetch a page's HTML through Bright Data's Web Unlocker (handles bot-blocks +
// JS rendering). Returns null on any failure.
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
        // Render JS so dynamically-loaded fee tables are present in the HTML.
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

// Pull all percentage figures (e.g. "0.06%", "0.02 %") from text as decimals.
function percentsToDecimals(text: string): number[] {
  const out: number[] = [];
  const re = /(-?\d+(?:\.\d+)?)\s*%/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const v = Number(m[1]) / 100;
    if (isFinite(v)) out.push(v);
  }
  return out;
}

// A plausible base-tier maker/taker pair for crypto venues: between 0% and ~0.6%
// and maker <= taker (the usual ordering). Used to reject garbage parses.
function plausible(r: Rate | null): r is Rate {
  if (!r) return false;
  const { maker, taker } = r;
  if (![maker, taker].every((x) => isFinite(x) && x >= 0 && x <= 0.006)) return false;
  return maker <= taker + 1e-9;
}

// Generic heuristic: find the first "maker ... X%" and "taker ... Y%" near each
// other in the rendered text. Works for many simple fee pages; per-exchange
// overrides can be added below when this isn't enough.
function genericParse(html: string, _market: Market): Rate | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const makerIdx = text.search(/maker/i);
  const takerIdx = text.search(/taker/i);
  if (makerIdx < 0 || takerIdx < 0) return null;
  // Look at a window starting at the first fee-related keyword.
  const start = Math.max(0, Math.min(makerIdx, takerIdx) - 40);
  const window = text.slice(start, start + 400);
  const pcts = percentsToDecimals(window);
  if (pcts.length < 2) return null;
  const r = { maker: pcts[0], taker: pcts[1] };
  return plausible(r) ? r : null;
}

// Per-exchange parser overrides (add as needed). Keyed by exchange slug.
const PARSERS: Record<string, (html: string, market: Market) => Rate | null> = {};

// Public entry point: scrape one exchange/market. Returns a decimal Rate or null
// (→ caller falls back to curated value).
export async function scrapeFee(
  exchange: string,
  market: Market,
): Promise<Rate | null> {
  const url = FEE_PAGE[exchange];
  if (!url || !scrapingEnabled()) return null;
  const html = await unlock(url);
  if (!html) return null;
  const parser = PARSERS[exchange] ?? genericParse;
  const rate = parser(html, market);
  return plausible(rate) ? rate : null;
}
