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
      name: 'What is the cheapest exchange to buy Solana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For SOL spot, the lowest base taker fees among the 20 venues FeeEdge tracks come from MEXC, Bitfinex and Backpack. SOL is liquid on the major venues, so the published trading fee is usually the main cost, but the SOL network withdrawal fee is small and worth checking if you self-custody.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it cheaper to trade Solana on spot or perps?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Perpetual-futures fees on SOL are typically much lower than spot fees on the same venue, but perps add funding costs and liquidation risk. If you simply want to buy and hold SOL, spot is the right market and the fee table below applies.',
      },
    },
  ],
}

export const Route = createFileRoute('/cheapest-exchange-for-solana')({
  head: () => {
    const title = 'Cheapest exchange to buy Solana (2026) — FeeEdge'
    const description =
      'Where to buy Solana with the lowest fees in 2026, ranked across 20 crypto exchanges by spot maker and taker fee, plus the costs most people miss.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/cheapest-exchange-for-solana' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Cheapest exchange to buy Solana" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Solana is one of the most actively traded assets in crypto, and on the major venues it is liquid
        enough that the <strong>trading fee</strong> is what separates exchanges. Here are the major venues
        ranked by published spot taker fee, cheapest first.
      </p>

      <h2>Lowest SOL spot fees, ranked</h2>
      <RankedFees market="spot" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier spot rates; volume tiers and native-token discounts can lower these further.
      </p>

      <h2>Trading SOL on perps</h2>
      <p>
        If you trade SOL with leverage, perpetual-futures fees are usually far lower than spot, but funding
        becomes a real cost. See the <a href="/cheapest-exchange-for-perps">cheapest exchange for perps</a> and
        the <a href="/guides/crypto-funding-rates-explained">funding rates guide</a>.
      </p>

      <h2>Find your cheapest venue for SOL</h2>
      <p>
        Your real cost depends on your volume and whether you place maker (limit) or taker (market) orders.
        <a href="/"> FeeEdge</a> ranks all 20 exchanges for your exact profile in seconds.
      </p>
      <p>
        <a href="/" style={cta}>Compare SOL fees for how you trade</a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-bitcoin">Cheapest exchange to buy Bitcoin</a></li>
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
