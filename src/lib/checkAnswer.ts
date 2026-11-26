import type { QueryResult, SqlValue } from './types'

export interface CheckOptions {
  /** Compare rows in sequence (the question asks for ORDER BY). */
  orderMatters?: boolean
  /** Accept the right columns in any order. */
  ignoreColumnOrder?: boolean
}

export type CheckResult =
  | { correct: true }
  | { correct: false; reason: string }

/** Round floats so 33.333333 and 33.33333333 compare equal; keep integers exact. */
function normalize(v: SqlValue): string {
  if (v === null) return 'null'
  if (typeof v === 'number') return Number.isInteger(v) ? `n:${v}` : `n:${Math.round(v * 100) / 100}`
  // Numeric strings like "42" compare equal to 42, which avoids surprises from CAST.
  if (v.trim() !== '' && !Number.isNaN(Number(v))) return normalize(Number(v))
  return `s:${v}`
}

function rowKey(row: SqlValue[], ignoreColumnOrder: boolean): string {
  const cells = row.map(normalize)
  if (ignoreColumnOrder) cells.sort()
  return JSON.stringify(cells)
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function checkAnswer(user: QueryResult, expected: QueryResult, opts: CheckOptions = {}): CheckResult {
  if (user.columns.length !== expected.columns.length) {
    return {
      correct: false,
      reason: `Your result has ${plural(user.columns.length, 'column')}, but the answer has ${expected.columns.length}. Check which columns you SELECT.`,
    }
  }
  if (user.rows.length !== expected.rows.length) {
    return {
      correct: false,
      reason: `Your result has ${plural(user.rows.length, 'row')}, but the answer has ${expected.rows.length}. Check your filters, joins or grouping.`,
    }
  }

  const ignoreCols = !!opts.ignoreColumnOrder
  const userKeys = user.rows.map((r) => rowKey(r, ignoreCols))
  const expKeys = expected.rows.map((r) => rowKey(r, ignoreCols))

  if (opts.orderMatters) {
    const sameSet = [...userKeys].sort().join('|') === [...expKeys].sort().join('|')
    if (userKeys.every((k, i) => k === expKeys[i])) return { correct: true }
    return {
      correct: false,
      reason: sameSet
        ? 'You have the right rows, but in the wrong order. Check your ORDER BY.'
        : 'Some values in your result do not match the answer.',
    }
  }

  userKeys.sort()
  expKeys.sort()
  if (userKeys.every((k, i) => k === expKeys[i])) return { correct: true }
  return {
    correct: false,
    reason: ignoreCols
      ? 'Some values in your result do not match the answer.'
      : 'Some values do not match. If the numbers look right, check that your columns are in the order the question asks for.',
  }
}
