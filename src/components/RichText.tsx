import { Fragment } from 'react'
import { Link } from 'react-router'

/** Renders text with [label](/path) internal links and `inline code`. */
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link) return <Link key={i} to={link[2]} className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900">{link[1]}</Link>
        if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
          return <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{part.slice(1, -1)}</code>
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
