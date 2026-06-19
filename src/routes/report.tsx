import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import { ExchangeLogo } from '~/components/ExchangeLogo'
import { EXCHANGES, pct, DATA_UPDATED, type Exchange } from '~/data/exchanges'

export const Route = createFileRoute('/report')({
  head: () => {
    const title = 'State of Crypto Exchange Fees 2026 — FeeEdge Report'
    const description =
      'A data-driven look at trading fees across 20 major crypto exchanges in 2026: who is cheapest for perps and spot, which venues are zero-fee, and the biggest native-token discounts.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/report' },
        { property: 'og:image', content: 'https://feeedge.com/og-report.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://feeedge.com/og-report.png' },
      ],
    }
  },
  component: ReportPage,
})

function ReportPage() {
  const byPerpTaker = [...EXCHANGES].sort((a, b) => a.futures.taker - b.futures.taker)
  const bySpotTaker = [...EXCHANGES].sort((a, b) => a.spot.taker - b.spot.taker)
  const zeroPerps = EXCHANGES.filter((e) => e.futures.maker === 0 && e.futures.taker === 0)
  const withToken = [...EXCHANGES].filter((e) => e.token && e.tokenDiscount)
    .sort((a, b) => (b.tokenDiscount || 0) - (a.tokenDiscount || 0))
  const avgPerpTaker = EXCHANGES.reduce((s, e) => s + e.futures.taker, 0) / EXCHANGES.length
  const avgSpotTaker = EXCHANGES.reduce((s, e) => s + e.spot.taker, 0) / EXCHANGES.length

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'State of Crypto Exchange Fees 2026',
    description:
      'Data-driven analysis of trading fees across 20 major crypto exchanges in 2026.',
    datePublished: '2026-06-19',
    author: { '@type': 'Organization', name: 'FeeEdge' },
    publisher: {
      '@type': 'Organization',
      name: 'FeeEdge',
      logo: { '@type': 'ImageObject', url: 'https://feeedge.com/logo-mark.png' },
    },
    mainEntityOfPage: 'https://feeedge.com/report',
  }

  return (
    <LegalPage title="The State of Crypto Exchange Fees, 2026" updated={DATA_UPDATED}>
      <JsonLd data={articleSchema} />

      <p>
        We track the published trading fees of 20 major crypto exchanges and refresh them daily. This
        report summarises what that data shows in 2026 — who is genuinely cheapest, where the "free" venues
        are, and how much the native-token discounts really save. Methodology and sources are on our{' '}
        <a href="/methodology">methodology page</a>; run your own numbers in the{' '}
        <a href="/">calculator</a>.
      </p>

      <h2>Key findings</h2>
      <ul>
        <li>
          The average base <strong>taker</strong> fee across the 20 venues is{' '}
          <strong>{pct(avgPerpTaker)}</strong> on perpetual futures and <strong>{pct(avgSpotTaker)}</strong>{' '}
          on spot — so the spread between the cheapest and priciest venue is several times the average.
        </li>
        <li>
          <strong>{zeroPerps.length > 0 ? zeroPerps.map((e) => e.name).join(', ') : 'A handful of venues'}</strong>{' '}
          advertise <strong>zero</strong> maker and taker trading fees{zeroPerps.length ? '' : ' on some markets'} —
          though funding, spreads and withdrawals still apply.
        </li>
        <li>
          The cheapest base perps taker is <strong>{byPerpTaker[0].name}</strong> ({pct(byPerpTaker[0].futures.taker)});
          for spot it's <strong>{bySpotTaker[0].name}</strong> ({pct(bySpotTaker[0].spot.taker)}).
        </li>
        <li>
          {withToken.length} venues cut fees with a native token — the largest discounts come from{' '}
          {withToken.slice(0, 3).map((e) => `${e.name} (${e.token}, −${Math.round((e.tokenDiscount || 0) * 100)}%)`).join(', ')}.
        </li>
      </ul>

      <h2>Cheapest perpetual-futures fees (base taker)</h2>
      <RankTable list={byPerpTaker} market="futures" />

      <h2>Cheapest spot fees (base taker)</h2>
      <RankTable list={bySpotTaker} market="spot" />

      <h2>Zero-fee venues</h2>
      <p>
        {zeroPerps.length > 0 ? (
          <>
            {zeroPerps.map((e) => e.name).join(', ')} currently advertise 0% maker and taker on the markets we
            track. That's genuinely the lowest trading fee possible — but remember the real cost of a trade also
            includes funding (on perps), the bid/ask spread, and withdrawal fees, which a 0% headline doesn't
            cover. See <a href="/guides/hidden-costs-of-crypto-trading">the hidden costs of crypto trading</a>.
          </>
        ) : (
          <>No venue we track is fully zero-fee right now, though several run zero-maker promotions.</>
        )}
      </p>

      <h2>Biggest native-token discounts</h2>
      <ul>
        {withToken.map((e) => (
          <li key={e.slug}>
            <strong>{e.name}</strong> — up to <strong>−{Math.round((e.tokenDiscount || 0) * 100)}%</strong> when
            you hold/pay fees with {e.token}.
          </li>
        ))}
      </ul>

      <h2>What it means for traders</h2>
      <p>
        Picking the lowest-headline-fee exchange isn't the same as paying the least. Your real cost depends on
        your monthly volume (which moves you down fee tiers), your maker/taker mix, funding if you trade perps,
        and whether you'd actually use a token discount. Two traders on the same exchange can pay very different
        effective rates — and the cheapest venue for a high-volume maker is rarely the cheapest for an
        occasional taker. That's the whole reason we built the <a href="/">FeeEdge calculator</a>: it ranks all
        20 venues for <em>your</em> profile in about ten seconds.
      </p>

      <h2>Methodology</h2>
      <p>
        Figures are published entry-tier (regular / VIP-0) maker and taker rates, refreshed daily — live from
        exchange APIs where available, otherwise hand-verified and re-checked monthly (last verified{' '}
        {DATA_UPDATED}). Full detail on our <a href="/methodology">methodology page</a>. Rates change; always
        confirm on the exchange before trading. This is information, not financial advice.
      </p>

      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Find your cheapest exchange →
        </a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
        <li><a href="/exchanges">Per-exchange fee pages</a></li>
      </ul>
    </LegalPage>
  )
}

function RankTable({ list, market }: { list: Exchange[]; market: 'futures' | 'spot' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
        <thead>
          <tr>
            <th style={th('left')}>#</th>
            <th style={th('left')}>Exchange</th>
            <th style={th('right')}>Maker</th>
            <th style={th('right')}>Taker</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e, i) => (
            <tr key={e.slug}>
              <td style={td('left', i === 0)}>{i + 1}</td>
              <td style={td('left', i === 0)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <ExchangeLogo slug={e.slug} name={e.name} colorClass={e.colorClass} size={18} />
                  {e.name}{e.token ? ` · ${e.token}` : ''}
                </span>
              </td>
              <td style={{ ...td('right', i === 0), fontFamily: 'var(--font-mono, monospace)' }}>{pct(e[market].maker)}</td>
              <td style={{ ...td('right', i === 0), fontFamily: 'var(--font-mono, monospace)' }}>{pct(e[market].taker)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function th(align: 'left' | 'right') {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontWeight: 600 } as const
}
function td(align: 'left' | 'right', top: boolean) {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: top ? '#34d399' : '#e4e4e7', fontWeight: top ? 700 : 400 } as const
}
