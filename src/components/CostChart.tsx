import { useState } from 'react'

type Series = {
  name: string
  colorClass: string
  points: { x: number; y: number }[]
}

// Dependency-free SVG line chart: total monthly cost (y) across a log-scaled
// monthly-volume range (x), one line per exchange. The cheapest line gets a
// soft area fill; hovering shows a vertical guide + a value tooltip.
export function CostChart({
  series,
  xMin,
  xMax,
}: {
  series: Series[]
  xMin: number
  xMax: number
}) {
  const W = 760
  const H = 300
  const padL = 56
  const padR = 16
  const padT = 16
  const padB = 40

  const allY = series.flatMap((s) => s.points.map((p) => p.y))
  const yMax = Math.max(1, ...allY)
  const lxMin = Math.log10(xMin)
  const lxMax = Math.log10(xMax)

  const sx = (x: number) =>
    padL + ((Math.log10(x) - lxMin) / (lxMax - lxMin)) * (W - padL - padR)
  const sy = (y: number) => padT + (1 - y / yMax) * (H - padT - padB)

  const xTicks = [0.1, 0.5, 1, 5, 10, 50, 100]
    .map((m) => m * 1_000_000)
    .filter((x) => x >= xMin && x <= xMax)
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i)

  const fmtX = (x: number) =>
    x >= 1_000_000 ? `$${x / 1_000_000}M` : `$${Math.round(x / 1000)}k`
  const fmtY = (y: number) =>
    y >= 1000 ? `$${(y / 1000).toFixed(1)}k` : `$${Math.round(y)}`
  const fmtMoney = (y: number) =>
    '$' + y.toLocaleString(undefined, { maximumFractionDigits: 0 })

  const N = series[0]?.points.length ?? 0
  const [hover, setHover] = useState<number | null>(null)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const xView = ((e.clientX - rect.left) / rect.width) * W
    const t = (xView - padL) / (W - padL - padR)
    const idx = Math.round(t * (N - 1))
    setHover(idx >= 0 && idx < N ? idx : null)
  }

  const baseY = sy(0)

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1 tracking-widest">
        Monthly Cost vs Volume
      </h4>
      <p className="text-[11px] text-zinc-400 mb-3">
        Where each venue becomes cheaper as your volume grows (log scale). Hover to compare.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Y gridlines + labels */}
        {yTicks.map((y, i) => (
          <g key={`y${i}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={sy(y)}
              y2={sy(y)}
              stroke="currentColor"
              className="text-zinc-800"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={sy(y) + 3}
              textAnchor="end"
              className="fill-zinc-400"
              fontSize={11}
            >
              {fmtY(y)}
            </text>
          </g>
        ))}
        {/* X labels */}
        {xTicks.map((x, i) => (
          <text
            key={`x${i}`}
            x={sx(x)}
            y={H - padB + 16}
            textAnchor="middle"
            className="fill-zinc-400"
            fontSize={11}
          >
            {fmtX(x)}
          </text>
        ))}
        {/* Area fill under the cheapest (first) series */}
        {series.map((s, i) => {
          if (i !== 0 || s.points.length === 0) return null
          const line = s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')
          const area = `${sx(s.points[0].x)},${baseY} ${line} ${sx(s.points[s.points.length - 1].x)},${baseY}`
          return (
            <polygon key="area" className={s.colorClass} points={area} fill="currentColor" opacity={0.12} />
          )
        })}
        {/* Lines + endpoint dots */}
        {series.map((s) => {
          const last = s.points[s.points.length - 1]
          return (
            <g key={s.name} className={s.colorClass}>
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
              />
              {last && <circle cx={sx(last.x)} cy={sy(last.y)} r={3} fill="currentColor" />}
            </g>
          )
        })}
        {/* Hover guide + dots */}
        {hover !== null && series[0] && (
          <g>
            <line
              x1={sx(series[0].points[hover].x)}
              x2={sx(series[0].points[hover].x)}
              y1={padT}
              y2={H - padB}
              stroke="currentColor"
              className="text-zinc-500"
              strokeDasharray="3 3"
            />
            {series.map((s) => (
              <circle
                key={s.name}
                className={s.colorClass}
                cx={sx(s.points[hover].x)}
                cy={sy(s.points[hover].y)}
                r={3.5}
                fill="currentColor"
                stroke="#0a0a0a"
                strokeWidth={1.5}
              />
            ))}
          </g>
        )}
      </svg>
      {/* Hover tooltip */}
      {hover !== null && series[0] && (
        <div className="mt-2 text-[11px] bg-black/60 border border-zinc-800 rounded-lg p-3">
          <div className="text-zinc-400 mb-1">
            At {fmtX(series[0].points[hover].x)}/mo volume:
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {[...series]
              .sort((a, b) => a.points[hover].y - b.points[hover].y)
              .map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-2">
                  <span className={`font-bold ${s.colorClass}`}>{s.name}</span>
                  <span className="text-zinc-200">{fmtMoney(s.points[hover].y)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-[11px]">
            <span className={`w-2.5 h-0.5 ${s.colorClass}`} style={{ backgroundColor: 'currentColor' }}></span>
            <span className="text-zinc-400">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
