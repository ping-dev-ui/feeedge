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
      name: 'Which crypto exchange has the lowest trading fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no single cheapest exchange — it depends on whether you trade perpetual futures or spot, your 30-day volume, and whether you use maker or taker orders. Among the 20 venues FeeEdge tracks, MEXC, Bitfinex, Hyperliquid and WhiteBIT consistently rank lowest on base fees, but the cheapest venue for your specific profile is calculated in the FeeEdge calculator.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are maker fees lower than taker fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Makers add liquidity with limit orders and are charged less; takers remove liquidity with market orders and pay more — usually 2–3× the maker fee. Trading with limit orders is the simplest way to lower your costs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I reduce my crypto trading fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use limit (maker) orders, consolidate volume to reach cheaper fee tiers, hold an exchange’s native token for a discount where offered, and account for funding and withdrawal fees — not just the headline trading fee.',
      },
    },
  ],
}

export const Route = createFileRoute('/lowest-fee-crypto-exchange')({
  head: () => {
    const title = 'Lowest-fee crypto exchange (2026) — FeeEdge'
    const description =
      'Which crypto exchange has the lowest trading fees? We rank the top 20 exchanges by maker and taker fees — and show how to find the cheapest one for how you actually trade.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/lowest-fee-crypto-exchange' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="The lowest-fee crypto exchange" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        There's no single "cheapest" crypto exchange — it depends on whether you trade perps or spot, your
        monthly volume, and whether you use maker (limit) or taker (market) orders. But here's how the major
        exchanges rank by published <strong>perpetual-futures</strong> taker fee, lowest first.
      </p>

      <h2>Lowest perp fees, ranked</h2>
      <RankedFees market="futures" />
      <p style={{ fontSize: '13px' }}>
        Published entry-tier rates; volume discounts and native-token rebates can lower these further.
      </p>

      <h2>Find your cheapest exchange</h2>
      <p>
        The ranking above is a starting point. Your real cheapest venue depends on your numbers — FeeEdge
        computes your actual monthly cost across all 20 exchanges in about 10 seconds, including funding on
        perps and native-token discounts.
      </p>
      <p>
        <a href="/" style={cta}>Compare fees for how you trade →</a>
      </p>

      <h2>How to actually pay less in fees</h2>
      <ul>
        <li><strong>Use limit (maker) orders</strong> where you can — maker fees are almost always lower than taker.</li>
        <li><strong>Watch volume tiers</strong> — many venues drop your rate sharply once you cross a monthly-volume threshold.</li>
        <li><strong>Hold the native token</strong> (BNB, OKB, KCS, GT, BGB, HT, BMX, CET, WBT) for a fee discount on supported exchanges.</li>
        <li><strong>Don't forget funding and withdrawal fees</strong> — on perps and when moving coins, these add up.</li>
      </ul>

      <h2>FAQ</h2>
      <h3>Which crypto exchange has the lowest trading fees?</h3>
      <p>
        It depends on the market (perps vs spot), your 30-day volume, and your maker/taker mix. Among the 20
        venues we track, MEXC, Bitfinex, Hyperliquid and WhiteBIT consistently rank lowest on base fees — but
        the cheapest for <em>you</em> is whatever the <a href="/">calculator</a> returns for your profile.
      </p>
      <h3>Are maker fees lower than taker fees?</h3>
      <p>
        Yes — makers add liquidity (limit orders) and pay less; takers remove it (market orders) and pay more,
        usually 2–3× as much. See <a href="/guides/maker-vs-taker-fees">maker vs taker fees explained</a>.
      </p>
      <h3>How can I reduce my crypto trading fees?</h3>
      <p>
        Use limit orders, consolidate volume to hit cheaper tiers, hold a native token for a discount where
        offered, and account for funding and withdrawal costs — not just the headline fee.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
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
