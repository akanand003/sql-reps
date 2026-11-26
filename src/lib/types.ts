export type SqlValue = string | number | null

export interface QueryResult {
  columns: string[]
  rows: SqlValue[][]
  /** True when the result was cut off at MAX_ROWS. */
  truncated: boolean
}

export type QueryOutcome = { ok: true; result: QueryResult } | { ok: false; error: string }

export interface TablePreview {
  name: string
  columns: string[]
  rows: SqlValue[][]
  rowCount: number
}

export type WorkerRequest =
  | { id: number; kind: 'run'; setupSql: string; sql: string }
  | { id: number; kind: 'schema'; setupSql: string }

export type WorkerResponse =
  | { id: number; kind: 'run'; outcome: QueryOutcome }
  | { id: number; kind: 'schema'; tables: TablePreview[] }
  | { id: number; kind: 'fatal'; error: string }
