import { useState } from 'react'
import { EXCHANGE_DOMAIN } from '~/data/exchanges'

// Renders an exchange's logo next to its name. Loads the brand mark from a
// favicon service (in the user's browser) keyed by official domain, and falls
// back to a colored initial if the image fails to load.
export function ExchangeLogo({
  slug,
  name,
  colorClass = 'text-zinc-300',
  size = 22,
}: {
  slug: string
  name: string
  colorClass?: string
  size?: number
}) {
  const [err, setErr] = useState(false)
  const domain = EXCHANGE_DOMAIN[slug]
  const px = `${size}px`

  if (err || !domain) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-[5px] bg-white/10 font-black ${colorClass}`}
        style={{ width: px, height: px, fontSize: Math.round(size * 0.5) }}
        aria-hidden="true"
      >
        {name.charAt(0)}
      </span>
    )
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErr(true)}
      className="shrink-0 rounded-[5px] bg-white/5 object-contain"
      style={{ width: px, height: px }}
    />
  )
}
