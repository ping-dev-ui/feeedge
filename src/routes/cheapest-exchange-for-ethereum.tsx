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
      name: 'What is the cheapest exchange to buy Ethereum?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For ETH spot, the lowest base taker fees among the 20 venues FeeEdge tracks come from MEXC, Bitfinex and Backpack. ETH is highly liquid so spreads are tight; the trading fee is the main differentiator — but ERC-20 withdrawal (gas) fees can be significant, so weigh those too.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why are Ethereum withdrawal fees sometimes high?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ETH and ERC-20 withdrawals pay Ethereum network gas, which rises with on-chain congestion and can be several dollars or more. Many exchanges let you withdraw over cheaper networks or layer-2s — choosing the right network can save far more than a small trading-fee difference.',
      },
    },
  ],
}

export const Route = createFileRoute('/cheapest-exchange-for-ethereum')({
  head: () => {
    const title = 'Cheapest exchange to buy Ethereum (2026) — FeeEdge'
    const description =
      'Where to buy Ethereum with the lowest fees in 2026, ranked across 20 crypto exchanges by spot maker and taker fee — plus ERC-20 withdrawal costs to watch.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/cheapest-exchange-for-ethereum' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Cheapest exchange to buy Ethereum" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        Ethereum is one of the most liquid assets in crypto, so spreads are tight across venues and the
        <strong> trading fee</strong> is what really separates exchanges. Here are the major venues ranked by
        published spot taker fee, cheapest first.
      </p>

      <h2>Lowest ETH spot fees, ranked</h2>
      <RankedFees market="spot" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier spot rates; volume tiers and native-token discounts can lower these further.
      </p>

      <h2>Mind the network (gas) on withdrawals</h2>
      <p>
        For ETH and ERC-20 tokens, the on-chain <strong>withdrawal fee is Ethereum gas</strong>, which spikes
        with congestion. Many exchanges support cheaper networks or layer-2s — picking the right one can save
        more than the trading fee itself. More in <a href="/guides/hidden-costs-of-crypto-trading">the hidden
        costs of crypto trading</a>.
      </p>

      <h2>Find your cheapest venue for ETH</h2>
      <p>
        Your real cost depends on volume and maker/taker mix. <a href="/">FeeEdge</a> ranks all 20 exchanges
        for your exact profile in seconds.
      </p>
      <p>
        <a href="/" style={cta}>Compare ETH fees for how you trade →</a>
      </p>

      <h2>FAQ</h2>
      <h3>What is the cheapest exchange to buy Ethereum?</h3>
      <p>
        For ETH spot, MEXC, Bitfinex and Backpack rank lowest on base taker fees. Your cheapest depends on
        volume and order type — check the <a href="/">calculator</a>.
      </p>
      <h3>Why are Ethereum withdrawal fees sometimes high?</h3>
      <p>
        ETH/ERC-20 withdrawals pay network gas, which rises with congestion. Using a cheaper network or
        layer-2 where supported can save more than a small trading-fee difference.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-bitcoin">Cheapest exchange to buy Bitcoin</a></li>
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
