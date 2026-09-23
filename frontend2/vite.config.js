import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Optional: proxy so the browser calls /api/... and Vite forwards to FastAPI.
    // With this on, set VITE_API_BASE_URL=/api in .env and you get zero CORS pain.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => (path.startsWith('/api/directory') ? path : path.replace(/^\/api/, '')),
      },
    },
  },
})
