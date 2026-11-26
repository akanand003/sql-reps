import { useState } from 'react'
import type { TablePreview } from '../lib/types'
import ResultsTable from './ResultsTable'

export default function SchemaPreview({ tables }: { tables: TablePreview[] | null }) {
  const [active, setActive] = useState(0)
  if (!tables) return <p className="text-sm text-slate-500">Loading tables…</p>
  const t = tables[Math.min(active, tables.length - 1)]
  if (!t) return null
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
        {tables.map((tbl, i) => (
          <button
            key={tbl.name}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${i === active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            {tbl.name} <span className="text-slate-400">({tbl.rowCount})</span>
          </button>
        ))}
      </div>
      <ResultsTable result={{ columns: t.columns, rows: t.rows, truncated: t.rows.length < t.rowCount }} />
    </div>
  )
}
