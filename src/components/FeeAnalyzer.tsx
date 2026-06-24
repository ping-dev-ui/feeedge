import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Upload, Download, BarChart3, ShieldCheck, Info, Zap, Lock } from 'lucide-react'

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
  { key: 'size', label: 'Size / Quantity', req: false, cands: ['filledquantity', 'quantity', 'qty', 'size', 'sz', 'baseqty', 'basesize', 'baseamount', 'execqty', 'contracts', 'filledqty', 'vol', 'volume', 'filled', 'amount'] },
  { key: 'price', label: 'Price', req: false, cands: ['filledprice', 'fillprice', 'fillpx', 'avgprice', 'avgpx', 'execprice', 'tradeprice', 'price', 'px', 'orderprice', 'entryprice', 'limitpx'] },
  { key: 'notional', label: 'Notional / Value', req: false, cands: ['notional', 'ntl', 'notionalvalue', 'execvalue', 'quotevolume', 'quoteamount', 'quoteqty', 'turnover', 'tradevalue', 'amountusd', 'usdvalue', 'value', 'cost'] },
  { key: 'fee', label: 'Fee / Commission', req: true, cands: ['tradingfee', 'tradefee', 'commission', 'feepaid', 'feeamount', 'execfee', 'txfee', 'fees', 'fee'] },
  { key: 'feeccy', label: 'Fee currency', req: false, cands: ['feecoin', 'feecurrency', 'feetoken', 'commissionasset', 'feeasset', 'feeccy'] },
  { key: 'liquidity', label: 'Maker/Taker flag', req: false, cands: ['liquidity', 'makerortaker', 'ismaker', 'role', 'feetype', 'makertaker', 'liquidityindicator', 'takerormaker'] },
  { key: 'pnl', label: 'Realized PnL', req: false, cands: ['realizedpnl', 'closedpnl', 'pnl', 'realizedprofit', 'profit', 'realisedpnl', 'netpnl'] },
  { key: 'funding', label: 'Funding payment', req: false, cands: ['funding', 'fundingfee', 'fundingpayment', 'fundingpaid', 'fundingamount'] },
]

type AnalyzerResult = {
  mode: 'fills' | 'ledger'
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
  text = text.replace(/^﻿/, '')
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
  // Pass 1: exact normalized match — claims headers across all fields first.
  for (const f of FIELDS) {
    for (const c of f.cands) {
      const h = headers.find((x) => !used.has(x) && norm(x) === c)
      if (h) { map[f.key] = h; used.add(h); break }
    }
  }
  // Pass 2: substring match in CANDIDATE-priority order (not column order), so
  // "Trading Fee" beats "Fee Rate" and "Filled Quantity" beats "Filled Type".
  for (const f of FIELDS) {
    if (map[f.key]) continue
    for (const c of f.cands) {
      const h = headers.find((x) => {
        if (used.has(x)) return false
        const nx = norm(x)
        return nx.includes(c) || c.includes(nx)
      })
      if (h) { map[f.key] = h; used.add(h); break }
    }
  }
  for (const f of FIELDS) if (!(f.key in map)) map[f.key] = null
  return map
}

// ---- ledger mode: account-statement exports (rows are Fee/Funding/PnL entries) ----
const LEDGER_TYPE_COLS = ['actiontype', 'type', 'category', 'operation']
const LEDGER_CHANGE_COLS = ['changeamount', 'change', 'delta', 'amount']

function findCol(headers: string[], cands: string[]): string | null {
  for (const c of cands) { const h = headers.find((x) => norm(x) === c); if (h) return h }
  for (const c of cands) { const h = headers.find((x) => norm(x).includes(c)); if (h) return h }
  return null
}

function detectLedger(headers: string[], rows: Record<string, string>[]): { typeCol: string; changeCol: string } | null {
  const typeCol = findCol(headers, LEDGER_TYPE_COLS)
  const changeCol = findCol(headers, LEDGER_CHANGE_COLS)
  if (!typeCol || !changeCol || typeCol === changeCol) return null
  const looksLedger = rows.some((r) => {
    const t = norm(r[typeCol] ?? '')
    return t.includes('fee') || t.includes('fund') || t.includes('pnl') || t.includes('profit')
  })
  return looksLedger ? { typeCol, changeCol } : null
}

function computeLedger(rows: Record<string, string>[], typeCol: string, changeCol: string): AnalyzerResult | { error: string } {
  let totalFees = 0
  let feeCount = 0
  let fundingNet = 0
  let pnlSum = 0
  let havePnl = false
  let haveFunding = false
  let ccy = ''
  for (const r of rows) {
    const raw = r[changeCol]
    const amt = num(raw)
    if (Number.isNaN(amt)) continue
    if (!ccy) { const m = String(raw ?? '').match(/[A-Za-z]{2,6}/); if (m) ccy = m[0].toUpperCase() }
    const t = norm(r[typeCol] ?? '')
    if (t.includes('fee') && !t.includes('rebate')) { totalFees += Math.abs(amt); feeCount++ }
    else if (t.includes('fund')) { fundingNet += amt; haveFunding = true }
    else if (t.includes('pnl') || t.includes('profit')) { pnlSum += amt; havePnl = true }
  }
  if (feeCount === 0 && !haveFunding) return { error: 'This looks like an account ledger, but no fee or funding entries were found.' }
  if (!ccy) ccy = 'USDT'
  const fundingPaid = fundingNet < 0 ? -fundingNet : 0
  const fundingRecv = fundingNet > 0 ? fundingNet : 0
  return {
    mode: 'ledger' as const,
    ccy, totalFees, feeCount, volume: 0, haveVolume: false, haveLiq: false,
    takerNotional: 0, makerNotional: 0, takerFees: 0, makerFees: 0,
    haveFunding, fundingNet, fundingPaid, fundingRecv,
    havePnl, pnlSum, heroCost: totalFees + fundingPaid, bySymbol: {}, byDay: {},
  }
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
    mode: 'fills' as const,
    ccy, totalFees, feeCount, volume, haveVolume, haveLiq,
    takerNotional, makerNotional, takerFees, makerFees,
    haveFunding, fundingNet, fundingPaid, fundingRecv,
    havePnl, pnlSum, heroCost, bySymbol, byDay,
  }
}

// ---- formatting ----
const money = (v: number, ccy: string): string =>
  Number.isNaN(v) ? '—' : `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${ccy}`
const pct = (v: number): string => {
  const a = Math.abs(v)
  const d = a !== 0 && a < 1 ? (a < 0.1 ? 3 : 2) : 1
  return `${v.toLocaleString(undefined, { maximumFractionDigits: d })}%`
}
const ratePct = (v: number): string => `${(v * 100).toLocaleString(undefined, { maximumFractionDigits: 4 })}%`

function topOf(obj: Record<string, number>): { k: string; v: number } | null {
  let bk: string | null = null
  let bv = -Infinity
  for (const k in obj) { if (obj[k] > bv) { bv = obj[k]; bk = k } }
  return bk ? { k: bk, v: bv } : null
}

const STEPS: { icon: typeof Upload; label: string }[] = [
  { icon: Download, label: 'Export' },
  { icon: Upload, label: 'Drop' },
  { icon: BarChart3, label: 'See cost' },
]

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#06140e] border border-zinc-800 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-sm font-bold text-white mt-0.5">{value}</div>
    </div>
  )
}

export function FeeAnalyzer({ isPro, onUpgrade, track = () => {} }: { isPro: boolean; onUpgrade: () => void; track?: (event: string, props?: Record<string, unknown>) => void }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Mapping>({})
  const [showMapping, setShowMapping] = useState(false)
  const [result, setResult] = useState<AnalyzerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [makerRateInput, setMakerRateInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => fileInputRef.current?.click()

  const runCompute = (rws: Record<string, string>[], map: Mapping) => {
    const r = compute(rws, map)
    if ('error' in r) { setError(r.error); setResult(null); setShowMapping(true); return }
    setError(null)
    setResult(r)
    setShowMapping(false)
    track('analyzer_run', { mode: r.mode, pro: isPro })
  }

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (!parsed.headers.length) { setError('Could not read any columns from that file.'); return }
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setError(null)
      const ledger = detectLedger(parsed.headers, parsed.rows)
      if (ledger) {
        const lr = computeLedger(parsed.rows, ledger.typeCol, ledger.changeCol)
        if ('error' in lr) { setError(lr.error); setResult(null) }
        else { setResult(lr); setShowMapping(false); track('analyzer_run', { mode: lr.mode, pro: isPro }) }
        return
      }
      const map = autoMap(parsed.headers)
      setMapping(map)
      if (!map.fee) { setShowMapping(true); setResult(null) }
      else runCompute(parsed.rows, map)
    } catch {
      setError('Could not read that file. Make sure it is a CSV export of your fills.')
    }
  }

  const calcFromMapping = () => {
    if (!mapping.fee) { setError('The Fee column is required.'); return }
    runCompute(rows, mapping)
  }

  const reset = () => {
    setHeaders([]); setRows([]); setMapping({}); setShowMapping(false)
    setResult(null); setError(null); setMakerRateInput('')
  }

  const card = 'bg-[#0b1f16] border border-emerald-500/30 rounded-2xl p-5 md:p-6 h-full flex flex-col'

  // ---- RESULTS (Pro, after a file is analysed) ----
  if (result) {
    const r = result
    const tSym = topOf(r.bySymbol)
    const tDay = topOf(r.byDay)
    const totNot = r.takerNotional + r.makerNotional
    const takerShare = totNot > 0 ? r.takerNotional / totNot * 100 : null
    const takerRate = r.takerNotional > 0 ? r.takerFees / r.takerNotional : null
    const makerRate = r.makerNotional > 0 ? r.makerFees / r.makerNotional : null
    return (
      <div className={card}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your Fees</h3>
          {isPro && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-1.5 py-0.5 rounded">Pro</span>}
        </div>

        <div className="bg-[#06140e] border border-zinc-800 rounded-xl p-5 mb-3">
          <div className="text-[11px] uppercase tracking-widest text-zinc-400">Total cost this period</div>
          <div className="text-3xl md:text-4xl font-black text-emerald-400 mt-1 tracking-tight">{money(r.heroCost, r.ccy)}</div>
          <div className="text-xs text-zinc-300 mt-2">
            Across <span className="font-bold">{r.feeCount.toLocaleString()}</span> fills. Fees {money(r.totalFees, r.ccy)}
            {r.haveFunding && <> + funding paid {money(r.fundingPaid, r.ccy)}</>}.
            {r.haveVolume && r.volume > 0 && (
              <> That's <span className="font-bold text-emerald-400">{pct(r.totalFees / r.volume * 100)}</span> of your traded volume.</>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {r.mode === 'ledger' ? (
            <>
              <Metric label="Total fees" value={money(r.totalFees, r.ccy)} />
              <Metric label="Funding" value={r.haveFunding ? money(r.fundingNet, r.ccy) : 'n/a'} />
              <Metric label="Realized PnL" value={r.havePnl ? money(r.pnlSum, r.ccy) : 'n/a'} />
              <Metric label="Fees % of PnL" value={r.havePnl && r.pnlSum !== 0 ? pct(r.totalFees / Math.abs(r.pnlSum) * 100) : 'n/a'} />
            </>
          ) : (
            <>
              <Metric label="Traded volume" value={r.haveVolume && r.volume > 0 ? money(r.volume, r.ccy) : '—'} />
              <Metric label="Fees % of volume" value={r.haveVolume && r.volume > 0 ? pct(r.totalFees / r.volume * 100) : '—'} />
              <Metric label="Total fees" value={money(r.totalFees, r.ccy)} />
              <Metric label="Funding paid" value={r.haveFunding ? money(r.fundingPaid, r.ccy) : '—'} />
            </>
          )}
        </div>

        {r.mode === 'fills' && !r.haveVolume && (
          <button
            onClick={() => setShowMapping(true)}
            className="mb-3 text-left text-[11px] font-bold text-amber-400 hover:text-amber-300"
          >
            Volume not detected — tap to map your size &amp; price (or notional) column →
          </button>
        )}
        {r.mode === 'ledger' && (
          <div className="mb-3 text-[11px] text-zinc-500">
            Read from your account ledger — fees and funding by entry type. No per-trade volume or maker/taker here: for those, export your <span className="font-bold text-zinc-300">trade history</span> (per-fill) CSV instead.
          </div>
        )}

        {isPro ? (
        <div className="space-y-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Taker vs maker</div>
            {!r.haveLiq ? (
              <div className="text-xs text-zinc-300">Your export didn't include a maker/taker flag, so the maker what-if is skipped. Re-export with that column to unlock it.</div>
            ) : takerRate !== null && makerRate !== null && takerRate > makerRate ? (
              <div className="text-xs text-zinc-300">
                {takerShare !== null && <><span className="font-bold text-white">{pct(takerShare)}</span> of your volume was taker. </>}
                At your own maker rate ({ratePct(makerRate)} vs taker {ratePct(takerRate)}), the same volume as maker would have cost
                ~<span className="font-bold text-emerald-400">{money(r.takerNotional * (takerRate - makerRate), r.ccy)}</span> less.
              </div>
            ) : takerRate !== null && makerRate === null ? (
              <div className="text-xs text-zinc-300">
                {takerShare !== null && <><span className="font-bold text-white">{pct(takerShare)}</span> of your volume was taker. </>}
                No maker fills to compare. Enter your exchange's maker rate to estimate:
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number" step="0.001" value={makerRateInput}
                    onChange={(e) => setMakerRateInput(e.target.value)} placeholder="e.g. 0.02"
                    className="w-24 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-zinc-400">% maker</span>
                </div>
                {makerRateInput !== '' && !Number.isNaN(num(makerRateInput)) && (
                  <div className="mt-2">≈ <span className="font-bold text-emerald-400">{money(r.takerNotional * Math.max(0, takerRate - num(makerRateInput) / 100), r.ccy)}</span> saved as maker (taker rate {ratePct(takerRate)}).</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-300">Not enough data to compute a maker comparison.</div>
            )}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Funding</div>
            {r.haveFunding ? (
              <div className="text-xs text-zinc-300">
                Net funding: <span className="font-bold text-white">{money(r.fundingNet, r.ccy)}</span> (negative = you paid).
                {r.fundingPaid > 0 && <> You paid {money(r.fundingPaid, r.ccy)} in funding.</>}
                {r.fundingRecv > 0 && <> You received {money(r.fundingRecv, r.ccy)}.</>}
              </div>
            ) : (
              <div className="text-xs text-zinc-300">No funding column detected. On perps, export your funding history separately to include it.</div>
            )}
          </div>

          {(tSym || tDay) && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Worst offender</div>
              <div className="text-xs text-zinc-300">
                {tSym && <>Most expensive symbol: <span className="font-bold text-white">{tSym.k}</span> at {money(tSym.v, r.ccy)}. </>}
                {tDay && <>Worst day: <span className="font-bold text-white">{tDay.k}</span> at {money(tDay.v, r.ccy)}.</>}
              </div>
            </div>
          )}

          {r.havePnl && r.pnlSum !== 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold mb-1">Versus your PnL</div>
              <div className="text-xs text-zinc-300">
                Realized-PnL column sums to <span className="font-bold text-white">{money(r.pnlSum, r.ccy)}</span>. Fees + funding were <span className="font-bold text-emerald-400">{pct(r.heroCost / Math.abs(r.pnlSum) * 100)}</span> of that (absolute).
              </div>
            </div>
          )}
        </div>
        ) : (
          <button
            onClick={() => { track('analyzer_upgrade_click', { mode: r.mode }); onUpgrade() }}
            className="w-full rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-left hover:border-emerald-500 transition-colors"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Lock size={14} /> Unlock the full breakdown — $29
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              See what trading maker would've saved, your costliest symbols, funding detail, your fees vs PnL — plus all {20} exchanges, alerts and export.
            </div>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button onClick={() => setShowMapping((v) => !v)} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors">Adjust column mapping</button>
          <span className="text-zinc-700">·</span>
          <button onClick={reset} className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors">Load another file</button>
        </div>

        {showMapping && headers.length > 0 && <MappingPanel headers={headers} mapping={mapping} setMapping={setMapping} onCalc={calcFromMapping} onCancel={() => setShowMapping(false)} />}

        <div className="flex items-start gap-2 text-[11px] text-zinc-500 mt-3">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>Summed directly from your file. The maker what-if uses your own maker vs taker rates — a scenario, not a guarantee. Estimates only, not financial advice.</span>
        </div>

        <input type="file" ref={fileInputRef} accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
      </div>
    )
  }

  // ---- ENTRY (marketing card: free tease OR Pro uploader) ----
  return (
    <div className={card}>
      <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Free to try · nothing uploaded</div>
      <h3 className="text-2xl md:text-3xl font-black text-white leading-[1.08] tracking-tight mb-2">
        What are fees <span className="text-emerald-400">really</span> costing you?
      </h3>
      <p className="text-[11px] text-zinc-400 mb-4">
        Drop your exchange export and see your real fee + funding bill in ~10 seconds. Free.
      </p>

      <div className="flex gap-1.5 mb-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex-1 bg-[#06140e] border border-zinc-800 rounded-lg py-2.5 px-1 text-center">
              <Icon size={16} className="text-emerald-400 mx-auto" />
              <div className="text-[11px] font-bold text-zinc-200 mt-1">{i + 1} · {s.label}</div>
            </div>
          )
        })}
      </div>

      <div
        onClick={openPicker}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f) }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-3.5 text-center transition-colors mb-2.5 ${dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
      >
        <div className="text-xs font-bold text-zinc-200">
          <Upload size={14} className="inline align-[-2px] text-emerald-400 mr-1" /> Drop your fills CSV, or click
        </div>
      </div>
      <button onClick={openPicker} className="w-full bg-emerald-500 text-black font-bold text-sm rounded-full py-2.5 hover:bg-emerald-400 transition-colors">
        See your real cost
      </button>
      {error && <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mt-2.5">{error}</div>}
      {showMapping && headers.length > 0 && <MappingPanel headers={headers} mapping={mapping} setMapping={setMapping} onCalc={calcFromMapping} onCancel={() => setShowMapping(false)} />}

      <div className="text-[11px] text-zinc-500 text-center mt-3">
        <ShieldCheck size={12} className="inline align-[-2px] text-emerald-500/80 mr-1" />
        Parsed in your browser — your file never leaves your device
      </div>

      <input type="file" ref={fileInputRef} accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }} />
    </div>
  )
}

function MappingPanel({
  headers, mapping, setMapping, onCalc, onCancel,
}: {
  headers: string[]
  mapping: Mapping
  setMapping: Dispatch<SetStateAction<Mapping>>
  onCalc: () => void
  onCancel: () => void
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-3 space-y-3">
      <p className="text-[11px] text-zinc-400">
        Confirm the mapping, then calculate. Only <span className="text-emerald-400 font-bold">Fee</span> is required.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className={`block text-[11px] mb-1 ${f.req ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>{f.label}{f.req ? ' *' : ''}</label>
            <select
              value={mapping[f.key] ?? ''}
              onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">(none)</option>
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCalc} className="bg-emerald-500 text-black px-4 py-2 rounded font-bold text-xs hover:bg-emerald-400 transition-colors">Calculate</button>
        <button onClick={onCancel} className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded font-bold text-xs hover:border-zinc-600 transition-colors">Cancel</button>
      </div>
    </div>
  )
}
