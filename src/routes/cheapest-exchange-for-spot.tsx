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
      name: 'Which crypto exchange is cheapest for spot trading?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spot fees vary widely. Among the 20 venues FeeEdge tracks, MEXC, Bitfinex and Backpack rank among the lowest base spot taker fees, while exchanges like Coinbase Advanced and Kraken sit at the higher end. Your cheapest venue depends on volume and maker/taker mix.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why are spot fees higher than futures fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spot maker/taker fees are typically 0.1% or more, versus around 0.02%/0.05% on perpetual futures, because spot involves taking full ownership of the asset and exchanges compete harder on derivatives volume. Native-token discounts and volume tiers can narrow the gap.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I lower my spot trading fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use limit (maker) orders, reach higher 30-day volume tiers, and hold the exchange’s native token for a discount where offered. Some venues also run zero-maker promotions on specific pairs.',
      },
    },
  ],
}

export const Route = createFileRoute('/cheapest-exchange-for-spot')({
  head: () => {
    const title = 'Cheapest exchange for spot trading (2026) — FeeEdge'
    const description =
      'The cheapest crypto exchange for spot trading, ranked by maker and taker fees across 20 major venues — and how to find the best one for your volume.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/cheapest-exchange-for-spot' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Cheapest exchange for spot trading" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        For buying and holding crypto, spot fees vary a lot more between exchanges than most people realize.
        Here are the major venues ranked by published spot <strong>taker</strong> fee, cheapest first.
      </p>

      <h2>Spot fees, ranked</h2>
      <RankedFees market="spot" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier rates; many exchanges lower these with volume or a native-token discount.
      </p>

      <h2>Find your cheapest venue</h2>
      <p>
        Spot fees compress as your volume grows, and some venues run zero-maker promotions. FeeEdge ranks
        all 20 exchanges by your real cost based on your volume and maker/taker mix.
      </p>
      <p>
        <a href="/" style={cta}>Compare spot fees for your volume →</a>
      </p>

      <h2>FAQ</h2>
      <h3>Which crypto exchange is cheapest for spot trading?</h3>
      <p>
        Among the 20 venues we track, MEXC, Bitfinex and Backpack rank lowest on base spot taker fees, while
        Coinbase Advanced and Kraken sit higher. Your cheapest depends on volume and maker/taker mix — check
        it in the <a href="/">calculator</a>.
      </p>
      <h3>Why are spot fees higher than futures fees?</h3>
      <p>
        Spot fees are typically 0.1%+, versus ~0.02%/0.05% on perps, because spot means taking full ownership
        of the asset and exchanges compete hardest on derivatives volume. Token discounts and volume tiers
        narrow the gap.
      </p>
      <h3>How do I lower my spot trading fees?</h3>
      <p>
        Use limit orders, reach higher 30-day volume tiers, and hold a native token for a discount where
        offered. Some venues run zero-maker promotions on specific pairs.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
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
