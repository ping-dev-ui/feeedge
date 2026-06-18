import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

// Shared shell for the static legal/info pages (Terms, Privacy, Refunds, About).
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans">
      <header className="border-b border-zinc-800 bg-[#0d0d0d] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.png" width="30" height="30" alt="FeeEdge" className="rounded-lg" />
            <span className="text-lg font-black text-white">FeeEdge</span>
          </Link>
          <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10 legal">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{title}</h1>
        {updated && <div className="text-zinc-500 text-sm mb-8">Last updated: {updated}</div>}
        {children}
        <div className="mt-10 pt-6 border-t border-zinc-800/60 text-[11px] text-zinc-500">
          Questions? <a href="mailto:support@feeedge.com">support@feeedge.com</a>
        </div>
      </main>
    </div>
  )
}
