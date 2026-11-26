import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { currentStreak, useProgress } from '../lib/progress'
import { TOPICS } from '../data/topics'
import { LANDING_PAGES } from '../data/landingPages'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2 py-1.5 text-sm sm:px-3 font-medium transition ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`

export default function Layout({ children }: { children: ReactNode }) {
  const progress = useProgress()
  const streak = currentStreak(progress)
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="fixed left-3 top-3 z-50 -translate-y-24 rounded-lg bg-white px-4 py-2 font-medium text-emerald-800 shadow-lg ring-1 ring-slate-200 focus:translate-y-0">Skip to content</a>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link to="/" className="mr-auto flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-700 font-mono text-[10px] font-bold text-white">SQL</span>
            <span className="hidden min-[440px]:inline">SQL Reps</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/topics" className={navClass}>Topics</NavLink>
            <NavLink to="/practice" className={navClass}>Practice</NavLink>
            <NavLink to="/sql-playground" className={navClass}>Playground</NavLink>
            <NavLink to="/progress" className={navClass}>
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden" aria-label="Progress">📈</span>
              {streak > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">🔥 {streak}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <Link to="/" className="inline-block py-1 font-semibold text-slate-900">SQL Reps</Link>
            <p className="mt-2 text-slate-500">Every query runs in your browser. Nothing is sent to a server.</p>
            <ul className="mt-3 space-y-1.5">
              <li><Link to="/practice" className="inline-block py-0.5 text-slate-600 hover:text-slate-900">Practice</Link></li>
              <li><Link to="/sql-playground" className="inline-block py-0.5 text-slate-600 hover:text-slate-900">SQL playground</Link></li>
              <li><Link to="/progress" className="inline-block py-0.5 text-slate-600 hover:text-slate-900">Your progress</Link></li>
            </ul>
          </div>
          <nav aria-label="SQL topics">
            <h2 className="font-semibold text-slate-900"><Link to="/topics" className="inline-block py-1">SQL topics</Link></h2>
            <ul className="mt-3 space-y-1.5">
              {TOPICS.map((t) => (
                <li key={t.slug}><Link to={`/topics/${t.slug}`} className="inline-block py-0.5 text-slate-600 hover:text-slate-900">{t.name}</Link></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="SQL guides">
            <h2 className="font-semibold text-slate-900">SQL guides</h2>
            <ul className="mt-3 space-y-1.5">
              {LANDING_PAGES.map((p) => (
                <li key={p.slug}><Link to={`/${p.slug}`} className="inline-block py-0.5 text-slate-600 hover:text-slate-900">{p.name}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  )
}
