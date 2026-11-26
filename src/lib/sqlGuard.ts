/**
 * Read-only guard for user SQL.
 *
 * Every query already runs against a throwaway in-memory database, so nothing
 * can reach real data. The guard is a second layer: it keeps practice queries
 * to a single read-only statement and turns anything else into a friendly message.
 */

const BLOCKED_KEYWORDS = [
  'ATTACH', 'DETACH', 'PRAGMA', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
  'ALTER', 'REPLACE', 'VACUUM', 'REINDEX', 'TRUNCATE', 'BEGIN', 'COMMIT',
  'ROLLBACK', 'SAVEPOINT', 'RELEASE', 'ANALYZE', 'LOAD_EXTENSION',
]

export type GuardResult = { ok: true; sql: string } | { ok: false; message: string }

/** Replace string literals, quoted identifiers and comments with spaces so keyword checks ignore them. */
export function stripLiteralsAndComments(sql: string): string {
  let out = ''
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]
    const next = sql[i + 1]
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') { out += ' '; i++ }
    } else if (ch === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2)
      const stop = end === -1 ? sql.length : end + 2
      out += ' '.repeat(stop - i); i = stop
    } else if (ch === "'" || ch === '"' || ch === '`' || ch === '[') {
      const close = ch === '[' ? ']' : ch
      out += ' '; i++
      while (i < sql.length) {
        if (sql[i] === close) {
          if (close !== ']' && sql[i + 1] === close) { out += '  '; i += 2; continue }
          out += ' '; i++; break
        }
        out += ' '; i++
      }
    } else {
      out += ch; i++
    }
  }
  return out
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

export function guardSql(raw: string): GuardResult {
  const sql = raw.trim()
  const bare = stripLiteralsAndComments(sql).trim()
  if (!bare) return { ok: false, message: 'Write a query first, then press Run.' }

  // Allow one trailing semicolon, but not a second statement.
  const withoutTrailing = bare.replace(/;\s*$/, '')
  if (withoutTrailing.includes(';')) {
    return { ok: false, message: 'Run one query at a time. Remove the extra statement after the semicolon.' }
  }

  const firstWord = withoutTrailing.split(/[\s(]+/)[0].toUpperCase()
  if (firstWord !== 'SELECT' && firstWord !== 'WITH' && !withoutTrailing.startsWith('(')) {
    if (BLOCKED_KEYWORDS.includes(firstWord)) {
      return {
        ok: false,
        message: `Practice queries only read data, so they start with SELECT or WITH. ${firstWord} statements are switched off here.`,
      }
    }
    const suggestion = ['SELECT', 'WITH'].find((k) => editDistance(firstWord, k) <= 2)
    return {
      ok: false,
      message: suggestion
        ? `Syntax error near "${firstWord}". Did you mean ${suggestion}?`
        : `Syntax error near "${firstWord}". A query starts with SELECT (or WITH for a CTE).`,
    }
  }

  const upper = withoutTrailing.toUpperCase()
  for (const word of BLOCKED_KEYWORDS) {
    if (new RegExp(`\\b${word}\\b`).test(upper)) {
      return { ok: false, message: `"${word}" is not allowed here. The practice tables are read-only.` }
    }
  }

  return { ok: true, sql: sql.replace(/;\s*$/, '') }
}
