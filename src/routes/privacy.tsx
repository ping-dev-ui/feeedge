import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy — FeeEdge' }] }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="June 18, 2026">
      <p>
        This Privacy Policy explains what information FeeEdge ("we") collects, how we use it, and your choices.
        By using feeedge.com you agree to this policy.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account information:</strong> your email address and password (stored hashed) when you sign up.</li>
        <li><strong>Your inputs:</strong> the profile values you enter (monthly volume, maker/taker mix, hold time, assets) when you save scenarios or set up alerts.</li>
        <li><strong>Email for alerts:</strong> the address you ask us to notify when a cheaper exchange appears.</li>
        <li><strong>Referral code:</strong> if you arrive via a referral link (e.g. <code>?ref=</code>), we store that code to attribute a purchase.</li>
        <li><strong>Basic technical data:</strong> standard request and usage information needed to run the site.</li>
      </ul>

      <h2>Payments</h2>
      <p>
        Payments are processed by <strong>Stripe</strong>. We never see or store your full card details — Stripe
        handles that directly.
      </p>

      <h2>Service providers</h2>
      <p>We use a small number of providers that process data on our behalf:</p>
      <ul>
        <li><strong>Stripe</strong> — payment processing.</li>
        <li><strong>Resend</strong> — transactional and alert emails.</li>
        <li><strong>Convex</strong> — backend and database.</li>
        <li><strong>Vercel</strong> — hosting and content delivery.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We use a session token to keep you signed in, and your browser's local storage to remember your inputs and
        any referral code. We do not use third-party advertising trackers.
      </p>

      <h2>How we use your information</h2>
      <p>
        To provide and improve the Service, process your purchase, send receipts and the price alerts you request,
        and attribute referrals. We do not sell your personal information.
      </p>

      <h2>Sharing</h2>
      <p>
        We share data only with the service providers listed above, or where required by law. Affiliate links take
        you to third-party exchanges that are governed by their own privacy policies.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request access to, correction of, or deletion of your data by emailing
        {' '}<a href="mailto:support@feeedge.com">support@feeedge.com</a>. Residents of the EEA, UK, and California
        may have additional rights, including access, deletion, portability, and objection.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep account data while your account is active. Contact us to close your account and delete your data.
      </p>

      <h2>International</h2>
      <p>
        Your data may be processed in the United States and other countries where our providers operate.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email <a href="mailto:support@feeedge.com">support@feeedge.com</a>.
      </p>
    </LegalPage>
  )
}
