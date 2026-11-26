import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { hasJoinedWaitlist, joinWaitlist } from '../lib/waitlist'

/**
 * Shown when canAccess() returns false. There is no payment system: it collects
 * waitlist emails in localStorage only (see lib/waitlist.ts).
 */
export default function Paywall({ source }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  useEffect(() => setJoined(hasJoinedWaitlist()), [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const res = joinWaitlist(email, source)
    if (res.ok) { setJoined(true); setError(null) } else setError(res.message)
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-3xl" aria-hidden>💎</p>
      <h2 className="mt-2 text-xl font-semibold">Premium questions are coming soon, join the waitlist</h2>

      {joined ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800" role="status">
          ✓ You're on the waitlist. We'll let you know when premium questions open.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row" noValidate>
          <label htmlFor="waitlist-email" className="sr-only">Email address</label>
          <input
            id="waitlist-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            aria-invalid={!!error}
            aria-describedby={error ? 'waitlist-error' : undefined}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">Join the waitlist</button>
        </form>
      )}
      {error && <p id="waitlist-error" className="mt-2 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link to="/practice" className="inline-block py-1 font-medium text-emerald-700 hover:underline">Keep practicing free questions</Link>
        <Link to="/progress" className="inline-block py-1 text-slate-600 hover:underline">See your progress</Link>
      </div>
    </div>
  )
}
