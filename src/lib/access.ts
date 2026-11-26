import type { Question } from '../data/questions'

/**
 * Single place that decides who can open which question.
 *
 * Today everything is free. To add a paywall later:
 *   1. mark questions with "premium": true in questions.json (or rely on FREE_QUESTION_LIMIT),
 *   2. make getPlan() read the real plan (for example from your auth or billing provider),
 *   3. the Practice page already shows <Paywall /> whenever canAccess() returns false.
 */
export const FREE_QUESTION_LIMIT = 30

export type Plan = 'free' | 'pro'

export function getPlan(): Plan {
  return 'free'
}

export function canAccess(q: Question, questionNumber: number, plan: Plan = getPlan()): boolean {
  if (plan === 'pro') return true
  return !q.premium && questionNumber <= FREE_QUESTION_LIMIT
}
