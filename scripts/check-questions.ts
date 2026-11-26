/**
 * Validates src/data/questions.json:
 *   - required fields and known topics / difficulties
 *   - unique ids
 *   - setup SQL runs, the solution passes the read-only guard and returns rows
 *   - questions with orderMatters really use ORDER BY
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

  console.log(`✓ ${id.padEnd(28)} ${String(out.result.rows.length).padStart(2)} rows × ${out.result.columns.length} cols`)
}

console.log(`\n${questions.length} questions, ${failures} problem(s)`)
process.exit(failures ? 1 : 0)
