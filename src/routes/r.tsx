import { createFileRoute, Link } from '@tanstack/react-router'
import { ShareButtons } from '~/components/ShareButtons'

// Personalized share landing. The calculator's "share" buttons point here with
// the trader's profile + computed savings in the query string. This route is
// server-rendered, so its <head> (set from the loader below) carries a
// per-result og:image — the dynamic card at /api/og — which makes the link
// unfurl as "You could save $X/yr switching to <exchange>" on X, Telegram, etc.
// The page itself nudges the recipient into running their OWN numbers.

type ShareSearch = {
  v: number
  m: 'futures' | 'spot'
  mk: number
  h: number
  a: string
  save: number
  top: string
}

const SITE = 'https://feeedge.com'

const toNum = (x: unknown, fallback = 0) => {
  const n = Number(x)
  return Number.isFinite(n) ? n : fallback
}

const fmtUsd = (n: number) => `$${Math.max(0, Math.round(n)).toLocaleString('en-US')}`

const fmtVolume = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n)}`
}

export const Route = createFileRoute('/r')({
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    v: Math.min(Math.max(toNum(search.v, 1_000_000), 0), 1_000_000_000),
    m: search.m === 'spot' ? 'spot' : 'futures',
    mk: Math.min(Math.max(toNum(search.mk, 0.5), 0), 1),
    h: Math.min(Math.max(toNum(search.h, 4), 0), 720),
    a: typeof search.a === 'string' ? search.a.slice(0, 40) : '',
    save: Math.min(Math.max(Math.round(toNum(search.save, 0)), 0), 100_000_000),
    top: typeof search.top === 'string' ? search.top.slice(0, 40) : '',
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    const market = deps.m === 'spot' ? 'spot' : 'perps'
    const makerPct = Math.round(deps.mk * 100)
    const top = deps.top || 'a cheaper exchange'
    const hasSave = deps.save > 0

    const ogParams = new URLSearchParams({
      save: String(deps.save),
      top,
      v: String(deps.v),
      m: deps.m,
      mk: deps.mk.toFixed(2),
    })
    const ogImage = `${SITE}/api/og?${ogParams.toString()}`

    const shareParams = new URLSearchParams({
      v: String(deps.v),
      m: deps.m,
      mk: deps.mk.toFixed(2),
      h: String(deps.h),
      a: deps.a,
      save: String(deps.save),
      top,
    })
    const shareUrl = `${SITE}/r?${shareParams.toString()}`

    // The recipient's "run my own numbers" link — prefills the calculator with
    // this profile (without the precomputed savings, so they see their own).
    const calcParams = new URLSearchParams({
      v: String(deps.v),
      m: deps.m,
      mk: deps.mk.toFixed(2),
      h: String(deps.h),
      a: deps.a,
    })
    const calcUrl = `/?${calcParams.toString()}`

    const title = hasSave
      ? `Save ${fmtUsd(deps.save)}/yr on crypto fees — FeeEdge`
      : 'Find your cheapest crypto exchange — FeeEdge'
    const description = hasSave
      ? `A ${market} trader at ${fmtVolume(deps.v)} monthly volume could save about ${fmtUsd(deps.save)} a year by switching to ${top}. Run your own numbers across 20 exchanges, free.`
      : 'Compare real trading fees across 20 crypto exchanges, ranked for your volume and style. Free.'
    const shareText = hasSave
      ? `I could save ~${fmtUsd(deps.save)}/yr on crypto trading fees by using ${top}. Find your cheapest exchange with FeeEdge:`
      : 'I found my cheapest crypto exchange with FeeEdge. Find yours:'

    return {
      market,
      makerPct,
      top,
      hasSave,
      save: deps.save,
      volumeLabel: fmtVolume(deps.v),
      ogImage,
      shareUrl,
      calcUrl,
      title,
      description,
      shareText,
    }
  },
  head: ({ loaderData }) => {
    const d = loaderData
    if (!d) return { meta: [{ title: 'FeeEdge' }] }
    return {
      meta: [
        { title: d.title },
        { name: 'description', content: d.description },
        // These share landings are infinite param combinations — keep them out
        // of the index, but let crawlers follow the links on them.
        { name: 'robots', content: 'noindex, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'FeeEdge' },
        { property: 'og:title', content: d.title },
        { property: 'og:description', content: d.description },
        { property: 'og:url', content: d.shareUrl },
        { property: 'og:image', content: d.ogImage },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: d.title },
        { name: 'twitter:description', content: d.description },
        { name: 'twitter:image', content: d.ogImage },
      ],
    }
  },
  component: SharePage,
})

function SharePage() {
  const d = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-[#07100c] text-zinc-100">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
        <Link to="/" className="text-lg font-bold tracking-tight text-zinc-100">
          Fee<span className="text-emerald-400">Edge</span>
        </Link>

        {d.hasSave ? (
          <>
            <p className="mt-12 text-2xl font-semibold text-zinc-300">A trader just found they could save</p>
            <p className="mt-2 text-6xl font-extrabold leading-none text-emerald-400 sm:text-7xl">
              {fmtUsd(d.save)}/yr
            </p>
            <p className="mt-4 text-xl text-zinc-300">
              switching to <span className="font-semibold text-zinc-100">{d.top}</span>
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {d.volumeLabel} monthly &middot; {d.market} &middot; {d.makerPct}% maker
            </p>
          </>
        ) : (
          <>
            <p className="mt-12 text-4xl font-extrabold leading-tight text-zinc-100 sm:text-5xl">
              Find the cheapest crypto exchange for <span className="text-emerald-400">how you trade</span>
            </p>
            <p className="mt-4 text-lg text-zinc-400">
              Real trading fees across 20 exchanges, ranked for your volume and style.
            </p>
          </>
        )}

        <p className="mt-10 max-w-md text-base text-zinc-400">
          Fees quietly eat your returns. FeeEdge ranks all 20 major exchanges by what you would
          actually pay, so you can stop overpaying. It is free to run your numbers.
        </p>

        <a
          href={d.calcUrl}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-3.5 text-base font-bold text-[#07100c] transition-colors hover:bg-emerald-300"
        >
          Find your cheapest exchange
        </a>

        <div className="mt-10 w-full border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-500">Share this</p>
          <ShareButtons text={d.shareText} url={d.shareUrl} />
        </div>

        <p className="mt-10 text-xs text-zinc-600">
          Estimates based on published fees. Not financial advice. feeedge.com
        </p>
      </div>
    </div>
  )
}
