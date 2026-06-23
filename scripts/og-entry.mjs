// Vercel Build Output API function entry for the dynamic share-card OG image.
//
// Renders a personalized "You could save $X/yr switching to <exchange>" card as
// a 1200x630 PNG from the query params produced by the calculator's share URL.
// Used by the /r share landing's og:image so links unfurl as a rich card on X,
// Telegram, etc.
//
// Pipeline: satori (HTML/flexbox -> SVG, pure JS) + @resvg/resvg-wasm (SVG -> PNG,
// wasm). Both bundle into a single self-contained file via esbuild (see
// scripts/build-vercel.mjs), with the fonts and wasm inlined by the .ttf/.wasm
// binary loaders. No disk or network reads at runtime.
//
// On any failure it redirects to the static /og.png so a share never hard-fails.
import satori from 'satori'
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import wasmBin from '@resvg/resvg-wasm/index_bg.wasm'
import boldFont from './og/fonts/BricolageGrotesque-Bold.ttf'
import regFont from './og/fonts/BricolageGrotesque-Regular.ttf'

let wasmReady
function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(wasmBin)
  return wasmReady
}

const clip = (s, max = 40) => (s == null ? '' : String(s)).slice(0, max)
const money = (n) =>
  Math.max(0, Math.round(Number(String(n ?? '').replace(/[^0-9.]/g, '')) || 0)).toLocaleString(
    'en-US',
  )

function card(search) {
  const save = money(search.get('save'))
  const top = clip(search.get('top')) || 'a cheaper exchange'
  const v = clip(search.get('v'))
  const market = search.get('m') === 'spot' ? 'spot' : 'perps'
  const mk = search.get('mk')
  const volLabel = v ? `$${money(v)} monthly` : 'your volume'
  const mkLabel =
    mk != null && mk !== '' && !Number.isNaN(Number(mk))
      ? ` • ${Math.round(Number(mk) * 100)}% maker`
      : ''
  const hasSave = save !== '0'
  const headline = hasSave ? 'You could save' : 'Find your cheapest'
  const big = hasSave ? `$${save}/yr` : 'crypto exchange'
  const sub = hasSave ? `switching to ${top}` : 'ranked for how you actually trade'

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: '#07100c',
        color: '#f4f7f6',
        padding: '70px',
        fontFamily: 'Bricolage',
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: { style: { fontSize: 34, fontWeight: 700, letterSpacing: '-0.5px' }, children: 'FeeEdge' },
        },
        {
          type: 'div',
          props: { style: { fontSize: 54, fontWeight: 700, marginTop: 46 }, children: headline },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 150, fontWeight: 700, color: '#2ee6a6', lineHeight: '1' },
            children: big,
          },
        },
        {
          type: 'div',
          props: { style: { fontSize: 46, marginTop: 24, fontWeight: 400 }, children: sub },
        },
        {
          type: 'div',
          props: {
            style: { marginTop: 'auto', fontSize: 30, opacity: 0.72, fontWeight: 400 },
            children: `${volLabel} • ${market}${mkLabel}`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '60px',
              right: '70px',
              fontSize: 30,
              color: '#2ee6a6',
              fontWeight: 700,
            },
            children: 'feeedge.com',
          },
        },
      ],
    },
  }
}

async function renderPng(search) {
  const svg = await satori(card(search), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Bricolage', data: boldFont, weight: 700, style: 'normal' },
      { name: 'Bricolage', data: regFont, weight: 400, style: 'normal' },
    ],
  })
  await ensureWasm()
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
}

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'feeedge.com'
    const url = new URL(req.url, `${protocol}://${host}`)

    const png = await renderPng(url.searchParams)

    res.statusCode = 200
    res.setHeader('content-type', 'image/png')
    // Cache hard at the edge: same params always produce the same card.
    res.setHeader('cache-control', 'public, immutable, no-transform, max-age=31536000')
    res.end(Buffer.from(png))
  } catch (error) {
    console.error('OG render error:', error)
    // Never hard-fail a share: fall back to the static card.
    res.statusCode = 302
    res.setHeader('location', '/og.png')
    res.end()
  }
}
