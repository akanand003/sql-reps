/** A dark code box. `wrap` breaks long lines instead of scrolling sideways (used in lessons, where every word matters). */
export default function CodeBlock({ code, wrap = false }: { code: string; wrap?: boolean }) {
  return (
    <pre className={`rounded-lg bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100 ${wrap ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto'}`}>
      <code>{code}</code>
    </pre>
  )
}
