import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { X } from 'lucide-react'

export function SignInModal({
  onClose,
  onSignedIn,
}: {
  onClose: () => void
  onSignedIn?: () => void
}) {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signUp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn('password', { email, password, flow })
      onSignedIn?.()
      onClose()
    } catch (err) {
      setError(
        flow === 'signUp'
          ? 'Could not create account. Try a stronger password or sign in instead.'
          : 'Invalid email or password.',
      )
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#0d0d0d] border border-zinc-800 rounded-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {flow === 'signUp' ? 'Create your account' : 'Welcome back'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1 uppercase">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded p-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 text-black px-4 py-2.5 rounded font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Please wait…'
              : flow === 'signUp'
                ? 'Sign up'
                : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-zinc-400 text-center">
          {flow === 'signUp' ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            onClick={() => {
              setError(null)
              setFlow(flow === 'signUp' ? 'signIn' : 'signUp')
            }}
            className="text-emerald-400 hover:underline font-medium"
          >
            {flow === 'signUp' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
