import { Link } from 'react-router'
import { LANDING_PAGES, type Block, type LandingPage } from '../data/landingPages'
import { landingMeta, useMeta } from '../lib/seo'
import CodeBlock from '../components/CodeBlock'
import RichText from '../components/RichText'

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return <p className="leading-relaxed text-slate-700"><RichText text={block.text} /></p>
    case 'h2':
      return <h2 className="pt-4 text-2xl font-semibold tracking-tight">{block.text}</h2>
    case 'h3':
      return <h3 className="pt-2 text-lg font-semibold">{block.text}</h3>
    case 'code':
      return <CodeBlock code={block.sql} />
    case 'ul':
      return (
        <ul className="list-disc space-y-2 pl-6 leading-relaxed text-slate-700">
          {block.items.map((item) => <li key={item}><RichText text={item} /></li>)}
        </ul>
      )
    case 'faq':
      return (
        <div className="space-y-6">
          {block.items.map((item) => (
            <section key={item.q} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold">{item.q}</h3>
              <p className="mt-2 leading-relaxed text-slate-700"><RichText text={item.a} /></p>
              {item.code && <div className="mt-3"><CodeBlock code={item.code} /></div>}
            </section>
          ))}
        </div>
      )
  }
}

export default function Landing({ page }: { page: LandingPage }) {
  useMeta(landingMeta(page))
  const others = LANDING_PAGES.filter((p) => p.slug !== page.slug)
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.h1}</h1>
      <div className="mt-6 space-y-5 text-lg">
        {page.blocks.map((block, i) => <BlockView key={i} block={block} />)}
      </div>

      <section className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h2 className="text-xl font-semibold">Ready to write some SQL?</h2>
        <p className="mt-1 text-slate-600">Free, in your browser, with instant feedback. No sign-up.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to={page.cta.practice} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700">Start practicing</Link>
          <Link to={page.cta.topic} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:border-slate-400">{page.cta.topicLabel}</Link>
        </div>
      </section>

      <nav className="mt-10" aria-label="More SQL guides">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">More SQL guides</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((p) => (
            <li key={p.slug}>
              <Link to={`/${p.slug}`} className="block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-400">{p.name}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  )
}
