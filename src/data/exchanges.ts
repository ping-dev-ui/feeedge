// Shared exchange dataset for the SEO comparison/cornerstone pages.
// Base-tier (entry) maker/taker rates as decimals (0.0002 = 0.02%). These are
// representative published rates; the live calculator at "/" has the full
// volume-tier logic and any live-fetched rates.

export type Fees = { maker: number; taker: number }

export type Exchange = {
  name: string
  slug: string
  colorClass: string
  futures: Fees
  spot: Fees
  token?: string // native-token fee discount asset, if any
  tokenDiscount?: number // e.g. 0.2 = 20% off
  referral?: string
}

export const EXCHANGES: Exchange[] = [
  {
    name: 'Binance', slug: 'binance', colorClass: 'text-yellow-400',
    futures: { maker: 0.0002, taker: 0.0005 }, spot: { maker: 0.001, taker: 0.001 },
    token: 'BNB', tokenDiscount: 0.1,
    referral: 'https://accounts.binance.com/register?ref=R1LOTHE0',
  },
  {
    name: 'Bybit', slug: 'bybit', colorClass: 'text-orange-400',
    futures: { maker: 0.0002, taker: 0.00055 }, spot: { maker: 0.001, taker: 0.001 },
    referral: 'https://www.bybit.com/invite?ref=XV0M2P&medium=referral&utm_campaign=evergreen',
  },
  {
    name: 'Hyperliquid', slug: 'hyperliquid', colorClass: 'text-emerald-400',
    futures: { maker: 0.00015, taker: 0.00045 }, spot: { maker: 0.0004, taker: 0.0007 },
    referral: 'https://app.hyperliquid.xyz/join/FEEEDGE',
  },
  {
    name: 'OKX', slug: 'okx', colorClass: 'text-zinc-100',
    futures: { maker: 0.0002, taker: 0.0005 }, spot: { maker: 0.0008, taker: 0.001 },
    token: 'OKB', tokenDiscount: 0.2,
    referral: 'https://okx.com/join/9729325',
  },
  {
    name: 'Gate.io', slug: 'gateio', colorClass: 'text-red-400',
    futures: { maker: 0.00015, taker: 0.0005 }, spot: { maker: 0.002, taker: 0.002 },
    token: 'GT', tokenDiscount: 0.15,
    referral:
      'https://www.gate.com/referral/earn-together/invite/UFlHUlkO?ref=UFlHUlkO&ref_type=103&utm_cmp=rXJBDjtJ&activity_id=1781161013843',
  },
  {
    name: 'Bitget', slug: 'bitget', colorClass: 'text-cyan-400',
    futures: { maker: 0.0002, taker: 0.0006 }, spot: { maker: 0.001, taker: 0.001 },
    token: 'BGB', tokenDiscount: 0.2,
  },
  {
    name: 'KuCoin', slug: 'kucoin', colorClass: 'text-green-400',
    futures: { maker: 0.0002, taker: 0.0006 }, spot: { maker: 0.001, taker: 0.0012 },
    token: 'KCS', tokenDiscount: 0.2,
  },
  {
    name: 'MEXC', slug: 'mexc', colorClass: 'text-blue-400',
    futures: { maker: 0.0, taker: 0.0002 }, spot: { maker: 0.0, taker: 0.0005 },
    referral: 'https://promote.mexc.com/r/KpQwPUMlv7',
  },
  {
    name: 'Kraken', slug: 'kraken', colorClass: 'text-purple-400',
    futures: { maker: 0.0002, taker: 0.0005 }, spot: { maker: 0.0025, taker: 0.004 },
  },
]

export function exchangeBySlug(slug: string): Exchange | undefined {
  return EXCHANGES.find((e) => e.slug === slug)
}

// All unique unordered pairs, returned in a stable order.
export function allPairs(): Array<[Exchange, Exchange]> {
  const out: Array<[Exchange, Exchange]> = []
  for (let i = 0; i < EXCHANGES.length; i++) {
    for (let j = i + 1; j < EXCHANGES.length; j++) {
      out.push([EXCHANGES[i], EXCHANGES[j]])
    }
  }
  return out
}

export function pairSlug(a: Exchange, b: Exchange): string {
  return `${a.slug}-vs-${b.slug}`
}

// Parse a "binance-vs-bybit" slug into its two exchanges (order-insensitive).
export function parsePair(pair: string): [Exchange, Exchange] | null {
  const parts = pair.split('-vs-')
  if (parts.length !== 2) return null
  const a = exchangeBySlug(parts[0])
  const b = exchangeBySlug(parts[1])
  if (!a || !b || a.slug === b.slug) return null
  return [a, b]
}

export const pct = (v: number) => `${(v * 100).toFixed(3)}%`
