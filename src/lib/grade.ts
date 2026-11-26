import { checkAnswer, type CheckOptions } from './checkAnswer'
import { runSql } from './sqlClient'
import { guardSql } from './sqlGuard'
import type { QueryResult } from './types'

export type Grade =
  | { kind: 'correct'; result: QueryResult }
  | { kind: 'wrong'; message: string; result: QueryResult }
  | { kind: 'error'; message: string }

/**
 * Runs the user's query and the reference solution on fresh copies of the
 * sample data, then compares them with the same rules as practice questions.
 * Never throws.
 */
export async function gradeQuery(setupSql: string, userSql: string, solution: string, opts: CheckOptions = {}): Promise<Grade> {
  const guard = guardSql(userSql)
  if (!guard.ok) return { kind: 'error', message: guard.message }
  try {
    const user = await runSql(setupSql, guard.sql)
    if (!user.ok) return { kind: 'error', message: user.error }
    const expected = await runSql(setupSql, solution)
    if (!expected.ok) return { kind: 'error', message: `Your query ran, but this step could not be checked (${expected.error}).` }
    const check = checkAnswer(user.result, expected.result, opts)
    return check.correct ? { kind: 'correct', result: user.result } : { kind: 'wrong', message: check.reason, result: user.result }
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }
  }
}
