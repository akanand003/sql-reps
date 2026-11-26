import { QUESTIONS } from './questions'

/**
 * The playground database: every table used by the practice questions, built
 * from the questions' own setup SQL so there is a single source of truth.
 * The first definition of each table wins.
 */

export interface SampleColumn {
  name: string
  type: string
  note?: string
}

export interface SampleTable {
  name: string
  columns: SampleColumn[]
  rowCount: number
}

const TABLE_ORDER = ['customers', 'orders', 'order_items', 'products', 'employees']

function collectTables(): Map<string, string[]> {
  const tables = new Map<string, string[]>()
  for (const q of QUESTIONS) {
    let current: string[] | null = null
    for (const line of q.setupSql) {
      const create = line.match(/^CREATE TABLE (\w+)/i)
      if (create) {
        current = tables.has(create[1]) ? null : []
        if (current) tables.set(create[1], current)
      }
      current?.push(line)
    }
  }
  return tables
}

/** Split on commas that are not inside brackets. */
function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let buf = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { parts.push(buf.trim()); buf = '' } else buf += ch
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts
}

function describe(name: string, lines: string[]): SampleTable {
  const create = lines[0]
  const body = create.slice(create.indexOf('(') + 1, create.lastIndexOf(')'))
  const columns = splitTopLevel(body).map((def) => {
    const [col, type = ''] = def.split(/\s+/)
    const ref = def.match(/REFERENCES (\w+)\((\w+)\)/i)
    const note = /PRIMARY KEY/i.test(def) ? 'primary key' : ref ? `→ ${ref[1]}.${ref[2]}` : undefined
    return { name: col, type: type.toUpperCase(), note }
  })
  const rowCount = lines.filter((l) => /^\s*\(/.test(l)).length
  return { name, columns, rowCount }
}

const collected = collectTables()
const names = [...TABLE_ORDER.filter((n) => collected.has(n)), ...[...collected.keys()].filter((n) => !TABLE_ORDER.includes(n))]

export const SAMPLE_TABLES: SampleTable[] = names.map((n) => describe(n, collected.get(n)!))

export const SAMPLE_SETUP_SQL: string = names.map((n) => collected.get(n)!.join('\n')).join('\n')

/** Setup SQL for just the named tables, in the standard order. Used by lessons. */
export function setupSqlForTables(tables: string[]): string {
  const missing = tables.filter((t) => !collected.has(t))
  if (missing.length) throw new Error(`Unknown sample table(s): ${missing.join(', ')}`)
  return names.filter((n) => tables.includes(n)).map((n) => collected.get(n)!.join('\n')).join('\n')
}
