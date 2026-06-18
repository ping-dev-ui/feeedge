import { useEffect, useRef, useState } from 'react'

// Animated number that eases from its previous value to the new one whenever
// `value` changes (and on first mount). Pure rAF, no dependencies.
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 700,
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to || !isFinite(to)) {
      setDisplay(to)
      fromRef.current = to
      return
    }
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const cur = from + (to - from) * eased
      setDisplay(cur)
      fromRef.current = cur
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={`font-mono ${className ?? ''}`}>
      {prefix}
      {display.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
