import type { QueryOutcome, TablePreview, WorkerRequest, WorkerResponse } from './types'

/** Queries slower than this are killed, which protects the tab from runaway recursive CTEs. */
const TIMEOUT_MS = 4000

type Pending = { resolve: (r: WorkerResponse) => void; timer: ReturnType<typeof setTimeout> }

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const p = pending.get(e.data.id)
    if (!p) return
    clearTimeout(p.timer)
    pending.delete(e.data.id)
    p.resolve(e.data)
  }
  worker.onerror = () => resetWorker('The SQL engine stopped unexpectedly. Please try again.')
  return worker
}

function resetWorker(error: string) {
  worker?.terminate()
  worker = null
  for (const [id, p] of pending) {
    clearTimeout(p.timer)
    p.resolve({ id, kind: 'fatal', error })
  }
  pending.clear()
}

type RequestBody = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id'> : never) : never

function send(req: RequestBody): Promise<WorkerResponse> {
  const id = nextId++
  return new Promise((resolve) => {
    const timer = setTimeout(
      () => resetWorker(`Your query ran for more than ${TIMEOUT_MS / 1000} seconds and was stopped. Check for a join without a condition or a recursive CTE that never ends.`),
      TIMEOUT_MS,
    )
    pending.set(id, { resolve, timer })
    getWorker().postMessage({ ...req, id } as WorkerRequest)
  })
}

export async function runSql(setupSql: string, sql: string): Promise<QueryOutcome> {
  const res = await send({ kind: 'run', setupSql, sql })
  if (res.kind === 'run') return res.outcome
  return { ok: false, error: res.kind === 'fatal' ? res.error : 'Unexpected response from the SQL engine.' }
}

export async function getTables(setupSql: string): Promise<TablePreview[]> {
  const res = await send({ kind: 'schema', setupSql })
  if (res.kind === 'schema') return res.tables
  throw new Error(res.kind === 'fatal' ? res.error : 'Could not load the tables.')
}
