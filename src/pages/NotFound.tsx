import { Link } from 'react-router'
import { LANDING_PAGES } from '../data/landingPages'
import { TOPICS } from '../data/topics'
import { NOT_FOUND_META, useMeta } from '../lib/seo'

export default function NotFound() {
  useMeta(NOT_FOUND_META)
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <p className="font-mono text-sm text-slate-600">SELECT * FROM pages WHERE url = 'this one';</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">0 rows returned</h1>
        <p className="mt-3 text-lg text-slate-600">We could not find that page. It may have moved, or the link has a typo.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/practice" className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">Start practicing</Link>
          <Link to="/sql-playground" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:border-slate-400">Open the SQL playground</Link>
          <Link to="/" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:border-slate-400">Go home</Link>
        </div>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-2">
        <nav aria-label="SQL topics">
          <h2 className="font-semibold">SQL topics</h2>
          <ul className="mt-3 space-y-1.5">
            {TOPICS.map((t) => (
              <li key={t.slug}><Link to={`/topics/${t.slug}`} className="text-emerald-800 hover:underline">{t.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="SQL guides">
          <h2 className="font-semibold">SQL guides</h2>
          <ul className="mt-3 space-y-1.5">
            {LANDING_PAGES.map((p) => (
              <li key={p.slug}><Link to={`/${p.slug}`} className="text-emerald-800 hover:underline">{p.name}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
