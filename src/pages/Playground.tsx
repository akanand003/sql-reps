import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { SAMPLE_TABLES } from '../data/sampleDatabase'
import { PLAYGROUND_META, useMeta } from '../lib/seo'

const PlaygroundEditor = lazy(() => import('../components/PlaygroundEditor'))

const EXAMPLES: { label: string; sql: string }[] = [
  { label: 'Best-selling products', sql: 'SELECT p.name, SUM(oi.quantity) AS units_sold\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nGROUP BY p.id, p.name\nORDER BY units_sold DESC;' },
  { label: 'Revenue by month', sql: "SELECT substr(order_date, 1, 7) AS month, COUNT(*) AS orders, SUM(total) AS revenue\nFROM orders\nWHERE status != 'cancelled'\nGROUP BY month\nORDER BY month;" },
  { label: 'Salary rank per team', sql: 'SELECT department, name, salary,\n  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS team_rank\nFROM employees\nORDER BY department, team_rank;' },
  { label: 'Employees and managers', sql: 'SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON m.id = e.manager_id;' },
]

/** Static shell (SEO text and schema) is prerendered; the editor loads on the client. */
export default function Playground() {
  useMeta(PLAYGROUND_META)
  const [load, setLoad] = useState<{ sql: string; nonce: number } | null>(null)
  // The editor needs the browser (CodeMirror, Web Worker, localStorage), so it is
  // only mounted after hydration. Server and first client render show the placeholder.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const placeholder = <div className="grid h-72 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading the SQL editor…</div>
  const open = (sql: string) => setLoad((prev) => ({ sql, nonce: (prev?.nonce ?? 0) + 1 }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">SQL playground</h1>
      <p className="mt-2 max-w-3xl text-lg text-slate-600">
        Run any SELECT query against a sample company database, right in your browser. Free, no sign-up, nothing to install.
        Want guided questions instead? Try the <Link to="/practice" className="font-medium text-emerald-700 underline underline-offset-2">practice questions</Link>.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Tables</h2>
            <p className="mt-1 text-sm text-slate-500">Click a table name to preview its rows.</p>
            <ul className="mt-4 space-y-4">
              {SAMPLE_TABLES.map((t) => (
                <li key={t.name}>
                  <button
                    onClick={() => open(`SELECT *\nFROM ${t.name}\nLIMIT 20;`)}
                    className="font-mono text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    {t.name}
                  </button>
                  <span className="ml-2 text-xs text-slate-500">{t.rowCount} rows</span>
                  <ul className="mt-1.5 space-y-0.5 border-l border-slate-200 pl-3">
                    {t.columns.map((c) => (
                      <li key={c.name} className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
                        <span className="text-slate-800">{c.name}</span>
                        <span className="text-slate-500">{c.type}</span>
                        {c.note && <span className="text-slate-500">{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Try an example</h2>
            <ul className="mt-3 space-y-1.5">
              {EXAMPLES.map((ex) => (
                <li key={ex.label}>
                  <button onClick={() => open(ex.sql)} className="text-left text-sm text-slate-700 hover:text-emerald-700">→ {ex.label}</button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="order-first lg:order-last" aria-label="SQL editor and results">
          {mounted ? (
            <Suspense fallback={placeholder}>
              <PlaygroundEditor load={load} />
            </Suspense>
          ) : placeholder}
        </section>
      </div>

      <section className="mt-12 max-w-3xl space-y-3 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">About this SQL playground</h2>
        <p>
          The playground runs SQLite compiled to WebAssembly inside your browser tab, so your queries never leave your device.
          Each run starts from a fresh copy of the sample data, so you cannot break anything. Only read queries (SELECT and WITH) are allowed.
        </p>
        <p>
          New to SQL? Start with <Link to="/sql-for-beginners" className="font-medium text-emerald-700 underline underline-offset-2">SQL for beginners</Link>,
          keep the <Link to="/sql-cheat-sheet" className="font-medium text-emerald-700 underline underline-offset-2">SQL cheat sheet</Link> open,
          or browse the <Link to="/topics" className="font-medium text-emerald-700 underline underline-offset-2">topic guides</Link>.
        </p>
      </section>
    </div>
  )
}
