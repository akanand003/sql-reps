import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import './index.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Topic pages and the home page are prerendered to HTML at build time, so hydrate them.
// Other routes (practice, progress) arrive as an empty shell and render on the client.
// Only hydrate when the HTML was prerendered for this exact URL. Some static servers
// answer an unknown path with the home page, which must be rendered fresh instead.
const normalize = (p: string) => p.replace(/\/+$/, '') || '/'
if (root.dataset.prerendered && normalize(root.dataset.prerendered) === normalize(location.pathname)) {
  hydrateRoot(root, app)
} else {
  root.replaceChildren()
  createRoot(root).render(app)
}
