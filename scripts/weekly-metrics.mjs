#!/usr/bin/env node
/**
 * FeeEdge weekly metrics report.
 * Queries PostHog (HogQL API) for the funnel + channel breakdown and prints a
 * markdown report to stdout. Run by the weekly scheduled task, which appends
 * the output to WEEKLY_METRICS.md and summarizes it for Miguel.
 *
 * Required env (put in .env.metrics or pass inline):
 *   POSTHOG_API_KEY     personal API key (phx_...), NOT the project key
 *   POSTHOG_PROJECT_ID  numeric project id (visible in PostHog URL)
 *   POSTHOG_HOST        optional, default https://us.posthog.com
 *
 * Usage: node scripts/weekly-metrics.mjs
 */

const KEY = process.env.POSTHOG_API_KEY
const PROJECT = process.env.POSTHOG_PROJECT_ID
const HOST = (process.env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/$/, '')

if (!KEY || !PROJECT) {
  console.error('Missing POSTHOG_API_KEY or POSTHOG_PROJECT_ID env vars.')
  console.error('Create a personal API key: PostHog -> Settings -> Personal API keys (scope: query read).')
  process.exit(1)
}

const EVENTS = [
  '$pageview',
  'result_viewed',
  'analyzer_run',
  'analyzer_upgrade_click',
  'upgrade_clicked',
  'head_to_head_clicked',
  'share_savings',
  'share_click',
  'export',
  'pro_purchased',
]

async function hogql(query) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostHog ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  return json.results ?? []
}

const eventList = EVENTS.map((e) => `'${e}'`).join(',')

function pct(a, b) {
  if (!b) return 'n/a'
  return `${((a / b) * 100).toFixed(1)}%`
}

function delta(cur, prev) {
  if (!prev) return cur > 0 ? '(new)' : ''
  const d = ((cur - prev) / prev) * 100
  return `(${d >= 0 ? '+' : ''}${d.toFixed(0)}% wow)`
}

async function main() {
  // 1. Event counts, this week (last 7 full days) vs the 7 days before.
  const counts = await hogql(`
    SELECT event,
      countIf(timestamp >= now() - INTERVAL 7 DAY) AS this_week,
      countIf(timestamp >= now() - INTERVAL 14 DAY AND timestamp < now() - INTERVAL 7 DAY) AS prior_week
    FROM events
    WHERE event IN (${eventList}) AND timestamp >= now() - INTERVAL 14 DAY
    GROUP BY event ORDER BY this_week DESC
  `)

  // 2. Top entry pages this week (which SEO pages pull traffic).
  const pages = await hogql(`
    SELECT properties.$pathname AS path, count() AS views,
      count(DISTINCT properties.$session_id) AS sessions
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY path ORDER BY views DESC LIMIT 20
  `)

  // 3. Traffic + conversions by ref code (share loop / influencers).
  const refs = await hogql(`
    SELECT properties.ref AS ref, count() AS events,
      countIf(event = 'pro_purchased') AS pro,
      countIf(event = 'analyzer_run') AS analyzer_runs
    FROM events
    WHERE timestamp >= now() - INTERVAL 7 DAY AND properties.ref IS NOT NULL
    GROUP BY ref ORDER BY events DESC LIMIT 15
  `)

  // 4. Referring domains (where traffic comes from).
  const sources = await hogql(`
    SELECT properties.$referring_domain AS source, count() AS views
    FROM events
    WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
      AND properties.$referring_domain IS NOT NULL
      AND properties.$referring_domain != '$direct'
      AND properties.$referring_domain NOT LIKE '%feeedge%'
    GROUP BY source ORDER BY views DESC LIMIT 12
  `)

  const byEvent = Object.fromEntries(counts.map((r) => [r[0], { cur: r[1], prev: r[2] }]))
  const g = (e) => byEvent[e] ?? { cur: 0, prev: 0 }

  const today = new Date().toISOString().slice(0, 10)
  const out = []
  out.push(`## Week ending ${today}`)
  out.push('')
  out.push('### Funnel (last 7 days, vs prior 7)')
  out.push('')
  out.push('| step | count | wow |')
  out.push('| --- | --- | --- |')
  for (const e of EVENTS) {
    const { cur, prev } = g(e)
    out.push(`| ${e} | ${cur} | ${delta(cur, prev)} |`)
  }
  out.push('')
  const pv = g('$pageview').cur
  const rv = g('result_viewed').cur
  const up = g('upgrade_clicked').cur + g('analyzer_upgrade_click').cur
  const pro = g('pro_purchased').cur
  const shares = g('share_click').cur + g('share_savings').cur
  out.push(`**Rates:** view->result ${pct(rv, pv)} | result->upgrade-click ${pct(up, rv)} | upgrade-click->pro ${pct(pro, up)} | share rate ${pct(shares, rv)}`)
  out.push('')
  out.push('### Top pages (7d)')
  out.push('')
  out.push('| path | views | sessions |')
  out.push('| --- | --- | --- |')
  for (const [path, views, sessions] of pages) out.push(`| ${path ?? '(unknown)'} | ${views} | ${sessions} |`)
  out.push('')
  out.push('### By ref code (7d)')
  out.push('')
  if (refs.length === 0) {
    out.push('No ref-attributed traffic this week.')
  } else {
    out.push('| ref | events | analyzer runs | pro |')
    out.push('| --- | --- | --- | --- |')
    for (const [ref, ev, proN, an] of refs) out.push(`| ${ref} | ${ev} | ${an} | ${proN} |`)
  }
  out.push('')
  out.push('### Traffic sources (7d)')
  out.push('')
  if (sources.length === 0) {
    out.push('No external referrers recorded.')
  } else {
    out.push('| source | views |')
    out.push('| --- | --- |')
    for (const [source, views] of sources) out.push(`| ${source} | ${views} |`)
  }
  out.push('')
  console.log(out.join('\n'))
}

main().catch((err) => {
  console.error(String(err))
  process.exit(1)
})
