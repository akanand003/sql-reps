/**
 * Build step: turns the SPA shell into real HTML pages for search engines.
 *
 * For every page in prerenderPages() it renders the React tree to HTML, injects the
 * page's own <title>, meta description and canonical URL, and writes
 * dist/<path>/index.html. It also writes dist/sitemap.xml.
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

const { render, prerenderPages, headTags } = await import(join(ssrDir, 'entry-server.js'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')
if (!template.includes('<!--app-html-->') || !template.includes('<!--app-head-->')) {
  throw new Error('dist/index.html is missing the <!--app-head--> or <!--app-html--> markers')
}

const pages = prerenderPages()
for (const page of pages) {
  const html = template
    .replace(/<!--app-head-->[\s\S]*?<!--\/app-head-->/, headTags(page, siteUrl))
    .replace('<div id="root"><!--app-html-->', `<div id="root" data-prerendered="${page.path}">${render(page.path)}`)
  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  console.log(`prerendered ${page.path}`)
}

// The SPA shell for client-only routes (/practice, /progress). Hosts fall back to it.
// We keep index.html as the home page, so client-only routes need their own shell:
const shell = template.replace(/<!--app-head-->([\s\S]*?)<!--\/app-head-->/, '$1').replace('<!--app-html-->', '')
for (const route of ['practice', 'progress']) {
  mkdirSync(join(dist, route), { recursive: true })
  writeFileSync(join(dist, route, 'index.html'), shell)
}
// Unknown URLs get the empty shell with a 404 status; the app then renders its Not Found page.
writeFileSync(join(dist, '404.html'), shell)

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
