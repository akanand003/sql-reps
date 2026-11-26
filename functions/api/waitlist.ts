/**
 * POST /api/waitlist  (Cloudflare Pages Function)
 *
 * Saves a premium-waitlist email in Cloudflare KV (binding: WAITLIST).
 * Stored per signup: key "email:<address>", value = the time it joined. Nothing else.
 *
 * Protection, all on the free tier:
 *   - email format and length check
 *   - duplicates are not stored twice
 *   - hidden honeypot field ("company"): if a bot fills it, we pretend it worked and store nothing
 *   - at most MAX_PER_MINUTE submits per visitor per minute. The visitor is identified by a
 *     one-way hash of their IP, kept for 2 minutes only. The IP itself is never stored.
 *   - requests from other websites are refused
 *
 * Every path returns JSON { ok, message, code? } and never throws.
 */

/** The parts of the Cloudflare KV API this function uses. */
interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

interface Env {
  WAITLIST?: KVNamespace
}

interface Context {
  request: Request
  env: Env
}

const MAX_PER_MINUTE = 5
const MAX_BODY_BYTES = 2_000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const SUCCESS = "You're on the waitlist! We'll email you when premium launches."
const ALREADY = "You're already on the waitlist. We'll email you when premium launches."

function reply(status: number, body: { ok: boolean; message: string; code?: string }, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  })
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // some browsers omit Origin on same-origin requests
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    const kv = env.WAITLIST
    if (!kv) {
      return reply(503, { ok: false, code: 'not_configured', message: 'The waitlist is not open yet. Please try again later.' })
    }
    if (!isSameOrigin(request)) {
      return reply(403, { ok: false, code: 'forbidden', message: 'This form can only be used on SQL Reps.' })
    }

    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return reply(413, { ok: false, code: 'too_large', message: 'That request was too large.' })
    }
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      return reply(400, { ok: false, code: 'bad_request', message: 'Something was wrong with that request. Please try again.' })
    }
    const fields = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>

    // Honeypot: real people never see this field. Pretend success so bots learn nothing.
    if (typeof fields.company === 'string' && fields.company.trim() !== '') {
      return reply(200, { ok: true, message: SUCCESS })
    }

    // Rate limit per visitor per minute.
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
    const minute = Math.floor(Date.now() / 60_000)
    const rateKey = `ratelimit:${await sha256(`sql-reps-waitlist:${ip}`)}:${minute}`
    const attempts = Number(await kv.get(rateKey)) || 0
    if (attempts >= MAX_PER_MINUTE) {
      return reply(429, { ok: false, code: 'rate_limited', message: 'Too many tries. Please wait a minute and try again.' }, { 'retry-after': '60' })
    }
    await kv.put(rateKey, String(attempts + 1), { expirationTtl: 120 })

    const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return reply(400, { ok: false, code: 'invalid_email', message: 'Please enter a valid email address.' })
    }

    const key = `email:${email}`
    if (await kv.get(key)) {
      return reply(200, { ok: true, code: 'already_joined', message: ALREADY })
    }
    await kv.put(key, new Date().toISOString())
    return reply(201, { ok: true, message: SUCCESS })
  } catch {
    return reply(500, { ok: false, code: 'server_error', message: 'Something went wrong on our side. Please try again in a minute.' })
  }
}

/** Any other method (GET, PUT, ...) is not allowed. */
export async function onRequest(): Promise<Response> {
  return reply(405, { ok: false, code: 'method_not_allowed', message: 'Use POST to join the waitlist.' }, { allow: 'POST' })
}
