/**
 * Premium waitlist. For now emails are stored only in this browser's
 * localStorage: no server, no third-party service. That means the site owner
 * cannot see them yet. Swap joinWaitlist() for a real form endpoint later.
 */
const STORAGE_KEY = 'sqlreps:waitlist:v1'

export interface WaitlistEntry {
  email: string
  joinedAt: string
  /** The question the visitor was looking at when they joined. */
  source?: string
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function getWaitlist(): WaitlistEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function hasJoinedWaitlist(): boolean {
  return getWaitlist().length > 0
}

export type JoinResult = { ok: true } | { ok: false; message: string }

export function joinWaitlist(rawEmail: string, source?: string): JoinResult {
  const email = rawEmail.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) return { ok: false, message: 'Please enter a valid email address.' }
  const list = getWaitlist()
  if (!list.some((e) => e.email === email)) list.push({ email, joinedAt: new Date().toISOString(), source })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return { ok: true }
  } catch {
    return { ok: false, message: 'Your browser blocked saving. Please allow site storage and try again.' }
  }
}
