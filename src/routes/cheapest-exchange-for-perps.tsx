import type { CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { RankedFees } from '~/components/RankedFees'

export const Route = createFileRoute('/cheapest-exchange-for-perps')({
  head: () => {
    const title = 'Cheapest exchange for perps / futures (2026) — FeeEdge'
    const description =
      'The cheapest crypto exchange for perpetual futures, ranked by maker and taker fees across 9 venues. Plus how funding rates change your real cost.'
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
    <LegalPage title="Cheapest exchange for perps">
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
        <a href="/" style={cta}>See your real perp cost across 9 venues →</a>
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
