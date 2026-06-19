import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import {
  parsePair,
  pct,
  allPairs,
  pairSlug,
  type Exchange,
} from '~/data/exchanges'

export const Route = createFileRoute('/compare/$pair')({
  head: ({ params }) => {
    const p = params && params.pair ? parsePair(params.pair) : null
    if (!p) return { meta: [{ title: 'Compare exchange fees — FeeEdge' }] }
    const [a, b] = p
    const title = `${a.name} vs ${b.name} fees (2026): which is cheaper?`
    const description = `Compare ${a.name} and ${b.name} trading fees side by side — maker, taker, spot and perpetual futures — and find which is cheaper for how you trade.`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `https://feeedge.com/compare/${params.pair}` },
      ],
    }
  },
  component: ComparePage,
  notFoundComponent: () => (
    <LegalPage title="Comparison not found">
      <p>
        We couldn't find that exchange comparison. See all{' '}
        <a href="/compare">exchange fee comparisons</a>.
      </p>
    </LegalPage>
  ),
})

function ComparePage() {
  const { pair } = Route.useParams()
  const p = parsePair(pair)
  if (!p) throw notFound()
  const [a, b] = p

  const related = allPairs()
    .filter(([x, y]) => (x.slug === a.slug || y.slug === a.slug || x.slug === b.slug || y.slug === b.slug) && pairSlug(x, y) !== pair)
    .slice(0, 8)

  const cheaperFutures = a.futures.taker <= b.futures.taker ? a : b
  const cheaperSpot = a.spot.taker <= b.spot.taker ? a : b
  const other = (e: Exchange) => (e.slug === a.slug ? b : a)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${a.name} cheaper than ${b.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `For base-tier perpetual futures, ${cheaperFutures.name} has the lower taker fee (${pct(cheaperFutures.futures.taker)} vs ${pct(other(cheaperFutures).futures.taker)}). For spot, ${cheaperSpot.name} is cheaper (${pct(cheaperSpot.spot.taker)} vs ${pct(other(cheaperSpot).spot.taker)}). Your actual cheapest venue depends on your monthly volume and maker/taker mix.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are ${a.name}'s trading fees?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${a.name} charges roughly ${pct(a.futures.maker)} maker / ${pct(a.futures.taker)} taker on perpetual futures and ${pct(a.spot.maker)} maker / ${pct(a.spot.taker)} taker on spot at the entry tier${a.token ? `, with discounts if you pay fees with ${a.token}` : ''}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are ${b.name}'s trading fees?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${b.name} charges roughly ${pct(b.futures.maker)} maker / ${pct(b.futures.taker)} taker on perpetual futures and ${pct(b.spot.maker)} maker / ${pct(b.spot.taker)} taker on spot at the entry tier${b.token ? `, with discounts if you pay fees with ${b.token}` : ''}.`,
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://feeedge.com/' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://feeedge.com/compare' },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${a.name} vs ${b.name}`,
        item: `https://feeedge.com/compare/${pair}`,
      },
    ],
  }

  return (
    <LegalPage title={`${a.name} vs ${b.name} fees`}>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <p>
        Wondering whether <strong>{a.name}</strong> or <strong>{b.name}</strong> is cheaper for trading?
        Below are their published entry-tier fees side by side, for both perpetual futures and spot. The
        cheapest venue for <em>you</em> depends on your volume and whether you trade maker or taker —
        run your own numbers in the{' '}
        <a href="/">FeeEdge calculator</a> to see your real monthly cost across all 20 exchanges.
      </p>

      <h2>Fee comparison</h2>
      <FeeTable a={a} b={b} />
      <p style={{ fontSize: '13px' }}>
        Rates shown are published base-tier estimates and may change — always confirm on the exchange.
        Maker = limit orders that add liquidity (cheaper); taker = market orders that remove it.
      </p>

      <h2>Which is cheaper?</h2>
      <p>
        On <strong>perpetual futures</strong>, {cheaperFutures.name} has the lower base taker fee
        ({pct(cheaperFutures.futures.taker)} vs {pct((cheaperFutures.slug === a.slug ? b : a).futures.taker)}).
        On <strong>spot</strong>, {cheaperSpot.name} is lower
        ({pct(cheaperSpot.spot.taker)} vs {pct((cheaperSpot.slug === a.slug ? b : a).spot.taker)}).
        But volume tiers, maker rebates, and native-token discounts can flip this for active traders —
        which is exactly what FeeEdge calculates.
      </p>

      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          See your cheapest exchange →
        </a>
      </p>

      <p>
        Want the full picture on either venue? See{' '}
        <Link to="/exchanges/$slug" params={{ slug: a.slug }}>{a.name} fees</Link> and{' '}
        <Link to="/exchanges/$slug" params={{ slug: b.slug }}>{b.name} fees</Link>.
      </p>

      <h2>Open an account</h2>
      <ul>
        {a.referral && (
          <li>
            <a href={a.referral} target="_blank" rel="sponsored noopener noreferrer">Open a {a.name} account</a>
          </li>
        )}
        {b.referral && (
          <li>
            <a href={b.referral} target="_blank" rel="sponsored noopener noreferrer">Open a {b.name} account</a>
          </li>
        )}
      </ul>
      <p style={{ fontSize: '12px' }}>
        These are affiliate links — FeeEdge may earn a commission at no extra cost to you.
      </p>

      <h2>FAQ</h2>
      <h3>Is {a.name} cheaper than {b.name}?</h3>
      <p>
        For base-tier perpetual futures, {cheaperFutures.name} has the lower taker fee. For spot,
        {' '}{cheaperSpot.name} is cheaper. Your actual cheapest venue depends on your monthly volume and
        maker/taker mix — check it in the <a href="/">calculator</a>.
      </p>
      <h3>What are {a.name}'s trading fees?</h3>
      <p>
        {a.name} charges roughly {pct(a.futures.maker)} maker / {pct(a.futures.taker)} taker on perps and
        {' '}{pct(a.spot.maker)} maker / {pct(a.spot.taker)} taker on spot at the entry tier
        {a.token ? `, with discounts if you pay fees with ${a.token}` : ''}.
      </p>
      <h3>What are {b.name}'s trading fees?</h3>
      <p>
        {b.name} charges roughly {pct(b.futures.maker)} maker / {pct(b.futures.taker)} taker on perps and
        {' '}{pct(b.spot.maker)} maker / {pct(b.spot.taker)} taker on spot at the entry tier
        {b.token ? `, with discounts if you pay fees with ${b.token}` : ''}.
      </p>

      <h2>More comparisons</h2>
      <ul>
        {related.map(([x, y]) => (
          <li key={pairSlug(x, y)}>
            <Link to="/compare/$pair" params={{ pair: pairSlug(x, y) }}>
              {x.name} vs {y.name} fees
            </Link>
          </li>
        ))}
      </ul>
      <p>
        <a href="/compare">← All exchange fee comparisons</a>
      </p>
    </LegalPage>
  )
}

function FeeTable({ a, b }: { a: Exchange; b: Exchange }) {
  const rows: Array<[string, number, number]> = [
    ['Perps maker', a.futures.maker, b.futures.maker],
    ['Perps taker', a.futures.taker, b.futures.taker],
    ['Spot maker', a.spot.maker, b.spot.maker],
    ['Spot taker', a.spot.taker, b.spot.taker],
  ]
  const cell = (v: number, other: number) => {
    const lower = v <= other
    return (
      <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: lower ? '#34d399' : '#e4e4e7', fontWeight: lower ? 700 : 400, fontFamily: 'var(--font-mono, monospace)' }}>
        {pct(v)}
      </td>
    )
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontWeight: 600 }}></th>
            <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>{a.name}</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>{b.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, av, bv]) => (
            <tr key={label}>
              <td style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>{label}</td>
              {cell(av, bv)}
              {cell(bv, av)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
