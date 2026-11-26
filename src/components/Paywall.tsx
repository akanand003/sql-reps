import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { hasJoinedWaitlist, joinWaitlist } from '../lib/waitlist'

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; message: string } | { kind: 'error'; message: string }

/**
 * Shown when canAccess() returns false. There is no payment system: it adds the
 * visitor's email to the premium waitlist (see lib/waitlist.ts and functions/api/waitlist.ts).
 */
export default function Paywall() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    if (hasJoinedWaitlist()) setStatus({ kind: 'done', message: "You're on the waitlist. We'll email you when premium launches." })
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (status.kind === 'sending') return
    setStatus({ kind: 'sending' })
    const res = await joinWaitlist(email, honeypot)
    setStatus(res.ok ? { kind: 'done', message: res.message } : { kind: 'error', message: res.message })
  }

  const error = status.kind === 'error' ? status.message : null

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-3xl" aria-hidden>💎</p>
      <h2 className="mt-2 text-xl font-semibold">Premium questions are coming soon, join the waitlist</h2>

      {status.kind === 'done' ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800" role="status">✓ {status.message}</p>
      ) : (
        <form onSubmit={submit} className="mt-5" noValidate>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="waitlist-email" className="sr-only">Email address</label>
            <input
              id="waitlist-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setStatus({ kind: 'idle' }) }}
              aria-invalid={!!error}
              aria-describedby={`waitlist-privacy${error ? ' waitlist-error' : ''}`}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={status.kind === 'sending'}
              className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
            >
              {status.kind === 'sending' ? 'Joining…' : 'Join the waitlist'}
            </button>
          </div>
          {/* Honeypot: hidden from people and screen readers. Bots that fill it are ignored. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="waitlist-company">Company</label>
            <input id="waitlist-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <p id="waitlist-privacy" className="mt-2 text-sm text-slate-600">We only use your email to tell you when premium launches.</p>
        </form>
      )}
      {error && <p id="waitlist-error" className="mt-2 text-sm text-rose-700" role="alert">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link to="/practice" className="inline-block py-1 font-medium text-emerald-700 hover:underline">Keep practicing free questions</Link>
        <Link to="/progress" className="inline-block py-1 text-slate-600 hover:underline">See your progress</Link>
      </div>
    </div>
  )
}
