// Vercel Build Output API function entry for the TanStack Start SSR server.
// Converts a Node (req, res) invocation into a web Request, runs the SSR
// fetch handler, and streams the web Response back out.
//
// The relative import below is resolved and inlined by esbuild at build time
// (see scripts/build-vercel.mjs), so the deployed function is self-contained.
import server from '../dist/server/server.js'

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const url = new URL(req.url, `${protocol}://${host}`)

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body:
        req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      duplex: 'half',
    })

    const response = await server.fetch(request)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      // content-length is recomputed by res.end; skip the streamed one.
      if (key.toLowerCase() === 'content-length') return
      res.setHeader(key, value)
    })

    const body = Buffer.from(await response.arrayBuffer())
    res.end(body)
  } catch (error) {
    console.error('SSR handler error:', error)
    res.statusCode = 500
    res.setHeader('content-type', 'text/plain; charset=utf-8')
    res.end('Internal Server Error')
  }
}
