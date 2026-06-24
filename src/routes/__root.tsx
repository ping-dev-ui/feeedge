import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'
import { JsonLd } from '~/components/JsonLd'

const siteSchema = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FeeEdge',
    url: 'https://feeedge.com/',
    logo: 'https://feeedge.com/logo-mark.png',
    description:
      'FeeEdge compares real trading fees across 20 major crypto exchanges — perps and spot — ranked for your volume and trading style.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FeeEdge',
    url: 'https://feeedge.com/',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FeeEdge',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: 'https://feeedge.com/',
    description:
      'Compare real trading fees across 20 crypto exchanges — perps and spot — ranked for your volume and trading style.',
    offers: {
      '@type': 'Offer',
      price: '29',
      priceCurrency: 'USD',
      description: 'FeeEdge Pro — one-time, no subscription',
    },
  },
]

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: ({ matches }) => {
    // Self-referencing canonical for the current page, query-string stripped, so
    // links with ?ref=/?v= don't create duplicate URLs. Computed from the most
    // specific matched route's pathname (emitted via head() so it SSRs).
    const path = matches[matches.length - 1]?.pathname || '/'
    const cleanPath = path !== '/' ? path.replace(/\/$/, '') : '/'
    const canonicalHref = `https://feeedge.com${cleanPath}`
    return {
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'FeeEdge — Compare Crypto Exchange Fees',
      },
      {
        name: 'description',
        content:
          'Find the cheapest crypto exchange for how you trade. Compare real trading fees across 20 exchanges — perps & spot — ranked for your volume and style.',
      },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'FeeEdge' },
      { property: 'og:title', content: 'The cheapest exchange for how you trade' },
      {
        property: 'og:description',
        content:
          'Compare real trading fees across 20 exchanges — perps & spot — ranked for your volume and style. $29 once, no subscription.',
      },
      { property: 'og:url', content: 'https://feeedge.com/' },
      { property: 'og:image', content: 'https://feeedge.com/og.png?v=2' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'The cheapest exchange for how you trade' },
      {
        name: 'twitter:description',
        content:
          'Compare real trading fees across 20 exchanges — perps & spot — ranked for your volume and style.',
      },
      { name: 'twitter:image', content: 'https://feeedge.com/og.png?v=2' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png?v=2' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'icon', href: '/favicon.ico?v=2' },
      { rel: 'canonical', href: canonicalHref },
    ],
    }
  },
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

// Loads PostHog only when VITE_POSTHOG_KEY is set (so it's a no-op until you
// add the key + redeploy — no npm dependency, can't break the build).
function Analytics() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const env = (import.meta as any).env || {}
    const key = env.VITE_POSTHOG_KEY
    if (!key) return
    const host = (env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '')
    const w = window as any
    if (w.__phLoaded) return
    w.__phLoaded = true
    const s = document.createElement('script')
    s.src = host + '/static/array.js'
    s.async = true
    s.onload = () => {
      try {
        w.posthog?.init(key, {
          api_host: host,
          capture_pageview: true,
          person_profiles: 'identified_only',
        })
        const ref = new URLSearchParams(window.location.search).get('ref')
        if (ref) w.posthog?.register({ ref })
      } catch {
        /* analytics is best-effort */
      }
    }
    document.head.appendChild(s)
  }, [])
  return null
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <JsonLd data={siteSchema} />
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}
