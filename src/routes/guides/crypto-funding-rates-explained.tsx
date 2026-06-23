import type { CSSProperties } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import { DATA_UPDATED } from '~/data/exchanges'

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a funding rate on perpetual futures?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A funding rate is a periodic payment exchanged directly between long and short traders on a perpetual-futures contract, usually about every 8 hours. It keeps the perp price tethered to the spot price. When funding is positive, longs pay shorts; when it is negative, shorts pay longs. The exchange does not keep it, but it is a real cost of holding a position.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can funding cost more than the trading fee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, often. The trading fee is paid once when you open and once when you close. Funding is paid every window you hold the position. Hold a leveraged perp through several funding windows and the cumulative funding can easily exceed the trading fee, which is why the cheapest venue to trade is not always the cheapest to hold.',
      },
    },
  ],
}

export const Route = createFileRoute('/guides/crypto-funding-rates-explained')({
  head: () => {
    const title = 'Crypto funding rates explained (2026) — FeeEdge'
    const description =
      'What perpetual-futures funding rates are, how they are charged, and why funding often costs perps traders more than the trading fee itself.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/guides/crypto-funding-rates-explained' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Crypto funding rates explained" updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <p>
        If you trade perpetual futures, the trading fee is only half the story. The other half is
        <strong> funding</strong>, and for anyone who holds a position for more than a few hours it is often
        the bigger cost. Here is how it works and why it matters.
      </p>

      <h2>What funding actually is</h2>
      <p>
        A perpetual future has no expiry, so exchanges use a funding payment to keep its price anchored to spot.
        Roughly every 8 hours, longs and shorts pay each other directly based on the funding rate. The exchange
        does not pocket it. When funding is positive, longs pay shorts. When it is negative, shorts pay longs.
      </p>

      <h2>Why it can beat the trading fee</h2>
      <p>
        You pay the trading fee twice: once to open, once to close. You pay funding every window you hold. A
        position held across several funding windows can rack up more in funding than the round-trip trading
        fee, especially in a strongly trending market where funding runs hot. That is why a venue with the
        cheapest taker fee is not automatically the cheapest place to hold a trade.
      </p>

      <h2>How to keep funding from eating your edge</h2>
      <p>
        Check the live funding rate before you hold, not just the trading fee. The same position can be cheaper
        to carry on a different venue purely because its funding is lower. Shorter holds reduce funding exposure.
        And if you are delta-neutral, funding can even pay you.
      </p>
      <p>
        FeeEdge Pro includes a funding-rate optimizer that shows live 8-hour funding per venue and the cheapest
        place to hold a long versus a short, on top of the trading-fee ranking.
      </p>
      <p>
        <a href="/" style={cta}>See live funding by venue</a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/guides/hidden-costs-of-crypto-trading">The hidden costs of crypto trading</a></li>
        <li><a href="/best-exchange-for-scalping">Best exchange for scalping</a></li>
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
