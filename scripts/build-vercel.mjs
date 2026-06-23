// Assembles a Vercel Build Output API directory (.vercel/output) from the
// Vite client build (dist/client) and the TanStack Start SSR server
// (dist/server/server.js).
//
// Why: this version of TanStack Start has no Vercel preset. It emits a plain
// Node SSR handler and a static client bundle. The Build Output API lets us
// define routing + the serverless function explicitly, independent of any
// Vercel framework preset.
//
// Layout produced:
//   .vercel/output/config.json                       -> routes
//   .vercel/output/static/**                          -> dist/client (assets, favicon)
//   .vercel/output/functions/render.func/index.mjs    -> bundled SSR function
//   .vercel/output/functions/render.func/.vc-config.json
//   .vercel/output/functions/api/og.func/index.mjs    -> dynamic share-card PNG
import { build } from 'esbuild'
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'

const OUT = '.vercel/output'
const FUNC = `${OUT}/functions/render.func`
// Nested .func path -> reachable at /api/og. Renders the dynamic share-card PNG.
const OG_FUNC = `${OUT}/functions/api/og.func`

if (!existsSync('dist/client') || !existsSync('dist/server/server.js')) {
  throw new Error(
    'Expected dist/client and dist/server/server.js. Run "vite build" first.',
  )
}

// Clean and recreate the output tree.
rmSync(OUT, { recursive: true, force: true })
mkdirSync(FUNC, { recursive: true })
mkdirSync(OG_FUNC, { recursive: true })

// 1) Static assets: everything Vite emitted for the client.
cpSync('dist/client', `${OUT}/static`, { recursive: true })

// 2) SSR function: bundle the handler + all node_modules deps into one file.
await build({
  entryPoints: ['scripts/render-entry.mjs'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: `${FUNC}/index.mjs`,
  // Make CommonJS interop (createRequire) available to any bundled deps.
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
})

// 3) Function runtime config.
writeFileSync(
  `${FUNC}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
    },
    null,
    2,
  ),
)

// 4) OG share-card function: satori + resvg-wasm, with the fonts (.ttf) and the
// resvg wasm (.wasm) inlined as binary so the function is fully self-contained.
await build({
  entryPoints: ['scripts/og-entry.mjs'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: `${OG_FUNC}/index.mjs`,
  loader: { '.wasm': 'binary', '.ttf': 'binary' },
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
})
writeFileSync(
  `${OG_FUNC}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
    },
    null,
    2,
  ),
)

// 5) Routing: static files first, then the OG image endpoint, then send
// everything else to the SSR function.
writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        { src: '^/api/og(?:\\.png)?(?:\\?.*)?$', dest: '/api/og' },
        { src: '/.*', dest: '/render' },
      ],
    },
    null,
    2,
  ),
)

console.log('Built .vercel/output (static + render.func + api/og.func)')
