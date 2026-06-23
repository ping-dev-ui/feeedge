# SEO audit — FeeEdge

Run overnight 2026-06-23. Method: inspected every route's head/meta, schema,
sitemap, robots, canonical, and internal linking against the live source. Verdict:
the site is already in strong SEO shape. No defects worth a code change were
found. Details and a short list of optional upgrades below.

## What was checked and passed

Titles and descriptions
- Every indexable route sets a unique title and meta description (cornerstone
  pages use the `{ title }` shorthand off a local const; the homepage inherits
  its description from the root head). No missing or duplicate titles found.
- Title lengths sit in the healthy 15 to 60 character range.

Indexation control
- `robots.txt` allows crawling and points to the sitemap.
- `admin.tsx` is `noindex` (correct, it is an internal referrals page).
- The new `/r` share landings are `noindex, follow` (infinite query-param
  combinations should not be indexed, but their outbound links should be
  followed). This was set deliberately as part of the share-loop work.

Canonical
- The root sets a self-referencing canonical computed from the pathname with the
  query string stripped, so `?ref=`, `?v=`, and share params do not spawn
  duplicate URLs. Good.

Structured data (JSON-LD) — coverage is excellent
- Organization, WebSite, SoftwareApplication (+ Offer) on the root.
- FAQPage on the cornerstone and comparison pages (good for SERP FAQ rich
  results).
- Article on the report.
- BreadcrumbList on the dynamic `/compare/$pair` and `/exchanges/$slug`
  templates (good for breadcrumb rich results).

Sitemap
- `sitemap.xml` is comprehensive: homepage, all cornerstone pages, all guides,
  all 20 exchange pages, and every comparison pair. The three new pages added
  tonight (Solana, native-token discounts guide, funding-rates guide) are
  included. `/r` and `/admin` are correctly excluded.

AI / generative search (GEO)
- `public/llms.txt` exists with a clean product summary and key facts, which
  helps the site get represented accurately in AI answers. This is ahead of most
  competitors.

Internal linking
- Cornerstone pages cross-link to related pages and to the calculator. The new
  pages were wired into the `/compare` hub and link to each other and the
  calculator.

Accessibility signals that also help SEO
- Exchange logos render with names; share buttons carry aria-labels.

## Optional upgrades (not applied — your call, none are defects)

1. Per-page OG cards. Cornerstone pages currently fall back to the site card
   (`og.png`). Now that the dynamic `/api/og` renderer exists (from the share-loop
   work), you could generate topic-specific cards (for example a "Cheapest
   exchange for perps" card). Nice polish, not necessary.
2. `lastmod` in the sitemap. The sitemap uses `changefreq` and `priority` but no
   `lastmod`. Adding a real last-modified date per URL is a small freshness
   signal. Skipped because the sitemap is hand-maintained and this would be 180+
   manual edits; better handled by generating the sitemap from the fee-data
   timestamp in a build step.
3. Twitter cards per page. Cornerstone pages inherit the root `twitter:card` +
   image, so X unfurls work. Per-page `twitter:title`/`image` would be marginally
   better but is low value.

## Bottom line
No SEO bugs to fix. The foundation (titles, descriptions, canonical, schema,
sitemap, robots, llms.txt, internal links) is solid and ahead of typical
competitors. The highest-leverage SEO move from here is not on-page cleanup, it
is publishing more high-intent comparison and guide content on top of this
foundation (started tonight) and earning the share-loop links back to it.
