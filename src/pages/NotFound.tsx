import { Link } from 'react-router'
import { useMeta } from '../lib/seo'

export default function NotFound() {
  useMeta({ title: 'Page not found | SQL Reps', description: 'This page does not exist.', path: '/404', index: false })
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-sm text-slate-500">SELECT * FROM pages WHERE url = 'this one';</p>
      <h1 className="mt-3 text-2xl font-bold">0 rows returned</h1>
      <p className="mt-2 text-slate-600">We could not find that page.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">Go home</Link>
    </div>
  )
}
