import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { StartupBoundary } from './components/StartupBoundary'
import './styles/global.css'
// Lazy import lets the boundary catch configuration/module startup errors too.
const App = lazy(() => import('./App'))
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><StartupBoundary><Suspense fallback={<div className="loading-screen">Loading CoachPortal…</div>}><App /></Suspense></StartupBoundary></React.StrictMode>
)
