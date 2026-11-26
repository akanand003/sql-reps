import { useEffect } from 'react'
import { TOPICS, TOPIC_BY_SLUG, type TopicSlug } from '../data/topics'

export const SITE_NAME = 'SQL Reps'

export interface PageMeta {
  title: string
  description: string
  path: string
  /** Set to false for pages that should not be indexed (progress, practice drafts). */
  index?: boolean
}

export const HOME_META: PageMeta = {
  title: 'SQL Reps · Learn SQL by writing real queries',
  description: 'Learn SQL by writing real queries in your browser and getting instant feedback. Free practice from SELECT and WHERE to JOINs and window functions.',
  path: '/',
}

export const TOPICS_META: PageMeta = {
  title: 'SQL Topics: from SELECT to Window Functions | SQL Reps',
  description: 'Plain English guides to the SQL you use at work: SELECT, WHERE, ORDER BY, GROUP BY, JOINs, subqueries and window functions, each with free practice.',
  path: '/topics',
}

export function topicMeta(slug: TopicSlug): PageMeta {
  const t = TOPIC_BY_SLUG.get(slug)!
  return { title: t.seoTitle, description: t.seoDescription, path: `/topics/${t.slug}` }
}

/** Every page that is prerendered to static HTML at build time. */
export function prerenderPages(): PageMeta[] {
  return [HOME_META, TOPICS_META, ...TOPICS.map((t) => topicMeta(t.slug))]
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** The head tags for a page. Used by the prerender script; the client keeps them in sync with useMeta. */
export function headTags(meta: PageMeta, siteUrl: string): string {
  const url = siteUrl.replace(/\/$/, '') + meta.path
  const t = escapeHtml(meta.title)
  const d = escapeHtml(meta.description)
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary" />`,
    meta.index === false ? '<meta name="robots" content="noindex" />' : '',
  ].filter(Boolean).join('\n    ')
}

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) { el = create(); document.head.appendChild(el) }
  el.setAttribute(attr, value)
}

/** Keeps <title>, description, canonical and Open Graph tags in sync during client-side navigation. */
export function useMeta(meta: PageMeta) {
  useEffect(() => {
    document.title = meta.title
    const url = window.location.origin + meta.path
    const metaEl = (key: string, val: string) => () => { const m = document.createElement('meta'); m.setAttribute(key, val); return m }
    setTag('meta[name="description"]', metaEl('name', 'description'), 'content', meta.description)
    setTag('meta[property="og:title"]', metaEl('property', 'og:title'), 'content', meta.title)
    setTag('meta[property="og:description"]', metaEl('property', 'og:description'), 'content', meta.description)
    setTag('meta[property="og:url"]', metaEl('property', 'og:url'), 'content', url)
    setTag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l }, 'href', url)
    const robots = document.head.querySelector('meta[name="robots"]')
    if (meta.index === false) setTag('meta[name="robots"]', metaEl('name', 'robots'), 'content', 'noindex')
    else robots?.remove()
  }, [meta.title, meta.description, meta.path, meta.index])
}
