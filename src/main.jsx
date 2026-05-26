import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/index.js'
import ErrorBoundary from './components/errors/ErrorBoundary.jsx'
import ErrorPage from './components/errors/ErrorPage.jsx'
import { validateFrontendEnv } from './utils/env.js'
import { initMonitoring } from './utils/monitoring.js'

initMonitoring()

const envCheck = validateFrontendEnv()

function Root() {
      if (!envCheck.valid) {
            return (
                  <ErrorPage
                        variant="config"
                        title="Configuration error"
                        message="Required environment variables are missing. Add them to your .env file and restart the dev server."
                        error={new Error(envCheck.missing.map((m) => `${m.key}: ${m.description}`).join('\n'))}
                        showDetails={import.meta.env.DEV}
                        homeHref="/"
                  />
            )
      }

      return (
            <ErrorBoundary>
                  <App />
            </ErrorBoundary>
      )
}

ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
            <Root />
      </React.StrictMode>,
)
