import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { LegalPage } from '~/components/LegalPage'
import { JsonLd } from '~/components/JsonLd'
import { ExchangeLogo } from '~/components/ExchangeLogo'
import {
  volumeTierBySlug,
  VOLUME_TIERS,
  rankedByCost,
  usd,
  pct,
  DATA_UPDATED,
} from '~/data/exchanges'

export const Route = createFileRoute('/volume/$tier')({
  head: ({ params }) => {
    const t = params && params.tier ? volumeTierBySlug(params.tier) : null
    if (!t) return { meta: [{ title: 'Cheapest exchange by volume — FeeEdge' }] }
    const title = `Cheapest crypto exchange for ${t.label}/month volume (2026) — FeeEdge`
    const description = `Trading ${t.label} a month? See every major exchange ranked by what that volume actually costs in fees — perps and spot, maker and taker — and how much switching saves.`
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: `https://feeedge.com/volume/${params.tier}` },
      ],
    }
  },
  component: VolumePage,
  notFoundComponent: () => (
    <LegalPage title="Volume profile not found">
      <p>
        We couldn't find that volume profile. Try the{' '}
        <a href="/">calculator</a> with your exact monthly volume, or see{' '}
        <a href="/compare">all fee comparisons</a>.
      </p>
    </LegalPage>
  ),
})

function VolumePage() {
  const { tier } = Route.useParams()
  const t = volumeTierBySlug(tier)
  if (!t) throw notFound()

  const perps = rankedByCost('futures', t.usd)
  const spot = rankedByCost('spot', t.usd)
  const cheapestPerps = perps[0]
  const priciestPerps = perps[perps.length - 1]
  const cheapestSpot = spot[0]
  const priciestSpot = spot[spot.length - 1]
  const perpsSavings = (priciestPerps.cost - cheapestPerps.cost) * 12
  const spotSavings = (priciestSpot.cost - cheapestSpot.cost) * 12

  const otherTiers = VOLUME_TIERS.filter((x) => x.slug !== t.slug)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Which exchange is cheapest for ${t.label} a month in trading volume?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `At ${t.label}/month with a 50/50 maker/taker mix on entry-tier rates, ${cheapestPerps.ex.name} has the lowest estimated perps bill (~${usd(cheapestPerps.cost)}/mo) and ${cheapestSpot.ex.name} the lowest spot bill (~${usd(cheapestSpot.cost)}/mo). Volume tiers, funding and token discounts can change the ranking, so check your exact profile in the FeeEdge calculator.`,
        },
      },
      {
        '@type': 'Question',
        name: `How much does ${t.label}/month in volume cost in fees?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `On perps it ranges from about ${usd(cheapestPerps.cost)} to ${usd(priciestPerps.cost)} per month across major venues at entry-tier rates; on spot from about ${usd(cheapestSpot.cost)} to ${usd(priciestSpot.cost)}. Picking the wrong venue can cost ${usd(Math.max(perpsSavings, spotSavings))}+ per year.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Do volume tiers change which exchange is cheapest?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Most exchanges cut maker/taker rates as your 30-day volume climbs, and the breakpoints differ by venue, so the cheapest exchange at one volume is often not the cheapest at another. The FeeEdge calculator applies each venue\'s tier table to your exact volume.',
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://feeedge.com/' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://feeedge.com/compare' },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Cheapest for ${t.label}/month`,
        item: `https://feeedge.com/volume/${t.slug}`,
      },
    ],
  }

  return (
    <LegalPage title={`Cheapest exchange for ${t.label}/month volume`} updated={DATA_UPDATED}>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <p>
        Trading around <strong>{t.label} a month</strong>? At that volume the venue you pick is a real
        line item: across the major exchanges the same flow costs anywhere from{' '}
        <strong>{usd(cheapestPerps.cost)}</strong> to <strong>{usd(priciestPerps.cost)}</strong> per month
        on perps ({usd(cheapestSpot.cost)} to {usd(priciestSpot.cost)} on spot), assuming a 50/50
        maker/taker mix at published entry-tier rates. That gap is up to{' '}
        <strong>{usd(Math.max(perpsSavings, spotSavings))} a year</strong> for doing nothing differently
        except where you trade.
      </p>

      <h2>Perps: estimated monthly fee bill at {t.label}/month</h2>
      <CostTable rows={perps.slice(0, 10)} market="futures" />

      <h2>Spot: estimated monthly fee bill at {t.label}/month</h2>
      <CostTable rows={spot.slice(0, 10)} market="spot" />

      <p style={{ fontSize: '13px' }}>
        Estimates use published entry-tier rates with a 50/50 maker/taker mix. Your real bill depends on
        your maker/taker mix, volume-tier discounts, funding (perps), and native-token discounts — the{' '}
        <a href="/">FeeEdge calculator</a> applies all of those to your exact profile.
      </p>

      <h2>Why the ranking changes at your volume</h2>
      <p>
        Most venues cut rates as your 30-day volume climbs, and the breakpoints differ: an exchange
        that's mid-pack at $10k/month can be cheapest at $1M/month once its tier discounts kick in.
        Maker rebates and token discounts (paying fees in BNB, GT, KCS, etc.) shift it further. The
        table above is the honest entry-tier picture; the calculator applies each venue's full tier
        table to your number.
      </p>

      <p>
        <a
          href="/"
          style={{ display: 'inline-block', background: '#10b981', color: '#03150f', fontWeight: 700, padding: '10px 18px', borderRadius: '8px', textDecoration: 'none' }}
        >
          Run your exact volume across 20 exchanges →
        </a>
      </p>

      {cheapestPerps.ex.referral && (
        <>
          <h2>Open an account</h2>
          <p>
            <a href={cheapestPerps.ex.referral} target="_blank" rel="sponsored noopener noreferrer">
              Open a {cheapestPerps.ex.name} account
            </a>{' '}
            <span style={{ fontSize: '12px' }}>
              (affiliate link — FeeEdge may earn a commission at no extra cost to you; rankings are
              never influenced by commissions)
            </span>
          </p>
        </>
      )}

      <h2>FAQ</h2>
      <h3>Which exchange is cheapest for {t.label} a month?</h3>
      <p>
        At entry-tier rates with a 50/50 mix, {cheapestPerps.ex.name} has the lowest estimated perps
        bill and {cheapestSpot.ex.name} the lowest spot bill — but tiers, funding and token discounts
        can flip it, so check your profile in the <a href="/">calculator</a>.
      </p>
      <h3>How much does {t.label}/month cost in fees?</h3>
      <p>
        Roughly {usd(cheapestPerps.cost)}–{usd(priciestPerps.cost)}/month on perps and{' '}
        {usd(cheapestSpot.cost)}–{usd(priciestSpot.cost)}/month on spot, depending on venue. See{' '}
        <a href="/guides/hidden-costs-of-crypto-trading">the hidden costs of crypto trading</a> for
        what the headline rate leaves out.
      </p>

      <h2>Other volume profiles</h2>
      <ul>
        {otherTiers.map((x) => (
          <li key={x.slug}>
            <Link to="/volume/$tier" params={{ tier: x.slug }}>
              Cheapest exchange for {x.label}/month volume
            </Link>
          </li>
        ))}
      </ul>
      <p>
        Related: <a href="/cheapest-exchange-for-perps">cheapest exchange for perps</a> ·{' '}
        <a href="/cheapest-exchange-for-spot">cheapest for spot</a> ·{' '}
        <a href="/best-exchange-for-scalping">best for scalping</a> ·{' '}
        <a href="/compare">all comparisons</a>
      </p>
    </LegalPage>
  )
}

function CostTable({
  rows,
  market,
}: {
  rows: Array<{ ex: import('~/data/exchanges').Exchange; cost: number }>
  market: 'futures' | 'spot'
}) {
  const th = (label: string, align: 'left' | 'right') => (
    <th
      style={{
        textAlign: align,
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        color: '#a1a1aa',
        fontWeight: 600,
      }}
    >
      {label}
    </th>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
        <thead>
          <tr>
            {th('#', 'left')}
            {th('Exchange', 'left')}
            {th('Maker', 'right')}
            {th('Taker', 'right')}
            {th('Est. monthly bill', 'right')}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ex, cost }, i) => {
            const fees = market === 'futures' ? ex.futures : ex.spot
            const cellStyle = {
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }
            return (
              <tr key={ex.slug}>
                <td style={{ ...cellStyle, color: '#a1a1aa' }}>{i + 1}</td>
                <td style={{ ...cellStyle, color: '#fff', fontWeight: i === 0 ? 700 : 400 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ExchangeLogo slug={ex.slug} name={ex.name} colorClass={ex.colorClass} size={18} />
                    {ex.name}
                  </span>
                </td>
                <td style={{ ...cellStyle, textAlign: 'right', color: '#e4e4e7', fontFamily: 'var(--font-mono, monospace)' }}>
                  {pct(fees.maker)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right', color: '#e4e4e7', fontFamily: 'var(--font-mono, monospace)' }}>
                  {pct(fees.taker)}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: 'right',
                    color: i === 0 ? '#34d399' : '#e4e4e7',
                    fontWeight: i === 0 ? 700 : 400,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {usd(cost)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
