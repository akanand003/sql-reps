/// <reference lib="webworker" />
import initSqlJs, { type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { describeTables, runSafely } from './sqlEngine'
import type { WorkerRequest, WorkerResponse } from './types'

let sqlPromise: Promise<SqlJsStatic> | null = null
function getSql() {
  sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl })
  return sqlPromise
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data
  let res: WorkerResponse
  try {
    const SQL = await getSql()
    res = req.kind === 'run'
      ? { id: req.id, kind: 'run', outcome: runSafely(SQL, req.setupSql, req.sql) }
      : { id: req.id, kind: 'schema', tables: describeTables(SQL, req.setupSql) }
  } catch (e) {
    res = { id: req.id, kind: 'fatal', error: e instanceof Error ? e.message : String(e) }
  }
  ;(self as DedicatedWorkerGlobalScope).postMessage(res)
}
