import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { QUESTIONS, QUESTION_BY_ID, nextQuestion, questionNumber, setupSqlOf, type Question } from '../data/questions'
import { TOPICS, TOPIC_BY_SLUG, type TopicSlug } from '../data/topics'
import { canAccess } from '../lib/access'
import { checkAnswer } from '../lib/checkAnswer'
import { isUnlocked, nextUp, recordAttempt, recordSolved, saveDraft, useProgress } from '../lib/progress'
import { useMeta } from '../lib/seo'
import { getTables, runSql } from '../lib/sqlClient'
import { guardSql, stripLiteralsAndComments } from '../lib/sqlGuard'
import type { QueryResult, TablePreview } from '../lib/types'
import CodeBlock from '../components/CodeBlock'
import Paywall from '../components/Paywall'
import ResultsTable from '../components/ResultsTable'
import SchemaPreview from '../components/SchemaPreview'
import SqlEditor from '../components/SqlEditor'
import NotFound from './NotFound'

const STARTER = '-- Write your query here, then press Run (Ctrl/⌘ + Enter)\n'
const PRAISE = ['Nailed it!', 'Correct!', 'Spot on!', 'Great query!', 'That is exactly right!']
const difficultyClass = { easy: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', hard: 'bg-rose-50 text-rose-700' }

type Feedback =
  | { kind: 'correct'; message: string }
  | { kind: 'wrong'; message: string }
  | { kind: 'error'; message: string }

export default function Practice() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const progress = useProgress()

  if (!id) {
    const topic = search.get('topic')
    const valid = topic && TOPIC_BY_SLUG.has(topic as TopicSlug) ? (topic as TopicSlug) : undefined
    return <Navigate replace to={`/practice/${nextUp(progress, valid).id}`} />
  }
  const q = QUESTION_BY_ID.get(id)
  if (!q) return <NotFound />
  return <QuestionView key={q.id} q={q} />
}

function QuestionView({ q }: { q: Question }) {
  const num = questionNumber(q)
  useMeta({ title: `${q.title} · SQL ${TOPIC_BY_SLUG.get(q.topic)!.name} practice | SQL Reps`, description: q.question, path: `/practice/${q.id}`, index: false })

  const progress = useProgress()
  const navigate = useNavigate()
  const setupSql = useMemo(() => setupSqlOf(q), [q])
  const initialSql = progress.drafts[q.id] ?? STARTER
  const sqlRef = useRef(initialSql)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [tables, setTables] = useState<TablePreview[] | null>(null)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const solved = !!progress.solved[q.id]
  const attempted = (progress.attempts[q.id] ?? 0) > 0
  const unlocked = isUnlocked(q, progress)
  const next = nextQuestion(q)

  useEffect(() => {
    let cancelled = false
    getTables(setupSql)
      .then((t) => { if (!cancelled) setTables(t) })
      .catch((e) => { if (!cancelled) setTablesError(e instanceof Error ? e.message : String(e)) })
    return () => { cancelled = true }
  }, [setupSql])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const schema = useMemo(
    () => (tables ? Object.fromEntries(tables.map((t) => [t.name, t.columns])) : undefined),
    [tables],
  )

  const onChange = useCallback((value: string) => {
    sqlRef.current = value
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveDraft(q.id, value), 400)
  }, [q.id])

  const run = useCallback(async () => {
    if (running) return
    const text = sqlRef.current
    if (stripLiteralsAndComments(text).trim() !== '') recordAttempt(q.id)
    saveDraft(q.id, text)

    const guard = guardSql(text)
    if (!guard.ok) {
      setResult(null)
      setFeedback({ kind: 'error', message: guard.message })
      return
    }

    setRunning(true)
    try {
      const user = await runSql(setupSql, guard.sql)
      if (!user.ok) {
        setResult(null)
        setFeedback({ kind: 'error', message: user.error })
        return
      }
      setResult(user.result)
      const expected = await runSql(setupSql, q.solution)
      if (!expected.ok) {
        setFeedback({ kind: 'error', message: `Your query ran, but this question's answer could not be checked (${expected.error}). Please report it.` })
        return
      }
      const check = checkAnswer(user.result, expected.result, q)
      if (check.correct) {
        recordSolved(q.id)
        setFeedback({ kind: 'correct', message: PRAISE[Math.floor(Math.random() * PRAISE.length)] })
      } else {
        setFeedback({ kind: 'wrong', message: check.reason })
      }
    } catch (e) {
      setFeedback({ kind: 'error', message: e instanceof Error ? e.message : 'Something went wrong. Please try again.' })
    } finally {
      setRunning(false)
    }
  }, [running, q, setupSql])

  if (!canAccess(q, num)) return <div className="px-4 py-16"><Paywall /></div>

  if (!unlocked) {
    const list = QUESTIONS.filter((x) => x.topic === q.topic)
    const prev = list[list.indexOf(q) - 1]
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="mt-3 text-xl font-semibold">This question is locked</h1>
        <p className="mt-2 text-slate-600">Solve "{prev.title}" first. Questions in a topic unlock one at a time.</p>
        <Link to={`/practice/${prev.id}`} className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">Go to "{prev.title}"</Link>
      </div>
    )
  }

  const topic = TOPIC_BY_SLUG.get(q.topic)!

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <QuestionPicker current={q} onPick={(id) => navigate(`/practice/${id}`)} />
        <span className="text-sm text-slate-500">Question {num} of {QUESTIONS.length}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Left: question */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link to={`/topics/${topic.slug}`} className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-200">{topic.name}</Link>
              <span className={`rounded-full px-2 py-0.5 font-medium ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
              {solved && <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-medium text-white">✓ solved</span>}
            </div>
            <h1 className="mt-3 text-xl font-semibold">{q.title}</h1>
            <p className="mt-2 leading-relaxed text-slate-700">{q.question}</p>
            {q.orderMatters && <p className="mt-2 text-sm text-slate-500">Row order matters for this one.</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setShowHint((s) => !s)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400">
                {showHint ? 'Hide hint' : '💡 Hint'}
              </button>
              {attempted && (
                <button onClick={() => setShowSolution((s) => !s)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400">
                  {showSolution ? 'Hide solution' : 'Show solution'}
                </button>
              )}
            </div>
            {showHint && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{q.hint}</p>}
            {showSolution && <div className="mt-3"><CodeBlock code={q.solution} /></div>}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Tables</h2>
            {tablesError ? <p className="text-sm text-rose-700">{tablesError}</p> : <SchemaPreview tables={tables} />}
          </div>
        </section>

        {/* Right: editor and results */}
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-64 sm:h-72">
              <SqlEditor initialValue={initialSql} onChange={onChange} onRun={run} schema={schema} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="hidden text-xs text-slate-500 sm:inline">Ctrl/⌘ + Enter to run</span>
              <button
                onClick={run}
                disabled={running}
                className="ml-auto rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                {running ? 'Running…' : '▶ Run'}
              </button>
            </div>
          </div>

          {feedback && <FeedbackBanner feedback={feedback} next={next} onHint={() => setShowHint(true)} hintShown={showHint} />}

          {result && <ResultsTable result={result} caption="Your result" />}
          {!result && !feedback && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Your results will appear here.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function FeedbackBanner({ feedback, next, onHint, hintShown }: { feedback: Feedback; next?: Question; onHint: () => void; hintShown: boolean }) {
  if (feedback.kind === 'correct') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3" role="status">
        <p className="font-semibold text-emerald-800">✓ {feedback.message} {next ? 'Next question unlocked.' : 'You finished every question!'}</p>
        {next
          ? <Link to={`/practice/${next.id}`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next: {next.title} →</Link>
          : <Link to="/progress" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">See your progress</Link>}
      </div>
    )
  }
  const isError = feedback.kind === 'error'
  return (
    <div className={`rounded-xl border px-4 py-3 ${isError ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`} role="alert">
      <p className="font-semibold">{isError ? 'Your query did not run' : 'Not quite yet. Keep going!'}</p>
      <p className="mt-1 text-sm">{feedback.message}</p>
      {!hintShown && (
        <button onClick={onHint} className="mt-2 text-sm font-medium underline underline-offset-2">Need a hint?</button>
      )}
    </div>
  )
}

function QuestionPicker({ current, onPick }: { current: Question; onPick: (id: string) => void }) {
  const progress = useProgress()
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Jump to question</span>
      <select
        value={current.id}
        onChange={(e) => onPick(e.target.value)}
        className="max-w-[16rem] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
      >
        {TOPICS.map((t) => (
          <optgroup key={t.slug} label={t.name}>
            {QUESTIONS.filter((q) => q.topic === t.slug).map((q) => {
              const open = isUnlocked(q, progress)
              return (
                <option key={q.id} value={q.id} disabled={!open}>
                  {progress.solved[q.id] ? '✓ ' : open ? '' : '🔒 '}{questionNumber(q)}. {q.title}
                </option>
              )
            })}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
