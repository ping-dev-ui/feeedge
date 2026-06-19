// Renders an inline JSON-LD structured-data script. SSR-rendered so Google
// reads the schema on first crawl. Pass any schema.org object (or array).
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // schema.org JSON-LD; serialized server-side.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
