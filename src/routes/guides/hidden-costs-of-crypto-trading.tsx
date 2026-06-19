import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/guides/hidden-costs-of-crypto-trading')({
  head: () => {
    const title = 'The hidden costs of crypto trading (2026) — FeeEdge'
    const description =
      "It's not just the trading fee — funding rates, withdrawal fees, spread/slippage, volume tiers and token discounts all change your true cost. Here's how they add up."
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/guides/hidden-costs-of-crypto-trading' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="The hidden costs of crypto trading">
      <p>
        When traders compare exchanges they look at one number: the maker/taker trading fee. But that's only
        part of what you actually pay. Here are the costs that quietly add up — and why your "cheapest"
        exchange might not be the one with the lowest advertised fee.
      </p>

      <h2>1. Funding rates (perps only — often the biggest)</h2>
      <p>
        On perpetual futures, <strong>funding</strong> can dwarf trading fees. Every 8 hours (hourly on some
        venues) longs and shorts exchange a payment to keep the perp tethered to spot. Hold a leveraged
        position through several windows and you can pay more in funding than in fees — without placing another
        order. The cheapest venue to <em>hold</em> isn't always the cheapest to <em>trade</em>.
      </p>

      <h2>2. Withdrawal fees (and the network you pick)</h2>
      <p>
        Moving crypto off an exchange costs a withdrawal fee that varies by exchange <em>and</em> network. The
        same USDT withdrawal might cost ~1 USDT on Tron (TRC-20) but several dollars on Ethereum (ERC-20). If
        you move funds often, the wrong chain is a recurring, avoidable tax.
      </p>

      <h2>3. The spread and slippage</h2>
      <p>
        The quoted fee assumes you trade at the mid price. In reality you cross the bid/ask spread, and on thin
        books a market order walks the book (slippage). Less-liquid assets and smaller venues have wider
        spreads, so the <em>effective</em> cost of trading an altcoin can far exceed the headline fee.
      </p>

      <h2>4. Volume tiers you're not hitting</h2>
      <p>
        Most exchanges drop your rate as 30-day volume climbs. Spread across three exchanges, you might be stuck
        at the worst tier on all of them — when consolidating onto one could unlock a cheaper tier and save more
        than switching venues.
      </p>

      <h2>5. Native-token discounts you're not using</h2>
      <p>
        Several exchanges cut fees 10–25% if you hold or pay with their token (BNB, OKB, KCS, GT, BGB). If you
        trade there regularly and aren't using it, that's an easy discount left on the table.
      </p>

      <h2>Add it all up</h2>
      <p>
        Real cost = trading fees + funding (perps) + withdrawal fees + spread/slippage, minus volume-tier and
        token discounts. The lowest headline fee can easily lose to a venue with better funding, cheaper
        withdrawals, or a discount you'd actually use. <a href="/">FeeEdge</a> folds these into one personalized
        number across 9 exchanges.
      </p>
      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          See your true cost →
        </a>
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/guides/maker-vs-taker-fees">Maker vs taker fees explained</a></li>
        <li><a href="/cheapest-exchange-for-perps">Cheapest exchange for perps</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
      </ul>
    </LegalPage>
  )
}
