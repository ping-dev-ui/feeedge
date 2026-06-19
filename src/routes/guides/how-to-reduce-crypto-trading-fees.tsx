import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'

const schema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to reduce crypto trading fees',
    description:
      'Seven practical ways to pay less in crypto trading fees — maker orders, volume tiers, token discounts, the right venue, and the costs people forget.',
    datePublished: '2026-06-19',
    author: { '@type': 'Organization', name: 'FeeEdge' },
    publisher: {
      '@type': 'Organization',
      name: 'FeeEdge',
      logo: { '@type': 'ImageObject', url: 'https://feeedge.com/logo-mark.png' },
    },
    mainEntityOfPage: 'https://feeedge.com/guides/how-to-reduce-crypto-trading-fees',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the easiest way to pay lower crypto trading fees?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use limit (maker) orders instead of market (taker) orders. Maker fees are typically 2–3× lower, so simply being patient with your entries cuts costs on every trade without changing exchange.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do native exchange tokens really lower fees?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, on exchanges that offer it — holding or paying fees with tokens like BNB, OKB, KCS, GT, BGB, HT, BMX, CET or WBT gives a discount of roughly 10–25%. It only pays off if you trade there regularly enough to offset holding the token.',
        },
      },
    ],
  },
]

export const Route = createFileRoute('/guides/how-to-reduce-crypto-trading-fees')({
  head: () => {
    const title = 'How to reduce crypto trading fees (2026) — FeeEdge'
    const description =
      'Seven practical, proven ways to pay less in crypto trading fees: maker orders, volume tiers, native-token discounts, picking the right venue, and avoiding hidden costs.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/guides/how-to-reduce-crypto-trading-fees' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="How to reduce your crypto trading fees">
      <JsonLd data={schema} />
      <p>
        Trading fees are one of the few costs you fully control. Over a year of active trading they add up to
        real money, and shaving them is pure profit. Here are seven ways to pay less — roughly in order of
        impact.
      </p>

      <h2>1. Trade with maker (limit) orders</h2>
      <p>
        The fastest win, on any exchange: place limit orders that add liquidity instead of market orders that
        take it. Maker fees are usually 2–3× lower than taker fees, so this cuts costs on every fill without
        switching venues. See <a href="/guides/maker-vs-taker-fees">maker vs taker fees explained</a>.
      </p>

      <h2>2. Pick the right exchange for how you trade</h2>
      <p>
        Base fees vary several-fold across venues, and the cheapest one depends on whether you trade perps or
        spot and on your maker/taker mix. Don't assume your current exchange is cheapest — the
        <a href="/"> FeeEdge calculator</a> ranks all 20 for your exact profile.
      </p>

      <h2>3. Climb the volume tiers</h2>
      <p>
        Almost every exchange lowers your rate as 30-day volume rises. If your volume is split across several
        exchanges, you may be stuck at the worst tier on all of them — consolidating onto one venue can unlock
        a cheaper tier and save more than switching.
      </p>

      <h2>4. Use a native-token discount (if you trade there anyway)</h2>
      <p>
        Many exchanges cut fees 10–25% when you hold or pay with their token (BNB, OKB, KCS, GT, BGB, HT, BMX,
        CET, WBT). It's worth it only if you trade on that venue regularly enough to justify holding the token.
      </p>

      <h2>5. Mind funding on perps</h2>
      <p>
        On perpetual futures, funding paid every ~8 hours between longs and shorts can cost more than the
        trading fee if you hold positions. The cheapest venue to <em>trade</em> isn't always the cheapest to
        <em> hold</em> — factor funding into your real cost.
      </p>

      <h2>6. Choose the cheaper withdrawal network</h2>
      <p>
        Moving coins off-exchange costs a withdrawal fee that varies by network. The same USDT might cost ~1
        on Tron but several dollars on Ethereum. If you withdraw often, the wrong chain is a recurring,
        avoidable tax.
      </p>

      <h2>7. Account for the spread</h2>
      <p>
        The quoted fee assumes you trade at mid price; in reality you cross the bid/ask spread, which is wider
        on thin books and small venues. For less-liquid assets the effective cost can far exceed the headline
        fee — trade liquid pairs and use limit orders to control it.
      </p>

      <h2>Add it up</h2>
      <p>
        Real cost = trading fees + funding (perps) + withdrawal fees + spread, minus volume-tier and token
        discounts. <a href="/">FeeEdge</a> folds these into one personalized number across 20 exchanges so you
        can see exactly where you'd pay least.
      </p>
      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          See your cheapest exchange →
        </a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/guides/maker-vs-taker-fees">Maker vs taker fees explained</a></li>
        <li><a href="/guides/hidden-costs-of-crypto-trading">The hidden costs of crypto trading</a></li>
        <li><a href="/lowest-fee-crypto-exchange">Lowest-fee crypto exchange</a></li>
      </ul>
    </LegalPage>
  )
}
