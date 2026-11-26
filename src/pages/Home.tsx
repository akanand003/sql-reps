import { Link } from 'react-router'
import { TOPICS } from '../data/topics'
import { QUESTIONS, questionsForTopic } from '../data/questions'
import { FREE_QUESTION_LIMIT } from '../lib/access'
import { HOME_META, useMeta } from '../lib/seo'
import CodeBlock from '../components/CodeBlock'

export default function Home() {
  useMeta(HOME_META)
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="min-w-0">
            <p className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Free · No sign-up · Runs in your browser</p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Learn SQL one rep at a time.</h1>
            <p className="mt-4 max-w-md text-lg text-slate-600">
              Write real queries against real business data and get instant feedback. {QUESTIONS.length} bite-sized questions ({FREE_QUESTION_LIMIT} of them free), from your first SELECT to window functions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/practice" className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800">Start practicing</Link>
              <Link to="/topics" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400">Browse topics</Link>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <CodeBlock code={"SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.name;"} />
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              <span aria-hidden>✓</span> Correct! Next question unlocked.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight">What you will practice</h2>
        <p className="mt-1 text-slate-600">Each topic has a short plain English guide, then hands-on questions that build on each other.</p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t, i) => (
            <li key={t.slug}>
              <Link to={`/topics/${t.slug}`} className="group flex h-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-400 hover:shadow-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 group-hover:bg-emerald-700 group-hover:text-white">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-sm text-slate-600">{t.tagline} · {questionsForTopic(t.slug).length} questions</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            ['Real queries', 'A real SQLite database runs in your browser. You write the SQL, it runs, you see the rows.'],
            ['Instant feedback', 'Your result is checked against the correct answer straight away, with a hint if you get stuck.'],
            ['Builds a habit', 'Short questions, a daily streak, and progress saved on your device.'],
          ].map(([title, body]) => (
            <div key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
