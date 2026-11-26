import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { Compartment, EditorState, Prec } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { SQLite, sql } from '@codemirror/lang-sql'

interface Props {
  initialValue: string
  onChange: (value: string) => void
  onRun: () => void
  /** table name -> column names, used for autocompletion */
  schema?: Record<string, string[]>
}

const theme = EditorView.theme({
  '&': { backgroundColor: '#fff', minHeight: '220px' },
  '.cm-content': { padding: '12px 0' },
  '.cm-gutters': { backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', color: '#94a3b8' },
  '.cm-activeLine': { backgroundColor: '#f0fdf4' },
  '.cm-activeLineGutter': { backgroundColor: '#f0fdf4' },
})

/** A thin React wrapper around CodeMirror 6. Remount it (change its key) to load a different question. */
export default function SqlEditor({ initialValue, onChange, onRun, schema }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const language = useRef(new Compartment())
  const handlers = useRef({ onChange, onRun })
  handlers.current = { onChange, onRun }

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { handlers.current.onRun(); return true } }])),
          basicSetup,
          language.current.of(sql({ dialect: SQLite, upperCaseKeywords: true })),
          placeholder('SELECT …'),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' }),
          EditorView.updateListener.of((u) => { if (u.docChanged) handlers.current.onChange(u.state.doc.toString()) }),
          theme,
        ],
      }),
    })
    view.current = v
    return () => v.destroy()
    // initialValue is only read on mount by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    view.current?.dispatch({
      effects: language.current.reconfigure(sql({ dialect: SQLite, upperCaseKeywords: true, schema })),
    })
  }, [schema])

  return <div ref={host} className="h-full overflow-hidden" />
}
