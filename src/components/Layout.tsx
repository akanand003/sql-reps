import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { currentStreak, useProgress } from '../lib/progress'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'}`

export default function Layout({ children }: { children: ReactNode }) {
  const progress = useProgress()
  const streak = currentStreak(progress)
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link to="/" className="mr-auto flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 font-mono text-[10px] font-bold text-white">SQL</span>
            <span>SQL Reps</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/topics" className={navClass}>Topics</NavLink>
            <NavLink to="/practice" className={navClass}>Practice</NavLink>
            <NavLink to="/progress" className={navClass}>
              <span className="hidden sm:inline">Progress</span>
              <span className="sm:hidden" aria-label="Progress">📈</span>
              {streak > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">🔥 {streak}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>SQL Reps · Every query runs in your browser. Nothing is sent to a server.</p>
          <Link to="/topics" className="hover:text-slate-800">All SQL topics</Link>
        </div>
      </footer>
    </div>
  )
}
