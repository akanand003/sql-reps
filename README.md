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

Questions appear grouped by topic in the order of `topics.ts`, and in file order within a topic. The first question of each topic is always open. The others unlock when the previous one in the same topic is solved.

Then check your work:

```bash
npm run check:questions
```

It fails if a field is missing, an id is duplicated, the setup or solution does not run, the solution returns no rows, or `orderMatters` is set without an `ORDER BY`.

**Tips for good questions:** keep tables small (5 to 15 rows) so learners can check results by eye. Avoid ties when order matters. Make sure a plausible wrong answer gives a different result from the right one.

## Adding a topic

1. Add the slug to `TopicSlug` and a full entry to `TOPICS` in `src/data/topics.ts`, including `seoTitle` and `seoDescription`.
2. Add the slug to `TOPICS` in `scripts/check-questions.ts`.
3. Add questions with that `topic`.

The topic page, sitemap entry and prerendered HTML are created automatically.

## Adding a paywall later

All access decisions go through `src/lib/access.ts`:

- `FREE_QUESTION_LIMIT` (30) is how many questions are free.
- `getPlan()` returns `'free'` today. Connect it to your auth or billing provider.
- `canAccess(question, number)` is checked on the Practice page. When it returns `false`, `<Paywall />` is shown instead. Change that component to link to your checkout page.
- Mark individual questions as paid with `"premium": true`.

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

## Security notes

- Queries run only inside the user's own browser tab, on a temporary in-memory database. They cannot touch any server or other users.
- The guard is an extra safety layer: it keeps practice to read-only queries and gives clear messages.
- Queries that run longer than 4 seconds are stopped by terminating the worker. Results are capped at 500 rows.
