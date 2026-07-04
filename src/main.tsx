import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnv } from './config/env'
import { initErrorLogging } from './lib/logger'
import { initAnalytics } from './lib/analytics'
import { registerServiceWorker } from './lib/registerServiceWorker'

// Production-grade bootstrap: env validation, error logging, analytics, PWA.
validateEnv()
initErrorLogging()
initAnalytics()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
