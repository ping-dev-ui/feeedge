import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Trend = {
  price: number
  priceChange: number
  quoteVolume: number
  oiChange: number
}

// Live BTC market stats from Binance public endpoints (CORS-enabled), fetched
// client-side so they don't block SSR.
async function fetchMarketTrend(): Promise<Trend> {
  const [tickerRes, oiRes] = await Promise.all([
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
    fetch(
      'https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1d&limit=2',
    ),
  ])
  const ticker = await tickerRes.json()
  const price = Number(ticker?.lastPrice)
  const priceChange = Number(ticker?.priceChangePercent)
  const quoteVolume = Number(ticker?.quoteVolume)

  let oiChange = NaN
  try {
    const oi = await oiRes.json()
    if (Array.isArray(oi) && oi.length >= 2) {
      const prev = Number(oi[0]?.sumOpenInterest)
      const last = Number(oi[oi.length - 1]?.sumOpenInterest)
      if (prev > 0) oiChange = ((last - prev) / prev) * 100
    }
  } catch {
    // leave oiChange as NaN -> renders as "—"
  }
  return { price, priceChange, quoteVolume, oiChange }
}

function fmtUsd(n: number | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtBillions(n: number | undefined): string {
  if (typeof n !== 'number' || !isFinite(n)) return '—'
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

function PctStat({ label, value }: { label: string; value: number | undefined }) {
  const valid = typeof value === 'number' && isFinite(value)
  const up = valid && value! >= 0
  return (
    <div className="flex-1">
      <div className="text-[10px] text-zinc-500 mb-1">{label}</div>
      {valid ? (
        <div
          className={`flex items-center gap-1 font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}
          {value!.toFixed(1)}%
        </div>
      ) : (
        <div className="text-zinc-600 font-bold">—</div>
      )}
    </div>
  )
}

export function MarketTrend() {
  const { data } = useQuery({
    queryKey: ['marketTrend'],
    queryFn: fetchMarketTrend,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
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
        <p className="text-[10px] text-zinc-500 mt-1">
          Live BTC/USDT — 24h price, volume, and perpetual open-interest shift.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex-1">
          <div className="text-[10px] text-zinc-500 mb-1">24h Volume</div>
          <div className="font-bold text-zinc-200">{fmtBillions(data?.quoteVolume)}</div>
        </div>
        <PctStat label="Open Interest 24h" value={data?.oiChange} />
      </div>
    </div>
  )
}
