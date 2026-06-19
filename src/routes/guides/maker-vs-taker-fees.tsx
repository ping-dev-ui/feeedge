import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Maker vs taker fees explained',
  description:
    'What maker and taker fees are, why takers usually pay more, and how to pay the cheaper maker fee.',
  datePublished: '2026-06-18',
  author: { '@type': 'Organization', name: 'FeeEdge' },
  publisher: {
    '@type': 'Organization',
    name: 'FeeEdge',
    logo: { '@type': 'ImageObject', url: 'https://feeedge.com/logo-mark.png' },
  },
  mainEntityOfPage: 'https://feeedge.com/guides/maker-vs-taker-fees',
}

export const Route = createFileRoute('/guides/maker-vs-taker-fees')({
  head: () => {
    const title = 'Maker vs taker fees explained (2026) — FeeEdge'
    const description =
      'What maker and taker fees are, why takers usually pay 2–3× more, and how to pay the cheaper maker fee — plus why your maker/taker mix decides the cheapest exchange.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/guides/maker-vs-taker-fees' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Maker vs taker fees explained">
      <JsonLd data={articleSchema} />
      <p>
        The easiest way to cut your crypto trading costs usually isn't switching exchanges — it's
        understanding the difference between a <strong>maker</strong> and a <strong>taker</strong> fee and
        trading in a way that pays the cheaper one. On most venues the gap is 2–3× per trade.
      </p>

      <h2>What's the difference?</h2>
      <p>
        Every exchange runs an order book. Your order either <em>adds</em> liquidity or <em>removes</em> it:
      </p>
      <ul>
        <li><strong>Maker order</strong> — a limit order that rests on the book waiting to be filled. You're "making" liquidity, so you pay the <strong>lower</strong> fee (sometimes zero, sometimes a rebate).</li>
        <li><strong>Taker order</strong> — a market order (or a limit order that fills instantly) that removes existing liquidity. You pay the <strong>higher</strong> fee for the instant fill.</li>
      </ul>
      <p>A typical entry-tier perp schedule is <strong>0.02% maker / 0.05% taker</strong> — the taker pays 2.5× more for the same trade.</p>

      <h2>Why most traders overpay</h2>
      <p>
        Market orders are the default — one tap, instant fill. But every market order is a taker order, the
        expensive side. Traders who hammer the buy/sell button quietly pay the top rate on every fill.
      </p>

      <h2>How to pay the maker fee instead</h2>
      <ul>
        <li><strong>Use limit orders</strong> — set your price and let the order rest on the book.</li>
        <li><strong>Use "post-only" mode</strong> where available — it guarantees maker treatment (it won't cross the spread and become a taker).</li>
        <li><strong>Be patient on entries and exits</strong> — a limit order a tick from the market often fills within seconds at a fraction of the taker cost.</li>
      </ul>
      <p>The trade-off is fill certainty: a limit order might not fill if price runs away. For fast scalps, takers are sometimes unavoidable — which is exactly why your maker/taker <em>mix</em> matters.</p>

      <h2>Your mix decides which exchange is cheapest</h2>
      <p>
        An exchange with a great maker rate but a poor taker rate is cheap for a patient limit-order trader and
        expensive for a market-order scalper. That's the idea behind <a href="/">FeeEdge</a>: set your real
        maker/taker mix and volume, and it ranks every exchange by what <em>you'd</em> actually pay.
      </p>
      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Find your cheapest exchange →
        </a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/guides/hidden-costs-of-crypto-trading">The hidden costs of crypto trading</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
      </ul>
    </LegalPage>
  )
}
