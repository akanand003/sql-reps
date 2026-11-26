import raw from './questions.json'
import { TOPICS, type TopicSlug } from './topics'

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
  /** Reserved for the paywall. See src/lib/access.ts. */
  premium?: boolean
}

const topicOrder = TOPICS.map((t) => t.slug)

/** All questions, ordered by topic (as listed in topics.ts) and then by their order in the JSON file. */
export const QUESTIONS: Question[] = (raw.questions as Question[])
  .map((q, i) => ({ q, i }))
  .sort((a, b) => topicOrder.indexOf(a.q.topic) - topicOrder.indexOf(b.q.topic) || a.i - b.i)
  .map(({ q }) => q)

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
