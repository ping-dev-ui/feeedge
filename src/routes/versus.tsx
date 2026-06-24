import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useConvexAuth, useAction } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { SignInModal } from '~/components/SignInModal'
import { Lock } from 'lucide-react'
import { EXCHANGES, exchangeBySlug, pct, type Exchange } from '~/data/exchanges'
import { ExchangeLogo } from '~/components/ExchangeLogo'

export const Route = createFileRoute('/versus')({
  head: () => {
    const title = 'Compare crypto exchanges head-to-head — FeeEdge'
    const description =
      'Pick any crypto exchanges and compare their trading fees side by side — perps or spot, tuned to your monthly volume and maker/taker style, with native-token discounts.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/versus' },
      ],
    }
  },
  component: VersusPage,
})

type Market = 'futures' | 'spot'

const fmtUsd = (n: number) =>
  n >= 1
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${n.toFixed(2)}`

function effectiveRate(e: Exchange, market: Market, makerRatio: number, useToken: boolean) {
  const f = e[market]
  let rate = f.maker * makerRatio + f.taker * (1 - makerRatio)
  if (useToken && e.token && e.tokenDiscount) rate *= 1 - e.tokenDiscount
  return rate
}

function VersusPage() {
  const [market, setMarket] = useState<Market>('futures')
  const [volume, setVolume] = useState<number>(1_000_000)
  const [makerPct, setMakerPct] = useState<number>(50) // % of volume traded as maker
  const [slugs, setSlugs] = useState<string[]>(['binance', 'bybit', 'hyperliquid'])
  const [tokenOn, setTokenOn] = useState<Record<string, boolean>>({})

  const { isAuthenticated } = useConvexAuth()
  const { data: viewer } = useSuspenseQuery(convexQuery(api.users.viewer, {}))
  const isPro = viewer?.isPro ?? false
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
  const [showSignIn, setShowSignIn] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      setShowSignIn(true)
      return
    }
    if (isPro) return
    try {
      setUpgrading(true)
      const ref =
        typeof window !== 'undefined' ? localStorage.getItem('feeedge_ref') ?? undefined : undefined
      const url = await createCheckoutSession(ref ? { ref } : {})
      window.location.href = url
    } catch {
      setUpgrading(false)
      alert('Could not start checkout. Please try again.')
    }
  }

  const makerRatio = makerPct / 100

  const rows = useMemo(() => {
    const list = slugs
      .map((s) => exchangeBySlug(s))
      .filter((e): e is Exchange => Boolean(e))
      .map((e) => {
        const useToken = Boolean(tokenOn[e.slug])
        const rate = effectiveRate(e, market, makerRatio, useToken)
        return { e, rate, monthly: rate * volume, useToken }
      })
    const min = Math.min(...list.map((r) => r.monthly))
    return list.map((r) => ({ ...r, cheapest: r.monthly === min && list.length > 1 }))
  }, [slugs, market, makerRatio, volume, tokenOn])

  const setSlug = (i: number, slug: string) =>
    setSlugs((prev) => prev.map((s, idx) => (idx === i ? slug : s)))
  const addSlug = () => {
    const unused = EXCHANGES.find((e) => !slugs.includes(e.slug))
    if (unused && slugs.length < 5) setSlugs((prev) => [...prev, unused.slug])
  }
  const removeSlug = (i: number) =>
    setSlugs((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev))

  const inputCls =
    'w-full rounded-lg bg-[#0a1a13] border border-zinc-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500'

  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#06140e] text-zinc-300 font-sans">
        {showSignIn && (
          <SignInModal onClose={() => setShowSignIn(false)} onSignedIn={() => setShowSignIn(false)} />
        )}
        <header className="border-b border-zinc-800 bg-[#0a1a13] px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo-mark.png" width="30" height="30" alt="FeeEdge" className="rounded-lg" />
              <span className="text-lg font-black text-white">FeeEdge</span>
            </Link>
            <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
              ← Back to app
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Compare exchanges head-to-head</h1>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            Pick any crypto exchanges and compare their trading fees side by side — perps or spot, tuned to your
            monthly volume and maker/taker style, with native-token discounts.
          </p>
          <div className="bg-[#0b1f16] border border-emerald-500/30 rounded-2xl p-8 text-center max-w-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
              <Lock size={20} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Head-to-head is a Pro feature</h2>
            <p className="mb-5 text-sm text-zinc-400">
              Unlock side-by-side comparison of any exchanges for your exact volume and style — plus the full
              calculator, all {EXCHANGES.length} venues, funding estimates, native-token discounts and more.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {upgrading ? 'Redirecting…' : 'Unlock Pro for $29 · one-time'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06140e] text-zinc-300 font-sans">
      <header className="border-b border-zinc-800 bg-[#0a1a13] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.png" width="30" height="30" alt="FeeEdge" className="rounded-lg" />
            <span className="text-lg font-black text-white">FeeEdge</span>
          </Link>
          <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Back to app
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Compare exchanges head-to-head</h1>
        <p className="text-zinc-400 mb-8 max-w-2xl">
          Pick the exchanges you want to compare, set how you trade, and see them side by side. Uses
          published entry-tier rates — for full volume-tier logic and funding,{' '}
          <Link to="/" className="text-emerald-400 hover:underline">use the calculator</Link>.
        </p>

        {/* Controls */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
              Market
            </label>
            <div className="flex rounded-lg overflow-hidden border border-zinc-700">
              <button
                onClick={() => setMarket('futures')}
                className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${market === 'futures' ? 'bg-emerald-500 text-[#03150f]' : 'bg-[#0a1a13] text-zinc-400'}`}
              >
                Perps
              </button>
              <button
                onClick={() => setMarket('spot')}
                className={`flex-1 px-3 py-2 text-sm font-bold transition-colors ${market === 'spot' ? 'bg-emerald-500 text-[#03150f]' : 'bg-[#0a1a13] text-zinc-400'}`}
              >
                Spot
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
              Monthly volume (USD)
            </label>
            <input
              type="number"
              min={0}
              step={100000}
              value={volume}
              onChange={(ev) => setVolume(Math.max(0, Number(ev.target.value) || 0))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
              Maker share: {makerPct}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={makerPct}
              onChange={(ev) => setMakerPct(Number(ev.target.value))}
              className="w-full accent-emerald-500 mt-2"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>All taker</span>
              <span>All maker</span>
            </div>
          </div>
        </div>

        {/* Exchange selectors */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {slugs.map((slug, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={slug} onChange={(ev) => setSlug(i, ev.target.value)} className={inputCls}>
                {EXCHANGES.map((e) => (
                  <option
                    key={e.slug}
                    value={e.slug}
                    disabled={slugs.includes(e.slug) && e.slug !== slug}
                  >
                    {e.name}
                  </option>
                ))}
              </select>
              {slugs.length > 2 && (
                <button
                  onClick={() => removeSlug(i)}
                  aria-label="Remove"
                  className="shrink-0 w-9 h-9 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {slugs.length < 5 && (
            <button
              onClick={addSlug}
              className="rounded-lg border border-dashed border-zinc-600 text-zinc-400 hover:text-white hover:border-emerald-500 px-3 py-2 text-sm font-bold"
            >
              + Add exchange
            </button>
          )}
        </div>

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ e, rate, monthly, cheapest, useToken }) => (
            <div
              key={e.slug}
              className={`rounded-xl border p-4 bg-[#0a1a13] ${cheapest ? 'border-emerald-500' : 'border-zinc-800'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 min-w-0">
                  <ExchangeLogo slug={e.slug} name={e.name} colorClass={e.colorClass} size={22} />
                  <span className={`text-lg font-black truncate ${e.colorClass}`}>{e.name}</span>
                </span>
                {cheapest && (
                  <span className="text-[10px] font-black uppercase tracking-wide bg-emerald-500 text-[#03150f] px-2 py-0.5 rounded">
                    Cheapest
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-white font-mono mb-1">{fmtUsd(monthly)}</div>
              <div className="text-[11px] text-zinc-500 mb-3">est. monthly fees</div>
              <dl className="text-sm space-y-1">
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Maker</dt>
                  <dd className="font-mono text-zinc-300">{pct(e[market].maker)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Taker</dt>
                  <dd className="font-mono text-zinc-300">{pct(e[market].taker)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Effective</dt>
                  <dd className="font-mono text-emerald-400">{pct(rate)}</dd>
                </div>
              </dl>
              {e.token && e.tokenDiscount && (
                <label className="flex items-center gap-2 mt-3 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useToken}
                    onChange={(ev) => setTokenOn((p) => ({ ...p, [e.slug]: ev.target.checked }))}
                    className="accent-emerald-500"
                  />
                  Pay fees with {e.token} (−{Math.round(e.tokenDiscount * 100)}%)
                </label>
              )}
              <div className="mt-3">
                <Link
                  to="/exchanges/$slug"
                  params={{ slug: e.slug }}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  {e.name} fee details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-zinc-500 mt-6">
          Figures use published entry-tier maker/taker rates and assume your full volume trades on each
          venue. Real cost also depends on volume tiers, funding (perps), spreads and withdrawal fees — the{' '}
          <Link to="/" className="text-emerald-400 hover:underline">full calculator</Link> models those.
        </p>

        <div className="mt-8 pt-6 border-t border-zinc-800/60 text-sm flex flex-wrap gap-4">
          <Link to="/compare" className="text-zinc-400 hover:text-white">All comparisons</Link>
          <Link to="/exchanges" className="text-zinc-400 hover:text-white">All exchange fee pages</Link>
          <Link to="/" className="text-zinc-400 hover:text-white">Full calculator</Link>
        </div>
      </main>
    </div>
  )
}
