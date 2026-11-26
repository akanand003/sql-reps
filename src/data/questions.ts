import raw from './questions.json'
import type { TopicSlug } from './topics'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  topic: TopicSlug
  difficulty: Difficulty
  title: string
  question: string
  hint: string
  /** SQL that creates and fills the sample tables. A list of lines, joined with newlines. */
  setupSql: string[]
  /** The reference answer. The user's result is compared against this query's result. */
  solution: string
  /** Rows must come back in the same order (the question asks for ORDER BY). */
  orderMatters?: boolean
  /** Columns may come back in any order. */
  ignoreColumnOrder?: boolean
  /** Force a question to be premium even inside the free range. See src/lib/access.ts. */
  premium?: boolean
}

/**
 * All questions in file order. The order is the learning path and also sets the
 * question numbers: 1 to 30 are free, 31 onwards are premium (see lib/access.ts).
 */
export const QUESTIONS: Question[] = raw.questions as Question[]

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

export function setupSqlOf(q: Question): string {
  return q.setupSql.join('\n')
}

export function questionsForTopic(slug: TopicSlug): Question[] {
  return QUESTIONS.filter((q) => q.topic === slug)
}

export function questionNumber(q: Question): number {
  return QUESTIONS.indexOf(q) + 1
}

export function nextQuestion(q: Question): Question | undefined {
  return QUESTIONS[QUESTIONS.indexOf(q) + 1]
}
