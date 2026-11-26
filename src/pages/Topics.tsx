import { Link } from 'react-router'
import { TOPICS } from '../data/topics'
import { questionsForTopic } from '../data/questions'
import { TOPICS_META, useMeta } from '../lib/seo'

export default function Topics() {
  useMeta(TOPICS_META)
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">SQL topics</h1>
      <p className="mt-2 text-slate-600">Work through them in order. Each one builds on the last.</p>
      <ol className="mt-8 space-y-3">
        {TOPICS.map((t, i) => (
          <li key={t.slug}>
            <Link to={`/topics/${t.slug}`} className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic {i + 1} · {questionsForTopic(t.slug).length} questions</span>
              <span className="mt-1 block text-lg font-semibold">{t.name}</span>
              <span className="mt-1 block text-sm text-slate-600">{t.intro[0]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
