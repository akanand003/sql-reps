# SQL Reps

A "Duolingo for SQL". People learn SQL by writing real queries in the browser and get instant feedback.

- Every query runs in the browser with [sql.js](https://sql.js.org) (SQLite compiled to WebAssembly). There is no backend and no server cost.
- Every Run creates a fresh in-memory database from the question's setup SQL, then throws it away.
- Progress (solved questions, attempts, drafts, streak) is saved in `localStorage`.
- The home page and topic pages are prerendered to static HTML at build time, each with its own title and meta description, so search engines can index them.

**Stack:** Vite, React, TypeScript, Tailwind CSS v4, CodeMirror 6, React Router, sql.js.

## Run it locally

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks, builds the site into `dist/`, prerenders SEO pages, writes `sitemap.xml` |
| `npm run preview` | Serves the production build from `dist/` locally |
| `npm run check:questions` | Runs every question's solution against its setup SQL and reports problems |

## Project layout

```
src/
  data/
    questions.json      ← all practice questions (the only file you edit to add content)
    questions.ts        ← types and helpers for questions
    topics.ts           ← topic pages: explanations, examples, SEO title and description
  lib/
    sqlGuard.ts         ← allows only a single read-only SELECT / WITH statement
    sqlEngine.ts        ← sql.js helpers: fresh DB per run, friendly error messages
    sql.worker.ts       ← runs sql.js in a Web Worker so the page never freezes
    sqlClient.ts        ← talks to the worker, kills queries that run longer than 4 s
    checkAnswer.ts      ← compares the user's rows with the solution's rows
    progress.ts         ← localStorage progress, unlock rules, streaks
    access.ts           ← free and paid access rules (paywall hook)
    seo.ts              ← per-page title, description, canonical and Open Graph tags
  components/           ← Layout, SqlEditor, ResultsTable, SchemaPreview, Paywall, CodeBlock
  pages/                ← Home, Topics, Topic, Practice, Progress, NotFound
  entry-server.tsx      ← used only at build time to prerender pages
scripts/
  prerender.mjs         ← writes static HTML for SEO pages, sitemap.xml and robots.txt
  check-questions.ts    ← validates questions.json
```

## How answers are checked

When the user presses Run:

1. `sqlGuard.ts` rejects anything that is not a single `SELECT` or `WITH` query, such as `DROP`, `ATTACH`, `PRAGMA` or a second statement.
2. The user's query runs on a fresh database built from `setupSql`.
3. The solution runs on another fresh database.
4. `checkAnswer.ts` compares the two results:
   - The number of columns and rows must match. Column names do not matter, so any alias is fine.
   - Row order is ignored, unless the question sets `"orderMatters": true`.
   - Column order matters, unless the question sets `"ignoreColumnOrder": true`.
   - Decimals are rounded to 2 places, so `33.333` and `33.3333` count as equal.

## Adding a question

Open `src/data/questions.json` and add an object to the `questions` array:

```json
{
  "id": "where-like",
  "topic": "where",
  "difficulty": "medium",
  "title": "Names that match a pattern",
  "question": "Show the name of every product whose name contains the word Desk.",
  "hint": "LIKE '%Desk%' matches Desk anywhere in the text.",
  "setupSql": [
    "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price REAL NOT NULL);",
    "INSERT INTO products VALUES",
    "  (1, 'Standing Desk', 'Furniture', 349),",
    "  (2, 'Desk Lamp', 'Furniture', 39.5),",
    "  (3, 'Gel Pens', 'Stationery', 6.5);"
  ],
  "solution": "SELECT name FROM products WHERE name LIKE '%Desk%';"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique and URL friendly. It appears in `/practice/<id>` and is the key for saved progress, so do not rename it after launch. |
| `topic` | yes | One of `select`, `where`, `order-by`, `group-by`, `joins`, `subqueries`, `window-functions` |
| `difficulty` | yes | `easy`, `medium` or `hard` |
| `title` | yes | Short name shown in lists |
| `question` | yes | The task, in plain English. Say which columns you expect and in which order. |
| `hint` | yes | Shown when the user asks for a hint |
| `setupSql` | yes | A list of SQL lines that create and fill the tables. They are joined with newlines. |
| `solution` | yes | The correct query. The user's result is compared against its result. |
| `orderMatters` | no | `true` if the question asks for a specific order. The solution must use `ORDER BY`. |
| `ignoreColumnOrder` | no | `true` to accept the right columns in any order |
| `premium` | no | `true` to put the question behind the paywall later |

Questions appear in file order, and that order sets their numbers. Questions 1 to 30 are the free path through all topics. Questions 31 to 100 are premium and go from easy to medium to hard. Add new questions at the end, so existing numbers (and what is free) do not shift.

The first question of each topic is always open. The others unlock when the previous one in the same topic is solved.

Then check your work:

```bash
npm run check:questions
```

It fails if:

- a field is missing, an id is duplicated, or the setup or solution does not run
- the solution returns no rows, or `orderMatters` is set without an `ORDER BY`
- the expected answer is ambiguous: ties under `ORDER BY`, or a `LIMIT` that could pick different rows (found by re-running the solution with a random tie-breaker and with reversed scan order)
- premium questions are not ordered easy, then medium, then hard

**Tips for good questions:** keep tables small (5 to 15 rows) so learners can check results by eye. Avoid ties when order matters. Make sure a plausible wrong answer gives a different result from the right one.

## Adding a topic

1. Add the slug to `TopicSlug` and a full entry to `TOPICS` in `src/data/topics.ts`, including `seoTitle` and `seoDescription`.
2. Add the slug to `TOPICS` in `scripts/check-questions.ts`.
3. Add questions with that `topic`.

The topic page, sitemap entry and prerendered HTML are created automatically.

## Premium questions and the waitlist

All access decisions go through `src/lib/access.ts`:

- `FREE_QUESTION_LIMIT` (30): questions 1 to 30 are free, and everything after is premium. You can also force a single question to be premium with `"premium": true`.
- `isPremium(question)` and `canAccess(question)` are used on the Practice page, topic pages, the progress page and the question picker.
- `getPlan()` returns `'free'` today. When paid plans launch, connect it to your auth or billing provider.

There is no payment system. Opening a premium question shows `<Paywall />` with "Premium questions are coming soon, join the waitlist" and an email box.

### How the waitlist saves emails

The form posts to a Cloudflare Pages Function, `functions/api/waitlist.ts`, which stores each email in Cloudflare KV (free tier). It:

- stores only the email (as the key `email:<address>`, lowercased) and the time it joined
- validates the format, and does not store the same email twice
- ignores bots that fill a hidden honeypot field
- allows 5 submits per visitor per minute. A one-way hash of the visitor's IP is kept for 2 minutes for this. The IP itself is never stored.
- refuses requests from other websites, and always answers with a clear JSON message

The browser only remembers that the visitor joined, not their email. The waitlist needs Cloudflare Pages: on other hosts the form shows "not available right now".

### Set up the KV store (one time)

1. In the Cloudflare dashboard, go to **Storage & Databases → KV** (in older dashboards: **Workers & Pages → KV**) and click **Create** (or **Create namespace**). Name it `sql-reps-waitlist`.
2. Open **Workers & Pages**, pick the `sql-reps` project, then **Settings → Bindings** (older dashboards: **Settings → Functions → KV namespace bindings**). Click **Add → KV namespace**.
3. Set **Variable name** to `WAITLIST` and choose the `sql-reps-waitlist` namespace. Save. Do this for **Production**, and for **Preview** too if you want preview deployments to work.
4. Redeploy (**Deployments → ⋯ → Retry deployment**). Bindings only apply to new deployments.

Until the binding exists, the form says "The waitlist is not open yet".

### See the saved emails

- **Dashboard:** **Storage & Databases → KV → sql-reps-waitlist → KV Pairs**. Each `email:...` key is one signup, and its value is the join time. Ignore `ratelimit:...` keys: they delete themselves within 2 minutes.
- **Command line:** run `npx wrangler login` once, then `npx wrangler kv key list --namespace-id <namespace id> --remote`. The namespace id is shown on the KV page.

The free KV tier allows 1,000 writes per day. Each submit uses one or two writes, which is plenty for a waitlist.

### Test the waitlist locally

```bash
npm run build
```
```bash
npm run preview:cf
```

This runs the site and the function on http://localhost:8788 with a local, simulated KV store. `npm run dev` has no functions, so the form shows "not available right now" there.

A client-side check is fine for an MVP. If you later need to protect paid content properly, serve premium questions from an API that checks the user's plan, rather than shipping them in `questions.json`.

## Deploying for free

The build output in `dist/` is plain static files. Canonical links and `sitemap.xml` use `https://sql-reps.pages.dev` by default (`DEFAULT_SITE_URL` in `scripts/prerender.mjs`). If you move to a custom domain, set the `SITE_URL` environment variable or change that default.

### Cloudflare Pages

1. Push the project to a GitHub or GitLab repository.
2. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git**, then pick the repository.
3. Use these build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `SITE_URL` = `https://your-domain`, and `NODE_VERSION` = `22`
4. Deploy. `public/_redirects` sends every `/practice/...` URL to the app shell. Unknown URLs get `404.html`.

Or from your machine, without Git:

```bash
npm run build
npx wrangler pages deploy dist --project-name sql-reps
```

### Vercel

1. Push the project to GitHub and import it at vercel.com/new.
2. Vercel detects Vite. Keep the build command `npm run build` and the output directory `dist`.
3. Add the environment variable `SITE_URL` = `https://your-domain`.
4. Deploy. `vercel.json` sends every `/practice/...` URL to the app shell.

### After deploying

Submit `https://your-domain/sitemap.xml` in Google Search Console so the topic pages get indexed.

## Analytics (Cloudflare Web Analytics)

Free, cookieless and privacy friendly: no cookie banner needed, no personal data stored. Single-page navigation is counted automatically.

**On Cloudflare Pages (recommended, no code):** in the Cloudflare dashboard open **Workers & Pages**, pick the `sql-reps` project, go to **Metrics**, and click **Enable** under Web Analytics. Cloudflare adds the script to new deployments, so redeploy once. Visits show up under **Analytics & Logs → Web Analytics** within a few minutes.

**Anywhere else (for example Vercel):** in the Cloudflare dashboard open **Analytics & Logs → Web Analytics → Add a site**, enter your domain, choose the manual JavaScript snippet, and copy the `token` value from the snippet. Set it as the build environment variable `CF_BEACON_TOKEN`. The build then adds the beacon to every page.

Use one method, not both, or each visit is counted twice.

## Social previews and the 404 page

- Every page has Open Graph and Twitter card tags pointing to `public/og-image.png` (1200x630). The design lives in `scripts/og-image.html`. After changing it, run `npm run og-image` (needs Chrome installed) and commit the new PNG.
- Unknown URLs get `dist/404.html`, a prerendered "0 rows returned" page with links to practice, the playground, every topic and every guide. It is marked `noindex`.
- `robots.txt` and `sitemap.xml` are generated at build time and point at `SITE_URL`.

## Security notes

- Queries run only inside the user's own browser tab, on a temporary in-memory database. They cannot touch any server or other users.
- The guard is an extra safety layer: it keeps practice to read-only queries and gives clear messages.
- Queries that run longer than 4 seconds are stopped by terminating the worker. Results are capped at 500 rows.
