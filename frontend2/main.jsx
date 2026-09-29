import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const storedTheme = window.localStorage.getItem('chemhub-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light')
document.documentElement.dataset.theme = initialTheme
document.documentElement.classList.toggle('dark', initialTheme === 'dark')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
