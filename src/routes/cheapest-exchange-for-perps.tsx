import type { CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { RankedFees } from '~/components/RankedFees'
import { JsonLd } from '~/components/JsonLd'
import { DATA_UPDATED } from '~/data/exchanges'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Which exchange has the cheapest perpetual-futures fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On base-tier taker fees, MEXC, Bitfinex and Hyperliquid are among the cheapest perp venues of the 20 FeeEdge tracks. But funding rates and your volume tier can change the real cost, so the cheapest venue for your trading is best found with the calculator.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do funding rates matter more than trading fees on perps?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Often, yes. Funding is exchanged between longs and shorts roughly every 8 hours, and if you hold a leveraged position through several windows it can cost more than the trading fee itself. The cheapest venue to trade is not always the cheapest to hold.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are perp fees lower than spot fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usually yes — perpetual-futures maker/taker fees are typically much lower than spot fees on the same exchange (often around 0.02%/0.05% vs 0.1%+ on spot), which is one reason high-frequency traders prefer perps.',
      },
    },
  ],
}

export const Route = createFileRoute('/cheapest-exchange-for-perps')({
  head: () => {
    const title = 'Cheapest exchange for perps / futures (2026) — FeeEdge'
    const description =
      'The cheapest crypto exchange for perpetual futures, ranked by maker and taker fees across 20 venues. Plus how funding rates change your real cost.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/cheapest-exchange-for-perps' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Cheapest exchange for perps" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Perpetual-futures traders feel fees more than anyone — high frequency and leverage magnify every
        basis point. Here are the major exchanges ranked by published perp <strong>taker</strong> fee,
        cheapest first.
      </p>

      <h2>Perp fees, ranked</h2>
      <RankedFees market="futures" />

      <h2>Funding is a hidden cost</h2>
      <p>
        On perps, the headline maker/taker fee isn't your whole cost — <strong>funding rates</strong> (paid
        every 8 hours between longs and shorts) can dwarf trading fees if you hold positions. FeeEdge's Pro
        funding optimizer shows the cheapest venue to hold a long or short right now.
      </p>

      <p>
        <a href="/" style={cta}>See your real perp cost across 20 venues →</a>
      </p>

      <h2>FAQ</h2>
      <h3>Which exchange has the cheapest perpetual-futures fees?</h3>
      <p>
        On base-tier taker fees, MEXC, Bitfinex and Hyperliquid rank among the cheapest perp venues — but
        funding and your volume tier change the real cost, so check your own profile in the{' '}
        <a href="/">calculator</a>.
      </p>
      <h3>Do funding rates matter more than trading fees?</h3>
      <p>
        Often. Funding is exchanged between longs and shorts ~every 8 hours; holding a leveraged position
        through several windows can cost more than the trade itself. The cheapest venue to trade isn't always
        the cheapest to hold — see <a href="/guides/hidden-costs-of-crypto-trading">the hidden costs of crypto trading</a>.
      </p>
      <h3>Are perp fees lower than spot fees?</h3>
      <p>
        Usually — perp maker/taker fees (around 0.02%/0.05%) are typically far below spot fees (0.1%+) on the
        same exchange, which is part of why active traders prefer perps.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
      </ul>
    </LegalPage>
  )
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
