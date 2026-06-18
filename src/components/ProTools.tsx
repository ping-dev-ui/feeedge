import { Lock, Zap, Download, TrendingUp, TrendingDown } from 'lucide-react'

type ResultRow = {
  name: string
  key: string
  color: string
  effMaker: number
  effTaker: number
  monthlyFee: number
  totalMonthly: number
  currentTier: { volume: number; maker: number; taker: number }
  nextTier?: { volume: number; maker: number; taker: number }
}

// Typical on-chain withdrawal fees by venue, in token units. Estimates — real
// fees vary with network conditions and account tier.
const WITHDRAWAL_FEES: Record<
  string,
  { usdtTrc20?: number; usdtErc20?: number; btc?: number; eth?: number }
> = {
  binance: { usdtTrc20: 1, usdtErc20: 4, btc: 0.0000061, eth: 0.0004 },
  bybit: { usdtTrc20: 1, usdtErc20: 5, btc: 0.0001, eth: 0.0012 },
  okx: { usdtTrc20: 1, usdtErc20: 3.2, btc: 0.00005, eth: 0.0009 },
  gateio: { usdtTrc20: 1, usdtErc20: 4.6, btc: 0.0004, eth: 0.0018 },
  bitget: { usdtTrc20: 1, usdtErc20: 5, btc: 0.0005, eth: 0.0021 },
  kucoin: { usdtTrc20: 1, usdtErc20: 6.7, btc: 0.0005, eth: 0.002 },
  mexc: { usdtTrc20: 1, usdtErc20: 5.6, btc: 0.00004, eth: 0.0009 },
  kraken: { usdtTrc20: 2.5, usdtErc20: 7, btc: 0.00002, eth: 0.0015 },
  hyperliquid: { usdtTrc20: undefined, usdtErc20: 1, btc: undefined, eth: undefined },
}

function LockedTease({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      onClick={onUpgrade}
      className="relative cursor-pointer bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center hover:border-zinc-700 transition-colors"
    >
      <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
        <Lock size={18} />
      </div>
      <div>
        <h4 className="text-white font-bold">Pro Trading Tools</h4>
        <p className="text-zinc-400 text-xs mt-1 max-w-sm">
          Three more ways to cut your real cost — included with Pro.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
        {[
          ['Funding-rate optimizer', 'Cheapest venue to hold a long or short, from live funding.'],
          ['Withdrawal-fee comparison', 'Real on-chain costs per asset the fee table ignores.'],
          ['Tier savings ladder', 'Where a bit more volume unlocks a cheaper fee tier.'],
        ].map(([title, desc]) => (
          <li key={title} className="bg-black/40 border border-zinc-800 rounded-lg p-3">
            <div className="text-xs font-bold text-emerald-400">{title}</div>
            <div className="text-[11px] text-zinc-400 mt-1">{desc}</div>
          </li>
        ))}
      </ul>
      <span className="bg-emerald-500 text-black px-5 py-1.5 rounded-full font-bold text-xs">
        Unlock Pro for $29 · one-time
      </span>
    </div>
  )
}

export function ProTools({
  isPro,
  market,
  results,
  fundingMap,
  monthlyVolume,
  makerRatio,
  assetMultiplier,
  onUpgrade,
}: {
  isPro: boolean
  market: 'futures' | 'spot'
  results: ResultRow[]
  fundingMap: Record<string, number>
  monthlyVolume: number
  makerRatio: number
  assetMultiplier: number
  onUpgrade: () => void
}) {
  if (!isPro) return <LockedTease onUpgrade={onUpgrade} />

  // ---- Funding-rate optimizer (perps only) ----
  const funding = results
    .filter((r) => fundingMap[r.key] !== undefined)
    .map((r) => ({ name: r.name, color: r.color, rate8h: fundingMap[r.key] }))
    .sort((a, b) => a.rate8h - b.rate8h)
  const bestLong = funding[0] // most negative = longs pay least / receive
  const bestShort = funding[funding.length - 1] // most positive = shorts receive

  // ---- Tier savings ladder ----
  const ladder = results
    .filter((r) => r.nextTier)
    .map((r) => {
      const nt = r.nextTier!
      const feeAtNext =
        monthlyVolume *
        (makerRatio * nt.maker + (1 - makerRatio) * nt.taker) *
        assetMultiplier
      return {
        name: r.name,
        color: r.color,
        volumeToNext: Math.max(0, nt.volume - monthlyVolume),
        nextVolume: nt.volume,
        savings: Math.max(0, r.monthlyFee - feeAtNext),
      }
    })
    .filter((r) => r.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5)

  const fmtUnit = (v: number | undefined) =>
    v === undefined ? '—' : v < 0.001 ? v.toFixed(6) : v.toString()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-emerald-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Pro Trading Tools</h3>
      </div>

      {/* Funding-rate optimizer */}
      {market === 'futures' && funding.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1 tracking-widest">
            Funding-Rate Optimizer
          </h4>
          <p className="text-[11px] text-zinc-400 mb-4">
            Live 8h perpetual funding by venue. Positive = longs pay shorts. Pick
            the cheapest venue for the side you're holding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {bestLong && (
              <div className="bg-black/40 border border-emerald-500/30 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp size={12} /> Best to hold a long
                </div>
                <div className="text-sm font-bold text-white mt-1">{bestLong.name}</div>
                <div className="text-[11px] text-zinc-400">
                  {(bestLong.rate8h * 100).toFixed(4)}% / 8h
                </div>
              </div>
            )}
            {bestShort && (
              <div className="bg-black/40 border border-emerald-500/30 rounded-lg p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingDown size={12} /> Best to hold a short
                </div>
                <div className="text-sm font-bold text-white mt-1">{bestShort.name}</div>
                <div className="text-[11px] text-zinc-400">
                  {(bestShort.rate8h * 100).toFixed(4)}% / 8h
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            {funding.map((f) => {
              const annual = f.rate8h * 3 * 365 * 100
              return (
                <div key={f.name} className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${f.color}`}>{f.name}</span>
                  <span className="flex items-center gap-4">
                    <span className={f.rate8h >= 0 ? 'text-zinc-300' : 'text-emerald-400'}>
                      {(f.rate8h * 100).toFixed(4)}% / 8h
                    </span>
                    <span className="text-zinc-400 w-24 text-right">
                      {annual >= 0 ? '+' : ''}
                      {annual.toFixed(1)}% / yr
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Withdrawal-fee comparison */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1 tracking-widest flex items-center gap-2">
          <Download size={14} /> Withdrawal Fees
        </h4>
        <p className="text-[11px] text-zinc-400 mb-4">
          Typical on-chain withdrawal cost per asset (token units). A real cost the
          fee table ignores — estimates, vary with network load.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-2 pr-3 font-bold">Exchange</th>
                <th className="text-right py-2 px-3 font-bold">USDT·TRC20</th>
                <th className="text-right py-2 px-3 font-bold">USDT·ERC20</th>
                <th className="text-right py-2 px-3 font-bold">BTC</th>
                <th className="text-right py-2 pl-3 font-bold">ETH</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const w = WITHDRAWAL_FEES[r.key]
                if (!w) return null
                return (
                  <tr key={r.key} className="border-b border-zinc-800/50">
                    <td className={`py-2 pr-3 font-bold ${r.color}`}>{r.name}</td>
                    <td className="text-right py-2 px-3 text-zinc-300">{fmtUnit(w.usdtTrc20)}</td>
                    <td className="text-right py-2 px-3 text-zinc-300">{fmtUnit(w.usdtErc20)}</td>
                    <td className="text-right py-2 px-3 text-zinc-300">{fmtUnit(w.btc)}</td>
                    <td className="text-right py-2 pl-3 text-zinc-300">{fmtUnit(w.eth)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier savings ladder */}
      {ladder.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1 tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Tier Savings Ladder
          </h4>
          <p className="text-[11px] text-zinc-400 mb-4">
            Where a bit more monthly volume unlocks a cheaper fee tier — ranked by
            the biggest monthly saving at your current profile.
          </p>
          <div className="space-y-2">
            {ladder.map((l) => (
              <div
                key={l.name}
                className="flex items-center justify-between gap-3 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <div className={`text-sm font-bold ${l.color}`}>{l.name}</div>
                  <div className="text-[11px] text-zinc-400">
                    +${l.volumeToNext.toLocaleString(undefined, { maximumFractionDigits: 0 })} volume → ${(l.nextVolume / 1_000_000).toFixed(1)}M tier
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-400">
                    −${l.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                  </div>
                  <div className="text-[11px] text-zinc-400">potential saving</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
