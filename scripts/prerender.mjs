/**
 * Build step: turns the SPA shell into real HTML pages for search engines.
 *
 * For every page in prerenderPages() it renders the React tree to HTML, injects the
 * page's own <title>, meta description and canonical URL, and writes
 * dist/<path>.html (for example dist/topics/joins.html). It also writes
 * dist/sitemap.xml.
 *
 * Flat .html files (not <path>/index.html folders) matter on Cloudflare Pages:
 * it serves topics/joins.html at /topics/joins with no redirect, so the URL
 * matches our links, canonical tags and sitemap exactly.
 *
 * Canonical links and the sitemap use SITE_URL if it is set, otherwise
 * DEFAULT_SITE_URL. Host-provided URLs such as CF_PAGES_URL are ignored on
 * purpose: they change with every deploy.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')
const DEFAULT_SITE_URL = 'https://sql-reps.pages.dev'
const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')

const { render, prerenderPages, headTags, SHELL_META, NOT_FOUND_META, LESSONS } = await import(join(ssrDir, 'entry-server.js'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')
if (!template.includes('<!--app-html-->') || !template.includes('<!--app-head-->')) {
  throw new Error('dist/index.html is missing the <!--app-head--> or <!--app-html--> markers')
}

/**
 * Optional Cloudflare Web Analytics (cookieless, free). Only needed when the
 * site is NOT using Cloudflare Pages' one-click analytics, which injects the
 * script itself. Set CF_BEACON_TOKEN to the token from the Web Analytics
 * dashboard. Leave it unset on Cloudflare Pages to avoid counting visits twice.
 */
const beaconToken = (process.env.CF_BEACON_TOKEN || '').trim()
if (beaconToken && !/^[a-f0-9]{32}$/i.test(beaconToken)) {
  throw new Error('CF_BEACON_TOKEN should be the 32-character token from Cloudflare Web Analytics')
}
const beacon = beaconToken
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${beaconToken}"}'></script>`
  : ''

/** Builds a full HTML page from the template. */
function page(meta, bodyHtml, prerenderedPath) {
  const rootOpen = prerenderedPath ? `<div id="root" data-prerendered="${prerenderedPath}">` : '<div id="root">'
  return template
    .replace(/<!--app-head-->[\s\S]*?<!--\/app-head-->/, headTags(meta, siteUrl))
    .replace('<div id="root"><!--app-html-->', rootOpen + bodyHtml)
    .replace('</body>', beacon ? `  ${beacon}\n  </body>` : '</body>')
}

function write(relPath, html) {
  const file = join(dist, relPath)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const pages = prerenderPages()
for (const p of pages) {
  write(p.path === '/' ? 'index.html' : `${p.path.slice(1)}.html`, page(p, render(p.path), p.path))
  console.log(`prerendered ${p.path}`)
}

// The SPA shell for client-only routes (/practice/..., /progress). It carries
// generic social tags (no canonical) so shared links still get a preview.
const shell = page(SHELL_META, '', null)
// practice.html also serves every /practice/<id> URL through the rewrite in
// public/_redirects (Cloudflare) or vercel.json (Vercel).
for (const route of ['practice', 'progress']) write(`${route}.html`, shell)
// Guided lessons are client-only too (not in the sitemap while they are a pilot).
for (const lesson of LESSONS) write(`lessons/${lesson.topic}.html`, shell)

// Custom 404 page, prerendered so it shows instantly with helpful links.
// Hosts serve it with a 404 status for unknown URLs.
write('404.html', page(NOT_FOUND_META, render('/404'), '/404'))
console.log('prerendered 404.html')
if (beacon) console.log('Cloudflare Web Analytics beacon added to every page')

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)

rmSync(ssrDir, { recursive: true, force: true })
console.log(`sitemap.xml written for ${siteUrl}`)
