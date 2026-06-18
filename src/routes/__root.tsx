import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
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
          'Find the cheapest crypto exchange for how you trade. Compare real trading fees across 9 exchanges — perps & spot — ranked for your volume and style.',
      },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'FeeEdge' },
      { property: 'og:title', content: 'The cheapest exchange for how you trade' },
      {
        property: 'og:description',
        content:
          'Compare real trading fees across 9 exchanges — perps & spot — ranked for your volume and style. $29 once, no subscription.',
      },
      { property: 'og:url', content: 'https://feeedge.com/' },
      { property: 'og:image', content: 'https://feeedge.com/og.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'The cheapest exchange for how you trade' },
      {
        name: 'twitter:description',
        content:
          'Compare real trading fees across 9 exchanges — perps & spot — ranked for your volume and style.',
      },
      { name: 'twitter:image', content: 'https://feeedge.com/og.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
