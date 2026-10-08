import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App.jsx'
import AppProviders from '@/app/providers/AppProviders.jsx'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource-variable/dm-sans'
import '@/shared/styles/index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
