import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { allPairs, pairSlug } from '~/data/exchanges'

export const Route = createFileRoute('/compare/')({
  head: () => {
    const title = 'Crypto exchange fee comparisons — FeeEdge'
    const description =
      'Side-by-side trading-fee comparisons for 9 major crypto exchanges — Binance, Bybit, OKX, Hyperliquid, Gate.io, Bitget, KuCoin, MEXC, and Kraken.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/compare' },
      ],
    }
  },
  component: CompareIndex,
})

function CompareIndex() {
  const pairs = allPairs()
  return (
    <LegalPage title="Crypto exchange fee comparisons">
      <p>
        Compare trading fees between the major crypto exchanges, head to head. Each page breaks down maker
        and taker rates for both perpetual futures and spot. To find the cheapest venue for{' '}
        <em>your</em> volume and trading style across all 9 exchanges at once, use the{' '}
        <a href="/">FeeEdge calculator</a>.
      </p>

      <h2>Popular pages</h2>
      <ul>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps (futures)</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot trading</a></li>
      </ul>

      <h2>All comparisons</h2>
      <ul>
        {pairs.map(([a, b]) => (
          <li key={pairSlug(a, b)}>
            <Link to="/compare/$pair" params={{ pair: pairSlug(a, b) }}>
              {a.name} vs {b.name} fees
            </Link>
          </li>
        ))}
      </ul>
    </LegalPage>
  )
}
