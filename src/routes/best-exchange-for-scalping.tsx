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
      name: 'What is the best crypto exchange for scalping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For scalping, the lowest possible maker/taker fee matters most because you trade frequently. Low-fee perp venues like MEXC, Bitfinex and Hyperliquid are strong for scalpers, but deep liquidity (tight spreads) and reliable order execution matter just as much as the headline fee. Run your expected volume through the FeeEdge calculator to see the real monthly cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do fees matter more for scalpers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hugely. A scalper turning over their capital many times a day pays the maker/taker fee on every trade, so even a 0.01% difference compounds into a large monthly cost. For high-frequency styles, fees and spreads are often the difference between a profitable and an unprofitable strategy.',
      },
    },
  ],
}

export const Route = createFileRoute('/best-exchange-for-scalping')({
  head: () => {
    const title = 'Best crypto exchange for scalping (low fees, 2026) — FeeEdge'
    const description =
      'Scalping lives and dies by fees. The lowest-fee crypto exchanges for high-frequency trading in 2026, ranked by maker/taker — plus why spread and execution matter too.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/best-exchange-for-scalping' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Best crypto exchange for scalping" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Scalping means many trades a day for small gains — so fees are the single biggest controllable cost.
        At high turnover, even a fraction of a basis point compounds into real money. Most scalpers trade
        perpetual futures (lower fees, leverage), so here are the venues ranked by published perp taker fee,
        cheapest first.
      </p>

      <h2>Lowest perp fees for scalpers, ranked</h2>
      <RankedFees market="futures" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier rates; high-volume scalpers usually hit lower tiers quickly, dropping these further.
      </p>

      <h2>Fees aren't the only thing that matters</h2>
      <p>
        For a scalper, two costs beyond the headline fee decide profitability:
      </p>
      <ul>
        <li><strong>Spread &amp; slippage</strong> — you pay it on every entry and exit, so deep, liquid books on major pairs matter as much as the fee.</li>
        <li><strong>Maker rebates &amp; volume tiers</strong> — trading maker-only and hitting high-volume tiers can cut your effective rate dramatically; some venues even pay maker rebates.</li>
        <li><strong>Execution reliability</strong> — latency and fill quality matter when you're in and out in seconds.</li>
      </ul>

      <h2>Find your cheapest venue at your volume</h2>
      <p>
        Scalpers do high monthly volume, which unlocks cheaper tiers — exactly what the
        <a href="/"> FeeEdge calculator</a> models. Set your volume and maker/taker mix to see your real
        per-month cost across all 20 venues.
      </p>
      <p>
        <a href="/" style={cta}>Find your lowest scalping cost →</a>
      </p>

      <h2>FAQ</h2>
      <h3>What is the best crypto exchange for scalping?</h3>
      <p>
        Low-fee perp venues like MEXC, Bitfinex and Hyperliquid suit scalpers, but tight spreads and reliable
        execution matter as much as the fee. Run your volume through the <a href="/">calculator</a> for the
        real cost.
      </p>
      <h3>Do fees matter more for scalpers?</h3>
      <p>
        Yes — you pay maker/taker on every trade, so at high turnover a 0.01% difference compounds into a large
        monthly cost. Fees and spreads often decide whether a high-frequency strategy is profitable.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/guides/maker-vs-taker-fees">Maker vs taker fees explained</a></li>
        <li><a href="/guides/how-to-reduce-crypto-trading-fees">How to reduce crypto trading fees</a></li>
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
