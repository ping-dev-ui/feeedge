import type { CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { RankedFees } from '~/components/RankedFees'

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
    <LegalPage title="Cheapest exchange for spot trading">
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
