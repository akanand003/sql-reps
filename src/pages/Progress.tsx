import { Link } from 'react-router'
import { TOPICS } from '../data/topics'
import { QUESTIONS, questionsForTopic } from '../data/questions'
import { currentStreak, isUnlocked, longestStreak, nextUp, resetProgress, useProgress } from '../lib/progress'
import { useMeta } from '../lib/seo'

export default function Progress() {
  useMeta({ title: 'Your progress | SQL Reps', description: 'Your solved SQL questions and daily streak.', path: '/progress', index: false })
  const p = useProgress()
  const solvedCount = QUESTIONS.filter((q) => p.solved[q.id]).length
  const streak = currentStreak(p)
  const pct = Math.round((solvedCount / QUESTIONS.length) * 100)
  const up = nextUp(p)
  const allDone = solvedCount === QUESTIONS.length

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Your progress</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Solved" value={`${solvedCount} / ${QUESTIONS.length}`} />
        <Stat label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} accent={streak > 0 ? '🔥' : undefined} />
        <Stat label="Longest streak" value={`${longestStreak(p)} day${longestStreak(p) === 1 ? '' : 's'}`} />
      </div>

      <div className="mt-6">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{allDone ? 'You solved every question. Nice work!' : `${pct}% complete. Solve one question a day to keep your streak.`}</p>
          {!allDone && <Link to={`/practice/${up.id}`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Continue: {up.title}</Link>}
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {TOPICS.map((t) => {
          const qs = questionsForTopic(t.slug)
          const done = qs.filter((q) => p.solved[q.id]).length
          return (
            <section key={t.slug} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold"><Link to={`/topics/${t.slug}`} className="hover:text-emerald-700">{t.name}</Link></h2>
                <span className="text-sm text-slate-500">{done}/{qs.length}</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {qs.map((q) => {
                  const solved = !!p.solved[q.id]
                  const open = isUnlocked(q, p)
                  const cls = solved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : open ? 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400' : 'border-slate-200 bg-slate-50 text-slate-400'
                  return (
                    <li key={q.id}>
                      {open || solved
                        ? <Link to={`/practice/${q.id}`} className={`block rounded-lg border px-3 py-1.5 text-sm ${cls}`}>{solved ? '✓ ' : ''}{q.title}</Link>
                        : <span className={`block rounded-lg border px-3 py-1.5 text-sm ${cls}`}>🔒 {q.title}</span>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {solvedCount > 0 && (
        <button
          onClick={() => { if (confirm('Reset all progress on this device? This cannot be undone.')) resetProgress() }}
          className="mt-10 text-sm text-slate-500 underline hover:text-rose-600"
        >
          Reset progress
        </button>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{accent && <span className="mr-1">{accent}</span>}{value}</p>
    </div>
  )
}
