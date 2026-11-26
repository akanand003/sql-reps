/**
 * Validates src/data/lessons.json:
 *   - every lesson topic is known, step ids are unique, and listed tables exist
 *   - each step has explain, example, task, hint and solution
 *   - the example and the solution run and return rows, and the solution passes the read-only guard
 *   - the example's result is NOT accepted as the answer (copying the example must not pass)
 *
 * Run with: npm run check:lessons
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import initSqlJs from 'sql.js'
import { runSafely } from '../src/lib/sqlEngine.ts'
import { guardSql } from '../src/lib/sqlGuard.ts'
import { checkAnswer } from '../src/lib/checkAnswer.ts'

const require = createRequire(import.meta.url)
const SQL = await initSqlJs({ locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm') })
const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const { lessons } = read('../src/data/lessons.json')
const { questions } = read('../src/data/questions.json')

// The same table definitions the app uses: first CREATE TABLE of each name in questions.json.
const tables = new Map<string, string[]>()
for (const q of questions) {
  let current: string[] | null = null
  for (const line of q.setupSql as string[]) {
    const m = line.match(/^CREATE TABLE (\w+)/i)
    if (m) { current = tables.has(m[1]) ? null : []; if (current) tables.set(m[1], current) }
    current?.push(line)
  }
}

const TOPICS = ['select', 'where', 'order-by', 'group-by', 'joins', 'subqueries', 'window-functions']
const FIELDS = ['id', 'explain', 'example', 'task', 'hint', 'solution']
const seen = new Set<string>()
let failures = 0
let steps = 0
const fail = (id: string, msg: string) => { failures++; console.error(`✗ ${id}: ${msg}`) }

for (const lesson of lessons) {
  if (!TOPICS.includes(lesson.topic)) fail(lesson.topic, 'unknown topic')
  const missingTables = (lesson.tables as string[]).filter((t) => !tables.has(t))
  if (missingTables.length) { fail(lesson.topic, `unknown tables: ${missingTables.join(', ')}`); continue }
  const setup = (lesson.tables as string[]).map((t) => tables.get(t)!.join('\n')).join('\n')
  if (lesson.steps.length < 4 || lesson.steps.length > 5) fail(lesson.topic, `has ${lesson.steps.length} steps, expected 4 to 5`)

  for (const step of lesson.steps) {
    steps++
    const id = `${lesson.topic}/${step.id ?? '?'}`
    const missing = FIELDS.filter((f) => !step[f])
    if (missing.length) { fail(id, `missing ${missing.join(', ')}`); continue }
    if (seen.has(step.id)) fail(id, 'duplicate step id')
    seen.add(step.id)

    const example = runSafely(SQL, setup, step.example)
    if (!example.ok) { fail(id, `example failed: ${example.error}`); continue }
    if (!example.result.rows.length) fail(id, 'example returns no rows')

    const guard = guardSql(step.solution)
    if (!guard.ok) { fail(id, `solution blocked by guard: ${guard.message}`); continue }
    const solution = runSafely(SQL, setup, guard.sql)
    if (!solution.ok) { fail(id, `solution failed: ${solution.error}`); continue }
    if (!solution.result.rows.length) fail(id, 'solution returns no rows')

    if (checkAnswer(example.result, solution.result, step).correct) fail(id, 'running the example would pass the task')
    console.log(`✓ ${id.padEnd(30)} ${String(solution.result.rows.length).padStart(2)} rows`)
  }
}

console.log(`\n${lessons.length} lessons, ${steps} steps, ${failures} problem(s)`)
process.exit(failures ? 1 : 0)
