import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import { ExchangeLogo } from '~/components/ExchangeLogo'
import {
  EXCHANGES,
  exchangeBySlug,
  allPairs,
  pairSlug,
  pct,
  type Exchange,
} from '~/data/exchanges'

export const Route = createFileRoute('/exchanges/$slug')({
  head: ({ params }) => {
    const e = params && params.slug ? exchangeBySlug(params.slug) : undefined
    if (!e) return { meta: [{ title: 'Exchange fees — FeeEdge' }] }
    const title = `${e.name} fees (2026): maker, taker, spot & futures`
    const description = `${e.name} trading fees explained — maker/taker rates for perpetual futures and spot, native-token discounts, and how ${e.name} compares to other crypto exchanges.`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `https://feeedge.com/exchanges/${e.slug}` },
      ],
    }
  },
  component: ExchangePage,
  notFoundComponent: () => (
    <LegalPage title="Exchange not found">
      <p>
        We couldn't find that exchange. See all{' '}
        <a href="/exchanges">crypto exchange fee pages</a>.
      </p>
    </LegalPage>
  ),
})

// Rank (1 = cheapest) of an exchange by a given taker rate across all venues.
function rankByTaker(e: Exchange, key: 'futures' | 'spot'): number {
  const sorted = [...EXCHANGES].sort((x, y) => x[key].taker - y[key].taker)
  return sorted.findIndex((x) => x.slug === e.slug) + 1
}

function ExchangePage() {
  const { slug } = Route.useParams()
  const e = exchangeBySlug(slug)
  if (!e) throw notFound()

  const perpsRank = rankByTaker(e, 'futures')
  const spotRank = rankByTaker(e, 'spot')
  const cheapestPerps = [...EXCHANGES].sort((x, y) => x.futures.taker - y.futures.taker)[0]
  const cheapestSpot = [...EXCHANGES].sort((x, y) => x.spot.taker - y.spot.taker)[0]

  // Comparisons that involve this exchange.
  const comparisons = allPairs()
    .filter(([x, y]) => x.slug === e.slug || y.slug === e.slug)
    .map(([x, y]) => (x.slug === e.slug ? y : x))

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What are ${e.name}'s trading fees?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${e.name} charges roughly ${pct(e.futures.maker)} maker / ${pct(e.futures.taker)} taker on perpetual futures and ${pct(e.spot.maker)} maker / ${pct(e.spot.taker)} taker on spot at the entry tier. Fees drop as your 30-day volume rises.`,
        },
      },
      {
        '@type': 'Question',
        name: `Does ${e.name} have a fee discount?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: e.token
            ? `Yes — ${e.name} discounts trading fees by about ${Math.round((e.tokenDiscount || 0) * 100)}% if you hold or pay fees with ${e.token}.`
            : `${e.name} does not offer a native-token fee discount, but fees still fall as your 30-day trading volume increases.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${e.name} the cheapest crypto exchange?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `On base-tier perpetual futures ${e.name} ranks #${perpsRank} of ${EXCHANGES.length} by taker fee, and #${spotRank} on spot. The cheapest venue for you depends on your volume and maker/taker mix — the FeeEdge calculator ranks all ${EXCHANGES.length} for your profile.`,
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://feeedge.com/' },
      { '@type': 'ListItem', position: 2, name: 'Exchanges', item: 'https://feeedge.com/exchanges' },
      { '@type': 'ListItem', position: 3, name: e.name, item: `https://feeedge.com/exchanges/${e.slug}` },
    ],
  }

  return (
    <LegalPage title={`${e.name} trading fees`}>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <p style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ExchangeLogo slug={e.slug} name={e.name} colorClass={e.colorClass} size={28} />
        <span className={e.colorClass} style={{ fontWeight: 800, fontSize: '18px' }}>{e.name}</span>
      </p>

      <p>
        Here are <strong>{e.name}</strong>'s published entry-tier trading fees for both perpetual futures
        and spot, plus how {e.name} stacks up against the other {EXCHANGES.length} major exchanges. To see
        your real monthly cost on {e.name} for your exact volume and trading style, run the{' '}
        <a href="/">FeeEdge calculator</a>.
      </p>

      <h2>{e.name} fee schedule</h2>
      <FeeTable e={e} />
      <p style={{ fontSize: '13px' }}>
        Rates shown are published base-tier estimates and may change — always confirm on {e.name}.
        Maker = limit orders that add liquidity (cheaper); taker = market orders that remove it.
      </p>

      <h2>How {e.name} compares</h2>
      <p>
        On <strong>perpetual futures</strong>, {e.name}'s {pct(e.futures.taker)} base taker fee ranks{' '}
        <strong>#{perpsRank} of {EXCHANGES.length}</strong>
        {perpsRank === 1
          ? ' — the cheapest of the venues we track.'
          : ` (the cheapest is ${cheapestPerps.name} at ${pct(cheapestPerps.futures.taker)}).`}{' '}
        On <strong>spot</strong>, {e.name} ranks <strong>#{spotRank}</strong>
        {spotRank === 1
          ? ' — the cheapest spot venue we track.'
          : ` (cheapest is ${cheapestSpot.name} at ${pct(cheapestSpot.spot.taker)}).`}{' '}
        Volume tiers, maker rebates{e.token ? `, and the ${e.token} discount` : ''} can change this for
        active traders.
      </p>

      {e.token && (
        <>
          <h2>{e.name} native-token discount ({e.token})</h2>
          <p>
            {e.name} cuts trading fees by roughly{' '}
            <strong>{Math.round((e.tokenDiscount || 0) * 100)}%</strong> if you hold or pay fees with{' '}
            <strong>{e.token}</strong>. If you trade on {e.name} regularly, that's a meaningful, recurring
            saving — the FeeEdge calculator lets you toggle the {e.token} discount on to see your adjusted
            cost.
          </p>
        </>
      )}

      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          See your cost on {e.name} →
        </a>
      </p>

      {e.referral && (
        <>
          <h2>Open a {e.name} account</h2>
          <p>
            <a href={e.referral} target="_blank" rel="sponsored noopener noreferrer">
              Open a {e.name} account
            </a>{' '}
            <span style={{ fontSize: '12px' }}>
              (affiliate link — FeeEdge may earn a commission at no extra cost to you).
            </span>
          </p>
        </>
      )}

      <h2>FAQ</h2>
      <h3>What are {e.name}'s trading fees?</h3>
      <p>
        {e.name} charges roughly {pct(e.futures.maker)} maker / {pct(e.futures.taker)} taker on perpetual
        futures and {pct(e.spot.maker)} maker / {pct(e.spot.taker)} taker on spot at the entry tier. Fees
        drop as your 30-day volume rises.
      </p>
      <h3>Does {e.name} have a fee discount?</h3>
      <p>
        {e.token
          ? `Yes — ${e.name} discounts trading fees by about ${Math.round((e.tokenDiscount || 0) * 100)}% if you hold or pay fees with ${e.token}.`
          : `${e.name} does not offer a native-token fee discount, but fees still fall as your 30-day trading volume increases.`}
      </p>
      <h3>Is {e.name} the cheapest crypto exchange?</h3>
      <p>
        On base-tier perps {e.name} ranks #{perpsRank} of {EXCHANGES.length} by taker fee, and #{spotRank}{' '}
        on spot. The cheapest venue for <em>you</em> depends on your volume and maker/taker mix — check it
        in the <a href="/">calculator</a>.
      </p>

      <h2>Compare {e.name} with other exchanges</h2>
      <ul>
        {comparisons.map((o) => (
          <li key={o.slug}>
            <Link to="/compare/$pair" params={{ pair: pairSlug(e, o) }}>
              {e.name} vs {o.name} fees
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <a href="/exchanges">← All exchange fee pages</a> · <a href="/compare">All comparisons</a>
      </p>
    </LegalPage>
  )
}

function FeeTable({ e }: { e: Exchange }) {
  const rows: Array<[string, number]> = [
    ['Perps maker', e.futures.maker],
    ['Perps taker', e.futures.taker],
    ['Spot maker', e.spot.maker],
    ['Spot taker', e.spot.taker],
  ]
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontWeight: 600 }}>Fee</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>{e.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, v]) => (
            <tr key={label}>
              <td style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>{label}</td>
              <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', fontFamily: 'var(--font-mono, monospace)' }}>{pct(v)}</td>
            </tr>
          ))}
          {e.token && (
            <tr>
              <td style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>Token discount ({e.token})</td>
              <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' }}>−{Math.round((e.tokenDiscount || 0) * 100)}%</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
