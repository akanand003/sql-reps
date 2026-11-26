/**
 * Validates src/data/questions.json:
 *   - required fields and known topics / difficulties
 *   - unique ids
 *   - setup SQL runs, the solution passes the read-only guard and returns rows
 *   - questions with orderMatters really use ORDER BY
 *   - answers are deterministic. The solution is re-run with SQLite's
 *     reverse_unordered_selects pragma (catches a LIMIT without ORDER BY), and
 *     with random() added as a last tie-breaker to its outer ORDER BY (catches
 *     ties that would make the row order or a LIMIT ambiguous).
 *   - questions after the free limit are ordered easy -> medium -> hard
 *
 * Run with: npm run check:questions   (Node 22.18+ runs TypeScript directly)
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import initSqlJs from 'sql.js'
import { runSafely } from '../src/lib/sqlEngine.ts'
import { guardSql } from '../src/lib/sqlGuard.ts'

const require = createRequire(import.meta.url)
const SQL = await initSqlJs({ locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm') })
const { questions } = JSON.parse(readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'))

const TOPICS = ['select', 'where', 'order-by', 'group-by', 'joins', 'subqueries', 'window-functions']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const REQUIRED = ['id', 'topic', 'difficulty', 'title', 'question', 'hint', 'setupSql', 'solution']
const FREE_QUESTION_LIMIT = 30 // keep in sync with src/lib/access.ts
const rowKeys = (rows: unknown[][]) => rows.map((r) => JSON.stringify(r))

/** Adds ", random()" to the outermost ORDER BY (ignoring ones inside brackets, such as OVER (...)). */
function withRandomTieBreak(sql: string): string | null {
  const s = sql.replace(/;\s*$/, '')
  const upper = s.toUpperCase()
  let depth = 0
  let orderAt = -1
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "'") { i = s.indexOf("'", i + 1); if (i < 0) break; continue }
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (depth === 0 && upper.startsWith('ORDER BY', i)) orderAt = i
  }
  if (orderAt < 0) return null
  const tail = upper.slice(orderAt)
  const limit = tail.search(/\bLIMIT\b/)
  const insertAt = limit < 0 ? s.length : orderAt + limit
  return `${s.slice(0, insertAt).trimEnd()}, random() ${s.slice(insertAt)}`.trim()
}

const seen = new Set<string>()
let failures = 0
const fail = (id: string, msg: string) => { failures++; console.error(`✗ ${id}: ${msg}`) }

for (const q of questions) {
  const id = q.id ?? '(missing id)'
  const missing = REQUIRED.filter((k) => q[k] === undefined || q[k] === '')
  if (missing.length) { fail(id, `missing ${missing.join(', ')}`); continue }
  if (seen.has(q.id)) fail(id, 'duplicate id')
  seen.add(q.id)
  if (!TOPICS.includes(q.topic)) fail(id, `unknown topic "${q.topic}"`)
  if (!DIFFICULTIES.includes(q.difficulty)) fail(id, `unknown difficulty "${q.difficulty}"`)
  if (!Array.isArray(q.setupSql)) fail(id, 'setupSql must be an array of lines')

  const guard = guardSql(q.solution)
  if (!guard.ok) { fail(id, `solution blocked by guard: ${guard.message}`); continue }
  const out = runSafely(SQL, q.setupSql.join('\n'), guard.sql)
  if (!out.ok) { fail(id, `solution failed: ${out.error}`); continue }
  if (out.result.rows.length === 0) fail(id, 'solution returns no rows, so any empty query would pass')
  if (q.orderMatters && !/order\s+by/i.test(q.solution.replace(/over\s*\([^)]*\)/gi, ''))) fail(id, 'orderMatters is set but the solution has no ORDER BY')

  const reversed = runSafely(SQL, q.setupSql.join('\n') + '\nPRAGMA reverse_unordered_selects = ON;', guard.sql)
  if (!reversed.ok) fail(id, `solution failed with reversed scan order: ${reversed.error}`)
  else {
    const a = rowKeys(out.result.rows)
    const b = rowKeys(reversed.result.rows)
    if (q.orderMatters && a.join('\n') !== b.join('\n')) fail(id, 'row order depends on ties. Add a tie-breaker to ORDER BY')
    if ([...a].sort().join('\n') !== [...b].sort().join('\n')) fail(id, 'result rows change with scan order (a LIMIT without a full ORDER BY picks arbitrary rows)')
  }

  const shuffled = withRandomTieBreak(guard.sql)
  if (shuffled) {
    const base = rowKeys(out.result.rows)
    for (let run = 0; run < 25; run++) {
      const r = runSafely(SQL, q.setupSql.join('\n'), shuffled)
      if (!r.ok) { fail(id, `tie-break test failed to run: ${r.error}`); break }
      const k = rowKeys(r.result.rows)
      if (q.orderMatters && k.join('\n') !== base.join('\n')) { fail(id, 'ORDER BY has ties, so the expected row order is ambiguous. Add a tie-breaker'); break }
      if ([...k].sort().join('\n') !== [...base].sort().join('\n')) { fail(id, 'ties at the LIMIT boundary make the expected rows ambiguous'); break }
    }
  }

  console.log(`✓ ${id.padEnd(28)} ${String(out.result.rows.length).padStart(2)} rows × ${out.result.columns.length} cols`)
}

const rank: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
const premium = questions.slice(FREE_QUESTION_LIMIT)
premium.forEach((q: { id: string; difficulty: string }, i: number) => {
  if (i > 0 && rank[q.difficulty] < rank[premium[i - 1].difficulty]) fail(q.id, `premium questions must go easy -> medium -> hard, but this ${q.difficulty} question follows a ${premium[i - 1].difficulty} one`)
})

console.log(`\n${questions.length} questions (${Math.min(questions.length, FREE_QUESTION_LIMIT)} free, ${premium.length} premium), ${failures} problem(s)`)
process.exit(failures ? 1 : 0)
