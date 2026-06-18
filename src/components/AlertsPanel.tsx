import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Bell, Trash2, Lock } from 'lucide-react'
import type { ScenarioState } from './ScenariosPanel'

export function AlertsPanel({
  current,
  isPro,
  isAuthenticated,
  onRequireSignIn,
  onUpgrade,
}: {
  current: ScenarioState
  isPro: boolean
  isAuthenticated: boolean
  onRequireSignIn: () => void
  onUpgrade: () => void
}) {
  const { data: alerts } = useSuspenseQuery(
    convexQuery(api.alerts.listMine, {}),
  )
  const create = useMutation(api.alerts.createAlert)
  const del = useMutation(api.alerts.deleteAlert)
  const [busy, setBusy] = useState(false)

  const handleCreate = async () => {
    if (!isAuthenticated) {
      onRequireSignIn()
      return
    }
    if (!isPro) {
      onUpgrade()
      return
    }
    try {
      setBusy(true)
      await create({ ...current })
    } catch (e: any) {
      alert(e?.message ?? 'Could not create alert.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Bell size={16} />
          Price Alerts
          {!isPro && <Lock size={11} className="text-zinc-400" />}
        </h2>
        <button
          onClick={handleCreate}
          disabled={busy}
          className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-2.5 py-1.5 rounded hover:bg-emerald-400 transition-colors flex items-center gap-1 disabled:opacity-60"
        >
          <Bell size={12} />
          Alert me
        </button>
      </div>

      <p className="text-[11px] text-zinc-400">
        Get an email when a cheaper exchange appears for your current profile.
        {!isPro && ' Pro feature.'}
      </p>

      {alerts.length > 0 && (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a._id}
              className="flex items-center justify-between gap-2 bg-black/40 border border-zinc-800 rounded px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-xs text-zinc-200 truncate">
                  {a.market === 'spot' ? 'Spot' : 'Perps'} · ${a.monthlyVolume.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Best now: {a.baselineExchange} (~${a.baselineCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo)
                </div>
              </div>
              <button
                onClick={() => del({ id: a._id })}
                className="text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                title="Delete alert"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
