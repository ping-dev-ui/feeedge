# Share loop: personalized OG cards + /r landing

Built overnight 2026-06-23. Status: code complete, typechecked, and the image
renderer verified end to end in a sandbox. NOT deployed. Review the diff, then
deploy with the steps at the bottom.

## What this does
Before: when someone shared their calculator result, the link unfurled on X and
Telegram with the generic homepage card. That dead, identical card gave people
no reason to click, which throttled the whole share loop.

After: a share link unfurls as a personalized image that says
"You could save $5,304/yr switching to Bitfinex" with the trader's own inputs.
That is the viral hook. Same mechanic Grok and I landed on in the plan.

## Files added or changed
- `src/routes/r.tsx` (new): the server-rendered share landing at `/r`. Reads the
  profile + savings from the query string, sets a personalized `og:image`,
  `og:title`, `twitter:*` in its SSR `<head>`, and renders a result hero with a
  big "Find your cheapest exchange" CTA into the live calculator, plus the share
  buttons so the recipient can re-share. Marked `noindex, follow` (infinite param
  combinations should not be indexed).
- `scripts/og-entry.mjs` (new): the dynamic image endpoint. Renders the 1200x630
  PNG card from the query params with satori (HTML to SVG) + @resvg/resvg-wasm
  (SVG to PNG). Fonts (Bricolage Grotesque, OFL) and the resvg wasm are inlined
  at build time, so the function has no disk or network dependency. On any error
  it 302s to the static `/og.png`, so a share never hard-fails.
- `scripts/og/fonts/` (new): the two Bricolage TTFs + the OFL license.
- `scripts/build-vercel.mjs` (changed): also bundles `og-entry.mjs` into a second
  Build Output function at `functions/api/og.func` and adds a route so `/api/og`
  hits it (before the SSR catch-all).
- `src/routes/index.tsx` (changed): `buildShareUrl()` now points at `/r` and
  includes the annual `save` and the cheapest venue `top`, so the unfurled card
  is personalized. The existing `?ref=` affiliate attribution is untouched.
- `package.json`: added `satori` and `@resvg/resvg-wasm`.

## How the share URL looks
`https://feeedge.com/r?v=1000000&m=futures&mk=0.50&h=4&a=BTC,ETH&save=5304&top=Bitfinex`

The card image is `https://feeedge.com/api/og?save=5304&top=Bitfinex&v=1000000&m=futures&mk=0.50`.

## What was verified in the sandbox
- `npx tsc --noEmit` passes clean (the new route's validateSearch/loader/head
  typing and the index.tsx change typecheck).
- `vite build` transforms all 2061 modules with no errors (every route compiles,
  including `/r`).
- The OG function was bundled with the exact `build-vercel.mjs` esbuild config
  and run as a Node handler: it returns `200 image/png`, ~43KB, correct card.
- One thing did NOT run to completion in the sandbox: the final `vite build`
  step that empties `dist/`. The sandbox could not delete the pre-existing
  `dist/` from an earlier build (a filesystem permission quirk of the mount, not
  a code issue). Vercel builds in a clean workspace, so this does not affect it.
  To reproduce locally, delete `dist/` first, then `npm run build`.

## Deploy + verify
1. Review the diff (`git diff` + the new files above).
2. `npm install` (pulls in satori + @resvg/resvg-wasm).
3. Locally: remove `dist/`, then `npm run build`. Confirm
   `.vercel/output/functions/api/og.func/index.mjs` exists.
4. Commit and push. Vercel redeploys.
5. After deploy, smoke test:
   - Open `https://feeedge.com/api/og?save=5304&top=Bitfinex&v=1000000&m=futures&mk=0.5`
     in a browser. You should see the PNG card.
   - Run a result on the site, click a share button, and check the unfurl with
     the X Post Inspector (cards-dev) and Telegram's @WebpageBot, which both
     refetch and clear the old cached card.

## Possible follow-ups (not built)
- A share-rate analytics event on `/r` views and a share-to-Pro attribution
  report (the `?ref=` plumbing already exists; could add a `share` ref source).
- A small "X traders checked their fees this week" counter on `/r` for social
  proof, backed by a Convex counter.
