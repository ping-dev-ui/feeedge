import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — FeeEdge' },
      {
        name: 'description',
        content:
          'FeeEdge helps crypto traders find the cheapest exchange for how they actually trade.',
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <LegalPage title="About FeeEdge">
      <p>
        FeeEdge helps crypto traders find the cheapest exchange for how they <strong>actually</strong> trade.
      </p>

      <h2>Why it exists</h2>
      <p>
        Most traders overpay on fees because they pick an exchange once and never re-check. But the cheapest venue
        isn't the same for everyone — it depends on your volume, your maker/taker mix, whether you trade perps or
        spot, and which assets you trade. The gap between the cheapest and priciest venue can be thousands of
        dollars a year for identical trading.
      </p>

      <h2>What it does</h2>
      <p>
        You enter how you trade, and FeeEdge ranks 9 exchanges by your real estimated monthly cost — factoring in
        maker/taker fees, funding rates on perps, native-token discounts, and volume tiers. The free version shows
        your three cheapest venues; <strong>Pro</strong> ($29 once, no subscription) unlocks all 9 plus the funding
        optimizer, withdrawal-fee comparison, tier savings ladder, price alerts, and PDF/CSV export.
      </p>

      <h2>Independent rankings</h2>
      <p>
        Rankings are computed purely from fee data and the inputs you provide. FeeEdge does use affiliate links to
        exchanges (see our <a href="/terms">Terms</a>), but they never change the rankings.
      </p>

      <h2>Get in touch</h2>
      <p>
        Email <a href="mailto:support@feeedge.com">support@feeedge.com</a> or find us on X at
        {' '}<a href="https://x.com/fee_edge" target="_blank" rel="noopener noreferrer">@fee_edge</a>.
      </p>

      <p>
        FeeEdge provides estimates for informational purposes only and is not financial advice.
      </p>
    </LegalPage>
  )
}
