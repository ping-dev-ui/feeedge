import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Save, Trash2, Link2, Check, FolderOpen } from 'lucide-react'

export type ScenarioState = {
  market: string
  monthlyVolume: number
  makerRatio: number
  holdTime: number
  selectedAssets: string[]
}

export function ScenariosPanel({
  current,
  isAuthenticated,
  onRequireSignIn,
  onLoad,
}: {
  current: ScenarioState
  isAuthenticated: boolean
  onRequireSignIn: () => void
  onLoad: (s: ScenarioState) => void
}) {
  const { data: scenarios } = useSuspenseQuery(
    convexQuery(api.scenarios.listMine, {}),
  )
  const save = useMutation(api.scenarios.saveScenario)
  const del = useMutation(api.scenarios.deleteScenario)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const handleSave = async () => {
    if (!isAuthenticated) {
      onRequireSignIn()
      return
    }
    const name = window.prompt(
      'Name this scenario:',
      `${current.market === 'spot' ? 'Spot' : 'Perps'} · $${current.monthlyVolume.toLocaleString()}`,
    )
    if (!name) return
    try {
      setBusy(true)
      await save({ name, ...current })
    } catch (e: any) {
      alert(e?.message ?? 'Could not save scenario.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async (shareId: string) => {
    const url = `${window.location.origin}/?s=${shareId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(shareId)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      window.prompt('Copy this share link:', url)
    }
  }

  return (
    <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <FolderOpen size={16} />
          Scenarios
        </h2>
        <button
          onClick={handleSave}
          disabled={busy}
          className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black px-2.5 py-1.5 rounded hover:bg-emerald-400 transition-colors flex items-center gap-1 disabled:opacity-60"
        >
          <Save size={12} />
          Save current
        </button>
      </div>

      {scenarios.length === 0 ? (
        <p className="text-[10px] text-zinc-500">
          {isAuthenticated
            ? 'No saved scenarios yet. Save your current setup to revisit or share it.'
            : 'Sign in to save and share scenarios.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {scenarios.map((s) => (
            <li
              key={s._id}
              className="flex items-center justify-between gap-2 bg-black/40 border border-zinc-800 rounded px-3 py-2"
            >
              <button
                onClick={() =>
                  onLoad({
                    market: s.market,
                    monthlyVolume: s.monthlyVolume,
                    makerRatio: s.makerRatio,
                    holdTime: s.holdTime,
                    selectedAssets: s.selectedAssets,
                  })
                }
                className="text-left flex-1 min-w-0"
                title="Load scenario"
              >
                <div className="text-xs text-zinc-200 truncate">{s.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {s.market === 'spot' ? 'Spot' : 'Perps'} · ${s.monthlyVolume.toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => copyLink(s.shareId)}
                className="text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
                title="Copy share link"
              >
                {copied === s.shareId ? <Check size={14} /> : <Link2 size={14} />}
              </button>
              <button
                onClick={() => del({ id: s._id })}
                className="text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                title="Delete"
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
