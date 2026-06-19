import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/methodology')({
  head: () => {
    const title = 'How FeeEdge sources & updates fees — Methodology'
    const description =
      'How FeeEdge collects, verifies and updates crypto exchange trading fees: live exchange APIs, automated scraping, and hand-verified rates refreshed daily.'
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: 'https://feeedge.com/methodology' },
      ],
    }
  },
  component: Page,
})

function Page() {
  return (
    <LegalPage title="Methodology — how we source & update fees">
      <p>
        FeeEdge compares trading fees across 20 major crypto exchanges. Accuracy is the whole point, so
        here's exactly where our numbers come from and how often they're refreshed.
      </p>

      <h2>What we track</h2>
      <p>
        For each exchange we track the <strong>entry-tier (regular / VIP-0)</strong> maker and taker fee for
        both <strong>perpetual futures</strong> and <strong>spot</strong>. The calculator then adjusts these
        for your 30-day volume tier, your maker/taker mix, native-token discounts, and — on perps — an
        estimate of funding costs. Every figure on the site is an estimate to help you compare, not financial
        advice; always confirm the exact rate on the exchange before trading.
      </p>

      <h2>Where the rates come from</h2>
      <p>
        Each exchange/market uses the most reliable source available, in this order:
      </p>
      <ul>
        <li>
          <strong>Live exchange API.</strong> Where an exchange exposes a clean public fee endpoint, we pull
          it automatically. Kraken's spot and futures fees are fetched this way.
        </li>
        <li>
          <strong>Automated scraping.</strong> For venues without a usable API, we scrape their published fee
          page through Bright Data's infrastructure, with a verified per-exchange parser and strict sanity
          checks (a value that can't be confidently parsed is rejected rather than shown). BingX futures is
          sourced this way today, and we add venues as reliable parsers are verified.
        </li>
        <li>
          <strong>Hand-verified rates.</strong> For the rest, we use published rates that we verify by hand
          and re-check on a recurring schedule. These carry the date we last confirmed them.
        </li>
      </ul>

      <h2>How often it updates</h2>
      <p>
        An automated job refreshes every exchange <strong>daily</strong>. Live-API and scraped venues update
        from their real source on each run; hand-verified venues are re-confirmed on a recurring monthly
        review, and their displayed date reflects the last verification. Each row in the calculator shows an
        <strong> "Updated" date and time</strong> so you can always see how current a given rate is.
      </p>

      <h2>What we don't capture perfectly</h2>
      <p>
        Funding rates (on perps) are estimated from your average hold time and live rates for major venues;
        smaller venues use a conservative default. Withdrawal fees, spreads and slippage are real costs that
        vary constantly — we surface withdrawal and spread context but they can't be pinned to a single
        number. When in doubt, the exchange's own fee page is the source of truth.
      </p>

      <h2>Found something off?</h2>
      <p>
        If a rate looks wrong, tell us at <a href="mailto:support@feeedge.com">support@feeedge.com</a> and
        we'll re-verify it. Accuracy reports are genuinely appreciated.
      </p>

      <h2>Related</h2>
      <ul>
        <li><a href="/">FeeEdge calculator</a></li>
        <li><a href="/compare">All exchange fee comparisons</a></li>
        <li><a href="/exchanges">Per-exchange fee pages</a></li>
        <li><a href="/guides/hidden-costs-of-crypto-trading">The hidden costs of crypto trading</a></li>
      </ul>
    </LegalPage>
  )
}
