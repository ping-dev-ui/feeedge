import { useState } from 'react'
import { Lock, Zap, ShieldCheck, Info, Upload } from 'lucide-react'

// ---------------------------------------------------------------------------
// FeeAnalyzer — "Your Fees" (Pro)
// Upload your own fills export and see how much of your trading went to taker
// fees + funding. 100% client-side: the file is parsed in the browser and
// NOTHING is uploaded or stored. No new dependencies — tiny inline CSV parser.
// ---------------------------------------------------------------------------

type Mapping = Record<string, string | null>

type FieldDef = { key: string; label: string; req: boolean; cands: string[] }

const FIELDS: FieldDef[] = [
  { key: 'timestamp', label: 'Timestamp', req: false, cands: ['time', 'timestamp', 'date', 'datetime', 'createdat', 'created', 'tradetime', 'filltime', 'closedtime'] },
  { key: 'symbol', label: 'Symbol / Market', req: false, cands: ['symbol', 'market', 'coin', 'pair', 'instrument', 'ticker', 'contract'] },
  { key: 'size', label: 'Size / Quantity', req: false, cands: ['qty', 'quantity', 'size', 'amount', 'filled', 'filledqty', 'baseqty', 'execqty', 'vol', 'volume'] },
  { key: 'price', label: 'Price', req: false, cands: ['price', 'fillprice', 'avgprice', 'execprice', 'tradeprice', 'entryprice'] },
  { key: 'notional', label: 'Notional / Value', req: false, cands: ['notional', 'value', 'quoteqty', 'turnover', 'tradevalue', 'amountusd', 'usdvalue', 'cost'] },
  { key: 'fee', label: 'Fee / Commission', req: true, cands: ['fee', 'commission', 'fees', 'feepaid', 'tradefee', 'txfee', 'feeamount'] },
  { key: 'feeccy', label: 'Fee currency', req: false, cands: ['feecurrency', 'feecoin', 'commissionasset', 'feeasset', 'feeccy'] },
  { key: 'liquidity', label: 'Maker/Taker flag', req: false, cands: ['liquidity', 'makerortaker', 'ismaker', 'role', 'feetype', 'makertaker', 'liquidityindicator', 'takerormaker'] },
  { key: 'pnl', label: 'Realized PnL', req: false, cands: ['realizedpnl', 'closedpnl', 'pnl', 'realizedprofit', 'profit', 'realisedpnl', 'netpnl'] },
  { key: 'funding', label: 'Funding payment', req: false, cands: ['funding', 'fundingfee', 'fundingpayment', 'fundingpaid', 'fundingamount'] },
]

type AnalyzerResult = {
  ccy: string
  totalFees: number
  feeCount: number
  volume: number
  haveVolume: boolean
  haveLiq: boolean
  takerNotional: number
  makerNotional: number
  takerFees: number
  makerFees: number
  haveFunding: boolean
  fundingNet: number
  fundingPaid: number
  fundingRecv: number
  havePnl: boolean
  pnlSum: number
  heroCost: number
  bySymbol: Record<string, number>
  byDay: Record<string, number>
}

// ---- helpers ----
const norm = (s: string): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

function num(v: string | undefined): number {
  if (v === undefined || v === null) return NaN
  const s = String(v).replace(/[^0-9.\-eE]/g, '')
  if (s === '' || s === '-' || s === '.') return NaN
  return parseFloat(s)
}

function cell(row: Record<string, string>, col: string | null): string | undefined {
  return col ? row[col] : undefined
}

function classifyLiquidity(v: string | undefined): 'maker' | 'taker' | null {
  const s = norm(v ?? '')
  if (!s) return null
  if (s.includes('maker') || s === 'm' || s === 'true' || s === '1' || s === 'add') return 'maker'
  if (s.includes('taker') || s === 't' || s === 'false' || s === '0' || s === 'remove') return 'taker'
  return null
}

function parseDate(v: string | undefined): Date | null {
  if (v === undefined) return null
  const s = String(v).trim()
  if (/^\d{10}$/.test(s)) return new Date(parseInt(s, 10) * 1000)
  if (/^\d{13}$/.test(s)) return new Date(parseInt(s, 10))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

// Tiny dependency-free CSV parser (handles quoted fields, commas, newlines).
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const records: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const pushField = () => { cur.push(field); field = '' }
  const pushRow = () => { records.push(cur); cur = [] }
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += c; i++; continue
    }
    if (c === '"') { inQuotes = true; i++; continue }
    if (c === ',') { pushField(); i++; continue }
    if (c === '\r') { i++; continue }
    if (c === '\n') { pushField(); pushRow(); i++; continue }
    field += c; i++
  }
  if (field.length > 0 || cur.length > 0) { pushField(); pushRow() }
  const headerRow = records.shift() ?? []
  const headers = headerRow.map((h) => h.trim()).filter((h) => h !== '')
  const rows = records
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const o: Record<string, string> = {}
      headers.forEach((h, idx) => { o[h] = (r[idx] ?? '').trim() })
      return o
    })
  return { headers, rows }
}

function autoMap(headers: string[]): Mapping {
  const map: Mapping = {}
  const used = new Set<string>()
  for (const f of FIELDS) {
    let best: string | null = null
    for (const h of headers) {
      if (used.has(h)) continue
      if (f.cands.some((c) => norm(h) === c)) { best = h; break }
    }
    if (!best) {
      for (const h of headers) {
        if (used.has(h)) continue
        const nh = norm(h)
        if (f.cands.some((c) => nh.includes(c) || c.includes(nh))) { best = h; break }
      }
    }
    map[f.key] = best
    if (best) used.add(best)
  }
  return map
}

function compute(rows: Record<string, string>[], map: Mapping): AnalyzerResult | { error: string } {
  let totalFees = 0
  let feeCount = 0
  let volume = 0
  let haveVolume = false
  let takerNotional = 0
  let makerNotional = 0
  let takerFees = 0
  let makerFees = 0
  let haveLiq = false
  let fundingNet = 0
  let haveFunding = false
  let pnlSum = 0
  let havePnl = false
  const bySymbol: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  let ccy = ''

  for (const r of rows) {
    const fee = Math.abs(num(cell(r, map.fee)))
    if (Number.isNaN(fee)) continue
    totalFees += fee
    feeCount++

    if (!ccy && map.feeccy) {
      const fc = cell(r, map.feeccy)
      if (fc) ccy = fc.trim()
    }

    let notional = NaN
    if (map.notional) notional = Math.abs(num(cell(r, map.notional)))
    if (Number.isNaN(notional) && map.size && map.price) {
      const sz = Math.abs(num(cell(r, map.size)))
      const px = Math.abs(num(cell(r, map.price)))
      if (!Number.isNaN(sz) && !Number.isNaN(px)) notional = sz * px
    }
    if (!Number.isNaN(notional)) { volume += notional; haveVolume = true }

    if (map.liquidity) {
      const cls = classifyLiquidity(cell(r, map.liquidity))
      if (cls) {
        haveLiq = true
        if (cls === 'taker') { takerFees += fee; if (!Number.isNaN(notional)) takerNotional += notional }
        else { makerFees += fee; if (!Number.isNaN(notional)) makerNotional += notional }
      }
    }

    if (map.funding) {
      const fv = num(cell(r, map.funding))
      if (!Number.isNaN(fv)) { fundingNet += fv; haveFunding = true }
    }

    if (map.pnl) {
      const pv = num(cell(r, map.pnl))
      if (!Number.isNaN(pv)) { pnlSum += pv; havePnl = true }
    }

    const sym = cell(r, map.symbol)
    if (sym) { const k = sym.trim(); bySymbol[k] = (bySymbol[k] ?? 0) + fee }

    const ts = cell(r, map.timestamp)
    if (ts) {
      const d = parseDate(ts)
      if (d) { const k = d.toISOString().slice(0, 10); byDay[k] = (byDay[k] ?? 0) + fee }
    }
  }

  if (feeCount === 0) return { error: 'No numeric fee values found in the chosen column. Try re-mapping the Fee column.' }
  if (!ccy) ccy = 'USDT'

  const fundingPaid = fundingNet < 0 ? -fundingNet : 0
  const fundingRecv = fundingNet > 0 ? fundingNet : 0
  const heroCost = totalFees + fundingPaid

  return {
    ccy, totalFees, feeCount, volume, haveVolume, haveLiq,
    takerNotional, makerNotional, takerFees, makerFees,
    haveFunding, fundingNet, fundingPaid, fundingRecv,
    havePnl, pnlSum, heroCost, bySymbol, byDay,
  }
}

// ---- formatting ----
const money = (v: number, ccy: string): string =>
  Number.isNaN(v) ? '—' : `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`
const pct = (v: number): string => `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
const ratePct = (v: number): string => `${(v * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%`

function topOf(obj: Record<string, number>): { k: string; v: number } | null {
  let bk: string | null = null
  let bv = -Infinity
  for (const k in obj) { if (obj[k] > bv) { bv = obj[k]; bk = k } }
  return bk ? { k: bk, v: bv } : null
}

// ---- locked (non-Pro) tease ----
function LockedTease({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      onClick={onUpgrade}
      className="relative cursor-pointer bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center hover:border-zinc-700 transition-colors"
    >
      <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300">
        <Lock size={18} />
      </div>
      <div>
        <h4 className="text-white font-bold">Your Fees — fee &amp; funding bleed</h4>
        <p className="text-zinc-400 text-xs mt-1 max-w-sm">
          Upload your own fills export and see exactly how much of your trading
          went to taker fees and funding — and what trading maker would have saved.
        </p>
      </div>
      <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
        <ShieldCheck size={13} /> Runs entirely in your browser — your file never leaves your device.
      </p>
      <span className="bg-emerald-500 text-black px-5 py-1.5 rounded-full font-bold text-xs">
        Unlock Pro for $29 · one-time
      </span>
    </div>
  )
}

export function FeeAnalyzer({ isPro, onUpgrade }: { isPro: boolean; onUpgrade: () => void }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Mapping>({})
  const [showMapping, setShowMapping] = useState(false)
  const [result, setResult] = useState<AnalyzerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [makerRateInput, setMakerRateInput] = useState('')

  if (!isPro) return <LockedTease onUpgrade={onUpgrade} />

  const runCompute = (rws: Record<string, string>[], map: Mapping) => {
    const r = compute(rws, map)
    if ('error' in r) { setError(r.error); setResult(null); setShowMapping(true); return }
    setError(null)
    setResult(r)
    setShowMapping(false)
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (!parsed.headers.length) { setError('Could not read any columns from that file.'); return }
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setError(null)
      const map = autoMap(parsed.headers)
      setMapping(map)
      if (!map.fee) { setShowMapping(true); setResult(null) }
      else runCompute(parsed.rows, map)
    } catch {
      setError('Could not read that file. Make sure it is a CSV export of your fills.')
    }
  }

  const onMapSelect = (key: string, value: string) => {
    setMapping((m) => ({ ...m, [key]: value || null }))
  }

  const calcFromMapping = () => {
    if (!mapping.fee) { setError('The Fee column is required.'); return }
    runCompute(rows, mapping)
  }

  const reset = () => {
    setHeaders([]); setRows([]); setMapping({}); setShowMapping(false)
    setResult(null); setError(null); setFileName(null); setMakerRateInput('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-emerald-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your Fees — Fee &amp; Funding Bleed</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-1.5 py-0.5 rounded">Pro</span>
      </div>

      {/* Privacy notice — prominent */}
      <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5">
        <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-200/90 leading-relaxed">
          <span className="font-bold text-emerald-300">Your data never leaves your browser.</span>{' '}
          Your file is read and analysed locally on this page — FeeEdge does not upload, receive, or store any of it. Nothing is sent to a server.
        </p>
      </div>

      {/* Dropzone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        className={`block cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition-colors ${
          dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-black/30 hover:border-zinc-700'
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <Upload size={20} className="text-emerald-400" />
          <div className="text-sm text-zinc-200 font-bold">
            {fileName ? `Loaded: ${fileName}` : 'Drop your fills CSV here, or click to choose'}
          </div>
          <div className="text-[11px] text-zinc-500">
            Hyperliquid / Bybit / Binance / OKX exports all work — columns are auto-detected.
          </div>
        </div>
      </label>

      {error && (
        <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Column mapping (when auto-detect is incomplete, or to adjust) */}
      {showMapping && headers.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Map your columns</h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Confirm the mapping below, then calculate. Only <span className="text-emerald-400 font-bold">Fee</span> is required.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className={`block text-[11px] mb-1 ${f.req ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                  {f.label}{f.req ? ' *' : ''}
                </label>
                <select
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => onMapSelect(f.key, e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">(none)</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={calcFromMapping}
              className="bg-emerald-500 text-black px-4 py-2 rounded font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Calculate
            </button>
            <button
              onClick={() => setShowMapping(false)}
              className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded font-bold text-xs hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Hero */}
          <div className="bg-gradient-to-b from-emerald-500/10 to-zinc-900/40 border border-zinc-800 rounded-xl p-6">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400">Total cost this period</div>
            <div className="text-3xl md:text-4xl font-black text-emerald-400 mt-1 tracking-tight">
              {money(result.heroCost, result.ccy)}
            </div>
            <div className="text-xs text-zinc-300 mt-2">
              Across <span className="font-bold">{result.feeCount.toLocaleString()}</span> fills. Fees {money(result.totalFees, result.ccy)}
              {result.haveFunding && <> + funding paid {money(result.fundingPaid, result.ccy)}</>}.
              {result.haveVolume && result.volume > 0 && (
                <> That's <span className="font-bold text-emerald-400">{pct(result.totalFees / result.volume * 100)}</span> of your traded volume.</>
              )}
            </div>
          </div>

          {/* Supporting lines */}
          <div className="grid grid-cols-1 gap-3">
            {/* Taker vs maker */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Taker vs maker</div>
              {(() => {
                if (!result.haveLiq) {
                  return <div className="text-xs text-zinc-300">Your export didn't include a maker/taker flag, so the maker what-if is skipped. Re-export with that column to unlock it.</div>
                }
                const totNot = result.takerNotional + result.makerNotional
                const takerShare = totNot > 0 ? result.takerNotional / totNot * 100 : null
                const takerRate = result.takerNotional > 0 ? result.takerFees / result.takerNotional : null
                const makerRate = result.makerNotional > 0 ? result.makerFees / result.makerNotional : null
                if (takerRate !== null && makerRate !== null && takerRate > makerRate) {
                  const savings = result.takerNotional * (takerRate - makerRate)
                  return (
                    <div className="text-xs text-zinc-300">
                      {takerShare !== null && <><span className="font-bold text-white">{pct(takerShare)}</span> of your volume was taker. </>}
                      At your own maker rate ({ratePct(makerRate)} vs taker {ratePct(takerRate)}), the same volume as maker would have cost
                      ~<span className="font-bold text-emerald-400">{money(savings, result.ccy)}</span> less.
                    </div>
                  )
                }
                if (takerRate !== null && makerRate === null) {
                  const mk = num(makerRateInput) / 100
                  const savings = !Number.isNaN(mk) ? result.takerNotional * Math.max(0, takerRate - mk) : null
                  return (
                    <div className="text-xs text-zinc-300">
                      {takerShare !== null && <><span className="font-bold text-white">{pct(takerShare)}</span> of your volume was taker. </>}
                      You have no maker fills to compare. Enter your exchange's maker rate to estimate the saving:
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          step="0.001"
                          value={makerRateInput}
                          onChange={(e) => setMakerRateInput(e.target.value)}
                          placeholder="e.g. 0.02"
                          className="w-28 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[11px] text-zinc-400">% maker</span>
                      </div>
                      {savings !== null && makerRateInput !== '' && (
                        <div className="mt-2">
                          ≈ <span className="font-bold text-emerald-400">{money(savings, result.ccy)}</span> saved if that volume had been maker
                          (your taker rate {ratePct(takerRate)}).
                        </div>
                      )}
                    </div>
                  )
                }
                return <div className="text-xs text-zinc-300">Not enough data to compute a maker comparison.</div>
              })()}
            </div>

            {/* Funding */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Funding</div>
              {result.haveFunding ? (
                <div className="text-xs text-zinc-300">
                  Net funding: <span className="font-bold text-white">{money(result.fundingNet, result.ccy)}</span> (negative = you paid).
                  {result.fundingPaid > 0 && <> You paid {money(result.fundingPaid, result.ccy)} in funding.</>}
                  {result.fundingRecv > 0 && <> You received {money(result.fundingRecv, result.ccy)}.</>}
                </div>
              ) : (
                <div className="text-xs text-zinc-300">No funding column detected. On perps, export your funding history separately to include it.</div>
              )}
            </div>

            {/* Worst offender */}
            {(() => {
              const tSym = topOf(result.bySymbol)
              const tDay = topOf(result.byDay)
              if (!tSym && !tDay) return null
              return (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Worst offender</div>
                  <div className="text-xs text-zinc-300">
                    {tSym && <>Most expensive symbol for fees: <span className="font-bold text-white">{tSym.k}</span> at {money(tSym.v, result.ccy)}. </>}
                    {tDay && <>Worst single day: <span className="font-bold text-white">{tDay.k}</span> at {money(tDay.v, result.ccy)}.</>}
                  </div>
                </div>
              )
            })()}

            {/* PnL context */}
            {result.havePnl && result.pnlSum !== 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Versus your PnL</div>
                <div className="text-xs text-zinc-300">
                  Your export's realized-PnL column sums to <span className="font-bold text-white">{money(result.pnlSum, result.ccy)}</span>.
                  Fees + funding were <span className="font-bold text-emerald-400">{pct(result.heroCost / Math.abs(result.pnlSum) * 100)}</span> of that (absolute).
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowMapping((v) => !v)}
              className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Adjust column mapping
            </button>
            <span className="text-zinc-700">·</span>
            <button
              onClick={reset}
              className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Load another file
            </button>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-zinc-500 bg-black/40 border border-zinc-800 rounded-lg p-3">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>
              Figures are summed directly from your file. The maker what-if uses your own effective maker vs taker rates — it's a scenario, not a guarantee. Estimates only, not financial advice.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
