import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { preferenceStorageAllowed } from './cookiePreferences'

const storedTheme = preferenceStorageAllowed() ? window.localStorage.getItem('chemhub-theme') : null
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light')
document.documentElement.dataset.theme = initialTheme
document.documentElement.classList.toggle('dark', initialTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
