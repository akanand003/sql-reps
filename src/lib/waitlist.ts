/**
 * Premium waitlist client. Emails are sent to the Cloudflare Pages Function at
 * /api/waitlist (functions/api/waitlist.ts), which stores them in Cloudflare KV.
 *
 * The browser keeps only a "joined" flag, never the email, so a returning
 * visitor sees the success message instead of the form.
 */
const JOINED_KEY = 'sqlreps:waitlist-joined'
/** Old versions stored emails in the browser. Remove them: they never reached us. */
const LEGACY_KEY = 'sqlreps:waitlist:v1'
const TIMEOUT_MS = 10_000

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function hasJoinedWaitlist(): boolean {
  try {
    localStorage.removeItem(LEGACY_KEY)
    return localStorage.getItem(JOINED_KEY) === '1'
  } catch {
    return false
  }
}

export type JoinResult = { ok: true; message: string } | { ok: false; message: string }

/** Never throws: every failure becomes a friendly message. */
export async function joinWaitlist(rawEmail: string, honeypot = ''): Promise<JoinResult> {
  const email = rawEmail.trim()
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, company: honeypot }),
      signal: controller.signal,
    })
    let body: { ok?: boolean; message?: string } = {}
    try {
      body = await res.json()
    } catch {
      /* not JSON, for example a 404 page when the function is not deployed */
    }
    if (res.ok && body.ok) {
      try { localStorage.setItem(JOINED_KEY, '1') } catch { /* storage blocked: fine */ }
      return { ok: true, message: body.message || "You're on the waitlist! We'll email you when premium launches." }
    }
    if (body.message) return { ok: false, message: body.message }
    return { ok: false, message: 'Sorry, the waitlist is not available right now. Please try again later.' }
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    return {
      ok: false,
      message: aborted
        ? 'That took too long. Please check your connection and try again.'
        : 'Could not reach the server. Please check your connection and try again.',
    }
  } finally {
    clearTimeout(timer)
  }
}
