import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Trend = {
  price: number
  priceChange: number
  volume: number
  marketCap: number
}

// Live BTC stats fetched client-side. Browsers (residential IPs) can reach
// CoinGecko fine; if it rate-limits, we fall back to CoinCap. (Server-side
// fetching doesn't work here — CoinGecko blocks datacenter IPs.)
async function fetchMarketTrend(): Promise<Trend> {
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&price_change_percentage=24h',
    )
    if (r.ok) {
      const arr = await r.json()
      const c = Array.isArray(arr) ? arr[0] : undefined
      if (c && c.current_price != null) {
        return {
          price: Number(c.current_price),
          priceChange: Number(c.price_change_percentage_24h),
          volume: Number(c.total_volume),
          marketCap: Number(c.market_cap),
        }
      }
    }
  } catch {
    /* fall through to CoinCap */
  }

  const r2 = await fetch('https://api.coincap.io/v2/assets/bitcoin')
  if (!r2.ok) throw new Error(`market data unavailable (${r2.status})`)
  const d = (await r2.json())?.data
  if (!d) throw new Error('market data unavailable')
  return {
    price: Number(d.priceUsd),
    priceChange: Number(d.changePercent24Hr),
    volume: Number(d.volumeUsd24Hr),
    marketCap: Number(d.marketCapUsd),
  }
}

function fmtUsd(n: number | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtBillions(n: number | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M'
  return '$' + n.toFixed(0)
}

function ChangeBadge({ value }: { value: number | undefined }) {
  const valid = typeof value === 'number' && isFinite(value)
  if (!valid) return null
  const up = value! >= 0
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}
    >
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}
      {value!.toFixed(1)}%
    </span>
  )
}

export function MarketTrend() {
  const { data } = useQuery({
    queryKey: ['marketTrend'],
    queryFn: fetchMarketTrend,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 4,
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 20_000),
  })

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-widest">
          Market Trend (BTC)
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">{fmtUsd(data?.price)}</span>
          <ChangeBadge value={data?.priceChange} />
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          Live BTC/USD — 24h price change, trading volume, and market cap.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex-1">
          <div className="text-[11px] text-zinc-400 mb-1">24h Volume</div>
          <div className="font-bold text-zinc-200">{fmtBillions(data?.volume)}</div>
        </div>
        <div className="flex-1">
          <div className="text-[11px] text-zinc-400 mb-1">Market Cap</div>
          <div className="font-bold text-zinc-200">{fmtBillions(data?.marketCap)}</div>
        </div>
      </div>
    </div>
  )
}
