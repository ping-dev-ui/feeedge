import type { CSSProperties } from 'react'
import { EXCHANGES, pct, type Exchange } from '~/data/exchanges'

// Ranked fee table for a given market, cheapest taker first. Used by the
// cornerstone SEO pages.
export function RankedFees({ market }: { market: 'futures' | 'spot' }) {
  const ranked: Exchange[] = [...EXCHANGES].sort(
    (a, b) => a[market].taker - b[market].taker,
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', margin: '0.5rem 0 1rem' }}>
        <thead>
          <tr>
            <th style={th('left')}>#</th>
            <th style={th('left')}>Exchange</th>
            <th style={th('right')}>Maker</th>
            <th style={th('right')}>Taker</th>
            <th style={th('left')}></th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((e, i) => (
            <tr key={e.slug}>
              <td style={td('left', i === 0)}>{i + 1}</td>
              <td style={td('left', i === 0)}>{e.name}{e.token ? ` (${e.token} discount)` : ''}</td>
              <td style={{ ...td('right', i === 0), fontFamily: 'var(--font-mono, monospace)' }}>{pct(e[market].maker)}</td>
              <td style={{ ...td('right', i === 0), fontFamily: 'var(--font-mono, monospace)' }}>{pct(e[market].taker)}</td>
              <td style={td('left', i === 0)}>
                {e.referral ? (
                  <a href={e.referral} target="_blank" rel="sponsored noopener noreferrer">Open account</a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function th(align: 'left' | 'right'): CSSProperties {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#a1a1aa', fontWeight: 600 }
}
function td(align: 'left' | 'right', top: boolean): CSSProperties {
  return { textAlign: align, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: top ? '#34d399' : '#e4e4e7', fontWeight: top ? 700 : 400 }
}
