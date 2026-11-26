import { useSyncExternalStore } from 'react'
import { QUESTIONS, questionsForTopic, type Question } from '../data/questions'

/**
 * Progress lives in localStorage under one versioned key.
 * Bump the version and add a migration in load() if the shape ever changes.
 */
const STORAGE_KEY = 'sqlreps:progress:v1'

export interface Progress {
  /** question id -> ISO time it was first solved */
  solved: Record<string, string>
  /** question id -> number of Run attempts */
  attempts: Record<string, number>
  /** question id -> the user's last query text */
  drafts: Record<string, string>
  /** Local dates (YYYY-MM-DD) on which the user solved at least one question */
  activeDays: string[]
}

const EMPTY: Progress = { solved: {}, attempts: {}, drafts: {}, activeDays: [] }

function load(): Progress {
  if (typeof localStorage === 'undefined') return EMPTY
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return parsed && typeof parsed === 'object' ? { ...EMPTY, ...parsed } : EMPTY
  } catch {
    return EMPTY
  }
}

let state: Progress = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function current(): Progress {
  if (!loaded && typeof window !== 'undefined') { state = load(); loaded = true }
  return state
}

function update(fn: (p: Progress) => Progress) {
  state = fn(current())
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage full or blocked: keep in memory */ }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { state = load(); listeners.forEach((l) => l()) }
  })
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    current,
    () => EMPTY,
  )
}

export function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function recordAttempt(id: string) {
  update((p) => ({ ...p, attempts: { ...p.attempts, [id]: (p.attempts[id] ?? 0) + 1 } }))
}

export function recordSolved(id: string) {
  update((p) => {
    const today = localDay()
    return {
      ...p,
      solved: p.solved[id] ? p.solved : { ...p.solved, [id]: new Date().toISOString() },
      activeDays: p.activeDays.includes(today) ? p.activeDays : [...p.activeDays, today],
    }
  })
}

export function saveDraft(id: string, sql: string) {
  update((p) => ({ ...p, drafts: { ...p.drafts, [id]: sql } }))
}

export function resetProgress() {
  update(() => EMPTY)
}

/** Consecutive days with a solve, ending today (or yesterday, so the streak survives until midnight). */
export function currentStreak(p: Progress, now = new Date()): number {
  const days = new Set(p.activeDays)
  const cursor = new Date(now)
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(localDay(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function longestStreak(p: Progress): number {
  const sorted = [...p.activeDays].sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const d of sorted) {
    const date = new Date(`${d}T12:00:00`)
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86_400_000) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return best
}

/**
 * Unlock rule: the first question of every topic is always open, so visitors
 * arriving on a topic page from search can start right away. Inside a topic,
 * each question unlocks when the one before it is solved.
 */
export function isUnlocked(q: Question, p: Progress): boolean {
  const list = questionsForTopic(q.topic)
  const i = list.indexOf(q)
  return i <= 0 || !!p.solved[list[i - 1].id]
}

/** Where "Start practicing" should take the user: the first open, unsolved question. */
export function nextUp(p: Progress, topic?: Question['topic']): Question {
  const pool = topic ? questionsForTopic(topic) : QUESTIONS
  return pool.find((q) => !p.solved[q.id] && isUnlocked(q, p)) ?? pool[0]
}
