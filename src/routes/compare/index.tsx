import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { allPairs, pairSlug, DATA_UPDATED } from '~/data/exchanges'

export const Route = createFileRoute('/compare/')({
  head: () => {
    const title = 'Crypto exchange fee comparisons — FeeEdge'
    const description =
      'Side-by-side trading-fee comparisons for the top 20 crypto exchanges — Binance, OKX, Bybit, Bitget, Gate.io, MEXC, Hyperliquid, HTX, BingX, Kraken and more.'
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
    <LegalPage title="Crypto exchange fee comparisons" updated={DATA_UPDATED}>
      <p>
        Compare trading fees between the major crypto exchanges, head to head. Each page breaks down maker
        and taker rates for both perpetual futures and spot. To find the cheapest venue for{' '}
        <em>your</em> volume and trading style across all 20 exchanges at once, use the{' '}
        <a href="/">FeeEdge calculator</a>.
      </p>

      <h2>Popular pages</h2>
      <ul>
        <li><a href="/report">State of Crypto Exchange Fees 2026 (report)</a></li>
        <li><a href="/versus">Compare exchanges head-to-head (interactive)</a></li>
        <li><a href="/cheapest-exchange-for-bitcoin">Cheapest exchange to buy Bitcoin</a></li>
        <li><a href="/cheapest-exchange-for-ethereum">Cheapest exchange to buy Ethereum</a></li>
        <li><a href="/cheapest-exchange-for-solana">Cheapest exchange to buy Solana</a></li>
        <li><a href="/guides/native-token-fee-discounts">Guide: native-token fee discounts compared</a></li>
        <li><a href="/guides/crypto-funding-rates-explained">Guide: crypto funding rates explained</a></li>
        <li><a href="/best-exchange-for-scalping">Best exchange for scalping</a></li>
        <li><a href="/guides/how-to-reduce-crypto-trading-fees">Guide: how to reduce crypto trading fees</a></li>
        <li><a href="/exchanges">All exchange fee pages (per-exchange)</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps (futures)</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot trading</a></li>
        <li><a href="/guides/maker-vs-taker-fees">Guide: maker vs taker fees explained</a></li>
        <li><a href="/guides/hidden-costs-of-crypto-trading">Guide: the hidden costs of crypto trading</a></li>
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
