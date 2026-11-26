import raw from './lessons.json'
import type { TopicSlug } from './topics'

/**
 * Guided "teach then do" lessons. Content lives in lessons.json.
 * Each step: one sentence (explain), a worked example, then a small task
 * checked against the solution with the same engine as practice questions.
 */
export interface LessonStep {
  id: string
  explain: string
  example: string
  task: string
  hint: string
  solution: string
  orderMatters?: boolean
  ignoreColumnOrder?: boolean
}

export interface Lesson {
  topic: TopicSlug
  title: string
  intro: string
  /** Sample tables to load, by name (see data/sampleDatabase.ts). */
  tables: string[]
  steps: LessonStep[]
}

export const LESSONS: Lesson[] = raw.lessons as Lesson[]

export const LESSON_BY_TOPIC = new Map(LESSONS.map((l) => [l.topic, l]))

export function lessonPath(topic: TopicSlug): string {
  return `/lessons/${topic}`
}
