type Series = {
  name: string
  colorClass: string
  points: { x: number; y: number }[]
}

// Lightweight dependency-free SVG line chart: total monthly cost (y) across a
// log-scaled monthly-volume range (x), one line per exchange.
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

  const xTicks = [0.1, 0.5, 1, 5, 10, 50, 100].map((m) => m * 1_000_000)
    .filter((x) => x >= xMin && x <= xMax)
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i)

  const fmtX = (x: number) =>
    x >= 1_000_000 ? `$${x / 1_000_000}M` : `$${Math.round(x / 1000)}k`
  const fmtY = (y: number) =>
    y >= 1000 ? `$${(y / 1000).toFixed(1)}k` : `$${Math.round(y)}`

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h4 className="text-xs font-bold text-zinc-400 uppercase mb-1 tracking-widest">
        Monthly Cost vs Volume
      </h4>
      <p className="text-[11px] text-zinc-400 mb-3">
        Where each venue becomes cheaper as your volume grows (log scale).
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
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
        {/* Lines */}
        {series.map((s) => (
          <g key={s.name} className={s.colorClass}>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
            />
          </g>
        ))}
      </svg>
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
