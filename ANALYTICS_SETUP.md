# Analytics setup (ready to apply)

Goal: measure the funnel **visit → result viewed → upgrade click → Pro**, plus which `?ref=` and SEO pages convert. Nothing here is applied yet — review and say go.

## Recommendation: PostHog (free tier, funnels + events)

PostHog's free tier (~1M events/mo) gives funnels, retention, and per-`ref` breakdowns — exactly what you need for the influencer/SEO push. Plausible (below) is the lighter, privacy-first alternative if you only want traffic numbers.

### Steps
1. Create a free account at posthog.com → new project → copy the **Project API key** (`phc_...`) and the API host (e.g. `https://us.i.posthog.com`).
2. Add them as Vercel env vars (Project → Settings → Environment Variables), since they're baked at build time:
   - `VITE_POSTHOG_KEY = phc_...`
   - `VITE_POSTHOG_HOST = https://us.i.posthog.com`
3. Install the SDK: `npm.cmd install posthog-js`
4. Add a small client initializer (code below) to `src/routes/__root.tsx`.
5. Sprinkle `capture(...)` calls on the key actions.

### Code — initializer (add to `__root.tsx`)
Inside `RootDocument`, render a `<PostHogInit />` client component:

```tsx
import { useEffect } from 'react'
import posthog from 'posthog-js'

function PostHogInit() {
  useEffect(() => {
    const key = import.meta.env.VITE_POSTHOG_KEY
    if (!key || typeof window === 'undefined') return
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
    // attribute the referral code if present
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) posthog.register({ ref })
  }, [])
  return null
}
```
Render `<PostHogInit />` just inside the `<body>` in `RootDocument`.

### Key events to capture (in `src/routes/index.tsx`)
- In `handleUpgrade`: `posthog?.capture('upgrade_clicked', { market, monthlyVolume, isAuthenticated })`
- After results render once: `posthog?.capture('result_viewed', { market, monthlyVolume })`
- In `handleShareSavings`: `posthog?.capture('share_savings')`
- In `handleExportCsv` / `handleExportPdf`: `posthog?.capture('export', { type })`
- On successful Pro (the `?checkout=success` landing): `posthog?.capture('pro_purchased')`

Import once at top: `import posthog from 'posthog-js'`. Guard calls with `typeof window !== 'undefined'`.

### Funnel to build in PostHog
`$pageview` → `result_viewed` → `upgrade_clicked` → `pro_purchased`, broken down by the `ref` property and by entry URL (to see which SEO/comparison pages convert).

## Alternative: Plausible (lightweight, privacy-first)
One script tag, no cookies, no env vars baked in. Paid (~$9/mo) or self-host.
- Add to `__root.tsx` head `scripts`:
```ts
scripts: [{ src: 'https://plausible.io/js/script.js', defer: true, 'data-domain': 'feeedge.com' }]
```
- Custom events via `window.plausible?.('Upgrade clicked')`. Less powerful for funnels than PostHog.

## My suggestion
Go **PostHog** for the conversion analysis you actually need right now. It's ~30 min to wire up; I can do all the code edits on your go-ahead (you'd create the account, add the two Vercel env vars, then push).
