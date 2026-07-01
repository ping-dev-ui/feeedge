import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

/**
 * Free-user email capture: monthly "cheapest exchange right now" update.
 * Compact inline form; no login required. Dedupe/reactivation handled server-side.
 */
export function EmailCapture({
  source,
  track,
}: {
  source: string
  track?: (event: string, props?: Record<string, unknown>) => void
}) {
  const subscribe = useMutation(api.subscribers.subscribe)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setState('error')
      return
    }
    setState('busy')
    try {
      const ref =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('ref')
          : null
      await subscribe({ email: value, source, ref })
      setState('done')
      track?.('email_subscribed', { source })
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
        You&apos;re in. One email a month with the cheapest exchange for each
        profile. No spam, unsubscribe anytime.
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3"
    >
      <p className="text-sm font-bold text-white mb-0.5">
        Fees change. Stay the cheapest.
      </p>
      <p className="text-xs text-zinc-400 mb-2">
        One email a month: which exchange is cheapest right now, and what
        changed. No spam.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder="your email"
          className="flex-1 min-w-0 rounded bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'busy'}
          className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-2 text-sm font-bold text-white whitespace-nowrap"
        >
          {state === 'busy' ? '…' : 'Get the update'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs text-red-400 mt-1.5">
          That didn&apos;t work. Check the email and try again.
        </p>
      )}
    </form>
  )
}
