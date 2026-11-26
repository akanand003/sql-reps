import type { QueryResult } from '../lib/types'

export default function ResultsTable({ result, caption }: { result: QueryResult; caption?: string }) {
  if (result.columns.length === 0) {
    return <p className="text-sm text-slate-500">The query ran but returned no columns.</p>
  }
  return (
    <div>
      {caption && <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{caption}</p>}
      <div className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-100 text-slate-700">
            <tr>
              {result.columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.rows.map((row, r) => (
              <tr key={r} className="hover:bg-slate-50">
                {row.map((v, c) => (
                  <td key={c} className={`whitespace-nowrap px-3 py-1.5 font-mono text-xs ${typeof v === 'number' ? 'text-right tabular-nums' : ''}`}>
                    {v === null ? <span className="italic text-slate-400">NULL</span> : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {result.rows.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No rows returned.</p>}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
        {result.truncated && ' (showing the first rows only)'}
      </p>
    </div>
  )
}
