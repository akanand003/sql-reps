export type TopicSlug = 'select' | 'where' | 'order-by' | 'group-by' | 'joins' | 'subqueries' | 'window-functions'

export interface TopicExample {
  title: string
  sql: string
  explanation: string
}

export interface Topic {
  slug: TopicSlug
  name: string
  /** Shown in lists on the home page. */
  tagline: string
  /** <title> for the topic page. Keep under ~60 characters. */
  seoTitle: string
  /** <meta name="description">. Keep under ~155 characters. */
  seoDescription: string
  intro: string[]
  examples: [TopicExample, TopicExample]
  tip: string
}

export const TOPICS: Topic[] = [
  {
    slug: 'select',
    name: 'SELECT',
    tagline: 'Read columns from a table',
    seoTitle: 'SQL SELECT Explained with Examples | SQL Reps',
    seoDescription: 'Learn the SQL SELECT statement in plain English: choose columns, calculate new ones and remove duplicates. Then practice with real queries in your browser.',
    intro: [
      'Every SQL query that reads data starts with SELECT. You tell the database which columns you want, and FROM tells it which table to read.',
      'You can list columns by name, use * for all of them, calculate new columns with maths, and rename any column with AS.',
    ],
    examples: [
      { title: 'Choose specific columns', sql: 'SELECT name, price\nFROM products;', explanation: 'Returns two columns, name and price, for every row in products.' },
      { title: 'Calculate and rename', sql: 'SELECT name, price * 1.18 AS price_with_tax\nFROM products;', explanation: 'Adds a calculated column. AS gives it a readable name.' },
    ],
    tip: 'SELECT DISTINCT removes duplicate rows, which is handy for lists like "which categories exist?".',
  },
  {
    slug: 'where',
    name: 'WHERE',
    tagline: 'Filter rows with conditions',
    seoTitle: 'SQL WHERE Clause Explained with Examples | SQL Reps',
    seoDescription: 'Learn how the SQL WHERE clause filters rows: comparisons, AND / OR, BETWEEN, IN, LIKE and IS NULL. Plain English examples plus free interactive practice.',
    intro: [
      'WHERE keeps only the rows that match a condition. It comes after FROM, and the database checks the condition once for every row.',
      'Combine conditions with AND (both must be true) or OR (either can be true). Text goes in single quotes and numbers do not.',
    ],
    examples: [
      { title: 'Filter on text and numbers', sql: "SELECT id, total\nFROM orders\nWHERE status = 'delivered' AND total > 100;", explanation: 'Keeps delivered orders worth more than 100.' },
      { title: 'Find missing values', sql: 'SELECT name\nFROM customers\nWHERE email IS NULL;', explanation: 'NULL means "unknown", so = NULL never matches. Use IS NULL instead.' },
    ],
    tip: "BETWEEN includes both ends, so WHERE order_date BETWEEN '2024-02-01' AND '2024-03-31' covers all of February and March.",
  },
  {
    slug: 'order-by',
    name: 'ORDER BY',
    tagline: 'Sort and limit results',
    seoTitle: 'SQL ORDER BY, LIMIT and OFFSET Explained | SQL Reps',
    seoDescription: 'Learn to sort SQL results with ORDER BY, ASC and DESC, sort by several columns, and page through results with LIMIT and OFFSET. Practice free in your browser.',
    intro: [
      'Without ORDER BY a database may return rows in any order. ORDER BY sorts the result by one or more columns, smallest first unless you add DESC.',
      'LIMIT keeps only the first few rows, and OFFSET skips some rows first, which is how "top 10" lists and pagination work.',
    ],
    examples: [
      { title: 'Most expensive first', sql: 'SELECT name, price\nFROM products\nORDER BY price DESC;', explanation: 'DESC sorts from highest to lowest.' },
      { title: 'Top 3 most recent', sql: 'SELECT id, order_date\nFROM orders\nORDER BY order_date DESC\nLIMIT 3;', explanation: 'Sort newest first, then keep only three rows.' },
    ],
    tip: 'With ORDER BY department, salary DESC the second column only decides the order when the first one is a tie.',
  },
  {
    slug: 'group-by',
    name: 'GROUP BY',
    tagline: 'Count, sum and average by group',
    seoTitle: 'SQL GROUP BY and HAVING Explained with Examples | SQL Reps',
    seoDescription: 'Learn SQL GROUP BY with COUNT, SUM and AVG, and filter groups with HAVING. Clear examples on business data, then practice with instant feedback.',
    intro: [
      'Aggregate functions like COUNT, SUM, AVG, MIN and MAX squash many rows into one number. GROUP BY splits the rows into groups first, so you get one number per group.',
      'Every column in SELECT should either be in GROUP BY or be inside an aggregate. To filter on an aggregate, use HAVING, which runs after grouping.',
    ],
    examples: [
      { title: 'Count per category', sql: 'SELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY category;', explanation: 'One row per category, with how many products are in it.' },
      { title: 'Filter groups with HAVING', sql: 'SELECT department, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 2;', explanation: 'Only departments with more than two people.' },
    ],
    tip: 'WHERE filters rows before they are grouped. HAVING filters the groups afterwards.',
  },
  {
    slug: 'joins',
    name: 'JOINs',
    tagline: 'Combine rows from several tables',
    seoTitle: 'SQL JOINs Explained: INNER and LEFT JOIN | SQL Reps',
    seoDescription: 'Understand SQL JOINs in plain English. Learn INNER JOIN and LEFT JOIN, join three tables, and find rows with no match. Practice with real queries online.',
    intro: [
      'Real databases split data across tables. An orders table stores a customer_id rather than the customer\'s name. A JOIN matches rows from two tables using a condition, usually an id.',
      'An INNER JOIN (or just JOIN) keeps only rows that have a match on both sides. A LEFT JOIN keeps every row from the left table and fills in NULL when nothing matches.',
    ],
    examples: [
      { title: 'Orders with customer names', sql: 'SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;', explanation: 'o and c are short aliases for the two tables.' },
      { title: 'Customers who never ordered', sql: 'SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id IS NULL;', explanation: 'LEFT JOIN keeps every customer. Rows with no order have NULL on the orders side.' },
    ],
    tip: 'When a column name exists in both tables, prefix it with the table alias, like o.id, so the database knows which one you mean.',
  },
  {
    slug: 'subqueries',
    name: 'Subqueries',
    tagline: 'Queries inside queries, and CTEs',
    seoTitle: 'SQL Subqueries and CTEs Explained with Examples | SQL Reps',
    seoDescription: 'Learn SQL subqueries in plain English: scalar subqueries, IN, correlated subqueries and CTEs with WITH. Examples on business data plus free practice.',
    intro: [
      'A subquery is a query in brackets that runs inside another query. It can produce a single value to compare against, or a list of values to check with IN.',
      'A CTE (common table expression) does the same job with a name: WITH name AS (...) runs first, and the main query can use it like a table. CTEs make long queries easier to read.',
    ],
    examples: [
      { title: 'Compare with an average', sql: 'SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products);', explanation: 'The inner query returns one number, the average price.' },
      { title: 'Name a step with WITH', sql: 'WITH spend AS (\n  SELECT customer_id, SUM(total) AS total_spent\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT * FROM spend WHERE total_spent > 400;', explanation: 'The CTE builds totals once, then the main query filters them.' },
    ],
    tip: 'A correlated subquery refers to a column from the outer query, so it is re-evaluated for every outer row.',
  },
  {
    slug: 'window-functions',
    name: 'Window functions',
    tagline: 'Rankings and running totals',
    seoTitle: 'SQL Window Functions Explained: ROW_NUMBER, OVER | SQL Reps',
    seoDescription: 'Learn SQL window functions in plain English: ROW_NUMBER, RANK, running totals with SUM OVER, and PARTITION BY. Interactive practice with instant feedback.',
    intro: [
      'A window function calculates across a set of rows related to the current row, but unlike GROUP BY it keeps every row. You add OVER (...) to say which rows count.',
      'PARTITION BY splits rows into groups that are handled separately, and ORDER BY inside OVER decides the order for rankings and running totals.',
    ],
    examples: [
      { title: 'Rank within each group', sql: 'SELECT category, name, price,\n  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank\nFROM products;', explanation: 'Numbering restarts at 1 for each category.' },
      { title: 'Running total', sql: 'SELECT order_date, total,\n  SUM(total) OVER (ORDER BY order_date) AS running_total\nFROM orders;', explanation: 'Each row shows the sum of all orders up to that date.' },
    ],
    tip: 'You cannot use a window function in WHERE. Compute it in a CTE or subquery, then filter the outer query.',
  },
]

export const TOPIC_BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]))
