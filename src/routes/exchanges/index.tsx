import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { ExchangeLogo } from '~/components/ExchangeLogo'
import { EXCHANGES, pct, DATA_UPDATED } from '~/data/exchanges'

export const Route = createFileRoute('/exchanges/')({
  head: () => {
    const title = 'Crypto exchange trading fees (2026) — FeeEdge'
    const description =
      'Trading-fee breakdowns for the top 20 crypto exchanges — Binance, OKX, Bybit, Bitget, Gate.io, MEXC, Hyperliquid, HTX, BingX, Kraken and more. Maker, taker, spot, futures and token discounts.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/exchanges' },
      ],
    }
  },
  component: ExchangesIndex,
})

function ExchangesIndex() {
  return (
    <LegalPage title="Crypto exchange trading fees" updated={DATA_UPDATED}>
      <p>
        Fee breakdowns for the major crypto exchanges. Each page covers maker and taker rates for
        perpetual futures and spot, native-token discounts, and how the exchange ranks against the others.
        To find the cheapest venue for <em>your</em> volume and style across all {EXCHANGES.length} at
        once, use the <a href="/">FeeEdge calculator</a>.
      </p>

      <h2>All exchanges</h2>
      <ul>
        {EXCHANGES.map((e) => (
          <li key={e.slug} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExchangeLogo slug={e.slug} name={e.name} colorClass={e.colorClass} size={20} />
            <Link to="/exchanges/$slug" params={{ slug: e.slug }}>
              {e.name} fees
            </Link>{' '}
            <span style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: 'var(--font-mono, monospace)' }}>
              — perps {pct(e.futures.maker)}/{pct(e.futures.taker)}, spot {pct(e.spot.maker)}/{pct(e.spot.taker)}
              {e.token ? ` · ${e.token} −${Math.round((e.tokenDiscount || 0) * 100)}%` : ''}
            </span>
          </li>
        ))}
      </ul>

      <h2>Related</h2>
      <ul>
        <li><a href="/versus">Compare exchanges head-to-head (interactive)</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/cheapest-exchange-for-spot">Cheapest exchange for spot</a></li>
      </ul>
    </LegalPage>
  )
}
