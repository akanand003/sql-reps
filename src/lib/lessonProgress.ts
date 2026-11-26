/** Lesson progress, saved in this browser only (no accounts). */
const STORAGE_KEY = 'sqlreps:lessons:v1'

export interface LessonState {
  /** Index of the step the learner is on. Equal to the step count when finished. */
  step: number
  solved: string[]
  skipped: string[]
}

const EMPTY: LessonState = { step: 0, solved: [], skipped: [] }

function readAll(): Record<string, LessonState> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function loadLesson(topic: string): LessonState {
  const saved = readAll()[topic]
  return saved ? { ...EMPTY, ...saved } : EMPTY
}

export function saveLesson(topic: string, state: LessonState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [topic]: state }))
  } catch {
    /* storage blocked: progress just won't persist */
  }
}
