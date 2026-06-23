import type { CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import { EXCHANGES, DATA_UPDATED } from '~/data/exchanges'

const withToken = [...EXCHANGES]
  .filter((e) => e.token && e.tokenDiscount)
  .sort((a, b) => (b.tokenDiscount || 0) - (a.tokenDiscount || 0))

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Which crypto exchange tokens give the biggest fee discount?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Among the venues FeeEdge tracks, the largest native-token trading-fee discounts come from HTX (HT), MEXC and Gate (GT), KuCoin (KCS), OKX (OKB) and Bitget (BGB), typically in the 15 to 25 percent range when you pay fees in the token and opt in.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are native-token fee discounts worth it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you trade enough volume, a 20 percent cut on every trade adds up fast. The catch is you hold the exchange token, which carries its own price risk, and the discount usually requires opting in and keeping a balance. For high-volume traders the savings often outweigh the hassle; for occasional traders it rarely does.',
      },
    },
  ],
}

export const Route = createFileRoute('/guides/native-token-fee-discounts')({
  head: () => {
    const title = 'Native-token fee discounts compared (2026) — FeeEdge'
    const description =
      'How much you save by paying crypto exchange fees in the native token (BNB, OKB, GT, BGB, KCS, HT and more), ranked, with the catch most traders miss.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/guides/native-token-fee-discounts' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Native-token fee discounts, compared" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Most large exchanges will cut your trading fee if you hold and pay with their native token. It is one
        of the easiest ways to lower your real cost, and it is also one of the most overlooked. Here is how
        the discounts stack up across the venues FeeEdge tracks, largest first.
      </p>

      <h2>Token discounts, ranked</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
          <thead>
            <tr>
              <th style={th('left')}>#</th>
              <th style={th('left')}>Exchange</th>
              <th style={th('left')}>Token</th>
              <th style={th('right')}>Fee discount</th>
            </tr>
          </thead>
          <tbody>
            {withToken.map((e, i) => (
              <tr key={e.slug}>
                <td style={td('left', i === 0)}>{i + 1}</td>
                <td style={td('left', i === 0)}>{e.name}</td>
                <td style={td('left', i === 0)}>{e.token}</td>
                <td style={{ ...td('right', i === 0), fontFamily: 'var(--font-mono, monospace)' }}>
                  {Math.round((e.tokenDiscount || 0) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '13px' }}>
        Discounts apply to trading fees when you opt in and pay fees in the token. Exact terms and tiers vary
        by venue and change over time.
      </p>

      <h2>The catch</h2>
      <p>
        The discount is real, but it comes with strings. You have to hold the exchange token, which has its own
        price risk, and you usually need to opt in and keep a minimum balance. If the token falls more than you
        save in fees, you are behind. For high-volume traders the math usually still works; for occasional
        traders the hassle rarely pays off.
      </p>

      <h2>Stack it with the right venue</h2>
      <p>
        A token discount on an already-cheap venue beats a bigger discount on an expensive one. Start from the
        cheapest base fees, then apply the discount. <a href="/">FeeEdge</a> factors native-token discounts into
        your ranking on Pro, so you see the true cost for how you trade.
      </p>
      <p>
        <a href="/" style={cta}>Rank exchanges with token discounts applied</a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/guides/how-to-reduce-crypto-trading-fees">How to reduce crypto trading fees</a></li>
        <li><a href="/guides/maker-vs-taker-fees">Maker vs taker fees explained</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
      </ul>
    </LegalPage>
  )
}

function th(align: 'left' | 'right'): CSSProperties {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontWeight: 600 }
}
function td(align: 'left' | 'right', top: boolean): CSSProperties {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: top ? '#34d399' : '#e4e4e7', fontWeight: top ? 700 : 400 }
}

const cta: CSSProperties = {
  display: 'inline-block',
  background: '#10b981',
  color: '#03150f',
  fontWeight: 700,
  padding: '10px 18px',
  borderRadius: '8px',
  textDecoration: 'none',
}
