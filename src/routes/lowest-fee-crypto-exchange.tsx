import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { RankedFees } from '~/components/RankedFees'

export const Route = createFileRoute('/lowest-fee-crypto-exchange')({
  head: () => {
    const title = 'Lowest-fee crypto exchange (2026) — FeeEdge'
    const description =
      'Which crypto exchange has the lowest trading fees? We rank 9 major exchanges by maker and taker fees — and show how to find the cheapest one for how you actually trade.'
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
    <LegalPage title="The lowest-fee crypto exchange">
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
        computes your actual monthly cost across all 9 exchanges in about 10 seconds, including funding on
        perps and native-token discounts.
      </p>
      <p>
        <a href="/" style={cta}>Compare fees for how you trade →</a>
      </p>

      <h2>How to actually pay less in fees</h2>
      <ul>
        <li><strong>Use limit (maker) orders</strong> where you can — maker fees are almost always lower than taker.</li>
        <li><strong>Watch volume tiers</strong> — many venues drop your rate sharply once you cross a monthly-volume threshold.</li>
        <li><strong>Hold the native token</strong> (BNB, OKB, KCS, GT, BGB) for a fee discount on supported exchanges.</li>
        <li><strong>Don't forget funding and withdrawal fees</strong> — on perps and when moving coins, these add up.</li>
      </ul>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
      </ul>
    </LegalPage>
  )
}

const cta: React.CSSProperties = {
  display: 'inline-block',
  background: '#10b981',
  color: '#03150f',
  fontWeight: 700,
  padding: '10px 18px',
  borderRadius: '8px',
  textDecoration: 'none',
}
