import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [{ title: 'FeeEdge — Referrals' }, { name: 'robots', content: 'noindex' }],
  }),
  component: AdminPage,
})

function AdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = useSuspenseQuery(convexQuery((api as any).admin.referralStats, {}))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-mono p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-bold italic">
            FE
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">FEE EDGE — REFERRALS</h1>
        </div>

        {!data ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-300 font-bold">Not authorized</p>
            <p className="text-xs text-zinc-400 mt-2">
              Sign in on the main site with the admin account, then reload this page.
            </p>
            <a href="/" className="inline-block mt-4 text-emerald-400 hover:underline text-sm">
              ← Back to FeeEdge
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Total Pro" value={data.totalPro} />
              <Stat label="From referrals" value={data.referredPro} accent />
              <Stat label="Direct" value={data.directPro} />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                Pro signups by referral code
              </h2>
              {data.byRef.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No referred Pro signups yet. Share links like{' '}
                  <span className="text-emerald-400">feeedge.com/?ref=name</span> to start tracking.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                      <th className="text-left py-2 font-bold">Code (?ref=)</th>
                      <th className="text-right py-2 font-bold">Pro signups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byRef.map((r) => (
                      <tr key={r.ref} className="border-b border-zinc-800/50">
                        <td className="py-2 text-emerald-400 font-bold">{r.ref}</td>
                        <td className="py-2 text-right text-white font-bold">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <a href="/" className="inline-block text-emerald-400 hover:underline text-sm">
              ← Back to FeeEdge
            </a>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className={`text-3xl font-black mt-1 ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
