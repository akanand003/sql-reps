import type { Database, SqlJsStatic } from 'sql.js'
import type { QueryOutcome, QueryResult, SqlValue, TablePreview } from './types'

/** Hard cap on rows returned to the UI, so a huge cross join cannot freeze the page. */
export const MAX_ROWS = 500

/**
 * Pure sql.js helpers shared by the browser worker and the Node question checker.
 * Each call opens a brand new in-memory database, runs the setup, then throws it away.
 */
export function withFreshDb<T>(SQL: SqlJsStatic, setupSql: string, fn: (db: Database) => T): T {
  const db = new SQL.Database()
  try {
    db.exec(setupSql)
    return fn(db)
  } finally {
    db.close()
  }
}

function toSqlValue(v: unknown): SqlValue {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' || typeof v === 'string') return v
  if (typeof v === 'bigint') return Number(v)
  if (v instanceof Uint8Array) return `<blob ${v.length} bytes>`
  return String(v)
}

export function runQuery(db: Database, sql: string): QueryResult {
  const stmt = db.prepare(sql)
  try {
    const columns = stmt.getColumnNames()
    const rows: SqlValue[][] = []
    let truncated = false
    while (stmt.step()) {
      if (rows.length >= MAX_ROWS) { truncated = true; break }
      rows.push(stmt.get().map(toSqlValue))
    }
    return { columns, rows, truncated }
  } finally {
    stmt.free()
  }
}

/** Turn raw SQLite errors into something a beginner can act on. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  let m: RegExpMatchArray | null
  if ((m = msg.match(/no such table: (\S+)/))) return `There is no table called "${m[1]}". Check the Tables panel for the exact names.`
  if ((m = msg.match(/no such column: (\S+)/))) return `There is no column called "${m[1]}". Check the spelling, or which table it belongs to.`
  if ((m = msg.match(/near "([^"]*)": syntax error/))) return `Syntax error near "${m[1]}". Look for a typo, a missing comma, or a keyword in the wrong place.`
  if (/incomplete input/.test(msg)) return 'The query ends too early. Is something missing at the end, like a closing bracket?'
  if ((m = msg.match(/ambiguous column name: (\S+)/))) return `"${m[1]}" exists in more than one table. Prefix it with the table name or alias, like o.${m[1].split('.').pop()}.`
  if (/misuse of aggregate/.test(msg)) return `${msg}. Aggregates like SUM or COUNT go in SELECT or HAVING, not WHERE.`
  if (/misuse of window function/.test(msg)) return `${msg}. Window functions cannot be used in WHERE. Wrap the query in a subquery or CTE and filter outside it.`
  return msg.charAt(0).toUpperCase() + msg.slice(1)
}

export function runSafely(SQL: SqlJsStatic, setupSql: string, sql: string): QueryOutcome {
  try {
    return withFreshDb(SQL, setupSql, (db) => ({ ok: true, result: runQuery(db, sql) }))
  } catch (e) {
    return { ok: false, error: friendlyError(e) }
  }
}

export function describeTables(SQL: SqlJsStatic, setupSql: string): TablePreview[] {
  return withFreshDb(SQL, setupSql, (db) => {
    const names = runQuery(db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").rows.map((r) => String(r[0]))
    return names.map((name) => {
      const quoted = `"${name.replace(/"/g, '""')}"`
      const preview = runQuery(db, `SELECT * FROM ${quoted} LIMIT 50`)
      const count = Number(runQuery(db, `SELECT COUNT(*) FROM ${quoted}`).rows[0][0])
      return { name, columns: preview.columns, rows: preview.rows, rowCount: count }
    })
  })
}
