import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/refunds')({
  head: () => ({
    meta: [
      { title: 'Refund Policy — FeeEdge' },
      { name: 'description', content: 'FeeEdge’s refund policy for Pro purchases — how refunds work and how to request one.' },
      { property: 'og:title', content: 'Refund Policy — FeeEdge' },
    ],
  }),
  component: RefundsPage,
})

function RefundsPage() {
  return (
    <LegalPage title="Refund Policy" updated="June 18, 2026">
      <p>
        FeeEdge Pro is a one-time purchase ($29) that unlocks Pro features immediately. This policy explains how
        refunds work.
      </p>

      <h2>14-day money-back guarantee</h2>
      <p>
        If you're not satisfied with FeeEdge Pro, email <a href="mailto:support@feeedge.com">support@feeedge.com</a>
        {' '}within <strong>14 days</strong> of your purchase and we'll issue a full refund — no hassle.
      </p>

      <h2>After 14 days</h2>
      <p>
        Because Pro is a digital product delivered immediately, purchases are final after the 14-day window, except
        where a refund is required by law.
      </p>

      <h2>EU / UK consumers</h2>
      <p>
        Consumers in the EU and UK have a statutory 14-day right of withdrawal for digital purchases. Our 14-day
        money-back guarantee meets or exceeds this right.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href="mailto:support@feeedge.com">support@feeedge.com</a> from (or referencing) the email address
        used for the purchase. Approved refunds are returned to your original payment method through Stripe,
        typically within 5–10 business days.
      </p>
    </LegalPage>
  )
}
