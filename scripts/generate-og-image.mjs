/**
 * Renders scripts/og-image.html to public/og-image.png (1200x630) with headless
 * Chrome. Run it only when you change the design: the PNG is committed, so
 * normal builds and deploys do not need Chrome.
 *
 *   npm run og-image
 *
 * Set CHROME_PATH if Chrome is not in the default macOS location.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'scripts', 'og-image.html')
const out = join(root, 'public', 'og-image.png')

const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)
const chrome = candidates.find((p) => existsSync(p))
if (!chrome) {
  console.error('Chrome not found. Set CHROME_PATH to your Chrome or Chromium binary.')
  process.exit(1)
}

// A throwaway profile keeps your normal Chrome profile untouched.
const profile = mkdtempSync(join(tmpdir(), 'og-chrome-'))
try {
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--force-device-scale-factor=1', '--window-size=1200,630',
    '--virtual-time-budget=2000', `--screenshot=${out}`, pathToFileURL(source).href,
  ], { stdio: 'pipe' })
} finally {
  rmSync(profile, { recursive: true, force: true })
}
console.log(`wrote ${out} (${Math.round(statSync(out).size / 1024)} KB)`)
