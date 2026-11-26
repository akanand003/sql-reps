/**
 * SEO landing pages. Each entry becomes a prerendered page at /<slug>.
 *
 * Inline text supports two tiny bits of markup:
 *   [label](/path)  an internal link
 *   `code`          inline code
 *
 * Every SQL example runs against the practice tables (customers, orders,
 * order_items, products, employees).
 */

export interface FaqItem {
  q: string
  a: string
  code?: string
}

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'code'; sql: string }
  | { type: 'ul'; items: string[] }
  | { type: 'faq'; items: FaqItem[] }

export interface LandingPage {
  slug: string
  /** Short name used in footer and cross links. */
  name: string
  seoTitle: string
  seoDescription: string
  h1: string
  blocks: Block[]
  /** Which JSON-LD types describe this page. FAQPage is built from the page's faq blocks. */
  schema: ('Course' | 'FAQPage')[]
  /** Course details, used when schema includes Course. */
  course?: { level: 'Beginner' | 'Intermediate' | 'Advanced'; teaches: string[] }
  cta: { practice: string; topic: string; topicLabel: string }
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: 'sql-practice-questions',
    name: 'SQL practice questions',
    seoTitle: 'Free SQL Practice Questions with Answers | SQL Reps',
    seoDescription: '30 free SQL practice questions on real business data, from SELECT to window functions. Write queries in your browser and get instant feedback. No sign-up.',
    h1: 'SQL practice questions with instant feedback',
    schema: ['Course'],
    course: { level: 'Beginner', teaches: ['SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'JOINs', 'Subqueries', 'Window functions'] },
    cta: { practice: '/practice', topic: '/topics', topicLabel: 'See all topics' },
    blocks: [
      { type: 'p', text: 'Reading about SQL only gets you so far. You get good at it the same way you get good at anything: many short reps, quick feedback, and fixing mistakes straight away. SQL Reps gives you 30 free practice questions that run in your browser on a small, realistic company database, so you can start in seconds with nothing to install.' },
      { type: 'h2', text: 'How the practice works' },
      { type: 'ul', items: [
        'Each question describes a task in plain English, like a request from a manager: "Which customers have never placed an order?"',
        'You write the query in an editor with SQL highlighting and press Run. A real SQLite database runs it on your device.',
        'Your result is compared with the correct answer. If it is right, the next question unlocks. If not, you see what is different and can ask for a hint.',
        'Your progress and daily streak are saved in your browser, so you can pick up tomorrow where you stopped.',
      ] },
      { type: 'h2', text: 'Sample questions at each level' },
      { type: 'p', text: 'The questions use five tables: `customers`, `orders`, `order_items`, `products` and `employees`. Here is one question from each level, with a working answer.' },
      { type: 'h3', text: 'Easy: products over 50' },
      { type: 'p', text: 'Show the name and price of every product that costs more than 50.' },
      { type: 'code', sql: 'SELECT name, price\nFROM products\nWHERE price > 50;' },
      { type: 'h3', text: 'Medium: orders per customer' },
      { type: 'p', text: 'Show every customer and how many orders they placed, including customers with none.' },
      { type: 'code', sql: 'SELECT c.name, COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name;' },
      { type: 'p', text: '`COUNT(o.id)` counts only matching orders, so customers without orders show 0 instead of 1.' },
      { type: 'h3', text: 'Hard: top earner in each department' },
      { type: 'p', text: 'Show the highest-paid employee in every department.' },
      { type: 'code', sql: 'WITH ranked AS (\n  SELECT department, name, salary,\n    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn\n  FROM employees\n)\nSELECT department, name, salary\nFROM ranked\nWHERE rn = 1;' },
      { type: 'h2', text: 'What the 30 questions cover' },
      { type: 'p', text: 'The questions follow a path where each one builds on the last: [SELECT](/topics/select), [WHERE](/topics/where), [ORDER BY](/topics/order-by), [GROUP BY](/topics/group-by), [JOINs](/topics/joins), [subqueries](/topics/subqueries) and [window functions](/topics/window-functions). Each topic has a short guide with examples if you want to read before you write.' },
      { type: 'h2', text: 'Tips to get more from practice' },
      { type: 'ul', items: [
        'Try before you look. The solution button only appears after your first attempt, and struggling a little is what makes it stick.',
        'Read the error. Messages like "no such column" usually point straight at the typo.',
        'Check the row count first. If you expected 5 rows and got 9, a filter or join condition is missing.',
        'Do a few every day. Five questions a day for a week beats thirty in one sitting.',
      ] },
      { type: 'p', text: 'New to SQL? Start with [SQL for beginners](/sql-for-beginners). Preparing for a job? Work through the [SQL interview questions](/sql-interview-questions), and keep the [SQL cheat sheet](/sql-cheat-sheet) open in another tab.' },
    ],
  },
  {
    slug: 'sql-interview-questions',
    name: 'SQL interview questions',
    seoTitle: 'SQL Interview Questions and Answers with Examples | SQL Reps',
    seoDescription: 'Common SQL interview questions answered in plain English with example queries: joins, WHERE vs HAVING, second highest salary, ROW_NUMBER and more.',
    h1: 'SQL interview questions and answers',
    schema: ['FAQPage'],
    cta: { practice: '/practice?topic=joins', topic: '/topics/joins', topicLabel: 'Read the JOINs guide' },
    blocks: [
      { type: 'p', text: 'Most SQL interviews for analyst, data and backend roles test the same handful of ideas. Interviewers want to see that you can filter and group data, combine tables, and handle the tricky cases like NULLs and ties. Below are the questions that come up most often, each with a short answer and a query you can run against a typical shop database.' },
      { type: 'faq', items: [
        { q: 'What is the difference between WHERE and HAVING?', a: 'WHERE filters rows before they are grouped. HAVING filters groups after aggregation, so it can use functions like COUNT or SUM.', code: 'SELECT department, COUNT(*) AS headcount\nFROM employees\nWHERE salary > 70000\nGROUP BY department\nHAVING COUNT(*) >= 2;' },
        { q: 'What is the difference between INNER JOIN and LEFT JOIN?', a: 'An INNER JOIN returns only rows that match in both tables. A LEFT JOIN returns every row from the left table and fills the right side with NULL where there is no match. Use a LEFT JOIN when you must not lose rows, such as customers who have not ordered yet.' },
        { q: 'How do you find rows with no match in another table?', a: 'Use a LEFT JOIN and keep the rows where the right side is NULL. NOT EXISTS works too.', code: 'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;' },
        { q: 'How do you find the second highest salary?', a: 'Sort the distinct salaries from highest to lowest and skip the first one. Using DISTINCT means it still works when several people share the top salary.', code: 'SELECT DISTINCT salary\nFROM employees\nORDER BY salary DESC\nLIMIT 1 OFFSET 1;' },
        { q: 'What is the difference between ROW_NUMBER, RANK and DENSE_RANK?', a: 'All three number rows in order. ROW_NUMBER always gives 1, 2, 3, even for ties. RANK gives ties the same number and then skips (1, 1, 3). DENSE_RANK gives ties the same number without gaps (1, 1, 2).', code: 'SELECT name, salary,\n  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,\n  RANK()       OVER (ORDER BY salary DESC) AS rnk,\n  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk\nFROM employees;' },
        { q: 'How do you find duplicate values?', a: 'Group by the column and keep only the groups with more than one row.', code: 'SELECT title, COUNT(*) AS how_many\nFROM employees\nGROUP BY title\nHAVING COUNT(*) > 1;' },
        { q: 'Why does WHERE email = NULL return nothing?', a: 'NULL means unknown, and comparing anything with unknown gives unknown, not true. Use IS NULL or IS NOT NULL instead.' },
        { q: 'How do you calculate a running total?', a: 'Use SUM as a window function with ORDER BY inside OVER. Unlike GROUP BY, it keeps every row.', code: 'SELECT order_date, total,\n  SUM(total) OVER (ORDER BY order_date) AS running_total\nFROM orders;' },
      ] },
      { type: 'h2', text: 'How to prepare' },
      { type: 'p', text: 'Reading answers is a start, but interviews ask you to write queries live. Practise until the patterns feel automatic. The [JOINs practice](/sql-joins-practice), [GROUP BY practice](/sql-group-by-practice) and [window functions practice](/sql-window-functions-practice) pages cover the three areas interviewers test most, and the [SQL cheat sheet](/sql-cheat-sheet) is a quick refresher the night before.' },
    ],
  },
  {
    slug: 'sql-joins-practice',
    name: 'SQL JOINs practice',
    seoTitle: 'SQL JOINs Practice: Exercises with Answers | SQL Reps',
    seoDescription: 'Practice SQL JOINs with real exercises: INNER JOIN, LEFT JOIN, finding missing rows and joining three tables. Run queries in your browser for free.',
    h1: 'SQL JOINs practice exercises',
    schema: ['Course'],
    course: { level: 'Intermediate', teaches: ['INNER JOIN', 'LEFT JOIN', 'Anti-joins', 'Multi-table joins'] },
    cta: { practice: '/practice?topic=joins', topic: '/topics/joins', topicLabel: 'Read the JOINs guide' },
    blocks: [
      { type: 'p', text: 'JOINs are where most people get stuck with SQL, and where interviewers spend the most time. The idea is simple: rows in one table point to rows in another through an id, and a JOIN follows that pointer. The hard part is choosing the right type of join without losing or duplicating rows by accident. These exercises use a small shop database where `orders.customer_id` points to `customers.id`, and `order_items` links orders to `products`.' },
      { type: 'h2', text: 'Exercise 1: add names to orders' },
      { type: 'p', text: 'Orders only store a customer id. Show each order with the customer\'s name.' },
      { type: 'code', sql: 'SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;' },
      { type: 'p', text: 'This is an INNER JOIN. Every order has a customer, so no rows are lost. The aliases `o` and `c` are short names for the tables. They save typing and make it clear which table each column comes from.' },
      { type: 'h2', text: 'Exercise 2: count orders for every customer' },
      { type: 'p', text: 'Now show every customer, including people who never ordered, with their number of orders.' },
      { type: 'code', sql: 'SELECT c.name, COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name;' },
      { type: 'p', text: 'Two details matter. LEFT JOIN keeps customers without orders. `COUNT(o.id)` counts only real orders, while `COUNT(*)` would count the empty row and report 1 instead of 0.' },
      { type: 'h2', text: 'Exercise 3: customers who never ordered' },
      { type: 'code', sql: 'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;' },
      { type: 'p', text: 'After a LEFT JOIN, unmatched rows have NULL in every column from the right table. Filtering on `o.id IS NULL` keeps exactly those rows. This pattern is often called an anti-join.' },
      { type: 'h2', text: 'Exercise 4: join three tables' },
      { type: 'p', text: 'Which customers bought something from the Furniture category? Follow the chain from customers to orders to order items to products.' },
      { type: 'code', sql: "SELECT DISTINCT c.name\nFROM customers c\nJOIN orders o       ON o.customer_id = c.id\nJOIN order_items oi ON oi.order_id = o.id\nJOIN products p     ON p.id = oi.product_id\nWHERE p.category = 'Furniture';" },
      { type: 'p', text: '`DISTINCT` matters here. A customer with two furniture orders would otherwise appear twice.' },
      { type: 'h2', text: 'Common JOIN mistakes' },
      { type: 'ul', items: [
        'Forgetting the ON condition, which pairs every row with every other row.',
        "Filtering the right table in WHERE after a LEFT JOIN. `WHERE o.status = 'delivered'` removes the NULL rows and quietly turns it back into an inner join. Put that condition in the ON clause instead.",
        'Using a column name that exists in both tables without an alias, such as `id`.',
        'Joining on the wrong columns, such as `o.id = c.id`. Always join a foreign key like `customer_id` to the id it points to.',
      ] },
      { type: 'p', text: 'Want the theory first? Read the [JOINs guide](/topics/joins). Once these feel easy, move on to [GROUP BY practice](/sql-group-by-practice), or try the join questions in our [SQL interview questions](/sql-interview-questions).' },
    ],
  },
  {
    slug: 'sql-group-by-practice',
    name: 'SQL GROUP BY practice',
    seoTitle: 'SQL GROUP BY Practice: Exercises with Answers | SQL Reps',
    seoDescription: 'Practice SQL GROUP BY with COUNT, SUM, AVG and HAVING on real business data. Free exercises with answers that run in your browser.',
    h1: 'SQL GROUP BY practice exercises',
    schema: ['Course'],
    course: { level: 'Beginner', teaches: ['GROUP BY', 'COUNT', 'SUM', 'AVG', 'HAVING'] },
    cta: { practice: '/practice?topic=group-by', topic: '/topics/group-by', topicLabel: 'Read the GROUP BY guide' },
    blocks: [
      { type: 'p', text: 'GROUP BY turns detailed rows into summaries: orders per customer, revenue per category, average salary per team. Almost every report you will ever write uses it. The rule to remember is that GROUP BY first splits rows into groups, then each aggregate function such as COUNT, SUM or AVG returns one value per group.' },
      { type: 'h2', text: 'How GROUP BY works, step by step' },
      { type: 'p', text: 'Picture the database sorting all rows into piles, one pile for each distinct value of the GROUP BY column. Then it calculates each aggregate once per pile and returns a single row for it. That is why your result has exactly one row per group. If you group by two columns, such as `department` and `title`, you get one pile for every combination that exists in the data.' },
      { type: 'h2', text: 'Exercise 1: count products per category' },
      { type: 'code', sql: 'SELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY category;' },
      { type: 'p', text: 'Every column in SELECT must either appear in GROUP BY or sit inside an aggregate. Here `category` is grouped and `COUNT(*)` is an aggregate.' },
      { type: 'h2', text: 'Exercise 2: total spend per customer' },
      { type: 'code', sql: 'SELECT customer_id, SUM(total) AS total_spent\nFROM orders\nGROUP BY customer_id\nORDER BY total_spent DESC;' },
      { type: 'p', text: 'Sorting by the aggregate turns this into a quick leaderboard of your best customers. Add `LIMIT 3` to keep only the top three.' },
      { type: 'h2', text: 'Exercise 3: average salary per department' },
      { type: 'code', sql: 'SELECT department, ROUND(AVG(salary)) AS avg_salary\nFROM employees\nGROUP BY department;' },
      { type: 'p', text: 'AVG often returns long decimals. ROUND keeps the report readable, and `ROUND(AVG(salary), 2)` would keep two decimal places instead.' },
      { type: 'h2', text: 'Exercise 4: filter groups with HAVING' },
      { type: 'code', sql: 'SELECT department, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 2;' },
      { type: 'p', text: 'You cannot write `WHERE COUNT(*) > 2`, because WHERE runs before the groups exist. HAVING runs after grouping, so it can see the counts.' },
      { type: 'h2', text: 'Exercise 5: group by a joined column' },
      { type: 'p', text: 'Revenue per product category needs data from two tables: quantities live in `order_items` and prices live in `products`.' },
      { type: 'code', sql: 'SELECT p.category, SUM(oi.quantity * p.price) AS revenue\nFROM order_items oi\nJOIN products p ON p.id = oi.product_id\nGROUP BY p.category\nORDER BY revenue DESC;' },
      { type: 'p', text: 'Join first, then group. The database builds the joined rows, splits them by category, and adds up quantity times price inside each group.' },
      { type: 'h2', text: 'Common GROUP BY mistakes' },
      { type: 'ul', items: [
        'Selecting a column that is neither grouped nor aggregated. Some databases reject it, and SQLite silently picks a value from one row.',
        'Using `COUNT(column)` when you mean `COUNT(*)`. COUNT of a column skips NULLs.',
        'Filtering aggregates in WHERE instead of HAVING.',
      ] },
      { type: 'p', text: 'Read the [GROUP BY guide](/topics/group-by) for the basics, practice [JOINs](/sql-joins-practice) to combine tables before grouping, and see [window functions practice](/sql-window-functions-practice) for totals that keep every row.' },
    ],
  },
  {
    slug: 'sql-window-functions-practice',
    name: 'SQL window functions practice',
    seoTitle: 'SQL Window Functions Practice with Answers | SQL Reps',
    seoDescription: 'Practice SQL window functions: ROW_NUMBER, RANK, running totals, LAG and top N per group. Free exercises with answers you can run in your browser.',
    h1: 'SQL window functions practice',
    schema: ['Course'],
    course: { level: 'Advanced', teaches: ['ROW_NUMBER', 'RANK', 'Running totals', 'LAG', 'PARTITION BY'] },
    cta: { practice: '/practice?topic=window-functions', topic: '/topics/window-functions', topicLabel: 'Read the window functions guide' },
    blocks: [
      { type: 'p', text: 'Window functions are the step from writing SQL to writing SQL that impresses people. They answer questions like "rank each product within its category" or "show a running total" without collapsing rows the way GROUP BY does. Every window function has an OVER clause that says which rows to look at: PARTITION BY splits rows into groups, and ORDER BY sets the order inside each group.' },
      { type: 'h2', text: 'Window functions vs GROUP BY' },
      { type: 'p', text: 'Both can calculate totals and averages, but they shape the result differently. GROUP BY returns one row per group, so the individual rows disappear. A window function returns every original row and adds the calculated value next to it. Reach for a window function whenever you need each row and a group-level number side by side, such as each order and the running total so far.' },
      { type: 'h2', text: 'Exercise 1: rank within a group' },
      { type: 'code', sql: 'SELECT category, name, price,\n  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank\nFROM products;' },
      { type: 'p', text: 'The numbering restarts at 1 for each category because of PARTITION BY.' },
      { type: 'h2', text: 'Exercise 2: running total' },
      { type: 'code', sql: 'SELECT order_date, total,\n  SUM(total) OVER (ORDER BY order_date) AS running_total\nFROM orders;' },
      { type: 'p', text: 'With ORDER BY inside OVER, SUM adds up every row from the start of the window to the current row.' },
      { type: 'h2', text: 'Exercise 3: compare with the previous row' },
      { type: 'p', text: 'LAG reads a value from the row before, which is handy for change over time.' },
      { type: 'code', sql: 'SELECT order_date, total,\n  LAG(total) OVER (ORDER BY order_date) AS previous_total,\n  total - LAG(total) OVER (ORDER BY order_date) AS change\nFROM orders;' },
      { type: 'p', text: 'The first row has no previous row, so LAG returns NULL there.' },
      { type: 'h2', text: 'Exercise 4: top earner per department' },
      { type: 'p', text: 'You cannot filter on a window function in WHERE, because WHERE runs first. Compute it in a CTE, then filter outside.' },
      { type: 'code', sql: 'WITH ranked AS (\n  SELECT department, name, salary,\n    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn\n  FROM employees\n)\nSELECT department, name, salary\nFROM ranked\nWHERE rn = 1;' },
      { type: 'h2', text: 'Exercise 5: compare each row with its group' },
      { type: 'code', sql: 'SELECT name, department, salary,\n  ROUND(AVG(salary) OVER (PARTITION BY department)) AS dept_avg\nFROM employees;' },
      { type: 'p', text: 'An aggregate with OVER puts the group value on every row, so you can compare each person with their team in one query.' },
      { type: 'h2', text: 'Common window function mistakes' },
      { type: 'ul', items: [
        'Using a window function in WHERE or GROUP BY. Wrap the query in a CTE or subquery and filter outside.',
        'Forgetting PARTITION BY, which ranks across the whole table instead of within each group.',
        'Using ROW_NUMBER when ties should share a rank. Use RANK or DENSE_RANK instead.',
      ] },
      { type: 'p', text: 'Read the [window functions guide](/topics/window-functions) for the basics, and see the [SQL interview questions](/sql-interview-questions) for the classic ROW_NUMBER vs RANK vs DENSE_RANK question.' },
    ],
  },
  {
    slug: 'sql-cheat-sheet',
    name: 'SQL cheat sheet',
    seoTitle: 'SQL Cheat Sheet: Common Queries with Examples | SQL Reps',
    seoDescription: 'A plain English SQL cheat sheet with examples: SELECT, WHERE, ORDER BY, GROUP BY, JOINs, subqueries, CTEs and window functions. Free and printable.',
    h1: 'SQL cheat sheet',
    schema: ['FAQPage'],
    cta: { practice: '/practice', topic: '/topics', topicLabel: 'See all topics' },
    blocks: [
      { type: 'p', text: 'A quick reference for the SQL you will use most. Every example works on a small shop database with `customers`, `orders`, `order_items`, `products` and `employees` tables. Keywords are not case sensitive, but writing them in capitals makes queries easier to read.' },
      { type: 'h2', text: 'Reading and filtering' },
      { type: 'code', sql: "SELECT name, price FROM products;               -- pick columns\nSELECT DISTINCT category FROM products;         -- no duplicates\nSELECT * FROM products WHERE price > 50;        -- filter rows\nSELECT * FROM customers WHERE country IN ('India', 'UK');\nSELECT * FROM orders WHERE order_date BETWEEN '2024-02-01' AND '2024-03-31';\nSELECT * FROM products WHERE name LIKE '%Desk%'; -- contains Desk\nSELECT * FROM customers WHERE email IS NULL;     -- missing values" },
      { type: 'h2', text: 'Sorting and limiting' },
      { type: 'code', sql: 'SELECT name, price FROM products ORDER BY price DESC;      -- highest first\nSELECT name FROM products ORDER BY name LIMIT 3 OFFSET 3;  -- page 2' },
      { type: 'h2', text: 'Aggregates and groups' },
      { type: 'code', sql: 'SELECT COUNT(*), SUM(total), AVG(total), MIN(total), MAX(total) FROM orders;\nSELECT status, COUNT(*) AS orders FROM orders GROUP BY status;\nSELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 2;' },
      { type: 'h2', text: 'Joins' },
      { type: 'code', sql: '-- only rows that match on both sides\nSELECT o.id, c.name FROM orders o JOIN customers c ON c.id = o.customer_id;\n-- every customer, NULL when there is no order\nSELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id;' },
      { type: 'h2', text: 'Subqueries and CTEs' },
      { type: 'code', sql: 'SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);\n\nWITH spend AS (\n  SELECT customer_id, SUM(total) AS total_spent FROM orders GROUP BY customer_id\n)\nSELECT * FROM spend WHERE total_spent > 400;' },
      { type: 'h2', text: 'Window functions' },
      { type: 'code', sql: 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;\nSELECT order_date, SUM(total) OVER (ORDER BY order_date) AS running_total FROM orders;' },
      { type: 'h2', text: 'Useful functions' },
      { type: 'ul', items: [
        '`ROUND(price * 1.18, 2)` rounds to 2 decimal places.',
        "`COALESCE(email, 'none')` replaces NULL with a default value.",
        '`UPPER(name)` and `LOWER(name)` change the case of text.',
        '`LENGTH(name)` counts the characters in a value.',
        "`CASE WHEN total > 100 THEN 'big' ELSE 'small' END` makes an if/else column.",
      ] },
      { type: 'h2', text: 'Quick answers' },
      { type: 'faq', items: [
        { q: 'In what order does SQL run a query?', a: 'Not in the order you write it. The database runs FROM and JOIN first, then WHERE, GROUP BY, HAVING, SELECT, ORDER BY and finally LIMIT. That is why you cannot use a SELECT alias in WHERE, but you can in ORDER BY.' },
        { q: 'Should I use single or double quotes?', a: "Use single quotes for text values, like 'India'. Double quotes are for table or column names that contain spaces or reserved words." },
        { q: 'Does SQL care about upper or lower case?', a: "Keywords are not case sensitive, so select and SELECT both work. Text comparisons can be, depending on the database: in SQLite, 'india' = 'India' is false." },
      ] },
      { type: 'p', text: 'Learning from scratch? Start with [SQL for beginners](/sql-for-beginners). Ready to test yourself? Try the [SQL practice questions](/sql-practice-questions).' },
    ],
  },
  {
    slug: 'sql-for-beginners',
    name: 'SQL for beginners',
    seoTitle: 'Learn SQL for Beginners: A Plain English Guide | SQL Reps',
    seoDescription: 'New to SQL? Learn what SQL is, how tables work and how to write your first queries, step by step in plain English. Then practice free in your browser.',
    h1: 'SQL for beginners',
    schema: ['Course', 'FAQPage'],
    course: { level: 'Beginner', teaches: ['What SQL is', 'SELECT', 'WHERE', 'ORDER BY', 'GROUP BY', 'JOIN'] },
    cta: { practice: '/practice?topic=select', topic: '/topics/select', topicLabel: 'Read the SELECT guide' },
    blocks: [
      { type: 'p', text: 'SQL (Structured Query Language) is how people ask questions of data stored in databases. Analysts use it to build reports, developers use it inside apps, and product managers use it to answer their own questions without waiting for someone else. The good news is that the core of SQL is small. A handful of keywords covers most of what you will do at work.' },
      { type: 'h2', text: 'Tables, rows and columns' },
      { type: 'p', text: 'A database stores data in tables, which look like spreadsheets. Each row is one thing, such as one customer, and each column is one fact about it, such as their city. In our practice database, the `customers` table has columns like `name`, `city` and `country`, and the `orders` table stores one row per order.' },
      { type: 'h2', text: 'Step 1: read data with SELECT' },
      { type: 'code', sql: 'SELECT name, city\nFROM customers;' },
      { type: 'p', text: 'SELECT lists the columns you want and FROM names the table. Use `*` to get every column.' },
      { type: 'h2', text: 'Step 2: filter with WHERE' },
      { type: 'code', sql: "SELECT name, city\nFROM customers\nWHERE country = 'India';" },
      { type: 'p', text: 'Text goes in single quotes. You can combine conditions with AND and OR.' },
      { type: 'h2', text: 'Step 3: sort with ORDER BY' },
      { type: 'code', sql: 'SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 3;' },
      { type: 'p', text: 'This returns the three most expensive products. DESC means highest first.' },
      { type: 'h2', text: 'Step 4: summarise with GROUP BY' },
      { type: 'code', sql: 'SELECT country, COUNT(*) AS customers\nFROM customers\nGROUP BY country;' },
      { type: 'p', text: 'GROUP BY makes one row per country, and COUNT counts the customers in each one.' },
      { type: 'h2', text: 'Step 5: combine tables with JOIN' },
      { type: 'code', sql: 'SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;' },
      { type: 'p', text: 'The join matches each order to its customer using the id they share.' },
      { type: 'h2', text: 'How to practise as a beginner' },
      { type: 'p', text: 'Type every example yourself instead of copying it, then change one thing at a time to see what happens: a different column, a different country, ASC instead of DESC. Small experiments like these teach you faster than reading. When a query fails, read the error message slowly. It usually names the exact word that confused the database.' },
      { type: 'h2', text: 'Beginner questions' },
      { type: 'faq', items: [
        { q: 'How long does it take to learn SQL?', a: 'Most people can write useful queries after a few hours of practice, and feel comfortable with joins and grouping after two or three weeks of short daily sessions.' },
        { q: 'Do I need to install anything?', a: 'Not to start. SQL Reps runs a real SQLite database inside your browser, so you can practise without installing software or creating an account.' },
        { q: 'Which SQL should I learn: MySQL, PostgreSQL or SQLite?', a: 'Start with any of them. The basics are the same everywhere, and the differences only matter for advanced features.' },
      ] },
      { type: 'p', text: 'Next, read the short [SELECT guide](/topics/select), keep the [SQL cheat sheet](/sql-cheat-sheet) handy, and when you are ready, try the [SQL practice questions](/sql-practice-questions).' },
    ],
  },
]

export const LANDING_BY_SLUG = new Map(LANDING_PAGES.map((p) => [p.slug, p]))
