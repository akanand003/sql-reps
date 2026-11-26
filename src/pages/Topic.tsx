import { Link, useParams } from 'react-router'
import { TOPICS, TOPIC_BY_SLUG, type TopicSlug } from '../data/topics'
import { questionsForTopic } from '../data/questions'
import { isUnlocked, useProgress } from '../lib/progress'
import { isPremium } from '../lib/access'
import { topicMeta, useMeta } from '../lib/seo'
import CodeBlock from '../components/CodeBlock'
import NotFound from './NotFound'

const difficultyClass = { easy: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', hard: 'bg-rose-50 text-rose-700' }

export default function Topic() {
  const { slug } = useParams()
  const topic = TOPIC_BY_SLUG.get(slug as TopicSlug)
  if (!topic) return <NotFound />
  return <TopicView slug={topic.slug} />
}

function TopicView({ slug }: { slug: TopicSlug }) {
  const topic = TOPIC_BY_SLUG.get(slug)!
  useMeta(topicMeta(slug))
  const progress = useProgress()
  const questions = questionsForTopic(slug)
  const freeCount = questions.filter((q) => !isPremium(q)).length
  const index = TOPICS.indexOf(topic)
  const prev = TOPICS[index - 1]
  const next = TOPICS[index + 1]

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-sm text-slate-500">
        <Link to="/topics" className="inline-block py-1 hover:text-slate-800">Topics</Link> <span aria-hidden>/</span> {topic.name}
      </nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">SQL {topic.name}, explained</h1>
      <div className="mt-4 space-y-3 text-lg leading-relaxed text-slate-700">
        {topic.intro.map((p) => <p key={p}>{p}</p>)}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Examples</h2>
      <div className="mt-4 space-y-6">
        {topic.examples.map((ex, i) => (
          <section key={ex.title}>
            <h3 className="mb-2 font-medium">{i + 1}. {ex.title}</h3>
            <CodeBlock code={ex.sql} />
            <p className="mt-2 text-slate-600">{ex.explanation}</p>
          </section>
        ))}
      </div>

      <aside className="mt-8 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <strong className="font-semibold">Tip: </strong>{topic.tip}
      </aside>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Practice {topic.name}</h2>
        <p className="mt-1 text-slate-600">
          {freeCount} free questions{questions.length > freeCount ? `, plus ${questions.length - freeCount} premium coming soon` : ''}. Your progress is saved on this device.
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {questions.map((q) => {
            const solved = !!progress.solved[q.id]
            const premium = isPremium(q)
            const open = premium || isUnlocked(q, progress)
            return (
              <li key={q.id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-center" aria-label={premium ? 'Premium' : solved ? 'Solved' : open ? 'Open' : 'Locked'}>{premium ? '💎' : solved ? '✅' : open ? '○' : '🔒'}</span>
                {open
                  ? <Link to={`/practice/${q.id}`} className="flex-1 font-medium hover:text-emerald-700">{q.title}</Link>
                  : <span className="flex-1 text-slate-500">{q.title}</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyClass[q.difficulty]}`}>{q.difficulty}</span>
              </li>
            )
          })}
        </ul>
        <Link to={`/practice?topic=${topic.slug}`} className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800">
          Practice {topic.name}
        </Link>
      </section>

      <nav className="mt-10 flex justify-between gap-4 text-sm">
        {prev ? <Link to={`/topics/${prev.slug}`} className="inline-block py-2 text-slate-600 hover:text-slate-900">← {prev.name}</Link> : <span />}
        {next && <Link to={`/topics/${next.slug}`} className="inline-block py-2 text-slate-600 hover:text-slate-900">{next.name} →</Link>}
      </nav>
    </article>
  )
}
