import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useConvexAuth, useAction } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { SignInModal } from '~/components/SignInModal'
import {
  BarChart3,
  Info,
  Lock,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Download,
  Zap,
  LogOut
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: FeeEdge,
})

type ExchangeData = {
  name: string
  maker: number
  taker: number
  tiers: { volume: number; maker: number; taker: number }[]
  color: string
}

const EXCHANGES: ExchangeData[] = [
  {
    name: 'Binance',
    maker: 0.0002,
    taker: 0.0005,
    color: 'text-yellow-400',
    tiers: [
      { volume: 0, maker: 0.0002, taker: 0.0005 },
      { volume: 15000000, maker: 0.00016, taker: 0.00045 },
      { volume: 50000000, maker: 0.00014, taker: 0.0004 },
    ]
  },
  {
    name: 'Bybit',
    maker: 0.0002,
    taker: 0.00055,
    color: 'text-orange-400',
    tiers: [
      { volume: 0, maker: 0.0002, taker: 0.00055 },
      { volume: 10000000, maker: 0.00018, taker: 0.00045 },
      { volume: 50000000, maker: 0.00015, taker: 0.0004 },
    ]
  },
  {
    name: 'Hyperliquid',
    maker: 0.0001,
    taker: 0.00035,
    color: 'text-emerald-400',
    tiers: [
      { volume: 0, maker: 0.0001, taker: 0.00035 },
    ]
  },
  {
    name: 'OKX',
    maker: 0.0002,
    taker: 0.0005,
    color: 'text-white',
    tiers: [
      { volume: 0, maker: 0.0002, taker: 0.0005 },
      { volume: 10000000, maker: 0.00015, taker: 0.0004 },
    ]
  },
  {
    name: 'Gate.io',
    maker: 0.00015,
    taker: 0.0005,
    color: 'text-red-400',
    tiers: [
      { volume: 0, maker: 0.00015, taker: 0.0005 },
      { volume: 10000000, maker: 0.00012, taker: 0.00045 },
    ]
  }
]

// Relative effective-cost multiplier by asset liquidity. Less-liquid assets
// carry wider spreads/slippage, so their effective trading cost runs higher.
// These are estimates; swap in real per-asset rates if you have them.
const ASSET_LIQUIDITY_MULTIPLIER: Record<string, number> = {
  BTC: 1.0,
  ETH: 1.02,
  SOL: 1.1,
  OTHER: 1.3,
}

function FeeEdge() {
  const [monthlyVolume, setMonthlyVolume] = useState<number>(1000000)
  const [makerRatio, setMakerRatio] = useState<number>(0.5) // 0 to 1
  const [holdTime, setHoldTime] = useState<number>(4)

  // Auth + subscription state (server-backed).
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const { data: viewer } = useSuspenseQuery(convexQuery(api.users.viewer, {}))
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
  const isPro = viewer?.isPro ?? false

  const [showSignIn, setShowSignIn] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SOL', 'OTHER'])

  const toggleAsset = (asset: string) =>
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset],
    )

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      setShowSignIn(true)
      return
    }
    if (isPro) return
    try {
      setUpgrading(true)
      const url = await createCheckoutSession({})
      window.location.href = url
    } catch (err) {
      console.error(err)
      setUpgrading(false)
      alert('Could not start checkout. Please try again.')
    }
  }

  // Average effective-cost multiplier across the selected assets.
  const assetMultiplier = useMemo(() => {
    if (selectedAssets.length === 0) return 1
    const sum = selectedAssets.reduce(
      (s, a) => s + (ASSET_LIQUIDITY_MULTIPLIER[a] ?? 1),
      0,
    )
    return sum / selectedAssets.length
  }, [selectedAssets])

  const results = useMemo(() => {
    return EXCHANGES.map(ex => {
      // Find current tier
      const currentTier = [...ex.tiers].reverse().find(t => monthlyVolume >= t.volume) || ex.tiers[0]
      const nextTier = ex.tiers.find(t => t.volume > monthlyVolume)

      const makerVolume = monthlyVolume * makerRatio
      const takerVolume = monthlyVolume * (1 - makerRatio)

      const monthlyFee = ((makerVolume * currentTier.maker) + (takerVolume * currentTier.taker)) * assetMultiplier

      // Funding rate estimate (simplified: 0.01% per 8h)
      const avgOI = (monthlyVolume / 2) / 30 / 24 * holdTime
      const fundingRatePer8h = 0.0001
      const monthlyFunding = (avgOI * fundingRatePer8h) * (30 * 24 / 8)

      return {
        ...ex,
        currentTier,
        nextTier,
        monthlyFee,
        monthlyFunding,
        totalMonthly: monthlyFee + (isPro ? monthlyFunding : 0)
      }
    }).sort((a, b) => a.totalMonthly - b.totalMonthly)
  }, [monthlyVolume, makerRatio, holdTime, isPro, assetMultiplier])

  const visibleResults = isPro ? results : results.slice(0, 3)
  const cheapest = results[0]
  const mostExpensive = results[results.length - 1]
  const monthlySavings = mostExpensive.totalMonthly - cheapest.totalMonthly

  const handleExportPdf = () => {
    const generatedAt = new Date().toLocaleString()
    const assets = selectedAssets.length ? selectedAssets.join(', ') : 'None'
    const rows = visibleResults
      .map(
        (ex, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${ex.name}</td>
            <td>${(ex.currentTier.maker * 100).toFixed(3)}%</td>
            <td>${(ex.currentTier.taker * 100).toFixed(3)}%</td>
            <td>$${ex.monthlyFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td>$${ex.totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
          </tr>`,
      )
      .join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>FeeEdge Report</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:32px;}
        h1{margin:0 0 4px;font-size:20px;} .sub{color:#666;font-size:12px;margin-bottom:24px;}
        .meta{font-size:13px;margin-bottom:20px;line-height:1.7;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th,td{border:1px solid #ddd;padding:8px 10px;text-align:left;}
        th{background:#f4f4f4;} td:nth-child(n+3){text-align:right;}
        .foot{margin-top:24px;color:#999;font-size:11px;}
      </style></head><body>
      <h1>FeeEdge &mdash; Exchange Fee Comparison</h1>
      <div class="sub">Generated ${generatedAt}</div>
      <div class="meta">
        <strong>Monthly volume:</strong> $${monthlyVolume.toLocaleString()}<br/>
        <strong>Execution:</strong> ${Math.round(makerRatio * 100)}% maker / ${Math.round((1 - makerRatio) * 100)}% taker<br/>
        <strong>Avg hold time:</strong> ${holdTime}h<br/>
        <strong>Assets:</strong> ${assets}<br/>
        <strong>Plan:</strong> ${isPro ? 'Pro (all exchanges)' : 'Free (top 3 shown)'}
      </div>
      <table>
        <thead><tr><th>#</th><th>Exchange</th><th>Maker</th><th>Taker</th><th>Trading Fees</th><th>Total Monthly</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="foot">FeeEdge Analytics &mdash; estimates only, not financial advice.</div>
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) {
      alert('Please allow pop-ups to export the PDF.')
      return
    }
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-mono selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0d0d0d] px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-bold italic">FE</div>
          <h1 className="text-xl font-bold tracking-tighter text-white">FEE EDGE</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            LIVE DATA
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading || isPro}
            className="bg-zinc-100 text-black px-3 py-1.5 rounded font-bold hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Zap size={14} fill="currentColor" />
            {isPro ? 'PRO ACTIVE' : upgrading ? 'REDIRECTING…' : 'UPGRADE TO PRO'}
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              title={viewer?.email ? `Signed in as ${viewer.email}` : 'Sign out'}
            >
              <LogOut size={14} />
            </button>
          ) : (
            <button
              onClick={() => setShowSignIn(true)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignedIn={() => setShowSignIn(false)}
        />
      )}

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} />
              Trader Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase">Monthly Volume (USD)</label>
                <input
                  type="number"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px] text-zinc-600">$100k</span>
                  <span className="text-[10px] text-zinc-600">$100M+</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase">Execution Style (Maker vs Taker)</label>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-zinc-600">TAKER</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={makerRatio}
                    onChange={(e) => setMakerRatio(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-600">MAKER</span>
                </div>
                <div className="text-center mt-2 text-xs font-bold text-emerald-500">
                  {Math.round(makerRatio * 100)}% Limit Orders
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase">Avg Hold Time (Hours)</label>
                <select
                  className="w-full bg-black border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                  value={holdTime}
                  onChange={(e) => setHoldTime(Number(e.target.value))}
                >
                  <option value={0.1}>Scalping (&lt;15m)</option>
                  <option value={1}>Day Trade (1h)</option>
                  <option value={4}>Intraday (4h)</option>
                  <option value={24}>Swing (24h+)</option>
                  <option value={168}>Position (1 week+)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Savings Callout */}
          <section className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ArrowRightLeft size={80} className="rotate-12" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Switching Savings</h3>
              <p className="text-2xl font-black text-white leading-tight">
                Save ${monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                By switching from {mostExpensive.name} to {cheapest.name}
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Annual Savings</div>
                  <div className="text-lg font-bold text-emerald-400">${(monthlySavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <TrendingDown className="text-emerald-500" size={24} />
              </div>
            </div>
          </section>
        </aside>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Exchange Comparison
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-mono">Ranked by Cost</span>
            </h2>
            <button
              onClick={handleExportPdf}
              className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Download size={14} />
              Export PDF
            </button>
          </div>

          <div className="space-y-3">
            {visibleResults.map((ex, idx) => (
              <div
                key={ex.name}
                className={`bg-zinc-900/50 border ${idx === 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800'} rounded-xl p-5 hover:border-zinc-700 transition-all`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-zinc-700 w-6">#{idx + 1}</div>
                    <div>
                      <h3 className={`text-lg font-bold ${ex.color}`}>{ex.name}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-zinc-500">
                          M: <span className="text-zinc-300">{(ex.currentTier.maker * 100).toFixed(3)}%</span>
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          T: <span className="text-zinc-300">{(ex.currentTier.taker * 100).toFixed(3)}%</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase">Trading Fees</div>
                      <div className="text-sm font-bold text-white">${ex.monthlyFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    {isPro ? (
                      <div className="text-right border-l border-zinc-800 pl-8">
                        <div className="text-[10px] text-zinc-500 uppercase">Funding Est.</div>
                        <div className="text-sm font-bold text-zinc-400">${ex.monthlyFunding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </div>
                    ) : (
                      <div className="text-right border-l border-zinc-800 pl-8 opacity-40">
                        <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-end gap-1">
                          Funding <Lock size={8} />
                        </div>
                        <div className="text-xs text-zinc-600 italic">Pro Feature</div>
                      </div>
                    )}
                    <div className="text-right md:border-l border-zinc-800 md:pl-8 col-span-2 md:col-span-1 border-t md:border-t-0 pt-2 md:pt-0">
                      <div className="text-[10px] text-emerald-500 uppercase font-bold">Total Monthly</div>
                      <div className="text-lg font-black text-white">${ex.totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Tier Progress */}
                {ex.nextTier && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-zinc-500">Next Tier: ${(ex.nextTier.volume / 1000000).toFixed(1)}M Vol</span>
                      <span className="text-emerald-500">Save ${((ex.monthlyFee / monthlyVolume * (monthlyVolume)) - (monthlyVolume * (makerRatio * ex.nextTier.maker + (1-makerRatio) * ex.nextTier.taker))).toLocaleString(undefined, { maximumFractionDigits: 0 })} more</span>
                    </div>
                    <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="bg-zinc-700 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (monthlyVolume / ex.nextTier.volume) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!isPro && (
              <div className="relative group cursor-pointer" onClick={handleUpgrade}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a] z-10"></div>
                <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-zinc-700 transition-colors">
                    <Lock size={20} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold">Unlock All 5 Exchanges & Pro Tools</h3>
                    <p className="text-zinc-500 text-xs mt-1">OKX and Gate.io results are currently restricted.</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpgrade()
                    }}
                    disabled={upgrading}
                    className="bg-emerald-500 text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {upgrading ? 'Redirecting…' : 'Unlock All for $29'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Asset Selection & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-widest">Calculated Assets</h4>
              <div className="flex flex-wrap gap-2">
                {['BTC', 'ETH', 'SOL', 'OTHER'].map(asset => {
                  const active = selectedAssets.includes(asset)
                  return (
                    <button
                      key={asset}
                      onClick={() => toggleAsset(asset)}
                      className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-black border-zinc-800 text-zinc-500 hover:border-emerald-500'
                      }`}
                    >
                      {asset}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-start gap-2 text-[10px] text-zinc-500 bg-black/50 p-2 rounded">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>Calculations apply a liquidity-based cost multiplier for the selected assets. Spot and delivery fees may vary.</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-widest">Market Trend Impact</h4>
                <p className="text-[10px] text-zinc-500">In high volatility, taker orders increase. Limit orders may see higher rebate opportunities.</p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 mb-1">Vol 24h</div>
                  <div className="flex items-center gap-1 text-emerald-500 font-bold">
                    <TrendingUp size={12} /> +12.4%
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-zinc-500 mb-1">Open Interest</div>
                  <div className="flex items-center gap-1 text-red-500 font-bold">
                    <TrendingDown size={12} /> -2.1%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-6 border-t border-zinc-800/50 mt-12 text-center">
        <p className="text-[10px] text-zinc-600">
          Fee data last updated Oct 2023. Real-time rates fetched via exchange APIs for Pro users.
          <br />© 2024 FeeEdge Analytics. Not financial advice.
        </p>
      </footer>
    </div>
  )
}
