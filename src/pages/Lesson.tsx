import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { LESSON_BY_TOPIC, lessonPath, type Lesson as LessonData } from '../data/lessons'
import { TOPIC_BY_SLUG, type TopicSlug } from '../data/topics'
import { setupSqlForTables } from '../data/sampleDatabase'
import { gradeQuery, type Grade } from '../lib/grade'
import { loadLesson, saveLesson, type LessonState } from '../lib/lessonProgress'
import { useMeta } from '../lib/seo'
import { getTables } from '../lib/sqlClient'
import type { TablePreview } from '../lib/types'
import CodeBlock from '../components/CodeBlock'
import ResultsTable from '../components/ResultsTable'
import SchemaPreview from '../components/SchemaPreview'
import SqlEditor from '../components/SqlEditor'
import NotFound from './NotFound'

export default function Lesson() {
  const { topic } = useParams()
  const lesson = LESSON_BY_TOPIC.get(topic as TopicSlug)
  if (!lesson) return <NotFound />
  return <LessonView key={lesson.topic} lesson={lesson} />
}

function LessonView({ lesson }: { lesson: LessonData }) {
  const topic = TOPIC_BY_SLUG.get(lesson.topic)!
  useMeta({ title: `${lesson.title} · Guided lesson | SQL Reps`, description: lesson.intro, path: lessonPath(lesson.topic), index: false })

  const setupSql = useMemo(() => setupSqlForTables(lesson.tables), [lesson])
  // Start at the top: links from a long topic page would otherwise keep its scroll position.
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const total = lesson.steps.length
  const [state, setState] = useState<LessonState>(() => {
    const saved = loadLesson(lesson.topic)
    return { ...saved, step: Math.min(saved.step, total) }
  })
  const update = (next: LessonState) => { setState(next); saveLesson(lesson.topic, next) }

  const [tables, setTables] = useState<TablePreview[] | null>(null)
  useEffect(() => {
    let cancelled = false
    getTables(setupSql).then((t) => { if (!cancelled) setTables(t) }).catch(() => { if (!cancelled) setTables([]) })
    return () => { cancelled = true }
  }, [setupSql])
  const schema = useMemo(() => (tables ? Object.fromEntries(tables.map((t) => [t.name, t.columns])) : undefined), [tables])

  const finished = state.step >= total
  const percent = Math.round(((finished ? total : state.step) / total) * 100)

  // Move keyboard and screen reader focus to the new step's heading (not on first load).
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    headingRef.current?.focus()
  }, [state.step])

  const goTo = (step: number) => update({ ...state, step })
  const skip = (id: string) => update({
    ...state,
    step: state.step + 1,
    skipped: state.solved.includes(id) || state.skipped.includes(id) ? state.skipped : [...state.skipped, id],
  })
  const markSolved = (id: string) => {
    if (state.solved.includes(id)) return
    const next = { ...state, solved: [...state.solved, id], skipped: state.skipped.filter((s) => s !== id) }
    update(next)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-slate-600" aria-label="Breadcrumb">
        <Link to="/topics" className="inline-block py-1 hover:text-slate-900">Topics</Link> <span aria-hidden>/</span>{' '}
        <Link to={`/topics/${topic.slug}`} className="inline-block py-1 hover:text-slate-900">{topic.name}</Link> <span aria-hidden>/</span> Lesson
      </nav>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{finished ? 'Lesson complete' : `Step ${state.step + 1} of ${total}`}</span>
          <span>{percent}%</span>
        </div>
        <div
          className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={finished ? total : state.step}
          aria-valuetext={finished ? 'Lesson complete' : `Step ${state.step + 1} of ${total}`}
        >
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {finished ? (
        <Finished lesson={lesson} state={state} headingRef={headingRef} onRestart={() => update({ step: 0, solved: [], skipped: [] })} />
      ) : (
        <StepView
          key={lesson.steps[state.step].id}
          lesson={lesson}
          index={state.step}
          setupSql={setupSql}
          schema={schema}
          solved={state.solved.includes(lesson.steps[state.step].id)}
          headingRef={headingRef}
          onSolved={markSolved}
          onNext={() => goTo(state.step + 1)}
          onBack={() => goTo(Math.max(0, state.step - 1))}
          onSkip={skip}
        />
      )}

      <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">See the tables used in this lesson</summary>
        <div className="mt-4"><SchemaPreview tables={tables} /></div>
      </details>
    </div>
  )
}

interface StepProps {
  lesson: LessonData
  index: number
  setupSql: string
  schema?: Record<string, string[]>
  solved: boolean
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onSolved: (id: string) => void
  onNext: () => void
  onBack: () => void
  onSkip: (id: string) => void
}

function StepView({ lesson, index, setupSql, schema, solved, headingRef, onSolved, onNext, onBack, onSkip }: StepProps) {
  const step = lesson.steps[index]
  const isLast = index === lesson.steps.length - 1
  const sqlRef = useRef('')
  const [running, setRunning] = useState(false)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [showHint, setShowHint] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)

  const check = useCallback(async () => {
    if (running) return
    setRunning(true)
    const g = await gradeQuery(setupSql, sqlRef.current, step.solution, step)
    setGrade(g)
    setRunning(false)
    if (g.kind === 'correct') onSolved(step.id)
  }, [running, setupSql, step, onSolved])

  // After a correct answer, move focus to "Next" so keyboard users can continue with Enter.
  useEffect(() => { if (grade?.kind === 'correct') nextRef.current?.focus() }, [grade])

  const correct = grade?.kind === 'correct'

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="step-heading">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Learn</p>
      <h2 id="step-heading" ref={headingRef} tabIndex={-1} className="mt-1 text-lg font-semibold leading-snug focus:outline-none">
        {step.explain}
      </h2>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">Example</p>
      <div className="mt-1.5"><CodeBlock code={step.example} wrap /></div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-600">Your turn</p>
      <p className="mt-1 font-medium text-slate-900">{step.task}</p>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-300">
        <div className="h-36 sm:h-40">
          <SqlEditor initialValue="" onChange={(v) => { sqlRef.current = v }} onRun={check} schema={schema} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={check}
          disabled={running}
          className="rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? 'Checking…' : '▶ Check'}
        </button>
        {!showHint && (
          <button onClick={() => setShowHint(true)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
            💡 Hint
          </button>
        )}
        <span className="ml-auto flex gap-2">
          {index > 0 && (
            <button onClick={onBack} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">← Back</button>
          )}
          {!correct && !solved && (
            <button onClick={() => onSkip(step.id)} aria-label="Skip this step" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
              Skip →
            </button>
          )}
          {!correct && solved && (
            <button onClick={onNext} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
              Next →
            </button>
          )}
        </span>
      </div>
      <p className="mt-2 hidden text-xs text-slate-600 sm:block">Tip: press Ctrl/⌘ + Enter in the editor to check.</p>

      {showHint && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><span className="font-semibold">Hint: </span><code className="font-mono">{step.hint}</code></p>}

      <div aria-live="polite" className="mt-4 space-y-3">
        {grade?.kind === 'correct' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="font-semibold text-emerald-800">✓ Correct! {isLast ? 'That was the last step.' : 'On to the next idea.'}</p>
            <button ref={nextRef} onClick={onNext} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              {isLast ? 'Finish lesson' : 'Next step →'}
            </button>
          </div>
        )}
        {grade?.kind === 'wrong' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900" role="alert">
            <p className="font-semibold">Not quite. Try again!</p>
            <p className="mt-1 text-sm">{grade.message}</p>
          </div>
        )}
        {grade?.kind === 'error' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900" role="alert">
            <p className="font-semibold">Your query did not run</p>
            <p className="mt-1 text-sm">{grade.message}</p>
          </div>
        )}
        {grade && grade.kind !== 'error' && <ResultsTable result={grade.result} caption="Your result" />}
      </div>
    </section>
  )
}

function Finished({ lesson, state, headingRef, onRestart }: { lesson: LessonData; state: LessonState; headingRef: React.RefObject<HTMLHeadingElement | null>; onRestart: () => void }) {
  const topic = TOPIC_BY_SLUG.get(lesson.topic)!
  const solvedCount = lesson.steps.filter((s) => state.solved.includes(s.id)).length
  const skippedCount = lesson.steps.length - solvedCount
  return (
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
      <p className="text-4xl" aria-hidden>🎉</p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-2 text-xl font-bold focus:outline-none">You finished the {topic.name} lesson</h2>
      <p className="mt-1 text-slate-700">
        You solved {solvedCount} of {lesson.steps.length} steps{skippedCount ? ` and skipped ${skippedCount}` : ''}.
        {skippedCount ? ' Restart the lesson any time to try the steps you skipped.' : ' Nice work!'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to={`/practice?topic=${topic.slug}`} className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">
          Practice {topic.name} questions
        </Link>
        <Link to={`/topics/${topic.slug}`} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:border-slate-400">
          Back to the {topic.name} guide
        </Link>
        <button onClick={onRestart} className="rounded-lg px-4 py-2.5 font-medium text-slate-700 underline hover:text-slate-900">Restart lesson</button>
      </div>
    </section>
  )
}
