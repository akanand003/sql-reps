import { Link } from 'react-router'

/** Shown when canAccess() returns false. Swap the button for your checkout link when paid plans launch. */
export default function Paywall() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-semibold">This question is part of SQL Reps Pro</h2>
      <p className="mt-2 text-slate-600">You have finished the free set. Pro questions are coming soon.</p>
      <Link to="/progress" className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">See your progress</Link>
    </div>
  )
}
