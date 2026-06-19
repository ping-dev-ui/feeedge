import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service — FeeEdge' },
      { name: 'description', content: 'The terms for using FeeEdge, our crypto exchange fee comparison tool, and FeeEdge Pro.' },
      { property: 'og:title', content: 'Terms of Service — FeeEdge' },
    ],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="June 18, 2026">
      <p>
        These Terms of Service ("Terms") govern your use of FeeEdge at feeedge.com (the "Service").
        By using the Service or purchasing FeeEdge Pro, you agree to these Terms. If you do not agree,
        please do not use the Service.
      </p>

      <h2>The service</h2>
      <p>
        FeeEdge is an informational tool that estimates and compares trading fees across cryptocurrency
        exchanges based on the inputs you provide (such as monthly volume, maker/taker mix, hold time,
        and assets). All figures shown are estimates.
      </p>

      <h2>Not financial advice</h2>
      <p>
        <strong>FeeEdge does not provide financial, investment, tax, or trading advice.</strong> Nothing on
        the Service is a recommendation to buy, sell, or use any exchange, asset, or strategy. You are solely
        responsible for your own decisions. Cryptocurrency trading involves significant risk, including loss of
        capital.
      </p>

      <h2>Accuracy and no warranty</h2>
      <p>
        Fee data is gathered from public and third-party sources and may be inaccurate, incomplete, or out of
        date. Exchanges change their fees, volume tiers, discounts, and terms at any time without notice. We do
        not warrant that any figure is correct — always verify current rates directly with the exchange before
        trading. The Service is provided "as is" and "as available."
      </p>

      <h2>Affiliate disclosure</h2>
      <p>
        FeeEdge contains affiliate and referral links to exchanges. We may earn a commission when you open an
        account or trade through these links, at no additional cost to you. Affiliate relationships do not affect
        the rankings, which are computed from fee data and the inputs you provide.
      </p>

      <h2>FeeEdge Pro</h2>
      <p>
        FeeEdge Pro is a one-time purchase that unlocks additional features for the account that bought it.
        Purchases are processed by Stripe and are subject to our <a href="/refunds">Refund Policy</a>.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for activity under your account and for keeping your credentials secure. Do not share
        your account or any access codes.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to scrape, resell, reverse-engineer, overload, or otherwise abuse or disrupt the Service,
        and not to use it for any unlawful purpose.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, FeeEdge and its operators are not liable for any direct, indirect,
        incidental, or consequential losses arising from your use of the Service — including trading losses, losses
        from reliance on estimates, or service interruptions.
      </p>

      <h2>Changes</h2>
      <p>
        We may update the Service and these Terms from time to time. Continued use of the Service after changes
        take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email <a href="mailto:support@feeedge.com">support@feeedge.com</a>.
      </p>
    </LegalPage>
  )
}
