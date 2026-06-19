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
      name: 'What is the cheapest exchange to buy Bitcoin?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For BTC spot, the lowest base taker fees among the 20 venues FeeEdge tracks come from MEXC, Bitfinex and Backpack; Coinbase Advanced and Kraken are higher. Because BTC is the most liquid asset, spreads are tight everywhere, so the published fee is the main cost — but also check the BTC network withdrawal fee if you plan to move coins off-exchange.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do Bitcoin withdrawal fees matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Moving BTC on-chain incurs a withdrawal fee that varies by exchange and network congestion. If you withdraw often, that recurring cost can outweigh small differences in trading fees, so factor it into your real cost.',
      },
    },
  ],
}

export const Route = createFileRoute('/cheapest-exchange-for-bitcoin')({
  head: () => {
    const title = 'Cheapest exchange to buy Bitcoin (2026) — FeeEdge'
    const description =
      'Where to buy Bitcoin with the lowest fees in 2026, ranked across 20 crypto exchanges by spot maker and taker fee — plus the withdrawal costs people forget.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/cheapest-exchange-for-bitcoin' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Cheapest exchange to buy Bitcoin" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Bitcoin is the most-traded crypto asset, and because it's so liquid the bid/ask spread is tight on
        almost every venue — which means the <strong>trading fee</strong> is the cost that actually separates
        exchanges. Here are the major venues ranked by published spot taker fee, cheapest first.
      </p>

      <h2>Lowest BTC spot fees, ranked</h2>
      <RankedFees market="spot" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier spot rates; volume tiers and native-token discounts can lower these further.
      </p>

      <h2>Don't forget the withdrawal fee</h2>
      <p>
        If you're buying BTC to self-custody, the on-chain <strong>withdrawal fee</strong> matters as much as
        the trading fee — it varies by exchange and with network congestion. For frequent withdrawals it can
        dwarf a small trading-fee difference. See <a href="/guides/hidden-costs-of-crypto-trading">the hidden
        costs of crypto trading</a>.
      </p>

      <h2>Find your cheapest venue for BTC</h2>
      <p>
        Your real cost depends on your volume and whether you place maker (limit) or taker (market) orders.
        <a href="/"> FeeEdge</a> ranks all 20 exchanges for your exact profile in seconds.
      </p>
      <p>
        <a href="/" style={cta}>Compare BTC fees for how you trade →</a>
      </p>

      <h2>FAQ</h2>
      <h3>What is the cheapest exchange to buy Bitcoin?</h3>
      <p>
        For BTC spot, MEXC, Bitfinex and Backpack rank lowest on base taker fees; Coinbase Advanced and Kraken
        sit higher. Your cheapest depends on volume and order type — check the <a href="/">calculator</a>.
      </p>
      <h3>Do Bitcoin withdrawal fees matter?</h3>
      <p>
        Yes — moving BTC on-chain costs a withdrawal fee that varies by exchange and congestion. If you
        withdraw often it can outweigh small trading-fee differences.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-ethereum">Cheapest exchange to buy Ethereum</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot trading</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
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
