import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Topics from './pages/Topics'
import Topic from './pages/Topic'
import NotFound from './pages/NotFound'

// The practice page pulls in CodeMirror and the SQL worker, so it loads on demand.
const Practice = lazy(() => import('./pages/Practice'))
const Progress = lazy(() => import('./pages/Progress'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:slug" element={<Topic />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:id" element={<Practice />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
