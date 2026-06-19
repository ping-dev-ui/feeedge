import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useConvexAuth, useAction } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { SignInModal } from '~/components/SignInModal'
import { CostChart } from '~/components/CostChart'
import { MarketTrend } from '~/components/MarketTrend'
import { ScenariosPanel } from '~/components/ScenariosPanel'
import { AlertsPanel } from '~/components/AlertsPanel'
import { ProTools } from '~/components/ProTools'
import { CountUp } from '~/components/CountUp'
import {
  BarChart3,
  Info,
  Lock,
  TrendingDown,
  ArrowRightLeft,
  Download,
  Zap,
  LogOut,
  HelpCircle,
  ExternalLink,
  Share2,
  Check,
  Mail
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: FeeEdge,
})

type Market = 'futures' | 'spot'
type Tier = { volume: number; maker: number; taker: number }
type ExchangeData = {
  name: string
  key: string
  color: string
  futures: Tier[]
  spot: Tier[]
}

const EXCHANGES: ExchangeData[] = [
  {
    name: 'Binance', key: 'binance', color: 'text-yellow-400',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.0005 },
      { volume: 15000000, maker: 0.00016, taker: 0.00045 },
      { volume: 50000000, maker: 0.00014, taker: 0.0004 },
    ],
    spot: [{ volume: 0, maker: 0.001, taker: 0.001 }],
  },
  {
    name: 'Bybit', key: 'bybit', color: 'text-orange-400',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.00055 },
      { volume: 10000000, maker: 0.00018, taker: 0.00045 },
      { volume: 50000000, maker: 0.00015, taker: 0.0004 },
    ],
    spot: [{ volume: 0, maker: 0.001, taker: 0.001 }],
  },
  {
    name: 'Hyperliquid', key: 'hyperliquid', color: 'text-emerald-400',
    futures: [{ volume: 0, maker: 0.00015, taker: 0.00045 }],
    spot: [{ volume: 0, maker: 0.0004, taker: 0.0007 }],
  },
  {
    name: 'OKX', key: 'okx', color: 'text-white',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.0005 },
      { volume: 10000000, maker: 0.00015, taker: 0.0004 },
    ],
    spot: [{ volume: 0, maker: 0.0008, taker: 0.001 }],
  },
  {
    name: 'Gate.io', key: 'gateio', color: 'text-red-400',
    futures: [
      { volume: 0, maker: 0.00015, taker: 0.0005 },
      { volume: 10000000, maker: 0.00012, taker: 0.00045 },
    ],
    spot: [{ volume: 0, maker: 0.002, taker: 0.002 }],
  },
  {
    name: 'Bitget', key: 'bitget', color: 'text-cyan-400',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.0006 },
      { volume: 8000000, maker: 0.00016, taker: 0.0005 },
    ],
    spot: [{ volume: 0, maker: 0.001, taker: 0.001 }],
  },
  {
    name: 'KuCoin', key: 'kucoin', color: 'text-green-400',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.0006 },
      { volume: 5000000, maker: 0.00018, taker: 0.00055 },
    ],
    spot: [{ volume: 0, maker: 0.001, taker: 0.0012 }],
  },
  {
    name: 'MEXC', key: 'mexc', color: 'text-blue-400',
    futures: [{ volume: 0, maker: 0.0, taker: 0.0002 }],
    spot: [{ volume: 0, maker: 0.0, taker: 0.0005 }],
  },
  {
    name: 'Kraken', key: 'kraken', color: 'text-purple-400',
    futures: [
      { volume: 0, maker: 0.0002, taker: 0.0005 },
      { volume: 10000000, maker: 0.00015, taker: 0.0004 },
    ],
    spot: [{ volume: 0, maker: 0.0025, taker: 0.004 }],
  },
]

// Affiliate / referral signup links per exchange. Only rendered for exchanges
// that have an entry here. Update freely as you add programs.
const REFERRAL_LINKS: Record<string, string> = {
  binance: 'https://accounts.binance.com/register?ref=R1LOTHE0',
  bybit: 'https://www.bybit.com/invite?ref=XV0M2P&medium=referral&utm_campaign=evergreen',
  hyperliquid: 'https://app.hyperliquid.xyz/join/FEEEDGE',
  okx: 'https://okx.com/join/9729325',
  gateio:
    'https://www.gate.com/referral/earn-together/invite/UFlHUlkO?ref=UFlHUlkO&ref_type=103&utm_cmp=rXJBDjtJ&activity_id=1781161013843',
  mexc: 'https://promote.mexc.com/r/KpQwPUMlv7',
}

// Native-token / loyalty fee discounts. Many venues cut trading fees when you
// pay fees with (or hold) their token. Rates are typical estimates — actual
// discounts vary by tier and program terms.
const TOKEN_DISCOUNT: Record<string, { token: string; rate: number }> = {
  binance: { token: 'BNB', rate: 0.1 },
  okx: { token: 'OKB', rate: 0.2 },
  kucoin: { token: 'KCS', rate: 0.2 },
  gateio: { token: 'GT', rate: 0.15 },
  bitget: { token: 'BGB', rate: 0.2 },
}

// Relative effective-cost multiplier by asset liquidity. Less-liquid assets
// carry wider spreads/slippage, so their effective trading cost runs higher.
const ASSET_LIQUIDITY_MULTIPLIER: Record<string, number> = {
  BTC: 1.0,
  ETH: 1.02,
  SOL: 1.1,
  OTHER: 1.3,
}

const FREE_VISIBLE_COUNT = 3

// Monthly-volume slider: log-scaled across $100k–$100M so the whole range is
// usable. Slider runs 0–1000; values snap to 2 significant figures.
const VOL_MIN = 100_000
const VOL_MAX = 100_000_000
const volToSlider = (v: number) => {
  const lmin = Math.log10(VOL_MIN)
  const lmax = Math.log10(VOL_MAX)
  const clamped = Math.min(VOL_MAX, Math.max(VOL_MIN, v))
  return Math.round(((Math.log10(clamped) - lmin) / (lmax - lmin)) * 1000)
}
const sliderToVol = (s: number) => {
  const lmin = Math.log10(VOL_MIN)
  const lmax = Math.log10(VOL_MAX)
  const v = Math.pow(10, lmin + (s / 1000) * (lmax - lmin))
  const step = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1))
  return Math.round(v / step) * step
}

// PostHog event helper — retries briefly since posthog loads async (so events
// fired on mount don't get dropped before the script is ready). No-op if absent.
function phCapture(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const w = window as any
  let tries = 0
  const fire = () => {
    if (w.posthog?.capture) {
      w.posthog.capture(event, props)
    } else if (tries++ < 6) {
      setTimeout(fire, 800)
    }
  }
  fire()
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function FeeEdge() {
  const [monthlyVolume, setMonthlyVolume] = useState<number>(1000000)
  const [makerRatio, setMakerRatio] = useState<number>(0.5) // 0 to 1
  const [holdTime, setHoldTime] = useState<number>(4)
  const [market, setMarket] = useState<Market>('futures')

  // Auth + subscription state (server-backed).
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const { data: viewer } = useSuspenseQuery(convexQuery(api.users.viewer, {}))
  const { data: feeRates } = useSuspenseQuery(convexQuery(api.fees.getFeeRates, {}))
  const { data: fundingRates } = useSuspenseQuery(convexQuery(api.funding.getFundingRates, {}))
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
  const isPro = viewer?.isPro ?? false

  const [showSignIn, setShowSignIn] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SOL', 'OTHER'])
  const [showGuide, setShowGuide] = useState(false)
  const [tokenKeys, setTokenKeys] = useState<string[]>([])
  const toggleToken = (key: string) =>
    setTokenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  const [shareCopied, setShareCopied] = useState(false)

  // Load a shared scenario from ?s=<id> (public read-only link), applied once.
  const sharedId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('s')
      : null
  const { data: sharedScenario } = useQuery({
    ...convexQuery(api.scenarios.getByShareId, { shareId: sharedId ?? '' }),
    enabled: !!sharedId,
  })
  const sharedApplied = useRef(false)
  useEffect(() => {
    if (sharedScenario && !sharedApplied.current) {
      sharedApplied.current = true
      setMarket(sharedScenario.market as Market)
      setMonthlyVolume(sharedScenario.monthlyVolume)
      setMakerRatio(sharedScenario.makerRatio)
      setHoldTime(sharedScenario.holdTime)
      setSelectedAssets(sharedScenario.selectedAssets)
    }
  }, [sharedScenario])

  // Prefill the calculator from a shared profile URL (?v=&m=&mk=&h=&a=), once.
  const profileApplied = useRef(false)
  useEffect(() => {
    if (profileApplied.current || typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (![...p.keys()].some((k) => ['v', 'm', 'mk', 'h', 'a'].includes(k))) return
    profileApplied.current = true
    const v = Number(p.get('v'))
    if (v > 0) setMonthlyVolume(v)
    const m = p.get('m')
    if (m === 'spot' || m === 'futures') setMarket(m)
    const mk = Number(p.get('mk'))
    if (!Number.isNaN(mk) && mk >= 0 && mk <= 1) setMakerRatio(mk)
    const h = Number(p.get('h'))
    if (h > 0) setHoldTime(h)
    const a = p.get('a')
    if (a) {
      const assets = a.split(',').filter((x) => ['BTC', 'ETH', 'SOL', 'OTHER'].includes(x))
      if (assets.length) setSelectedAssets(assets)
    }
  }, [])

  // Capture ?ref= (influencer/referral code) once and persist it so it survives
  // sign-in and is attached to the Stripe checkout for attribution.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) {
      try {
        localStorage.setItem('feeedge_ref', ref.slice(0, 64))
      } catch {
        /* storage blocked — ignore */
      }
    }
  }, [])

  // Analytics: funnel entry + Stripe-return conversion (fires once on mount).
  useEffect(() => {
    if (typeof window === 'undefined') return
    phCapture('result_viewed', { market, monthlyVolume })
    if (new URLSearchParams(window.location.search).get('checkout') === 'success') {
      phCapture('pro_purchased')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleAsset = (asset: string) =>
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset],
    )

  // Build a shareable URL that pre-fills this exact profile for the recipient.
  const buildShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://feeedge.com'
    const q = new URLSearchParams({
      v: String(monthlyVolume),
      m: market,
      mk: makerRatio.toFixed(2),
      h: String(holdTime),
      a: selectedAssets.join(','),
    })
    return `${origin}/?${q.toString()}`
  }

  const handleShareSavings = async () => {
    phCapture('share_savings')
    const annual = Math.round(monthlySavings * 12)
    const text =
      annual > 0
        ? `I could save ~$${annual.toLocaleString()}/yr on crypto trading fees by using ${cheapest.name}. Find your cheapest exchange with FeeEdge:`
        : `I found my cheapest crypto exchange with FeeEdge. Find yours:`
    const url = buildShareUrl()
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'FeeEdge', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    } catch {
      /* user cancelled share or clipboard blocked — no-op */
    }
  }

  const handleUpgrade = async () => {
    phCapture('upgrade_clicked', { market, monthlyVolume })
    if (!isAuthenticated) {
      setShowSignIn(true)
      return
    }
    if (isPro) return
    try {
      setUpgrading(true)
      const ref =
        typeof window !== 'undefined'
          ? localStorage.getItem('feeedge_ref') ?? undefined
          : undefined
      const url = await createCheckoutSession(ref ? { ref } : {})
      window.location.href = url
    } catch (err) {
      console.error(err)
      setUpgrading(false)
      alert('Could not start checkout. Please try again.')
    }
  }

  // Live fee rates from Convex, keyed by "exchange:market".
  const liveMap = useMemo(() => {
    const m: Record<string, { maker: number; taker: number; source: string }> = {}
    for (const r of feeRates ?? []) {
      m[`${r.exchange}:${r.market}`] = {
        maker: r.makerFee,
        taker: r.takerFee,
        source: r.source ?? 'published',
      }
    }
    return m
  }, [feeRates])

  // Live BTC-perp funding rate per exchange (8h decimal).
  const fundingMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of fundingRates ?? []) m[r.exchange] = r.rate8h
    return m
  }, [fundingRates])

  const feeMeta = useMemo(() => {
    const rows = (feeRates ?? []).filter((r) => r.market === market)
    if (rows.length === 0) return null
    const liveCount = rows.filter((r) => r.source === 'live').length
    const lastUpdated = Math.max(...rows.map((r) => r.lastUpdated))
    return { liveCount, lastUpdated, total: rows.length }
  }, [feeRates, market])

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
      const tiers = ex[market]
      const currentTier = [...tiers].reverse().find(t => monthlyVolume >= t.volume) || tiers[0]
      const nextTier = tiers.find(t => t.volume > monthlyVolume)

      // Override the base-tier rate with the live fetched rate when available.
      const live = liveMap[`${ex.key}:${market}`]
      const onBaseTier = currentTier.volume === 0
      const baseMaker = live && onBaseTier ? live.maker : currentTier.maker
      const baseTaker = live && onBaseTier ? live.taker : currentTier.taker
      const rateSource = live && onBaseTier ? live.source : 'published'

      // Native-token discount (Pro): applies a loyalty discount to the rate.
      const tokenInfo = TOKEN_DISCOUNT[ex.key]
      const discount = isPro && tokenKeys.includes(ex.key) && tokenInfo ? tokenInfo.rate : 0
      const effMaker = baseMaker * (1 - discount)
      const effTaker = baseTaker * (1 - discount)

      const makerVolume = monthlyVolume * makerRatio
      const takerVolume = monthlyVolume * (1 - makerRatio)

      const monthlyFee = ((makerVolume * effMaker) + (takerVolume * effTaker)) * assetMultiplier

      // Funding only applies to perpetual futures, not spot.
      let monthlyFunding = 0
      if (market === 'futures') {
        const avgOI = (monthlyVolume / 2) / 30 / 24 * holdTime
        // Live per-exchange funding magnitude (8h), else a 0.01% estimate.
        const fundingRatePer8h = Math.abs(fundingMap[ex.key] ?? 0.0001)
        monthlyFunding = (avgOI * fundingRatePer8h) * (30 * 24 / 8)
      }

      const includeFunding = isPro && market === 'futures'
      return {
        ...ex,
        currentTier,
        nextTier,
        effMaker,
        effTaker,
        rateSource,
        token: tokenInfo?.token ?? null,
        discount,
        monthlyFee,
        monthlyFunding,
        totalMonthly: monthlyFee + (includeFunding ? monthlyFunding : 0)
      }
    }).sort((a, b) => a.totalMonthly - b.totalMonthly)
  }, [monthlyVolume, makerRatio, holdTime, isPro, assetMultiplier, liveMap, market, fundingMap, tokenKeys])

  const visibleResults = isPro ? results : results.slice(0, FREE_VISIBLE_COUNT)
  const hiddenResults = isPro ? [] : results.slice(FREE_VISIBLE_COUNT)
  const cheapest = results[0]
  const mostExpensive = results[results.length - 1]
  const monthlySavings = mostExpensive.totalMonthly - cheapest.totalMonthly

  // Series for the cost-vs-volume chart (same exchanges currently visible).
  const chartSeries = useMemo(() => {
    const xMin = 100000
    const xMax = 100000000
    const N = 24
    const vols = Array.from({ length: N }, (_, i) =>
      Math.pow(10, Math.log10(xMin) + (i / (N - 1)) * (Math.log10(xMax) - Math.log10(xMin))),
    )
    return visibleResults.map((ex) => ({
      name: ex.name,
      colorClass: ex.color,
      points: vols.map((vol) => {
        const tiers = ex[market]
        const tier = [...tiers].reverse().find((t) => vol >= t.volume) || tiers[0]
        const live = liveMap[`${ex.key}:${market}`]
        const onBase = tier.volume === 0
        const disc = isPro && tokenKeys.includes(ex.key) && TOKEN_DISCOUNT[ex.key] ? TOKEN_DISCOUNT[ex.key].rate : 0
        const effMaker = (live && onBase ? live.maker : tier.maker) * (1 - disc)
        const effTaker = (live && onBase ? live.taker : tier.taker) * (1 - disc)
        const fee =
          (vol * makerRatio * effMaker + vol * (1 - makerRatio) * effTaker) * assetMultiplier
        let funding = 0
        if (market === 'futures') {
          const avgOI = (vol / 2) / 30 / 24 * holdTime
          funding = avgOI * Math.abs(fundingMap[ex.key] ?? 0.0001) * (30 * 24 / 8)
        }
        const total = fee + (isPro && market === 'futures' ? funding : 0)
        return { x: vol, y: total }
      }),
    }))
  }, [visibleResults, market, makerRatio, assetMultiplier, holdTime, isPro, liveMap, fundingMap, tokenKeys])

  // CSV export (Pro): the full visible results table as a downloadable file.
  const handleExportCsv = () => {
    phCapture('export', { type: 'csv', market, monthlyVolume })
    const header = ['Rank', 'Exchange', 'Maker %', 'Taker %', 'Token Discount', 'Trading Fees (mo)', 'Funding Est (mo)', 'Total Monthly']
    const lines = visibleResults.map((ex, i) => [
      i + 1,
      ex.name,
      (ex.effMaker * 100).toFixed(4),
      (ex.effTaker * 100).toFixed(4),
      ex.discount ? `${Math.round(ex.discount * 100)}% ${ex.token}` : '',
      ex.monthlyFee.toFixed(2),
      market === 'futures' ? ex.monthlyFunding.toFixed(2) : '',
      ex.totalMonthly.toFixed(2),
    ])
    const csv = [header, ...lines]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feeedge-${market}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    phCapture('export', { type: 'pdf', market, monthlyVolume })
    const generatedAt = new Date().toLocaleString()
    const assets = selectedAssets.length ? selectedAssets.join(', ') : 'None'
    const rows = visibleResults
      .map(
        (ex, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${ex.name}</td>
            <td>${(ex.effMaker * 100).toFixed(3)}%</td>
            <td>${(ex.effTaker * 100).toFixed(3)}%</td>
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
        <strong>Market:</strong> ${market === 'futures' ? 'Perpetual futures' : 'Spot'}<br/>
        <strong>Monthly volume:</strong> $${monthlyVolume.toLocaleString()}<br/>
        <strong>Execution:</strong> ${Math.round(makerRatio * 100)}% maker / ${Math.round((1 - makerRatio) * 100)}% taker<br/>
        <strong>Avg hold time:</strong> ${holdTime}h<br/>
        <strong>Assets:</strong> ${assets}<br/>
        <strong>Plan:</strong> ${isPro ? 'Pro (all exchanges)' : 'Free (top 3 shown)'}<br/>
        <strong>Native-token discounts:</strong> ${isPro && tokenKeys.length ? `${tokenKeys.length} applied` : 'Off'}
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
    <div
      className="min-h-screen text-zinc-300 font-sans selection:bg-emerald-500/30"
      style={{
        backgroundColor: '#06140e',
        backgroundImage:
          'radial-gradient(55rem 26rem at 50% -7rem, rgba(16,185,129,0.12), transparent 70%)',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0a1a13] px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark.png" width="34" height="34" alt="FeeEdge" className="shrink-0 rounded-lg" />
          <h1 className="text-xl font-black tracking-tight text-white">FeeEdge</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          <div
            className="hidden sm:flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
            title={feeMeta ? `${feeMeta.liveCount} live · ${feeMeta.total} tracked · updated ${timeAgo(feeMeta.lastUpdated)}` : 'Using built-in rates'}
          >
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {feeMeta ? `UPDATED ${timeAgo(feeMeta.lastUpdated)}` : 'FEE DATA'}
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading || isPro}
            className="bg-zinc-100 text-black px-3 py-1.5 rounded font-bold hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <Zap size={14} fill="currentColor" />
            {isPro ? 'PRO ACTIVE' : upgrading ? '…' : (
              <>
                <span className="sm:hidden">Pro</span>
                <span className="hidden sm:inline">UPGRADE TO PRO</span>
              </>
            )}
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
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

      {/* Hero tagline */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-2 text-center">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
          The cheapest exchange for{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            how you trade
          </span>
        </h2>
        <p className="text-sm md:text-base text-zinc-400 mt-4 max-w-2xl mx-auto">
          Personalized fee rankings across {EXCHANGES.length} venues in 10 seconds — perps &amp; spot, tuned to your volume and style.
        </p>
      </div>

      {/* Pro value-prop banner (free users), led by the savings number */}
      {!isPro && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-zinc-900/40 to-zinc-900/40 border border-emerald-500/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                FeeEdge Pro · $29 once · no subscription
              </p>
              <h2 className="text-white font-bold text-xl mt-1">
                {monthlySavings > 0 ? (
                  <>Stop overpaying — traders at your volume leave up to <span className="text-emerald-400"><CountUp value={Math.round(monthlySavings * 12)} prefix="$" />/yr</span> on the table</>
                ) : (
                  <>See your true cost across all 9 venues — and stop overpaying on fees</>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5">
                Unlock all {EXCHANGES.length} exchanges, the funding-rate optimizer, native-token discounts, withdrawal-fee comparison, the tier savings ladder, unlimited saved scenarios, price alerts, and PDF/CSV export.
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="shrink-0 bg-emerald-500 text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center gap-2"
            >
              <Zap size={15} fill="currentColor" />
              {upgrading ? 'Redirecting…' : 'Unlock Pro for $29'}
            </button>
          </div>
        </div>
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
                <label className="block text-xs text-zinc-400 mb-2 uppercase">Market</label>
                <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded p-1">
                  {(['futures', 'spot'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMarket(m)}
                      className={`flex-1 px-3 py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        market === m
                          ? 'bg-emerald-500 text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m === 'futures' ? 'Perps' : 'Spot'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="block text-xs text-zinc-400 uppercase">Monthly Volume (USD)</label>
                  <span className="text-base font-bold text-white font-mono">${monthlyVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={1}
                  value={volToSlider(monthlyVolume)}
                  onChange={(e) => setMonthlyVolume(sliderToVol(Number(e.target.value)))}
                  className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[11px] text-zinc-400">$100k</span>
                  <span className="text-[11px] text-zinc-400">$100M+</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-2 uppercase">Execution Style (Maker vs Taker)</label>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-zinc-400">TAKER</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={makerRatio}
                    onChange={(e) => setMakerRatio(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-400">MAKER</span>
                </div>
                <div className="text-center mt-2 text-xs font-bold text-emerald-500">
                  {Math.round(makerRatio * 100)}% Limit Orders
                </div>
              </div>

              <div className={market === 'spot' ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-xs text-zinc-400 mb-2 uppercase">
                  Avg Hold Time (Hours){market === 'spot' ? ' — perps only' : ''}
                </label>
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
                Save <CountUp value={Math.round(monthlySavings)} prefix="$" />/mo
              </p>
              <p className="text-zinc-400 text-xs mt-1">
                By switching from {mostExpensive.name} to {cheapest.name}
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase">Annual Savings</div>
                  <div className="text-lg font-bold text-emerald-400"><CountUp value={Math.round(monthlySavings * 12)} prefix="$" /></div>
                </div>
                <TrendingDown className="text-emerald-500" size={24} />
              </div>
              <button
                onClick={handleShareSavings}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                {shareCopied ? (
                  <>
                    <Check size={14} /> Link copied!
                  </>
                ) : (
                  <>
                    <Share2 size={14} /> Share my savings
                  </>
                )}
              </button>
            </div>
          </section>

          <ScenariosPanel
            current={{ market, monthlyVolume, makerRatio, holdTime, selectedAssets }}
            isAuthenticated={isAuthenticated}
            onRequireSignIn={() => setShowSignIn(true)}
            onLoad={(s) => {
              setMarket(s.market as Market)
              setMonthlyVolume(s.monthlyVolume)
              setMakerRatio(s.makerRatio)
              setHoldTime(s.holdTime)
              setSelectedAssets(s.selectedAssets)
            }}
          />

          <AlertsPanel
            current={{ market, monthlyVolume, makerRatio, holdTime, selectedAssets }}
            isPro={isPro}
            isAuthenticated={isAuthenticated}
            onRequireSignIn={() => setShowSignIn(true)}
            onUpgrade={handleUpgrade}
          />
        </aside>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
              Exchange Comparison
              <span className="text-[11px] whitespace-nowrap bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-mono">{EXCHANGES.length} · {market === 'futures' ? 'Perps' : 'Spot'} · by Cost</span>
            </h2>
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => setShowGuide((v) => !v)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <HelpCircle size={14} />
                How to use
              </button>
              <button
                onClick={handleExportPdf}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Download size={14} />
                PDF
              </button>
              <button
                onClick={isPro ? handleExportCsv : handleUpgrade}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                title={isPro ? 'Download CSV' : 'CSV export is a Pro feature'}
              >
                <Download size={14} />
                CSV {!isPro && <Lock size={10} />}
              </button>
            </div>
          </div>

          {/* Native-token fee discounts (Pro) — select the tokens you actually hold */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
            <div className="text-xs mb-2.5">
              <span className="text-zinc-200 font-bold flex items-center gap-1">
                Native-token fee discounts {!isPro && <Lock size={11} className="text-zinc-400" />}
              </span>
              <span className="text-[11px] text-zinc-400">
                Tap the exchange tokens you hold — the discount applies to that venue only.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXCHANGES.filter((ex) => TOKEN_DISCOUNT[ex.key]).map((ex) => {
                const info = TOKEN_DISCOUNT[ex.key]
                const active = isPro && tokenKeys.includes(ex.key)
                return (
                  <button
                    key={ex.key}
                    onClick={() => (isPro ? toggleToken(ex.key) : handleUpgrade())}
                    title={`${ex.name}: −${Math.round(info.rate * 100)}% when you pay fees with ${info.token}`}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-black border-zinc-800 text-zinc-400 hover:border-emerald-500'
                    }`}
                  >
                    {ex.name} · {info.token} −{Math.round(info.rate * 100)}%
                  </button>
                )
              })}
            </div>
          </div>

          {/* How to read this */}
          {showGuide && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-xs text-zinc-400 space-y-4">
              <div className="space-y-2">
                <p className="text-zinc-300 font-bold uppercase tracking-widest text-[11px]">How to use FeeEdge</p>
                <ol className="space-y-1.5 list-decimal list-inside marker:text-emerald-400 marker:font-bold">
                  <li>Set your <span className="text-zinc-200">Trader Profile</span> (left) — monthly volume, maker/taker mix, average hold time, and the assets you trade.</li>
                  <li>Choose <span className="text-zinc-200">Perps</span> or <span className="text-zinc-200">Spot</span> to match the market you trade.</li>
                  <li>FeeEdge ranks every exchange by your real estimated monthly cost — <span className="text-emerald-400 font-bold">#1 is the cheapest for you</span>.</li>
                  <li>Save a setup, share it with a link, or get an email alert when a cheaper venue appears (Pro), and export the table to PDF.</li>
                </ol>
              </div>
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <p className="text-zinc-300 font-bold uppercase tracking-widest text-[11px]">Reading the table</p>
                <p><span className="text-emerald-400 font-bold">Ranking (#1, #2…):</span> exchanges sorted cheapest → most expensive for your exact profile. #1 (highlighted) is your best venue.</p>
                <p><span className="text-emerald-400 font-bold">M / T:</span> Maker and Taker fee rates at your current volume tier. <span className="text-zinc-300">Maker</span> = limit orders that add liquidity (cheaper); <span className="text-zinc-300">Taker</span> = market orders that remove it (pricier). The slider sets your mix.</p>
                <p><span className="text-emerald-400 font-bold">Trading Fees:</span> estimated monthly cost = volume × your blended maker/taker rate × the selected-asset multiplier.</p>
                <p><span className="text-emerald-400 font-bold">Funding Est. (Pro, perps only):</span> estimated monthly perpetual-funding cost, from your average hold time and live funding rates.</p>
                <p><span className="text-emerald-400 font-bold">Total Monthly:</span> what you'd pay — trading fees, plus funding on Pro perps.</p>
                <p><span className="text-emerald-400 font-bold">Next Tier bar:</span> how close you are to an exchange's next volume discount, and the extra you'd save.</p>
              </div>
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <p className="text-zinc-300 font-bold uppercase tracking-widest text-[11px]">Pro tools</p>
                <p><span className="text-emerald-400 font-bold">Native-token discount:</span> toggle it on to recompute every rate as if you pay fees with each venue's token (BNB, OKB, KCS, GT, BGB). Rows show the discount applied — this is your true cost if you hold the token.</p>
                <p><span className="text-emerald-400 font-bold">Funding-rate optimizer (perps):</span> live 8h funding by venue, with the cheapest place to hold a long vs a short. Positive funding = longs pay shorts.</p>
                <p><span className="text-emerald-400 font-bold">Withdrawal fees:</span> typical on-chain withdrawal cost per asset and network (USDT TRC20/ERC20, BTC, ETH) — a real cost the fee table alone misses.</p>
                <p><span className="text-emerald-400 font-bold">Tier savings ladder:</span> where a little more volume unlocks a cheaper tier, ranked by the biggest monthly saving.</p>
                <p><span className="text-emerald-400 font-bold">CSV export:</span> download the full comparison (rates, discount, fees, funding, totals) for your own spreadsheets.</p>
              </div>
              <p className="text-zinc-400 italic">Free shows the 3 cheapest venues; Pro unlocks all {EXCHANGES.length} exchanges plus funding estimates, the native-token discount, the funding optimizer, withdrawal-fee comparison, the tier savings ladder, unlimited saved scenarios, price alerts, and PDF/CSV export. All figures are estimates — not financial advice.</p>
            </div>
          )}

          <div className="space-y-3">
            {visibleResults.map((ex, idx) => (
              <div
                key={ex.name}
                className={`relative overflow-hidden bg-zinc-900/50 border ${idx === 0 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800'} rounded-xl p-5 pl-6 hover:border-zinc-700 transition-all`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ex.color}`} style={{ backgroundColor: 'currentColor' }} />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-zinc-700 w-6">#{idx + 1}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-bold ${ex.color}`}>{ex.name}</h3>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-1.5 py-0.5 rounded">
                            Cheapest
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[11px] text-zinc-400">
                          M: <span className="text-zinc-300 font-mono">{(ex.effMaker * 100).toFixed(3)}%</span>
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          T: <span className="text-zinc-300 font-mono">{(ex.effTaker * 100).toFixed(3)}%</span>
                        </span>
                      </div>
                      {ex.discount > 0 && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          −{Math.round(ex.discount * 100)}% with {ex.token}
                        </span>
                      )}
                      {REFERRAL_LINKS[ex.key] && (
                        <a
                          href={REFERRAL_LINKS[ex.key]}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                            idx === 0
                              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                              : 'border border-zinc-700 text-zinc-200 hover:border-emerald-500 hover:text-emerald-400'
                          }`}
                        >
                          Open account <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    <div className="text-right">
                      <div className="text-[11px] text-zinc-400 uppercase">Trading Fees</div>
                      <div className="text-sm font-bold text-white font-mono">${ex.monthlyFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </div>
                    {market === 'spot' ? (
                      <div className="text-right border-l border-zinc-800 pl-4 md:pl-8 opacity-50">
                        <div className="text-[11px] text-zinc-400 uppercase">Funding</div>
                        <div className="text-xs text-zinc-400 italic">N/A (spot)</div>
                      </div>
                    ) : isPro ? (
                      <div className="text-right border-l border-zinc-800 pl-4 md:pl-8">
                        <div className="text-[11px] text-zinc-400 uppercase">Funding Est.</div>
                        <div className="text-sm font-bold text-zinc-400">${ex.monthlyFunding.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </div>
                    ) : (
                      <div className="text-right border-l border-zinc-800 pl-4 md:pl-8 opacity-40">
                        <div className="text-[11px] text-zinc-400 uppercase flex items-center justify-end gap-1">
                          Funding <Lock size={8} />
                        </div>
                        <div className="text-xs text-zinc-400 italic">Pro Feature</div>
                      </div>
                    )}
                    <div className="text-right md:border-l border-zinc-800 md:pl-8 col-span-2 md:col-span-1 border-t md:border-t-0 pt-2 md:pt-0">
                      <div className="text-[11px] text-emerald-500 uppercase font-bold">Total Monthly</div>
                      <div className="text-2xl font-black text-white"><CountUp value={ex.totalMonthly} prefix="$" decimals={2} /></div>
                    </div>
                  </div>
                </div>

                {/* Tier Progress */}
                {ex.nextTier && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-zinc-400">Next Tier: ${(ex.nextTier.volume / 1000000).toFixed(1)}M Vol</span>
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
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 transition-colors">
                    <Lock size={20} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold">Unlock All {EXCHANGES.length} Exchanges & Pro Tools</h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      {hiddenResults.length} more {hiddenResults.length === 1 ? 'exchange is' : 'exchanges are'} restricted{hiddenResults.length ? `: ${hiddenResults.map((e) => e.name).join(', ')}` : ''}.
                    </p>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-zinc-300 w-full max-w-md">
                    {[
                      `All ${EXCHANGES.length} exchanges ranked for you`,
                      'Funding-rate optimizer (perps)',
                      'Native-token fee discounts',
                      'Withdrawal-fee comparison',
                      'Tier savings ladder',
                      'Unlimited saved scenarios',
                      'Email price alerts',
                      'PDF & CSV export',
                    ].map((b) => (
                      <li key={b} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span> {b}
                      </li>
                    ))}
                  </ul>

                  {hiddenResults.some((e) => REFERRAL_LINKS[e.key]) && (
                    <div className="w-full max-w-md text-center">
                      <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2">
                        Or open an account directly
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {hiddenResults
                          .filter((e) => REFERRAL_LINKS[e.key])
                          .map((e) => (
                            <a
                              key={e.key}
                              href={REFERRAL_LINKS[e.key]}
                              target="_blank"
                              rel="sponsored noopener noreferrer"
                              onClick={(ev) => ev.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-bold text-zinc-200 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              {e.name} <ExternalLink size={12} />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpgrade()
                    }}
                    disabled={upgrading}
                    className="bg-emerald-500 text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {upgrading ? 'Redirecting…' : 'Unlock All for $29 · one-time'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cost vs Volume chart */}
          <CostChart series={chartSeries} xMin={100000} xMax={100000000} />

          {/* Pro trading tools: funding optimizer, withdrawal fees, tier ladder (Pro) */}
          <ProTools
            isPro={isPro}
            market={market}
            results={results}
            fundingMap={fundingMap}
            monthlyVolume={monthlyVolume}
            makerRatio={makerRatio}
            assetMultiplier={assetMultiplier}
            onUpgrade={handleUpgrade}
          />

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
                      className={`px-3 py-1 rounded text-[11px] font-bold border transition-colors ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-black border-zinc-800 text-zinc-400 hover:border-emerald-500'
                      }`}
                    >
                      {asset}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-start gap-2 text-[11px] text-zinc-400 bg-black/50 p-2 rounded">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>Selected assets apply a liquidity-based cost multiplier (BTC lowest, alts higher).</span>
              </div>
            </div>

            <MarketTrend />
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-6 border-t border-zinc-800/50 mt-12 text-center">
        <p className="text-[11px] text-zinc-400">
          Maker/taker rates are refreshed periodically and shown as estimates. "Open account" links are affiliate links — FeeEdge may earn a commission at no cost to you.
          <br />© {new Date().getFullYear()} FeeEdge Analytics. Not financial advice.
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 flex-wrap">
          <a
            href="https://x.com/fee_edge"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FeeEdge on X"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @fee_edge
          </a>
          <a
            href="mailto:support@feeedge.com"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <Mail size={14} />
            support@feeedge.com
          </a>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 flex-wrap text-[11px] text-zinc-400">
          <Link to="/compare" className="hover:text-white transition-colors">Compare fees</Link>
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/refunds" className="hover:text-white transition-colors">Refunds</Link>
        </div>
      </footer>
    </div>
  )
}
