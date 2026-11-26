import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SAMPLE_SETUP_SQL, SAMPLE_TABLES } from '../data/sampleDatabase'
import { guardSql } from '../lib/sqlGuard'
import { runSql } from '../lib/sqlClient'
import type { QueryResult } from '../lib/types'
import ResultsTable from './ResultsTable'
import SqlEditor from './SqlEditor'

const STORAGE_KEY = 'sqlreps:playground:v1'

export const DEFAULT_PLAYGROUND_SQL = `-- Any SELECT query works. Press Run or Ctrl/⌘ + Enter.
SELECT c.name, COUNT(o.id) AS orders, SUM(o.total) AS spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY spent DESC;`

function loadSaved(): string {
  try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAYGROUND_SQL } catch { return DEFAULT_PLAYGROUND_SQL }
}

/** Editor, Run button and results for the playground. Loaded lazily, so CodeMirror and sql.js stay out of the main bundle. */
export default function PlaygroundEditor({ load }: { load: { sql: string; nonce: number } | null }) {
  const [initial] = useState(loadSaved)
  const sqlRef = useRef(initial)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [ms, setMs] = useState<number | null>(null)

  const schema = useMemo(() => Object.fromEntries(SAMPLE_TABLES.map((t) => [t.name, t.columns.map((c) => c.name)])), [])

  const onChange = useCallback((value: string) => {
    sqlRef.current = value
    try { localStorage.setItem(STORAGE_KEY, value) } catch { /* storage blocked: fine */ }
  }, [])

  const run = useCallback(async () => {
    if (running) return
    const guard = guardSql(sqlRef.current)
    if (!guard.ok) { setResult(null); setError(guard.message); return }
    setRunning(true)
    const started = performance.now()
    try {
      const out = await runSql(SAMPLE_SETUP_SQL, guard.sql)
      if (out.ok) { setResult(out.result); setError(null) } else { setResult(null); setError(out.error) }
    } finally {
      setMs(Math.round(performance.now() - started))
      setRunning(false)
    }
  }, [running])

  // A table or example click remounts the editor with that query and runs it.
  const editorValue = load?.sql ?? initial
  const runRef = useRef(run)
  runRef.current = run
  useEffect(() => {
    if (!load) return
    onChange(load.sql)
    runRef.current()
    // Only react to a new load request, identified by its nonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load?.nonce])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-64 sm:h-72">
          <SqlEditor key={load?.nonce ?? 'saved'} initialValue={editorValue} onChange={onChange} onRun={run} schema={schema} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="hidden text-xs text-slate-500 sm:inline">Ctrl/⌘ + Enter to run · read-only, resets every run</span>
          <button
            onClick={run}
            disabled={running}
            className="ml-auto rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          >
            {running ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900" role="alert">
          <p className="font-semibold">Your query did not run</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}
      {result && <ResultsTable result={result} caption={`Result${ms !== null ? ` · ${ms} ms` : ''}`} />}
      {!result && !error && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Press Run to see the result here.</p>
      )}
    </div>
  )
}
