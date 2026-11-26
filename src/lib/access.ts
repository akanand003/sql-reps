import { questionNumber, type Question } from '../data/questions'

/**
 * Single place that decides who can open which question.
 *
 * Questions 1 to FREE_QUESTION_LIMIT are free. Everything after that is premium,
 * as is any question marked "premium": true in questions.json.
 *
 * There is no payment system yet: premium questions show <Paywall />, which
 * collects waitlist emails (see lib/waitlist.ts). When paid plans launch, make
 * getPlan() return the user's real plan from your auth or billing provider.
 */
export const FREE_QUESTION_LIMIT = 30

export type Plan = 'free' | 'pro'

export function getPlan(): Plan {
  return 'free'
}

export function isPremium(q: Question): boolean {
  return !!q.premium || questionNumber(q) > FREE_QUESTION_LIMIT
}

export function canAccess(q: Question, plan: Plan = getPlan()): boolean {
  return plan === 'pro' || !isPremium(q)
}
